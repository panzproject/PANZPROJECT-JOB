import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  BadgeCheck,
  CalendarDays,
  CreditCard,
  KeyRound,
  Laptop,
  Mail,
  MapPin,
  MonitorSmartphone,
  RefreshCw,
  Save,
  ShieldCheck,
  ShieldQuestion,
  Smartphone,
  UserRound,
  Wallet,
} from 'lucide-react'
import { useApp } from '../../store/AppContext'
import type { PaymentMethod } from '../../types'
import { formatDate, formatDateTime, formatIDR, maskAccount, relativeTime } from '../../lib/format'
import {
  Avatar,
  Badge,
  Button,
  Callout,
  ConfirmDialog,
  PageHeader,
  Panel,
  SelectField,
  SimulationTag,
  TextField,
} from '../../components/ui'
import { useToast } from '../../components/ui/Toast'

const bankProviders = ['Bank BCA', 'Bank Mandiri', 'Bank BNI', 'Bank BRI']
const ewalletProviders = ['DANA', 'OVO', 'GoPay', 'ShopeePay']

type ProfileErrors = {
  name?: string
  username?: string
  email?: string
  accountName?: string
  accountNumber?: string
}

export default function Profile() {
  const { state, currentSeller, updateProfile, updatePaymentMethod, requestPasswordResetDemo, revokeSession } = useApp()
  const toast = useToast()
  const [name, setName] = useState(currentSeller.name)
  const [username, setUsername] = useState(currentSeller.username)
  const [email, setEmail] = useState(currentSeller.email)
  const [errors, setErrors] = useState<ProfileErrors>({})
  const [profileError, setProfileError] = useState('')

  const [methodType, setMethodType] = useState<PaymentMethod['type']>(
    currentSeller.paymentMethod?.type ?? 'bank',
  )
  const [provider, setProvider] = useState(currentSeller.paymentMethod?.provider ?? bankProviders[0])
  const [accountName, setAccountName] = useState(currentSeller.paymentMethod?.accountName ?? currentSeller.name)
  const [accountNumber, setAccountNumber] = useState(currentSeller.paymentMethod?.accountNumber ?? '')
  const [paymentError, setPaymentError] = useState('')
  const [paymentErrors, setPaymentErrors] = useState<ProfileErrors>({})
  const [revokeId, setRevokeId] = useState<string | null>(null)

  useEffect(() => {
    setName(currentSeller.name)
    setUsername(currentSeller.username)
    setEmail(currentSeller.email)
    setMethodType(currentSeller.paymentMethod?.type ?? 'bank')
    setProvider(currentSeller.paymentMethod?.provider ?? bankProviders[0])
    setAccountName(currentSeller.paymentMethod?.accountName ?? currentSeller.name)
    setAccountNumber(currentSeller.paymentMethod?.accountNumber ?? '')
    setErrors({})
    setPaymentErrors({})
    setProfileError('')
    setPaymentError('')
  }, [currentSeller.id])

  const completedJobs = state.jobs.filter(
    (job) => job.sellerId === currentSeller.id && job.status === 'APPROVED',
  ).length
  const sessions = useMemo(
    () => [...state.sessions].sort((a, b) => Number(b.current) - Number(a.current)),
    [state.sessions],
  )
  const sessionToRevoke = sessions.find((session) => session.id === revokeId) ?? null
  const providers = methodType === 'bank' ? bankProviders : ewalletProviders

  const submitProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: ProfileErrors = {}
    if (name.trim().length < 3) nextErrors.name = 'Nama minimal 3 karakter.'
    if (!/^[a-z0-9._]{3,30}$/i.test(username.trim())) {
      nextErrors.username = 'Gunakan 3–30 huruf, angka, titik, atau garis bawah.'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = 'Masukkan alamat email yang valid.'
    setErrors(nextErrors)
    setProfileError('')
    if (Object.keys(nextErrors).length > 0) return

    const result = updateProfile({ name, username, email })
    if (result.ok) {
      toast.success(result.message, 'Profil disimpan')
    } else {
      setProfileError(result.message)
      toast.error(result.message)
    }
  }

  const resetProfileForm = () => {
    setName(currentSeller.name)
    setUsername(currentSeller.username)
    setEmail(currentSeller.email)
    setErrors({})
    setProfileError('')
  }

  const submitPayment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: ProfileErrors = {}
    if (accountName.trim().length < 3) nextErrors.accountName = 'Nama pemilik akun wajib diisi minimal 3 karakter.'
    if (accountNumber.replace(/\D/g, '').length < 6) nextErrors.accountNumber = 'Nomor akun demo minimal 6 digit.'
    setPaymentErrors(nextErrors)
    setPaymentError('')
    if (Object.keys(nextErrors).length > 0) return

    const result = updatePaymentMethod({
      type: methodType,
      provider,
      accountName: accountName.trim(),
      accountNumber: accountNumber.trim(),
    })
    if (result.ok) {
      toast.success(result.message, 'Metode pembayaran disimpan')
    } else {
      setPaymentError(result.message)
      toast.error(result.message)
    }
  }

  const changeMethodType = (value: string) => {
    const nextType = value as PaymentMethod['type']
    setMethodType(nextType)
    setProvider(nextType === 'bank' ? bankProviders[0] : ewalletProviders[0])
  }

  const simulatePasswordReset = () => {
    const result = requestPasswordResetDemo()
    if (result.ok) toast.info(result.message, 'Simulasi keamanan')
    else toast.error(result.message)
  }

  const confirmRevoke = () => {
    if (!revokeId) return
    const result = revokeSession(revokeId)
    if (result.ok) toast.success(result.message, 'Sesi dicabut')
    else toast.error(result.message)
    setRevokeId(null)
  }

  return (
    <div className="page page-enter">
      <PageHeader
        eyebrow="Akun seller"
        title="Profil & keamanan"
        description="Kelola identitas akun, metode pembayaran demo, dan sesi perangkat. Perubahan hanya tersimpan di peramban."
        actions={<SimulationTag>Data lokal</SimulationTag>}
      />

      <Callout tone="warning" title="Jangan gunakan data pribadi nyata">
        Semua informasi di halaman ini adalah bagian dari prototype. Nomor rekening, email, dan sesi tidak
        terhubung ke layanan nyata.
      </Callout>

      <section className="profile-hero" aria-label="Ringkasan akun seller">
        <Avatar name={currentSeller.name} size="lg" status={currentSeller.status === 'ACTIVE' ? 'online' : 'pending'} />
        <div className="profile-hero__copy">
          <div className="profile-hero__title-row">
            <h2>{currentSeller.name}</h2>
            <Badge tone={currentSeller.status === 'ACTIVE' ? 'success' : 'warning'}>
              {currentSeller.status === 'ACTIVE' ? 'Aktif' : currentSeller.status}
            </Badge>
            {currentSeller.emailVerified ? (
              <Badge tone="info">
                <BadgeCheck size={10} aria-hidden="true" /> Email terverifikasi
              </Badge>
            ) : (
              <Badge tone="warning">
                <ShieldQuestion size={10} aria-hidden="true" /> Email perlu verifikasi
              </Badge>
            )}
          </div>
          <p className="profile-hero__username">@{currentSeller.username} · {currentSeller.email}</p>
          <div className="profile-hero__facts">
            <span><CalendarDays size={13} aria-hidden="true" /> Bergabung {formatDate(currentSeller.joinedAt)}</span>
            <span><UserRound size={13} aria-hidden="true" /> Seller ID <span className="mono">{currentSeller.id}</span></span>
            <span><BadgeCheck size={13} aria-hidden="true" /> {completedJobs} pekerjaan disetujui</span>
          </div>
        </div>
        <div className="profile-hero__score">
          <span>Total penghasilan demo</span>
          <strong>{formatIDR(state.wallet.lifetimeEarnings)}</strong>
          <small>
            Aktivitas terakhir{' '}
            {relativeTime(state.transactions[state.transactions.length - 1]?.date ?? currentSeller.joinedAt)}
          </small>
        </div>
      </section>

      <div className="profile-grid">
        <Panel
          title="Informasi akun"
          description="Nama, username, dan email yang digunakan pada prototype."
        >
          <form className="form-stack" onSubmit={submitProfile} noValidate>
            {profileError ? (
              <Callout tone="danger" title="Perubahan belum disimpan">
                {profileError}
              </Callout>
            ) : null}
            <TextField
              label="Nama lengkap"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              error={errors.name}
              hint="Minimal 3 karakter."
              autoComplete="name"
              required
            />
            <TextField
              label="Username"
              name="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              error={errors.username}
              hint="Huruf, angka, titik, atau garis bawah. 3–30 karakter."
              prefix="@"
              autoComplete="username"
              required
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={errors.email}
              hint={
                email !== currentSeller.email
                  ? 'Mengubah email akan mereset status verifikasi pada data demo.'
                  : 'Email demo; tidak dikirim keluar.'
              }
              autoComplete="email"
              required
            />
            <div className="form-actions">
              <Button variant="ghost" iconLeft={RefreshCw} onClick={resetProfileForm} type="button">
                Reset
              </Button>
              <Button variant="primary" iconLeft={Save} type="submit">
                Simpan perubahan
              </Button>
            </div>
          </form>
        </Panel>

        <Panel
          title="Metode pembayaran"
          description="Tujuan penarikan pada simulasi keuangan."
          action={
            currentSeller.paymentMethod ? (
              <Badge tone="success">Aktif</Badge>
            ) : (
              <Badge tone="warning">Belum diatur</Badge>
            )
          }
        >
          <div className="payment-current">
            <span className="payout-card__icon" aria-hidden="true"><CreditCard size={20} /></span>
            <div>
              <p>{currentSeller.paymentMethod?.provider ?? 'Belum ada metode'}</p>
              <span>
                {currentSeller.paymentMethod
                  ? `${maskAccount(currentSeller.paymentMethod.accountNumber)} · ${currentSeller.paymentMethod.accountName}`
                  : 'Isi formulir di bawah untuk data demo'}
              </span>
            </div>
          </div>

          <form className="form-stack" onSubmit={submitPayment} noValidate>
            {paymentError ? (
              <Callout tone="danger" title="Metode belum disimpan">
                {paymentError}
              </Callout>
            ) : null}
            <div className="form-grid">
              <SelectField
                label="Jenis metode"
                value={methodType}
                onChange={(event) => changeMethodType(event.target.value)}
                options={[
                  { value: 'bank', label: 'Transfer bank' },
                  { value: 'ewallet', label: 'E-wallet' },
                ]}
              />
              <SelectField
                label="Penyedia"
                value={provider}
                onChange={(event) => setProvider(event.target.value)}
                options={providers.map((item) => ({ value: item, label: item }))}
              />
              <TextField
                label="Nama pemilik akun"
                name="accountName"
                value={accountName}
                onChange={(event) => setAccountName(event.target.value)}
                error={paymentErrors.accountName}
                autoComplete="off"
                required
              />
              <TextField
                label="Nomor akun demo"
                name="accountNumber"
                value={accountNumber}
                onChange={(event) => setAccountNumber(event.target.value.replace(/[^\d\s-]/g, ''))}
                error={paymentErrors.accountNumber}
                hint="Gunakan angka fiktif. Minimal 6 digit."
                inputMode="numeric"
                autoComplete="off"
                required
              />
            </div>
            <Callout tone="info" title="Nomor akun disamarkan pada tampilan">
              Setelah disimpan, nomor hanya ditampilkan sebagian. Data ini tidak terhubung ke bank atau e-wallet.
            </Callout>
            <div className="form-actions">
              <Button variant="primary" iconLeft={Wallet} type="submit">
                Simpan metode demo
              </Button>
            </div>
          </form>
        </Panel>
      </div>

      <div className="profile-security-grid">
        <Panel title="Keamanan akun" description="Kontrol keamanan yang tersedia pada prototype.">
          <div className="security-list">
            <div className="security-row">
              <span className="security-row__icon" aria-hidden="true"><KeyRound size={17} /></span>
              <div className="security-row__copy">
                <p>Kata sandi</p>
                <span>Simulasikan tautan ubah kata sandi. Tidak ada email yang dikirim.</span>
              </div>
              <Button variant="secondary" size="sm" onClick={simulatePasswordReset}>
                Simulasikan reset
              </Button>
            </div>
            <div className="security-row">
              <span className="security-row__icon" aria-hidden="true"><Mail size={17} /></span>
              <div className="security-row__copy">
                <p>Verifikasi email</p>
                <span>
                  {currentSeller.emailVerified
                    ? 'Email demo sudah ditandai terverifikasi.'
                    : 'Perubahan email mereset status verifikasi pada data demo.'}
                </span>
              </div>
              <Badge tone={currentSeller.emailVerified ? 'success' : 'warning'}>
                {currentSeller.emailVerified ? 'Terverifikasi' : 'Perlu verifikasi'}
              </Badge>
            </div>
            <div className="security-row">
              <span className="security-row__icon" aria-hidden="true"><ShieldCheck size={17} /></span>
              <div className="security-row__copy">
                <p>Autentikasi dua faktor</p>
                <span>MFA admin tersedia pada pengaturan admin. MFA seller belum termasuk prototype.</span>
              </div>
              <Badge tone="neutral">Backlog</Badge>
            </div>
          </div>
          <Callout tone="warning" title="Batasan keamanan prototype">
            Tidak ada autentikasi nyata, penyimpanan kata sandi, atau sesi server. Jangan gunakan untuk data
            pengguna sebenarnya.
          </Callout>
        </Panel>

        <Panel
          title="Sesi perangkat"
          description={`${sessions.length} sesi tercatat pada data demo.`}
          action={<Badge tone="info">{sessions.filter((session) => session.current).length} sesi ini</Badge>}
        >
          <div className="session-list">
            {sessions.map((session) => (
              <div className="session-row" key={session.id}>
                <span className="session-row__icon" aria-hidden="true">
                  {session.device.toLowerCase().includes('iphone') || session.device.toLowerCase().includes('android') ? (
                    <Smartphone size={17} />
                  ) : session.device.toLowerCase().includes('ipad') ? (
                    <MonitorSmartphone size={17} />
                  ) : (
                    <Laptop size={17} />
                  )}
                </span>
                <div className="session-row__copy">
                  <p>
                    {session.device} · {session.browser}
                    {session.current ? <Badge tone="success">Sesi ini</Badge> : null}
                  </p>
                  <span>
                    <MapPin size={11} aria-hidden="true" /> {session.location} · Terakhir aktif{' '}
                    {relativeTime(session.lastActiveAt)}
                  </span>
                  <small title={formatDateTime(session.lastActiveAt)}>{session.id}</small>
                </div>
                {session.current ? (
                  <span className="session-row__current">Aktif</span>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => setRevokeId(session.id)}>
                    Cabut sesi
                  </Button>
                )}
              </div>
            ))}
          </div>
          <p className="detail-footnote">Pencabutan sesi hanya menghapus baris pada state demo.</p>
        </Panel>
      </div>

      <ConfirmDialog
        open={Boolean(revokeId)}
        onClose={() => setRevokeId(null)}
        onConfirm={confirmRevoke}
        title="Cabut sesi perangkat?"
        description={
          sessionToRevoke
            ? `${sessionToRevoke.device} · ${sessionToRevoke.browser} akan dihapus dari data sesi demo.`
            : 'Sesi akan dihapus dari data demo.'
        }
        confirmLabel="Cabut sesi"
        tone="danger"
      >
        <Callout tone="warning" title="Simulasi">
          Tidak ada sesi nyata yang dicabut dan tidak ada pengguna yang dikeluarkan dari perangkat.
        </Callout>
      </ConfirmDialog>
    </div>
  )
}
