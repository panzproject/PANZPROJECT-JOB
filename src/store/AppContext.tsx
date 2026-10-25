import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createSeedState, DEMO_STORAGE_KEY } from '../data/seed'
import type {
  ActionResult,
  AppNotification,
  AppState,
  AuditCategory,
  AuditEntry,
  DemoAttachment,
  EmailConnection,
  Job,
  JobStatus,
  NewJobInput,
  PaymentMethod,
  Seller,
  SellerStatus,
  Settings,
  Transaction,
  Withdrawal,
  WithdrawalInput,
  WithdrawalStatus,
} from '../types'
import { maskAccount } from '../lib/format'

type EmailConnectionInput = {
  provider: string
  email: string
  label: string
}

type WithdrawalAdminPayload = {
  reason?: string
  paymentRef?: string
  confirmed?: boolean
}

type ReviewDecision = 'APPROVE' | 'REVISION' | 'REJECT' | 'EXPIRE'

type AppContextValue = {
  state: AppState
  currentSeller: Seller
  claimJob: (jobId: string) => ActionResult
  submitJob: (jobId: string, note: string, attachments: DemoAttachment[]) => ActionResult
  requestWithdrawal: (input: WithdrawalInput) => ActionResult
  cancelWithdrawal: (id: string) => ActionResult
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  updateProfile: (input: { name: string; username: string; email: string }) => ActionResult
  updatePaymentMethod: (method: PaymentMethod) => ActionResult
  requestPasswordResetDemo: () => ActionResult
  revokeSession: (id: string) => ActionResult
  createJob: (input: NewJobInput) => ActionResult
  updateJob: (id: string, input: NewJobInput) => ActionResult
  toggleJobPause: (id: string) => ActionResult
  closeJob: (id: string, reason: string) => ActionResult
  reopenJob: (id: string) => ActionResult
  extendJobDeadline: (id: string, hours: number, reason: string) => ActionResult
  reviewJob: (id: string, decision: ReviewDecision, reason: string, note: string) => ActionResult
  setSellerStatus: (id: string, status: SellerStatus, reason: string) => ActionResult
  actOnWithdrawal: (
    id: string,
    action: 'APPROVE' | 'REJECT' | 'PROCESS' | 'PAID',
    payload: WithdrawalAdminPayload,
  ) => ActionResult
  addEmailConnection: (input: EmailConnectionInput) => ActionResult
  markConnectionChecked: (id: string) => ActionResult
  reconnectConnection: (id: string) => ActionResult
  revokeConnection: (id: string) => ActionResult
  updateSettings: (next: Settings) => ActionResult
  resetDemo: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

const loadState = (): AppState => {
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (parsed && parsed.version === 1 && Array.isArray(parsed.jobs)) return parsed
    }
  } catch {
    // Prototype falls back to fresh demo data if local storage is unavailable or invalid.
  }
  return createSeedState()
}

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36).toUpperCase()}`

const nextJobId = (jobs: Job[]) => {
  const max = jobs.reduce((acc, job) => {
    const value = Number(job.id.replace('PJB-', ''))
    return Number.isFinite(value) ? Math.max(acc, value) : acc
  }, 2600)
  return `PJB-${max + 1}`
}

const nextWithdrawalId = (withdrawals: Withdrawal[]) => {
  const year = new Date().getFullYear()
  const max = withdrawals.reduce((acc, item) => {
    const parts = item.id.split('-')
    const value = Number(parts[parts.length - 1])
    return Number.isFinite(value) ? Math.max(acc, value) : acc
  }, 0)
  return `WD-${year}-${String(max + 1).padStart(3, '0')}`
}

const nextTransactionId = (transactions: Transaction[]) => {
  const year = new Date().getFullYear()
  const max = transactions.reduce((acc, item) => {
    const parts = item.id.split('-')
    const value = Number(parts[parts.length - 1])
    return Number.isFinite(value) ? Math.max(acc, value) : acc
  }, 0)
  return `TRX-${year}-${String(max + 1).padStart(3, '0')}`
}

const makeAudit = (
  actor: string,
  category: AuditCategory,
  action: string,
  objectType: string,
  objectRef: string,
  summary: string,
  reason?: string,
): AuditEntry => ({
  id: uid('AUD'),
  timestamp: new Date().toISOString(),
  actor,
  category,
  action,
  objectType,
  objectRef,
  summary,
  reason,
})

const makeNotification = (
  partial: Omit<AppNotification, 'id' | 'at' | 'read'>,
): AppNotification => ({
  ...partial,
  id: uid('NTF'),
  at: new Date().toISOString(),
  read: false,
})

const audit = (state: AppState, entry: AuditEntry): AuditEntry[] => [entry, ...state.audit]

const notify = (state: AppState, notification: AppNotification): AppNotification[] => [
  notification,
  ...state.notifications,
]

const appendHistory = (job: Job, by: string, action: string, detail?: string): Job => ({
  ...job,
  history: [...job.history, { at: new Date().toISOString(), by, action, detail }],
})

const isReviewQueueStatus = (status: JobStatus) =>
  status === 'SUBMITTED' || status === 'UNDER_REVIEW' || status === 'EXPIRY_REVIEW'

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    try {
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Persistence is best-effort for the local prototype only.
    }
  }, [state])

  const commit = useCallback((updater: (previous: AppState) => AppState) => {
    const next = updater(stateRef.current)
    stateRef.current = next
    setState(next)
  }, [])

  const currentSeller = state.sellers.find((seller) => seller.id === state.currentSellerId) ?? state.sellers[0]
  const sellerName = currentSeller.name

  const claimJob = (jobId: string): ActionResult => {
    const previous = stateRef.current
    const job = previous.jobs.find((item) => item.id === jobId)
    const seller = previous.sellers.find((item) => item.id === previous.currentSellerId)
    if (!job) return { ok: false, message: 'Pekerjaan tidak ditemukan.' }
    if (seller?.status !== 'ACTIVE') {
      return { ok: false, message: 'Akun seller tidak aktif. Klaim pekerjaan diblokir pada simulasi.' }
    }
    if (job.status !== 'AVAILABLE') return { ok: false, message: 'Pekerjaan ini sudah tidak tersedia.' }
    if (job.paused) return { ok: false, message: 'Pekerjaan sedang dijeda admin.' }

    const now = new Date()
    const deadlineAt = new Date(now.getTime() + previous.settings.deadlineHours * 3600000).toISOString()
    const updatedJob: Job = {
      ...appendHistory(job, sellerName, 'Pekerjaan diklaim'),
      status: 'CLAIMED',
      sellerId: previous.currentSellerId,
      claimedAt: now.toISOString(),
      deadlineAt,
      progress: 8,
      paused: false,
    }

    commit((current) => ({
      ...current,
      jobs: current.jobs.map((item) => (item.id === jobId ? updatedJob : item)),
      notifications: notify(
        current,
        makeNotification({
          kind: 'job',
          type: 'JOB_CLAIMED',
          title: 'Pekerjaan berhasil diklaim',
          message: `${job.id} · ${job.title} masuk ke Pekerjaan Saya. Status ini hanya tersimpan pada demo lokal.`,
          href: '/seller/jobs',
        }),
      ),
      audit: audit(
        current,
        makeAudit(
          sellerName,
          'PEKERJAAN',
          'Pekerjaan diklaim',
          'Pekerjaan',
          job.id,
          `Pekerjaan diklaim dengan tarif terkunci ${job.rate}.`,
          'Aksi simulasi pada prototype.',
        ),
      ),
    }))

    return { ok: true, message: `${job.id} berhasil ditambahkan ke Pekerjaan Saya (simulasi).` }
  }

  const submitJob = (jobId: string, note: string, attachments: DemoAttachment[]): ActionResult => {
    const previous = stateRef.current
    const job = previous.jobs.find((item) => item.id === jobId)
    if (!job) return { ok: false, message: 'Pekerjaan tidak ditemukan.' }
    if (job.sellerId !== previous.currentSellerId) return { ok: false, message: 'Pekerjaan ini bukan milik seller aktif.' }
    if (job.status !== 'CLAIMED' && job.status !== 'REVISION') {
      return { ok: false, message: 'Status pekerjaan tidak mengizinkan pengiriman hasil.' }
    }
    if (attachments.length === 0) return { ok: false, message: 'Tambahkan minimal satu lampiran demo.' }
    const seller = previous.sellers.find((item) => item.id === previous.currentSellerId)
    if (seller?.status !== 'ACTIVE') return { ok: false, message: 'Akun seller tidak aktif.' }

    const now = new Date().toISOString()
    const isRevision = job.status === 'REVISION'
    const updatedJob: Job = {
      ...appendHistory(job, sellerName, isRevision ? 'Hasil dikirim ulang' : 'Hasil dikirim'),
      status: 'SUBMITTED',
      submittedAt: now,
      progress: 100,
      sellerNote: note.trim() || 'Tidak ada catatan tambahan.',
      attachments,
      submissions: [
        ...job.submissions,
        {
          id: uid('SUB'),
          submittedAt: now,
          note: note.trim() || 'Tidak ada catatan tambahan.',
          attachments,
        },
      ],
    }

    commit((current) => ({
      ...current,
      jobs: current.jobs.map((item) => (item.id === jobId ? updatedJob : item)),
      notifications: notify(
        current,
        makeNotification({
          kind: 'job',
          type: 'JOB_SUBMITTED',
          title: isRevision ? 'Hasil revisi dikirim' : 'Hasil berhasil dikirim',
          message: `${job.id} kini menunggu review admin. Lampiran demo tidak diunggah ke server.`,
          href: '/seller/jobs',
        }),
      ),
      audit: audit(
        current,
        makeAudit(
          sellerName,
          'PEKERJAAN',
          isRevision ? 'Hasil revisi dikirim' : 'Hasil dikirim',
          'Pekerjaan',
          job.id,
          `${attachments.length} lampiran demo dicatat pada pengiriman ini.`,
          'Pengiriman disimulasikan tanpa transfer file.',
        ),
      ),
    }))

    return { ok: true, message: isRevision ? 'Hasil revisi dikirim (simulasi).' : 'Hasil berhasil dikirim (simulasi).' }
  }

  const requestWithdrawal = (input: WithdrawalInput): ActionResult => {
    const previous = stateRef.current
    const seller = previous.sellers.find((item) => item.id === previous.currentSellerId)
    if (seller?.status !== 'ACTIVE') return { ok: false, message: 'Akun seller tidak aktif.' }
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      return { ok: false, message: 'Nominal penarikan harus lebih besar dari nol.' }
    }
    if (input.amount > previous.wallet.available) {
      return { ok: false, message: 'Nominal melebihi saldo tersedia.' }
    }
    if (!input.method.trim()) return { ok: false, message: 'Pilih metode pembayaran.' }
    if (input.accountName.trim().length < 3) return { ok: false, message: 'Nama pemilik akun wajib diisi.' }
    if (input.accountNumber.replace(/\D/g, '').length < 6) {
      return { ok: false, message: 'Nomor rekening atau akun demo minimal 6 digit.' }
    }

    const now = new Date().toISOString()
    const withdrawalId = nextWithdrawalId(previous.withdrawals)
    const withdrawal: Withdrawal = {
      id: withdrawalId,
      sellerId: previous.currentSellerId,
      sellerName,
      amount: input.amount,
      method: input.method,
      accountName: input.accountName.trim(),
      accountNumber: maskAccount(input.accountNumber.trim()),
      status: 'PENDING',
      requestedAt: now,
      updatedAt: now,
      timeline: [
        {
          at: now,
          status: 'PENDING',
          by: sellerName,
          note: 'Pengajuan dibuat pada simulasi. Saldo ditahan.',
        },
      ],
    }

    const transaction: Transaction = {
      id: nextTransactionId(previous.transactions),
      date: now,
      type: 'WITHDRAWAL',
      description: `Pengajuan penarikan ke ${input.method}`,
      amount: -input.amount,
      status: 'PENDING',
      reference: withdrawalId,
    }

    commit((current) => ({
      ...current,
      wallet: {
        ...current.wallet,
        available: current.wallet.available - input.amount,
        held: current.wallet.held + input.amount,
      },
      withdrawals: [withdrawal, ...current.withdrawals],
      transactions: [transaction, ...current.transactions],
      notifications: notify(
        current,
        makeNotification({
          kind: 'finance',
          type: 'WITHDRAWAL_REQUESTED',
          title: 'Pengajuan penarikan dibuat',
          message: `${withdrawalId} sebesar ${input.amount.toLocaleString('id-ID')} Rupiah menunggu pemeriksaan admin (simulasi).`,
          href: '/seller/finance',
        }),
      ),
      audit: audit(
        current,
        makeAudit(
          sellerName,
          'KEUANGAN',
          'Pengajuan penarikan dibuat',
          'Penarikan',
          withdrawalId,
          `Pengajuan simulasi ${input.amount} dibuat. Saldo tersedia ditahan.`,
          'Permintaan seller melalui halaman Keuangan prototype.',
        ),
      ),
    }))

    return { ok: true, message: `Pengajuan ${withdrawalId} dibuat. Saldo ditahan (simulasi).` }
  }

  const cancelWithdrawal = (id: string): ActionResult => {
    const previous = stateRef.current
    const withdrawal = previous.withdrawals.find((item) => item.id === id)
    if (!withdrawal) return { ok: false, message: 'Pengajuan tidak ditemukan.' }
    if (withdrawal.sellerId !== previous.currentSellerId) return { ok: false, message: 'Pengajuan bukan milik seller aktif.' }
    if (withdrawal.status !== 'PENDING') return { ok: false, message: 'Hanya pengajuan PENDING yang dapat dibatalkan.' }

    const now = new Date().toISOString()
    commit((current) => ({
      ...current,
      wallet:
        withdrawal.sellerId === current.currentSellerId
          ? {
              ...current.wallet,
              available: current.wallet.available + withdrawal.amount,
              held: Math.max(0, current.wallet.held - withdrawal.amount),
            }
          : current.wallet,
      withdrawals: current.withdrawals.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'CANCELLED' as WithdrawalStatus,
              updatedAt: now,
              reason: 'Dibatalkan oleh seller.',
              timeline: [
                ...item.timeline,
                { at: now, status: 'CANCELLED', by: sellerName, note: 'Saldo dikembalikan ke tersedia.' },
              ],
            }
          : item,
      ),
      transactions: current.transactions.map((item) =>
        item.reference === id ? { ...item, status: 'FAILED' as const } : item,
      ),
      notifications: notify(
        current,
        makeNotification({
          kind: 'finance',
          type: 'WITHDRAWAL_CANCELLED',
          title: 'Penarikan dibatalkan',
          message: `${id} dibatalkan. Saldo simulasi dikembalikan ke tersedia.`,
          href: '/seller/finance',
        }),
      ),
      audit: audit(
        current,
        makeAudit(
          sellerName,
          'KEUANGAN',
          'Penarikan dibatalkan seller',
          'Penarikan',
          id,
          'Saldo yang ditahan dikembalikan.',
          'Pembatalan oleh seller pada prototype.',
        ),
      ),
    }))

    return { ok: true, message: `${id} dibatalkan. Saldo demo dikembalikan.` }
  }

  const markNotificationRead = (id: string) => {
    commit((current) => ({
      ...current,
      notifications: current.notifications.map((item) => (item.id === id ? { ...item, read: true } : item)),
    }))
  }

  const markAllNotificationsRead = () => {
    commit((current) => ({
      ...current,
      notifications: current.notifications.map((item) => ({ ...item, read: true })),
    }))
  }

  const updateProfile = (input: { name: string; username: string; email: string }): ActionResult => {
    const previous = stateRef.current
    if (input.name.trim().length < 3) return { ok: false, message: 'Nama minimal 3 karakter.' }
    if (!/^[a-z0-9._]{3,30}$/i.test(input.username.trim())) {
      return { ok: false, message: 'Username hanya boleh berisi huruf, angka, titik, atau garis bawah (3–30 karakter).' }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
      return { ok: false, message: 'Format email tidak valid.' }
    }
    const duplicate = previous.sellers.find(
      (seller) =>
        seller.id !== previous.currentSellerId &&
        seller.username.toLowerCase() === input.username.trim().toLowerCase(),
    )
    if (duplicate) return { ok: false, message: 'Username sudah digunakan pada data demo.' }

    const emailChanged = input.email.trim().toLowerCase() !== currentSeller.email.toLowerCase()
    commit((current) => ({
      ...current,
      sellers: current.sellers.map((seller) =>
        seller.id === current.currentSellerId
          ? {
              ...seller,
              name: input.name.trim(),
              username: input.username.trim().toLowerCase(),
              email: input.email.trim().toLowerCase(),
              emailVerified: emailChanged ? false : seller.emailVerified,
            }
          : seller,
      ),
      audit: audit(
        current,
        makeAudit(
          input.name.trim(),
          'SELLER',
          'Profil seller diperbarui',
          'Seller',
          current.currentSellerId,
          emailChanged ? 'Profil diperbarui dan status verifikasi email direset.' : 'Profil diperbarui.',
          'Perubahan melalui halaman Profil & Keamanan prototype.',
        ),
      ),
    }))
    return {
      ok: true,
      message: emailChanged
        ? 'Profil disimpan. Email demo perlu diverifikasi ulang.'
        : 'Profil berhasil disimpan (simulasi).',
    }
  }

  const updatePaymentMethod = (method: PaymentMethod): ActionResult => {
    if (!method.provider.trim()) return { ok: false, message: 'Pilih metode pembayaran.' }
    if (method.accountName.trim().length < 3) return { ok: false, message: 'Nama pemilik akun wajib diisi.' }
    if (method.accountNumber.replace(/\D/g, '').length < 6) return { ok: false, message: 'Nomor akun demo minimal 6 digit.' }

    commit((current) => ({
      ...current,
      sellers: current.sellers.map((seller) =>
        seller.id === current.currentSellerId
          ? { ...seller, paymentMethod: method }
          : seller,
      ),
      audit: audit(
        current,
        makeAudit(
          sellerName,
          'KEAMANAN',
          'Metode pembayaran diperbarui',
          'Seller',
          current.currentSellerId,
          `Metode pembayaran diubah ke ${method.provider} dengan nomor akun disamarkan.`,
          'Perubahan melalui halaman Profil & Keamanan prototype.',
        ),
      ),
    }))
    return { ok: true, message: 'Metode pembayaran demo diperbarui.' }
  }

  const requestPasswordResetDemo = (): ActionResult => {
    commit((current) => ({
      ...current,
      notifications: notify(
        current,
        makeNotification({
          kind: 'account',
          type: 'SECURITY',
          title: 'Tautan ubah password disimulasikan',
          message: 'Tidak ada email yang dikirim dan tidak ada password yang diminta pada prototype ini.',
          href: '/seller/profile',
        }),
      ),
      audit: audit(
        current,
        makeAudit(
          sellerName,
          'KEAMANAN',
          'Tautan ubah password disimulasikan',
          'Seller',
          current.currentSellerId,
          'Permintaan tautan ubah password disimulasikan tanpa meminta kredensial.',
          'Aksi demo; tidak ada email keluar.',
        ),
      ),
    }))
    return { ok: true, message: 'Simulasi tautan keamanan dicatat. Tidak ada email yang dikirim.' }
  }

  const revokeSession = (id: string): ActionResult => {
    const previous = stateRef.current
    const session = previous.sessions.find((item) => item.id === id)
    if (!session) return { ok: false, message: 'Sesi tidak ditemukan.' }
    if (session.current) return { ok: false, message: 'Sesi saat ini tidak dapat dicabut dari prototype.' }

    commit((current) => ({
      ...current,
      sessions: current.sessions.filter((item) => item.id !== id),
      audit: audit(
        current,
        makeAudit(
          sellerName,
          'KEAMANAN',
          'Sesi login dicabut',
          'Sesi',
          id,
          `Sesi ${session.browser} dicabut pada data demo.`,
          'Tindakan keamanan dari halaman Profil.',
        ),
      ),
    }))
    return { ok: true, message: `Sesi ${session.browser} dicabut (simulasi).` }
  }

  const createJob = (input: NewJobInput): ActionResult => {
    if (input.title.trim().length < 5) return { ok: false, message: 'Judul pekerjaan minimal 5 karakter.' }
    if (!input.category) return { ok: false, message: 'Pilih kategori pekerjaan.' }
    if (!Number.isFinite(input.rate) || input.rate <= 0) return { ok: false, message: 'Tarif harus lebih besar dari nol.' }
    if (!Number.isFinite(input.deadlineHours) || input.deadlineHours < 1 || input.deadlineHours > 168) {
      return { ok: false, message: 'Deadline harus antara 1 dan 168 jam.' }
    }
    if (input.description.trim().length < 10) return { ok: false, message: 'Deskripsi minimal 10 karakter.' }
    if (input.instructions.trim().length < 20) return { ok: false, message: 'Instruksi minimal 20 karakter.' }

    const previous = stateRef.current
    const jobId = nextJobId(previous.jobs)
    const now = new Date().toISOString()
    const job: Job = {
      id: jobId,
      title: input.title.trim(),
      category: input.category,
      description: input.description.trim(),
      instructions: input.instructions.trim(),
      rate: input.rate,
      status: 'AVAILABLE',
      paused: false,
      createdAt: now,
      deadlineHours: input.deadlineHours,
      progress: 0,
      revisionCount: 0,
      commissionRecorded: false,
      attachments: [],
      submissions: [],
      history: [{ at: now, by: 'Admin PANZ', action: 'Pekerjaan dibuat' }],
    }

    commit((current) => ({
      ...current,
      jobs: [job, ...current.jobs],
      notifications: notify(
        current,
        makeNotification({
          kind: 'job',
          type: 'NEW_JOB',
          title: 'Pekerjaan baru tersedia',
          message: `${jobId} · ${job.title} baru tersedia pada marketplace simulasi.`,
          href: '/seller/marketplace',
        }),
      ),
      audit: audit(
        current,
        makeAudit(
          'Admin PANZ',
          'PEKERJAAN',
          'Pekerjaan dibuat',
          'Pekerjaan',
          jobId,
          `Pekerjaan baru dengan tarif ${input.rate} diterbitkan.`,
          'Dibuat dari workspace admin prototype.',
        ),
      ),
    }))
    return { ok: true, message: `${jobId} berhasil dibuat dan masuk marketplace simulasi.` }
  }

  const updateJob = (id: string, input: NewJobInput): ActionResult => {
    const previous = stateRef.current
    const job = previous.jobs.find((item) => item.id === id)
    if (!job) return { ok: false, message: 'Pekerjaan tidak ditemukan.' }
    if (job.status !== 'AVAILABLE' && job.status !== 'CANCELLED') {
      return {
        ok: false,
        message: 'Materi dan tarif dikunci setelah pekerjaan diklaim. Gunakan perpanjangan deadline bila diperlukan.',
      }
    }
    if (input.title.trim().length < 5) return { ok: false, message: 'Judul minimal 5 karakter.' }
    if (input.rate <= 0) return { ok: false, message: 'Tarif harus lebih besar dari nol.' }
    if (input.deadlineHours < 1 || input.deadlineHours > 168) return { ok: false, message: 'Deadline harus 1–168 jam.' }
    if (input.description.trim().length < 10) return { ok: false, message: 'Deskripsi minimal 10 karakter.' }
    if (input.instructions.trim().length < 20) return { ok: false, message: 'Instruksi minimal 20 karakter.' }

    commit((current) => ({
      ...current,
      jobs: current.jobs.map((item) =>
        item.id === id
          ? appendHistory(
              {
                ...item,
                title: input.title.trim(),
                category: input.category,
                description: input.description.trim(),
                instructions: input.instructions.trim(),
                rate: input.rate,
                deadlineHours: input.deadlineHours,
              },
              'Admin PANZ',
              'Detail pekerjaan diperbarui',
            )
          : item,
      ),
      audit: audit(
        current,
        makeAudit(
          'Admin PANZ',
          'PEKERJAAN',
          'Pekerjaan diperbarui',
          'Pekerjaan',
          id,
          `Detail pekerjaan diperbarui. Tarif saat ini ${input.rate}.`,
          'Perubahan pada pekerjaan yang belum diklaim.',
        ),
      ),
    }))
    return { ok: true, message: 'Detail pekerjaan diperbarui (simulasi).' }
  }

  const toggleJobPause = (id: string): ActionResult => {
    const previous = stateRef.current
    const job = previous.jobs.find((item) => item.id === id)
    if (!job) return { ok: false, message: 'Pekerjaan tidak ditemukan.' }
    if (job.status !== 'AVAILABLE') return { ok: false, message: 'Hanya pekerjaan berstatus tersedia yang dapat dijeda.' }

    const nextPaused = !job.paused
    commit((current) => ({
      ...current,
      jobs: current.jobs.map((item) =>
        item.id === id
          ? {
              ...appendHistory(
                { ...item, paused: nextPaused },
                'Admin PANZ',
                nextPaused ? 'Pekerjaan dijeda' : 'Pekerjaan diaktifkan kembali',
              ),
            }
          : item,
      ),
      audit: audit(
        current,
        makeAudit(
          'Admin PANZ',
          'PEKERJAAN',
          nextPaused ? 'Pekerjaan dijeda' : 'Pekerjaan diaktifkan',
          'Pekerjaan',
          id,
          nextPaused ? 'Pekerjaan disembunyikan dari marketplace.' : 'Pekerjaan ditampilkan kembali di marketplace.',
          'Aksi dari Manajemen Pekerjaan prototype.',
        ),
      ),
    }))
    return { ok: true, message: nextPaused ? `${id} dijeda.` : `${id} diaktifkan kembali.` }
  }

  const closeJob = (id: string, reason: string): ActionResult => {
    const previous = stateRef.current
    const job = previous.jobs.find((item) => item.id === id)
    if (!job) return { ok: false, message: 'Pekerjaan tidak ditemukan.' }
    if (job.status !== 'AVAILABLE') {
      return { ok: false, message: 'Pekerjaan yang sudah diklaim tidak dapat ditutup dari prototype ini.' }
    }
    if (reason.trim().length < 5) return { ok: false, message: 'Alasan penutupan minimal 5 karakter.' }

    commit((current) => ({
      ...current,
      jobs: current.jobs.map((item) =>
        item.id === id
          ? appendHistory({ ...item, status: 'CANCELLED', paused: false }, 'Admin PANZ', 'Pekerjaan ditutup', reason.trim())
          : item,
      ),
      audit: audit(
        current,
        makeAudit(
          'Admin PANZ',
          'PEKERJAAN',
          'Pekerjaan ditutup',
          'Pekerjaan',
          id,
          'Pekerjaan tidak lagi tersedia untuk seller.',
          reason.trim(),
        ),
      ),
    }))
    return { ok: true, message: `${id} ditutup (simulasi).` }
  }

  const reopenJob = (id: string): ActionResult => {
    const previous = stateRef.current
    const job = previous.jobs.find((item) => item.id === id)
    if (!job) return { ok: false, message: 'Pekerjaan tidak ditemukan.' }
    if (job.status !== 'CANCELLED') return { ok: false, message: 'Hanya pekerjaan yang ditutup dapat dibuka kembali.' }
    if (job.sellerId) return { ok: false, message: 'Pekerjaan dengan seller tidak dapat dibuka kembali pada prototype.' }

    commit((current) => ({
      ...current,
      jobs: current.jobs.map((item) =>
        item.id === id
          ? appendHistory({ ...item, status: 'AVAILABLE', paused: false }, 'Admin PANZ', 'Pekerjaan dibuka kembali')
          : item,
      ),
      audit: audit(
        current,
        makeAudit(
          'Admin PANZ',
          'PEKERJAAN',
          'Pekerjaan dibuka kembali',
          'Pekerjaan',
          id,
          'Status dikembalikan menjadi AVAILABLE.',
          'Aksi dari Manajemen Pekerjaan prototype.',
        ),
      ),
    }))
    return { ok: true, message: `${id} dibuka kembali.` }
  }

  const extendJobDeadline = (id: string, hours: number, reason: string): ActionResult => {
    const previous = stateRef.current
    const job = previous.jobs.find((item) => item.id === id)
    if (!job) return { ok: false, message: 'Pekerjaan tidak ditemukan.' }
    if (!['CLAIMED', 'REVISION', 'EXPIRY_REVIEW'].includes(job.status)) {
      return { ok: false, message: 'Perpanjangan hanya tersedia untuk pekerjaan aktif, revisi, atau review kedaluwarsa.' }
    }
    if (!Number.isFinite(hours) || hours < 1 || hours > 72) return { ok: false, message: 'Perpanjangan harus 1–72 jam.' }
    if (reason.trim().length < 5) return { ok: false, message: 'Alasan perpanjangan minimal 5 karakter.' }

    const base = job.deadlineAt ? new Date(job.deadlineAt).getTime() : Date.now()
    const newDeadline = new Date(Math.max(base, Date.now()) + hours * 3600000).toISOString()
    const wasExpired = job.status === 'EXPIRY_REVIEW'
    commit((current) => ({
      ...current,
      jobs: current.jobs.map((item) =>
        item.id === id
          ? appendHistory(
              {
                ...item,
                status: wasExpired ? 'CLAIMED' : item.status,
                deadlineAt: newDeadline,
              },
              'Admin PANZ',
              'Deadline diperpanjang',
              `${hours} jam · ${reason.trim()}`,
            )
          : item,
      ),
      notifications: notify(
        current,
        makeNotification({
          kind: 'job',
          type: 'DEADLINE_EXTENDED',
          title: 'Deadline pekerjaan diperpanjang',
          message: `${id} mendapat perpanjangan ${hours} jam pada simulasi.`,
          href: '/seller/jobs',
        }),
      ),
      audit: audit(
        current,
        makeAudit(
          'Admin PANZ',
          'PEKERJAAN',
          'Deadline diperpanjang',
          'Pekerjaan',
          id,
          `Deadline ditambah ${hours} jam${wasExpired ? ' dan pekerjaan dibuka kembali dari review kedaluwarsa' : ''}.`,
          reason.trim(),
        ),
      ),
    }))
    return { ok: true, message: `Deadline ${id} diperpanjang ${hours} jam (simulasi).` }
  }

  const reviewJob = (id: string, decision: ReviewDecision, reason: string, note: string): ActionResult => {
    const previous = stateRef.current
    const job = previous.jobs.find((item) => item.id === id)
    if (!job) return { ok: false, message: 'Pekerjaan tidak ditemukan.' }
    if (!isReviewQueueStatus(job.status)) return { ok: false, message: 'Pekerjaan tidak berada pada antrean review.' }
    if (decision !== 'APPROVE' && reason.trim().length < 5) {
      return { ok: false, message: 'Alasan wajib diisi minimal 5 karakter.' }
    }
    if (decision === 'REVISION' && job.revisionCount >= previous.settings.maxRevisions) {
      return { ok: false, message: `Batas maksimum ${previous.settings.maxRevisions} permintaan revisi sudah tercapai.` }
    }
    if (decision === 'EXPIRE' && job.status !== 'EXPIRY_REVIEW') {
      return { ok: false, message: 'Keputusan kedaluwarsa hanya tersedia pada status review kedaluwarsa.' }
    }
    if (decision === 'EXPIRE' && !reason.trim()) {
      return { ok: false, message: 'Alasan wajib diisi.' }
    }
    if (decision === 'APPROVE' && job.commissionRecorded) {
      return { ok: false, message: 'Komisi untuk pekerjaan ini sudah pernah dicatat.' }
    }

    const now = new Date().toISOString()
    const nextStatus: JobStatus =
      decision === 'APPROVE'
        ? 'APPROVED'
        : decision === 'REVISION'
          ? 'REVISION'
          : decision === 'REJECT'
            ? 'REJECTED'
            : 'EXPIRED'

    const outcome: 'APPROVED' | 'REVISION' | 'REJECTED' | undefined =
      decision === 'APPROVE' ? 'APPROVED' : decision === 'REVISION' ? 'REVISION' : decision === 'REJECT' ? 'REJECTED' : undefined

    const reviewText = note.trim() || reason.trim() || undefined
    const sellerIsCurrent = job.sellerId === previous.currentSellerId
    const newRevisionDeadline =
      decision === 'REVISION' ? new Date(Date.now() + previous.settings.revisionHours * 3600000).toISOString() : job.deadlineAt

    const updatedSubmissions = job.submissions.map((submission, index) =>
      index === job.submissions.length - 1 && outcome
        ? { ...submission, outcome, adminNote: reviewText }
        : submission,
    )

    commit((current) => {
      const jobUpdate: Job = appendHistory(
        {
          ...job,
          status: nextStatus,
          reviewNote: reviewText,
          submissions: updatedSubmissions,
          deadlineAt: newRevisionDeadline,
          revisionCount: decision === 'REVISION' ? job.revisionCount + 1 : job.revisionCount,
          commissionRecorded: decision === 'APPROVE' ? true : job.commissionRecorded,
          progress: decision === 'APPROVE' || decision === 'REJECT' ? 100 : job.progress,
        },
        'Admin PANZ',
        decision === 'APPROVE'
          ? 'Hasil disetujui'
          : decision === 'REVISION'
            ? `Revisi diminta (${job.revisionCount + 1}/${current.settings.maxRevisions})`
            : decision === 'REJECT'
              ? 'Hasil ditolak'
              : 'Pekerjaan dinyatakan kedaluwarsa',
        decision === 'APPROVE' ? reviewText : reason.trim(),
      )

      let wallet = current.wallet
      let transactions = current.transactions
      if (decision === 'APPROVE' && sellerIsCurrent) {
        wallet = {
          ...wallet,
          available: wallet.available + job.rate,
          lifetimeEarnings: wallet.lifetimeEarnings + job.rate,
        }
        transactions = [
          {
            id: nextTransactionId(current.transactions),
            date: now,
            type: 'COMMISSION',
            description: `Komisi pekerjaan ${job.id}`,
            amount: job.rate,
            status: 'SUCCESS',
            reference: job.id,
          },
          ...transactions,
        ]
      }

      const notificationContent =
        decision === 'APPROVE'
          ? {
              type: 'JOB_APPROVED',
              title: 'Hasil pekerjaan disetujui',
              message: `${job.id} disetujui. Komisi simulasi ${job.rate} dicatat satu kali.`,
            }
          : decision === 'REVISION'
            ? {
                type: 'REVISION_REQUESTED',
                title: 'Revisi diperlukan',
                message: `${job.id} memerlukan revisi ke-${job.revisionCount + 1}. ${reason.trim()}`,
              }
            : decision === 'REJECT'
              ? {
                  type: 'JOB_REJECTED',
                  title: 'Hasil pekerjaan ditolak',
                  message: `${job.id} ditolak. Alasan: ${reason.trim()}`,
                }
              : {
                  type: 'EXPIRED',
                  title: 'Pekerjaan dinyatakan kedaluwarsa',
                  message: `${job.id} dinyatakan kedaluwarsa setelah review admin.`,
                }

      const nextNotifications =
        sellerIsCurrent && job.sellerId
          ? notify(current, makeNotification({ kind: 'job', ...notificationContent, href: '/seller/jobs' }))
          : current.notifications

      return {
        ...current,
        jobs: current.jobs.map((item) => (item.id === id ? jobUpdate : item)),
        wallet,
        transactions,
        notifications: nextNotifications,
        audit: audit(
          current,
          makeAudit(
            'Admin PANZ',
            'PEKERJAAN',
            decision === 'APPROVE'
              ? 'Hasil disetujui'
              : decision === 'REVISION'
                ? 'Revisi diminta'
                : decision === 'REJECT'
                  ? 'Hasil ditolak'
                  : 'Pekerjaan dinyatakan kedaluwarsa',
            'Pekerjaan',
            job.id,
            decision === 'APPROVE'
              ? `Hasil disetujui; komisi ${job.rate} dicatat satu kali pada simulasi.`
              : `Status berubah menjadi ${nextStatus}.`,
            note.trim() || reason.trim() || 'Keputusan review prototype.',
          ),
        ),
      }
    })

    return {
      ok: true,
      message:
        decision === 'APPROVE'
          ? `${job.id} disetujui. Komisi demo dicatat satu kali.`
          : decision === 'REVISION'
            ? `Revisi ke-${job.revisionCount + 1} diminta.`
            : decision === 'REJECT'
              ? `${job.id} ditolak.`
              : `${job.id} ditandai kedaluwarsa.`,
    }
  }

  const setSellerStatus = (id: string, status: SellerStatus, reason: string): ActionResult => {
    const previous = stateRef.current
    const seller = previous.sellers.find((item) => item.id === id)
    if (!seller) return { ok: false, message: 'Seller tidak ditemukan.' }
    if (seller.status === status) return { ok: false, message: 'Status seller tidak berubah.' }
    if (['REJECTED', 'SUSPENDED', 'CLOSED'].includes(status) && reason.trim().length < 5) {
      return { ok: false, message: 'Alasan wajib diisi untuk perubahan status sensitif.' }
    }
    if (seller.id === previous.currentSellerId && status === 'CLOSED') {
      return { ok: false, message: 'Akun seller yang sedang aktif tidak dapat ditutup dari simulasi ini.' }
    }

    commit((current) => ({
      ...current,
      sellers: current.sellers.map((item) =>
        item.id === id ? { ...item, status, note: reason.trim() || item.note } : item,
      ),
      notifications:
        id === current.currentSellerId
          ? notify(
              current,
              makeNotification({
                kind: 'account',
                type: 'ACCOUNT_STATUS',
                title: 'Status akun diperbarui',
                message: `Status akun demo Anda sekarang ${status}.`,
                href: '/seller/profile',
              }),
            )
          : current.notifications,
      audit: audit(
        current,
        makeAudit(
          'Admin PANZ',
          'SELLER',
          'Status seller diubah',
          'Seller',
          id,
          `Status ${seller.name} berubah dari ${seller.status} menjadi ${status}.`,
          reason.trim() || 'Perubahan status melalui Manajemen Seller prototype.',
        ),
      ),
    }))
    return { ok: true, message: `Status ${seller.name} diubah menjadi ${status}.` }
  }

  const actOnWithdrawal = (
    id: string,
    action: 'APPROVE' | 'REJECT' | 'PROCESS' | 'PAID',
    payload: WithdrawalAdminPayload,
  ): ActionResult => {
    const previous = stateRef.current
    const withdrawal = previous.withdrawals.find((item) => item.id === id)
    if (!withdrawal) return { ok: false, message: 'Pengajuan tidak ditemukan.' }

    const nextStatus: WithdrawalStatus =
      action === 'APPROVE'
        ? 'APPROVED'
        : action === 'REJECT'
          ? 'REJECTED'
          : action === 'PROCESS'
            ? 'PROCESSING'
            : 'PAID'

    if (action === 'APPROVE' && withdrawal.status !== 'PENDING') {
      return { ok: false, message: 'Hanya pengajuan PENDING yang dapat disetujui.' }
    }
    if (action === 'REJECT' && withdrawal.status !== 'PENDING') {
      return { ok: false, message: 'Hanya pengajuan PENDING yang dapat ditolak.' }
    }
    if (action === 'PROCESS' && withdrawal.status !== 'APPROVED') {
      return { ok: false, message: 'Pengajuan harus berstatus APPROVED sebelum diproses.' }
    }
    if (action === 'PAID') {
      if (withdrawal.status !== 'PROCESSING') {
        return { ok: false, message: 'Status PAID hanya dapat dicatat setelah pengajuan berstatus PROCESSING.' }
      }
      if (!payload.confirmed) {
        return { ok: false, message: 'Konfirmasi verifikasi transfer wajib dicentang.' }
      }
      if (!payload.paymentRef || payload.paymentRef.trim().length < 4) {
        return { ok: false, message: 'Referensi pembayaran minimal 4 karakter.' }
      }
    }
    if (action === 'REJECT' && (!payload.reason || payload.reason.trim().length < 5)) {
      return { ok: false, message: 'Alasan penolakan wajib diisi minimal 5 karakter.' }
    }
    if (withdrawal.sellerId === previous.currentSellerId && action === 'PAID' && previous.wallet.held < withdrawal.amount) {
      return { ok: false, message: 'Saldo tertahan tidak mencukupi untuk mencatat pembayaran.' }
    }

    const now = new Date().toISOString()
    const note =
      action === 'APPROVE'
        ? 'Pengajuan disetujui, menunggu proses transfer.'
        : action === 'REJECT'
          ? payload.reason?.trim()
          : action === 'PROCESS'
            ? 'Transfer sedang diproses.'
            : `Transfer dikonfirmasi · ${payload.paymentRef?.trim()}`

    commit((current) => {
      let wallet = current.wallet
      if (action === 'REJECT' && withdrawal.sellerId === current.currentSellerId) {
        wallet = {
          ...wallet,
          available: wallet.available + withdrawal.amount,
          held: Math.max(0, wallet.held - withdrawal.amount),
        }
      }
      if (action === 'PAID' && withdrawal.sellerId === current.currentSellerId) {
        wallet = {
          ...wallet,
          held: Math.max(0, wallet.held - withdrawal.amount),
          paidOut: wallet.paidOut + withdrawal.amount,
        }
      }

      return {
        ...current,
        wallet,
        withdrawals: current.withdrawals.map((item) =>
          item.id === id
            ? {
                ...item,
                status: nextStatus,
                updatedAt: now,
                reason: action === 'REJECT' ? payload.reason?.trim() : item.reason,
                paymentRef: action === 'PAID' ? payload.paymentRef?.trim() : item.paymentRef,
                timeline: [
                  ...item.timeline,
                  {
                    at: now,
                    status: nextStatus,
                    by: 'Admin PANZ',
                    note,
                  },
                ],
              }
            : item,
        ),
        transactions: current.transactions.map((item) => {
          if (item.reference !== id) return item
          if (action === 'PAID') return { ...item, status: 'SUCCESS' as const }
          if (action === 'REJECT') return { ...item, status: 'FAILED' as const }
          return item
        }),
        notifications:
          withdrawal.sellerId === current.currentSellerId
            ? notify(
                current,
                makeNotification({
                  kind: 'finance',
                  type: action === 'PAID' ? 'PAYMENT_COMPLETED' : 'WITHDRAWAL_UPDATE',
                  title:
                    action === 'PAID'
                      ? 'Pembayaran penarikan selesai'
                      : action === 'REJECT'
                        ? 'Penarikan ditolak'
                        : 'Status penarikan diperbarui',
                  message: `${id} kini berstatus ${nextStatus} pada simulasi.`,
                  href: '/seller/finance',
                }),
              )
            : current.notifications,
        audit: audit(
          current,
          makeAudit(
            'Admin PANZ',
            'KEUANGAN',
            action === 'APPROVE'
              ? 'Penarikan disetujui'
              : action === 'REJECT'
                ? 'Penarikan ditolak'
                : action === 'PROCESS'
                  ? 'Penarikan diproses'
                  : 'Penarikan ditandai PAID',
            'Penarikan',
            id,
            action === 'PAID'
              ? `Transfer dikonfirmasi dengan referensi ${payload.paymentRef?.trim()}.`
              : `Status pengajuan berubah menjadi ${nextStatus}.`,
            payload.reason?.trim() || note,
          ),
        ),
      }
    })

    return {
      ok: true,
      message:
        action === 'PAID'
          ? `${id} dicatat PAID setelah konfirmasi transfer (simulasi).`
          : `Status ${id} diubah menjadi ${nextStatus}.`,
    }
  }

  const addEmailConnection = (input: EmailConnectionInput): ActionResult => {
    const previous = stateRef.current
    if (!input.email.includes('@')) return { ok: false, message: 'Alamat email demo tidak valid.' }
    if (previous.connections.some((item) => item.email.toLowerCase() === input.email.trim().toLowerCase())) {
      return { ok: false, message: 'Email demo ini sudah terdaftar.' }
    }
    if (!input.provider) return { ok: false, message: 'Pilih penyedia koneksi.' }
    if (input.label.trim().length < 2) return { ok: false, message: 'Label koneksi minimal 2 karakter.' }

    const now = new Date().toISOString()
    const connection: EmailConnection = {
      id: uid('EML'),
      provider: input.provider,
      email: input.email.trim().toLowerCase(),
      label: input.label.trim(),
      status: 'CONNECTED',
      lastSync: now,
      permissions: ['Baca metadata email'],
      errors: [],
    }
    commit((current) => ({
      ...current,
      connections: [connection, ...current.connections],
      audit: audit(
        current,
        makeAudit(
          'Admin PANZ',
          'INTEGRASI',
          'Koneksi email demo ditambahkan',
          'Koneksi email',
          connection.id,
          `Koneksi ${connection.email} ditambahkan sebagai simulasi tanpa OAuth.`,
          'Aksi demo; tidak ada token atau kredensial yang diminta.',
        ),
      ),
    }))
    return { ok: true, message: 'Koneksi email demo ditambahkan tanpa OAuth.' }
  }

  const markConnectionChecked = (id: string): ActionResult => {
    const previous = stateRef.current
    const connection = previous.connections.find((item) => item.id === id)
    if (!connection) return { ok: false, message: 'Koneksi tidak ditemukan.' }
    if (connection.status === 'REVOKED') return { ok: false, message: 'Koneksi sudah dicabut. Sambungkan kembali terlebih dahulu.' }
    const now = new Date().toISOString()
    commit((current) => ({
      ...current,
      connections: current.connections.map((item) =>
        item.id === id ? { ...item, lastSync: now } : item,
      ),
      audit: audit(
        current,
        makeAudit(
          'Admin PANZ',
          'INTEGRASI',
          'Koneksi email diperiksa',
          'Koneksi email',
          id,
          connection.status === 'CONNECTED'
            ? 'Pemeriksaan simulasi berhasil; status tetap CONNECTED.'
            : 'Pemeriksaan simulasi selesai; koneksi masih memerlukan perhatian.',
          'Pemeriksaan manual dari prototype.',
        ),
      ),
    }))
    if (connection.status === 'CONNECTED') {
      return { ok: true, message: 'Koneksi demo sehat. Waktu sinkronisasi diperbarui.' }
    }
    return { ok: false, message: 'Koneksi demo masih memerlukan perhatian. Gunakan Sambungkan kembali.' }
  }

  const reconnectConnection = (id: string): ActionResult => {
    const previous = stateRef.current
    const connection = previous.connections.find((item) => item.id === id)
    if (!connection) return { ok: false, message: 'Koneksi tidak ditemukan.' }
    if (connection.status === 'CONNECTED') return { ok: false, message: 'Koneksi sudah dalam status tersambung.' }
    const now = new Date().toISOString()
    commit((current) => ({
      ...current,
      connections: current.connections.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'CONNECTED',
              lastSync: now,
              permissions: ['Baca metadata email', 'Baca isi email (minimal)'],
            }
          : item,
      ),
      audit: audit(
        current,
        makeAudit(
          'Admin PANZ',
          'INTEGRASI',
          'Koneksi email disambungkan kembali',
          'Koneksi email',
          id,
          'Koneksi demo dipulihkan tanpa OAuth atau token nyata.',
          'Aksi simulasi.',
        ),
      ),
    }))
    return { ok: true, message: 'Koneksi demo disambungkan kembali. Tidak ada OAuth sungguhan.' }
  }

  const revokeConnection = (id: string): ActionResult => {
    const previous = stateRef.current
    const connection = previous.connections.find((item) => item.id === id)
    if (!connection) return { ok: false, message: 'Koneksi tidak ditemukan.' }
    if (connection.status === 'REVOKED') return { ok: false, message: 'Koneksi sudah dicabut.' }
    const now = new Date().toISOString()
    commit((current) => ({
      ...current,
      connections: current.connections.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'REVOKED',
              permissions: [],
              errors: [
                {
                  at: now,
                  code: 'CONNECTION_REVOKED',
                  message: 'Akses dicabut oleh admin pada simulasi. Tidak ada token yang disimpan.',
                },
                ...item.errors,
              ].slice(0, 5),
            }
          : item,
      ),
      audit: audit(
        current,
        makeAudit(
          'Admin PANZ',
          'INTEGRASI',
          'Akses email dicabut',
          'Koneksi email',
          id,
          `Akses untuk ${connection.email} dicabut pada data demo.`,
          'Pencabutan akses simulasi.',
        ),
      ),
    }))
    return { ok: true, message: 'Akses koneksi demo dicabut.' }
  }

  const updateSettings = (next: Settings): ActionResult => {
    if (!Number.isFinite(next.deadlineHours) || next.deadlineHours < 1 || next.deadlineHours > 168) {
      return { ok: false, message: 'Deadline pekerjaan harus 1–168 jam.' }
    }
    if (!Number.isFinite(next.revisionHours) || next.revisionHours < 1 || next.revisionHours > 72) {
      return { ok: false, message: 'Deadline revisi harus 1–72 jam.' }
    }
    if (!Number.isFinite(next.maxRevisions) || next.maxRevisions < 1 || next.maxRevisions > 3) {
      return { ok: false, message: 'Maksimum revisi harus 1–3.' }
    }
    if (!Number.isFinite(next.uploadMaxMb) || next.uploadMaxMb < 1 || next.uploadMaxMb > 50) {
      return { ok: false, message: 'Ukuran upload harus 1–50 MB.' }
    }
    if (next.allowedFileTypes.length === 0) {
      return { ok: false, message: 'Pilih minimal satu tipe file.' }
    }
    if (!Number.isFinite(next.retentionDays) || next.retentionDays < 30 || next.retentionDays > 3650) {
      return { ok: false, message: 'Retensi data harus 30–3.650 hari.' }
    }
    if (![30, 60, 120, 240].includes(next.sessionTimeoutMinutes)) {
      return { ok: false, message: 'Batas sesi tidak valid.' }
    }

    const previous = stateRef.current
    const changed = (Object.keys(next) as (keyof Settings)[]).filter(
      (key) => JSON.stringify(previous.settings[key]) !== JSON.stringify(next[key]),
    )
    if (changed.length === 0) return { ok: false, message: 'Tidak ada perubahan pengaturan.' }

    commit((current) => ({
      ...current,
      settings: next,
      audit: audit(
        current,
        makeAudit(
          'Admin PANZ',
          'KEAMANAN',
          'Pengaturan diperbarui',
          'Pengaturan',
          'SET-KEBIJAKAN',
          `${changed.length} pengaturan diubah: ${changed.join(', ')}.`,
          'Berlaku pada simulasi; pekerjaan berjalan tidak diubah diam-diam.',
        ),
      ),
    }))
    return { ok: true, message: 'Pengaturan demo disimpan dan dicatat pada audit log.' }
  }

  const resetDemo = () => {
    const fresh = createSeedState()
    stateRef.current = fresh
    setState(fresh)
    try {
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(fresh))
    } catch {
      // Ignore storage errors on reset.
    }
  }

  const value: AppContextValue = {
    state,
    currentSeller,
    claimJob,
    submitJob,
    requestWithdrawal,
    cancelWithdrawal,
    markNotificationRead,
    markAllNotificationsRead,
    updateProfile,
    updatePaymentMethod,
    requestPasswordResetDemo,
    revokeSession,
    createJob,
    updateJob,
    toggleJobPause,
    closeJob,
    reopenJob,
    extendJobDeadline,
    reviewJob,
    setSellerStatus,
    actOnWithdrawal,
    addEmailConnection,
    markConnectionChecked,
    reconnectConnection,
    revokeConnection,
    updateSettings,
    resetDemo,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp harus digunakan di dalam AppProvider')
  return context
}
