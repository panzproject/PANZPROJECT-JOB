import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  RotateCcw,
  Search,
  ShieldCheck,
  Timer,
  XCircle,
} from 'lucide-react'
import { useApp } from '../../store/AppContext'
import type { Withdrawal } from '../../types'
import { formatDate, formatDateTime, formatIDR, maskAccount } from '../../lib/format'
import { SELLER_STATUS, WITHDRAWAL_STATUS } from '../../lib/status'
import { ReasonDialog } from '../../components/common/ReasonDialog'
import {
  Badge,
  Button,
  Callout,
  CheckboxField,
  ConfirmDialog,
  EmptyState,
  Modal,
  PageHeader,
  Pagination,
  Panel,
  SearchField,
  SimulationTag,
  StatCard,
  StatusBadge,
  Tabs,
  TextField,
} from '../../components/ui'
import { useToast } from '../../components/ui/Toast'

type WithdrawalTab = 'ALL' | 'PENDING' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'REJECTED' | 'CANCELLED'

const PAGE_SIZE = 8

const tabMatches = (withdrawal: Withdrawal, tab: WithdrawalTab) =>
  tab === 'ALL' || withdrawal.status === tab

export default function Withdrawals() {
  const { state, actOnWithdrawal } = useApp()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<WithdrawalTab>('ALL')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('withdrawal'))
  const [confirmAction, setConfirmAction] = useState<'APPROVE' | 'PROCESS' | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [paidOpen, setPaidOpen] = useState(false)
  const [paymentRef, setPaymentRef] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [paidError, setPaidError] = useState('')

  const counts = useMemo(
    () => ({
      ALL: state.withdrawals.length,
      PENDING: state.withdrawals.filter((item) => item.status === 'PENDING').length,
      APPROVED: state.withdrawals.filter((item) => item.status === 'APPROVED').length,
      PROCESSING: state.withdrawals.filter((item) => item.status === 'PROCESSING').length,
      PAID: state.withdrawals.filter((item) => item.status === 'PAID').length,
      REJECTED: state.withdrawals.filter((item) => item.status === 'REJECTED').length,
      CANCELLED: state.withdrawals.filter((item) => item.status === 'CANCELLED').length,
    }),
    [state.withdrawals],
  )

  const pendingTotal = state.withdrawals
    .filter((item) => item.status === 'PENDING')
    .reduce((sum, item) => sum + item.amount, 0)
  const processingItems = state.withdrawals.filter((item) => ['APPROVED', 'PROCESSING'].includes(item.status))
  const processingTotal = processingItems.reduce((sum, item) => sum + item.amount, 0)
  const paidTotal = state.withdrawals
    .filter((item) => item.status === 'PAID')
    .reduce((sum, item) => sum + item.amount, 0)
  const problemCount = state.withdrawals.filter((item) => ['REJECTED', 'CANCELLED'].includes(item.status)).length

  const filtered = useMemo(() => {
    return state.withdrawals
      .filter((withdrawal) => {
        if (!tabMatches(withdrawal, tab)) return false
        if (!query.trim()) return true
        const needle = query.toLowerCase()
        return (
          withdrawal.id.toLowerCase().includes(needle) ||
          withdrawal.sellerName.toLowerCase().includes(needle) ||
          withdrawal.method.toLowerCase().includes(needle) ||
          withdrawal.accountName.toLowerCase().includes(needle) ||
          (withdrawal.paymentRef?.toLowerCase().includes(needle) ?? false)
        )
      })
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
  }, [state.withdrawals, tab, query])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const selected = state.withdrawals.find((item) => item.id === selectedId) ?? null
  const selectedSeller = state.sellers.find((seller) => seller.id === selected?.sellerId)
  const hasFilters = Boolean(query.trim())

  useEffect(() => {
    if (!paidOpen) return
    setPaymentRef('')
    setConfirmed(false)
    setPaidError('')
  }, [paidOpen, selectedId])

  const approve = () => {
    if (!selected) return
    const result = actOnWithdrawal(selected.id, 'APPROVE', {})
    if (result.ok) toast.success(result.message, 'Penarikan disetujui')
    else toast.error(result.message)
    setConfirmAction(null)
  }

  const process = () => {
    if (!selected) return
    const result = actOnWithdrawal(selected.id, 'PROCESS', {})
    if (result.ok) toast.success(result.message, 'Penarikan diproses')
    else toast.error(result.message)
    setConfirmAction(null)
  }

  const reject = (reason: string) => {
    if (!selected) return { ok: false, message: 'Pengajuan tidak ditemukan.' }
    const result = actOnWithdrawal(selected.id, 'REJECT', { reason })
    if (result.ok) toast.success(result.message, 'Penarikan ditolak')
    return result
  }

  const markPaid = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selected) return
    if (!confirmed) {
      setPaidError('Centang konfirmasi verifikasi transfer terlebih dahulu.')
      return
    }
    if (paymentRef.trim().length < 4) {
      setPaidError('Referensi pembayaran minimal 4 karakter.')
      return
    }
    const result = actOnWithdrawal(selected.id, 'PAID', { confirmed, paymentRef: paymentRef.trim() })
    if (result.ok) {
      toast.success(result.message, 'Pembayaran dikonfirmasi')
      setPaidOpen(false)
      setPaidError('')
    } else {
      setPaidError(result.message)
      toast.error(result.message)
    }
  }

  return (
    <div className="page page-enter">
      <PageHeader
        eyebrow="Panel admin"
        title="Penarikan seller"
        description="Proses pengajuan penarikan sesuai urutan: setujui, proses, lalu konfirmasi pembayaran dengan referensi."
        actions={<SimulationTag>Data lokal</SimulationTag>}
      />

      <Callout tone="warning" icon={ShieldCheck} title="Tidak ada transfer nyata">
        Status PAID hanya merupakan penanda demo setelah verifikasi transfer dan referensi pembayaran diisi. Jangan
        memasukkan data rekening nyata.
      </Callout>

      <div className="stats-grid">
        <StatCard
          label="Menunggu persetujuan"
          value={formatIDR(pendingTotal)}
          icon={Clock3}
          tone="warning"
          footnote={`${counts.PENDING} pengajuan PENDING menahan saldo`}
          simulated
        />
        <StatCard
          label="Sedang diproses"
          value={formatIDR(processingTotal)}
          icon={Timer}
          footnote={`${counts.APPROVED} disetujui · ${counts.PROCESSING} diproses`}
          simulated
        />
        <StatCard
          label="Total dibayar"
          value={formatIDR(paidTotal)}
          icon={BadgeCheck}
          tone="success"
          footnote={`${counts.PAID} penarikan berstatus PAID`}
          simulated
        />
        <StatCard
          label="Ditolak / dibatalkan"
          value={String(problemCount)}
          icon={XCircle}
          tone="danger"
          footnote={`${counts.REJECTED} ditolak · ${counts.CANCELLED} dibatalkan`}
          simulated
        />
      </div>

      <Panel
        title="Antrean penarikan"
        description="Data demo diurutkan dari pengajuan terbaru."
        action={<Badge tone={counts.PENDING > 0 ? 'warning' : 'success'}>{counts.PENDING} perlu ditinjau</Badge>}
      >
        <Tabs
          label="Filter status penarikan"
          value={tab}
          onChange={(value) => {
            setTab(value as WithdrawalTab)
            setPage(1)
          }}
          items={[
            { id: 'ALL', label: 'Semua', count: counts.ALL },
            { id: 'PENDING', label: 'Menunggu', count: counts.PENDING },
            { id: 'APPROVED', label: 'Disetujui', count: counts.APPROVED },
            { id: 'PROCESSING', label: 'Diproses', count: counts.PROCESSING },
            { id: 'PAID', label: 'Dibayar', count: counts.PAID },
            { id: 'REJECTED', label: 'Ditolak', count: counts.REJECTED },
            { id: 'CANCELLED', label: 'Dibatalkan', count: counts.CANCELLED },
          ]}
        />

        <div className="filter-bar jobs-toolbar">
          <SearchField
            label="Cari penarikan berdasarkan ID seller atau referensi"
            value={query}
            onChange={(value) => {
              setQuery(value)
              setPage(1)
            }}
            placeholder="Cari ID, seller, metode, atau referensi…"
          />
          <Button
            variant="ghost"
            size="sm"
            iconLeft={RotateCcw}
            onClick={() => {
              setQuery('')
              setPage(1)
            }}
            disabled={!hasFilters}
            className="filter-reset"
          >
            Reset
          </Button>
          <span className="filter-bar__result">{filtered.length} pengajuan</span>
        </div>

        {pageItems.length > 0 ? (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <caption className="sr-only">Antrean penarikan seller</caption>
                <thead>
                  <tr>
                    <th scope="col">Pengajuan</th>
                    <th scope="col">Seller</th>
                    <th scope="col" className="num">Nominal</th>
                    <th scope="col">Metode</th>
                    <th scope="col">Diajukan</th>
                    <th scope="col">Status</th>
                    <th scope="col"><span className="sr-only">Aksi</span></th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((withdrawal) => (
                    <tr key={withdrawal.id}>
                      <td>
                        <div className="cell-title mono">{withdrawal.id}</div>
                        <div className="cell-sub">
                          {withdrawal.paymentRef ? `Ref. ${withdrawal.paymentRef}` : 'Belum ada referensi transfer'}
                        </div>
                      </td>
                      <td>
                        <div className="cell-title">{withdrawal.sellerName}</div>
                        <div className="cell-sub mono">{withdrawal.sellerId}</div>
                      </td>
                      <td className="num cell-amount">{formatIDR(withdrawal.amount)}</td>
                      <td>
                        <div className="cell-title">{withdrawal.method}</div>
                        <div className="cell-sub">{maskAccount(withdrawal.accountNumber)}</div>
                      </td>
                      <td>{formatDate(withdrawal.requestedAt)}</td>
                      <td><StatusBadge meta={WITHDRAWAL_STATUS[withdrawal.status]} /></td>
                      <td>
                        <div className="cell-actions">
                          <Button
                            variant="secondary"
                            size="sm"
                            iconRight={ArrowRight}
                            onClick={() => setSelectedId(withdrawal.id)}
                          >
                            Tinjau
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              <p className="result-count">
                Menampilkan <strong>{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}</strong>{' '}
                dari <strong>{filtered.length}</strong> pengajuan
              </p>
              <Pagination page={currentPage} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />
            </div>
          </>
        ) : (
          <EmptyState
            icon={Search}
            title={hasFilters ? 'Pengajuan tidak ditemukan' : 'Tidak ada pengajuan pada filter ini'}
            description={
              hasFilters
                ? 'Coba kata kunci lain atau reset pencarian.'
                : 'Pengajuan penarikan seller akan tampil di antrean ini.'
            }
            action={
              hasFilters ? (
                <Button variant="secondary" size="sm" onClick={() => setQuery('')}>
                  Hapus pencarian
                </Button>
              ) : undefined
            }
          />
        )}
      </Panel>

      {selected ? (
        <Modal
          open={Boolean(selected)}
          onClose={() => setSelectedId(null)}
          title={`Penarikan ${selected.id}`}
          description={`${selected.sellerName} · diajukan ${formatDateTime(selected.requestedAt)}`}
          eyebrow="Detail penarikan"
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setSelectedId(null)}>
                Tutup
              </Button>
              {selected.status === 'PENDING' ? (
                <>
                  <Button variant="danger" iconLeft={XCircle} onClick={() => setRejectOpen(true)}>
                    Tolak
                  </Button>
                  <Button variant="success" iconLeft={CheckCircle2} onClick={() => setConfirmAction('APPROVE')}>
                    Setujui
                  </Button>
                </>
              ) : null}
              {selected.status === 'APPROVED' ? (
                <Button variant="primary" iconLeft={Timer} onClick={() => setConfirmAction('PROCESS')}>
                  Tandai diproses
                </Button>
              ) : null}
              {selected.status === 'PROCESSING' ? (
                <Button variant="success" iconLeft={BadgeCheck} onClick={() => setPaidOpen(true)}>
                  Konfirmasi pembayaran
                </Button>
              ) : null}
            </>
          }
        >
          <div className="withdraw-detail">
            <div className="withdraw-detail__hero">
              <div>
                <span>Nominal pengajuan</span>
                <strong>{formatIDR(selected.amount)}</strong>
              </div>
              <StatusBadge meta={WITHDRAWAL_STATUS[selected.status]} />
            </div>

            <div className="admin-withdrawal-seller">
              <div>
                <span>Seller</span>
                <strong>{selected.sellerName}</strong>
                <small>{selectedSeller?.email ?? selected.sellerId}</small>
              </div>
              <div>
                <span>Status seller</span>
                {selectedSeller ? (
                  <StatusBadge meta={SELLER_STATUS[selectedSeller.status]} />
                ) : (
                  <Badge tone="neutral">Tidak ditemukan</Badge>
                )}
              </div>
            </div>

            <div className="confirm-summary">
              <div>
                <span>Metode</span>
                <strong>{selected.method}</strong>
              </div>
              <div>
                <span>Nama pemilik</span>
                <strong>{selected.accountName}</strong>
              </div>
              <div>
                <span>Nomor akun</span>
                <strong>{maskAccount(selected.accountNumber)}</strong>
              </div>
              <div>
                <span>Terakhir diperbarui</span>
                <strong>{formatDateTime(selected.updatedAt)}</strong>
              </div>
              {selected.paymentRef ? (
                <div>
                  <span>Referensi pembayaran</span>
                  <strong className="mono">{selected.paymentRef}</strong>
                </div>
              ) : null}
            </div>

            {selected.status === 'PENDING' ? (
              <Callout tone="warning" icon={Clock3} title="Saldo seller ditahan">
                Tinjau kecocokan nama dan metode pembayaran sebelum menyetujui. Penolakan harus menyertakan alasan
                minimal 5 karakter.
              </Callout>
            ) : null}

            {selected.status === 'APPROVED' ? (
              <Callout tone="info" icon={CreditCard} title="Siap diproses">
                Tandai pengajuan sebagai diproses setelah antrean transfer disiapkan. Status PAID tetap memerlukan
                referensi dan konfirmasi.
              </Callout>
            ) : null}

            {selected.status === 'PROCESSING' ? (
              <Callout tone="info" icon={Banknote} title="Menunggu konfirmasi transfer">
                Konfirmasi pembayaran hanya dapat dicatat setelah referensi transfer diisi dan verifikasi dicentang.
              </Callout>
            ) : null}

            {selected.reason ? (
              <Callout
                tone={selected.status === 'REJECTED' ? 'danger' : 'warning'}
                title="Catatan keputusan"
              >
                {selected.reason}
              </Callout>
            ) : null}

            <section className="detail-section">
              <h3>Riwayat status</h3>
              <div className="timeline">
                {[...selected.timeline]
                  .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
                  .map((event, index, sorted) => (
                    <div className="timeline__item" key={`${event.at}-${event.status}-${index}`}>
                      <span className={`timeline__dot${index === sorted.length - 1 ? ' is-current' : ''}`} aria-hidden="true" />
                      <div className="timeline__content">
                        <div className="timeline__top">
                          <p className="timeline__action">{WITHDRAWAL_STATUS[event.status].label}</p>
                          <span className="timeline__time">{formatDateTime(event.at)}</span>
                        </div>
                        <p className="timeline__meta">oleh {event.by}</p>
                        {event.note ? <p className="timeline__detail">{event.note}</p> : null}
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            <p className="detail-footnote">
              Nomor akun disamarkan pada seluruh tampilan admin. Data pembayaran nyata tidak boleh digunakan pada
              prototype.
            </p>
          </div>
        </Modal>
      ) : null}

      <ConfirmDialog
        open={confirmAction === 'APPROVE'}
        onClose={() => setConfirmAction(null)}
        onConfirm={approve}
        title="Setujui penarikan?"
        description={
          selected
            ? `${formatIDR(selected.amount)} untuk ${selected.sellerName} akan disetujui. Saldo tetap ditahan sampai pembayaran dikonfirmasi.`
            : 'Pengajuan akan disetujui.'
        }
        confirmLabel="Setujui penarikan"
      >
        {selected ? (
          <div className="confirm-summary">
            <div>
              <span>Metode</span>
              <strong>{selected.method}</strong>
            </div>
            <div>
              <span>Pemilik akun</span>
              <strong>{selected.accountName}</strong>
            </div>
            <div>
              <span>Nomor akun</span>
              <strong>{maskAccount(selected.accountNumber)}</strong>
            </div>
          </div>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmAction === 'PROCESS'}
        onClose={() => setConfirmAction(null)}
        onConfirm={process}
        title="Tandai sebagai diproses?"
        description="Pengajuan akan masuk tahap PROCESSING. Konfirmasi pembayaran masih diperlukan untuk status PAID."
        confirmLabel="Tandai diproses"
      >
        {selected ? (
          <div className="confirm-summary">
            <div>
              <span>Pengajuan</span>
              <strong className="mono">{selected.id}</strong>
            </div>
            <div>
              <span>Nominal</span>
              <strong>{formatIDR(selected.amount)}</strong>
            </div>
          </div>
        ) : null}
      </ConfirmDialog>

      <ReasonDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={reject}
        title="Tolak penarikan?"
        description={selected ? `${selected.id} · ${formatIDR(selected.amount)}` : 'Pengajuan akan ditolak.'}
        label="Alasan penolakan"
        placeholder="Contoh: nama pemilik rekening tidak sesuai dengan profil."
        confirmLabel="Tolak penarikan"
        tone="danger"
      >
        <Callout tone="warning" title="Saldo akan tersedia kembali">
          Penolakan mengembalikan saldo tertahan ke saldo tersedia seller dan menandai transaksi terkait gagal pada
          data demo.
        </Callout>
      </ReasonDialog>

      <Modal
        open={paidOpen}
        onClose={() => setPaidOpen(false)}
        title="Konfirmasi pembayaran"
        description={selected ? `${selected.id} · ${formatIDR(selected.amount)}` : 'Catat pembayaran demo.'}
        eyebrow="Tahap akhir"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPaidOpen(false)}>
              Batal
            </Button>
            <Button variant="success" iconLeft={BadgeCheck} type="submit" form="mark-paid-form">
              Catat sebagai PAID
            </Button>
          </>
        }
      >
        <form id="mark-paid-form" className="form-stack" onSubmit={markPaid} noValidate>
          <Callout tone="warning" title="Simulasi pembayaran">
            Prototype tidak melakukan transfer. Hanya catat referensi fiktif untuk menyelesaikan status demo.
          </Callout>
          <TextField
            label="Referensi transfer"
            name="paymentRef"
            value={paymentRef}
            onChange={(event) => {
              setPaymentRef(event.target.value)
              setPaidError('')
            }}
            placeholder="Contoh: TRF-BCA-DEMO-001"
            hint="Minimal 4 karakter. Jangan gunakan kode transaksi nyata."
            required
          />
          <CheckboxField
            label="Saya menyatakan bahwa verifikasi transfer sudah dilakukan pada simulasi ini."
            description="Status PAID tidak dapat dicatat tanpa konfirmasi ini."
            checked={confirmed}
            onChange={(value) => {
              setConfirmed(value)
              setPaidError('')
            }}
            error={paidError || undefined}
          />
        </form>
      </Modal>
    </div>
  )
}
