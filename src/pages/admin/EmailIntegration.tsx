import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  Link2,
  Mail,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Unplug,
} from 'lucide-react'
import { useApp } from '../../store/AppContext'
import type { EmailConnection, EmailConnectionStatus } from '../../types'
import { formatDateTime, relativeTime } from '../../lib/format'
import {
  Badge,
  Button,
  Callout,
  ConfirmDialog,
  EmptyState,
  Modal,
  PageHeader,
  Panel,
  SelectField,
  SimulationTag,
  TextField,
} from '../../components/ui'
import { useToast } from '../../components/ui/Toast'

const statusMeta: Record<EmailConnectionStatus, { label: string; tone: 'success' | 'warning' | 'neutral' }> = {
  CONNECTED: { label: 'Terhubung', tone: 'success' },
  NEEDS_ATTENTION: { label: 'Perlu perhatian', tone: 'warning' },
  REVOKED: { label: 'Akses dicabut', tone: 'neutral' },
}

const providers = ['Microsoft 365', 'Microsoft Outlook', 'Google Workspace']

export default function EmailIntegration() {
  const { state, addEmailConnection, markConnectionChecked, reconnectConnection, revokeConnection } = useApp()
  const toast = useToast()
  const [addOpen, setAddOpen] = useState(false)
  const [provider, setProvider] = useState(providers[0])
  const [email, setEmail] = useState('')
  const [label, setLabel] = useState('')
  const [formError, setFormError] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [revokeId, setRevokeId] = useState<string | null>(null)

  const summary = useMemo(
    () => ({
      connected: state.connections.filter((item) => item.status === 'CONNECTED').length,
      attention: state.connections.filter((item) => item.status === 'NEEDS_ATTENTION').length,
      revoked: state.connections.filter((item) => item.status === 'REVOKED').length,
    }),
    [state.connections],
  )

  const detail = state.connections.find((connection) => connection.id === detailId) ?? null
  const revokeTarget = state.connections.find((connection) => connection.id === revokeId) ?? null

  useEffect(() => {
    if (!addOpen) return
    setProvider(providers[0])
    setEmail('')
    setLabel('')
    setFormError('')
  }, [addOpen])

  const submitConnection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email.includes('@')) {
      setFormError('Masukkan alamat email demo yang valid.')
      return
    }
    if (label.trim().length < 2) {
      setFormError('Label koneksi minimal 2 karakter.')
      return
    }
    const result = addEmailConnection({ provider, email: email.trim(), label: label.trim() })
    if (result.ok) {
      toast.success(result.message, 'Koneksi demo ditambahkan')
      setAddOpen(false)
    } else {
      setFormError(result.message)
    }
  }

  const checkConnection = (connection: EmailConnection) => {
    const result = markConnectionChecked(connection.id)
    if (result.ok) toast.success(result.message, 'Pemeriksaan selesai')
    else toast.warning(result.message, 'Koneksi masih bermasalah')
  }

  const reconnect = (connection: EmailConnection) => {
    const result = reconnectConnection(connection.id)
    if (result.ok) toast.success(result.message, 'Koneksi dipulihkan')
    else toast.error(result.message)
  }

  const confirmRevoke = () => {
    if (!revokeId) return
    const result = revokeConnection(revokeId)
    if (result.ok) toast.success(result.message, 'Akses dicabut')
    else toast.error(result.message)
    setRevokeId(null)
    setDetailId(null)
  }

  return (
    <div className="page page-enter">
      <PageHeader
        eyebrow="Panel admin"
        title="Integrasi email"
        description="Kelola koneksi email operasional demo, izin minimal, dan error yang sudah disanitasi."
        actions={
          <Button variant="primary" iconLeft={Plus} onClick={() => setAddOpen(true)}>
            Tambah koneksi
          </Button>
        }
      />

      <Callout tone="warning" icon={ShieldAlert} title="Tidak ada OAuth atau token nyata">
        Penambahan koneksi pada prototype hanya membuat metadata demo. Jangan memasukkan email atau kredensial nyata;
        tidak ada autentikasi Microsoft/Google yang dijalankan dan tidak ada email yang dibaca.
      </Callout>

      <div className="email-health">
        <div>
          <span className="email-health__icon is-connected" aria-hidden="true"><ShieldCheck size={18} /></span>
          <div>
            <strong>{summary.connected}</strong>
            <span>koneksi terhubung</span>
          </div>
        </div>
        <div>
          <span className="email-health__icon is-attention" aria-hidden="true"><AlertTriangle size={18} /></span>
          <div>
            <strong>{summary.attention}</strong>
            <span>perlu perhatian</span>
          </div>
        </div>
        <div>
          <span className="email-health__icon is-revoked" aria-hidden="true"><Unplug size={18} /></span>
          <div>
            <strong>{summary.revoked}</strong>
            <span>akses dicabut</span>
          </div>
        </div>
        <div className="email-health__note">
          <Clock3 size={13} aria-hidden="true" />
          <span>Sinkronisasi terakhir diperbarui pada data demo.</span>
        </div>
      </div>

      <Panel
        title="Koneksi email"
        description="Izin hanya metadata demo; isi email tidak pernah diambil."
        action={<SimulationTag>Tanpa OAuth</SimulationTag>}
      >
        {state.connections.length > 0 ? (
          <div className="connection-grid">
            {state.connections.map((connection) => {
              const meta = statusMeta[connection.status]
              return (
                <article className={`connection-card connection-card--${connection.status.toLowerCase()}`} key={connection.id}>
                  <div className="connection-card__head">
                    <span className="connection-card__icon" aria-hidden="true"><Mail size={19} /></span>
                    <div className="connection-card__identity">
                      <div>
                        <h3>{connection.label}</h3>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </div>
                      <p>{connection.email}</p>
                      <span>{connection.provider} · <span className="mono">{connection.id}</span></span>
                    </div>
                  </div>

                  <div className="connection-card__sync">
                    <div>
                      <span>Terakhir sinkron</span>
                      <strong>{connection.lastSync ? relativeTime(connection.lastSync) : 'Belum pernah'}</strong>
                    </div>
                    <div>
                      <span>Izin</span>
                      <strong>{connection.permissions.length} izin demo</strong>
                    </div>
                  </div>

                  {connection.permissions.length > 0 ? (
                    <div className="permission-chips">
                      {connection.permissions.map((permission) => (
                        <span className="permission-chip" key={permission}>{permission}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="detail-empty">Tidak ada izin aktif pada koneksi ini.</p>
                  )}

                  {connection.errors.length > 0 ? (
                    <div className="connection-error">
                      <AlertTriangle size={14} aria-hidden="true" />
                      <div>
                        <strong>{connection.errors[0].code}</strong>
                        <p>{connection.errors[0].message}</p>
                        <span>{formatDateTime(connection.errors[0].at)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="connection-ok">
                      <CheckCircle2 size={14} aria-hidden="true" />
                      <span>Tidak ada error tercatat.</span>
                    </div>
                  )}

                  <div className="connection-card__actions">
                    <Button variant="ghost" size="sm" iconLeft={Eye} onClick={() => setDetailId(connection.id)}>
                      Detail
                    </Button>
                    {connection.status !== 'REVOKED' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        iconLeft={RefreshCw}
                        onClick={() => checkConnection(connection)}
                      >
                        Periksa
                      </Button>
                    ) : null}
                    {connection.status === 'NEEDS_ATTENTION' || connection.status === 'REVOKED' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        iconLeft={Link2}
                        onClick={() => reconnect(connection)}
                      >
                        Sambungkan kembali
                      </Button>
                    ) : (
                      <Button
                        variant="danger"
                        size="sm"
                        iconLeft={Unplug}
                        onClick={() => setRevokeId(connection.id)}
                      >
                        Cabut akses
                      </Button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <EmptyState
            icon={Mail}
            title="Belum ada koneksi email"
            description="Tambahkan koneksi demo untuk menampilkan status integrasi. Tidak ada OAuth yang dijalankan."
            action={
              <Button variant="primary" size="sm" iconLeft={Plus} onClick={() => setAddOpen(true)}>
                Tambah koneksi
              </Button>
            }
          />
        )}
      </Panel>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Tambah koneksi email"
        description="Metadata demo saja. Tidak ada OAuth atau kredensial yang diminta."
        eyebrow="Integrasi simulasi"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" iconLeft={Plus} type="submit" form="add-email-form">
              Tambah koneksi
            </Button>
          </>
        }
      >
        <form id="add-email-form" className="form-stack" onSubmit={submitConnection} noValidate>
          {formError ? (
            <Callout tone="danger" title="Koneksi belum ditambahkan">
              {formError}
            </Callout>
          ) : null}
          <SelectField
            label="Penyedia"
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
            options={providers.map((item) => ({ value: item, label: item }))}
          />
          <TextField
            label="Email demo"
            name="email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setFormError('')
            }}
            placeholder="operasional@panzproject.demo"
            hint="Gunakan domain demo, bukan email pribadi."
            autoComplete="off"
            required
          />
          <TextField
            label="Label koneksi"
            name="label"
            value={label}
            onChange={(event) => {
              setLabel(event.target.value)
              setFormError('')
            }}
            placeholder="Contoh: Operasional"
            hint="Minimal 2 karakter."
            required
          />
          <Callout tone="warning" title="Tanpa autentikasi">
            Tombol tambah hanya membuat metadata pada state lokal. Tidak ada halaman login penyedia email dan tidak
            ada token akses.
          </Callout>
        </form>
      </Modal>

      {detail ? (
        <Modal
          open={Boolean(detail)}
          onClose={() => setDetailId(null)}
          title={detail.label}
          description={`${detail.email} · ${detail.provider}`}
          eyebrow="Detail koneksi"
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDetailId(null)}>
                Tutup
              </Button>
              {detail.status === 'NEEDS_ATTENTION' || detail.status === 'REVOKED' ? (
                <Button
                  variant="primary"
                  iconLeft={Link2}
                  onClick={() => {
                    reconnect(detail)
                    setDetailId(null)
                  }}
                >
                  Sambungkan kembali
                </Button>
              ) : (
                <Button
                  variant="danger"
                  iconLeft={Unplug}
                  onClick={() => setRevokeId(detail.id)}
                >
                  Cabut akses
                </Button>
              )}
            </>
          }
        >
          <div className="connection-detail">
            <div className="connection-detail__top">
              <Badge tone={statusMeta[detail.status].tone}>{statusMeta[detail.status].label}</Badge>
              <span className="mono">{detail.id}</span>
            </div>
            <div className="confirm-summary">
              <div>
                <span>Penyedia</span>
                <strong>{detail.provider}</strong>
              </div>
              <div>
                <span>Email demo</span>
                <strong>{detail.email}</strong>
              </div>
              <div>
                <span>Terakhir sinkron</span>
                <strong>{detail.lastSync ? formatDateTime(detail.lastSync) : 'Belum pernah'}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{statusMeta[detail.status].label}</strong>
              </div>
            </div>

            <section className="detail-section">
              <h3>Izin akses demo</h3>
              {detail.permissions.length > 0 ? (
                <div className="permission-chips">
                  {detail.permissions.map((permission) => (
                    <span className="permission-chip" key={permission}>{permission}</span>
                  ))}
                </div>
              ) : (
                <p className="detail-empty">Tidak ada izin aktif.</p>
              )}
              <p className="detail-footnote">
                Daftar izin hanya teks demo. Prototype tidak pernah meminta atau menyimpan token OAuth.
              </p>
            </section>

            <section className="detail-section">
              <h3>Riwayat error tersanitasi</h3>
              {detail.errors.length > 0 ? (
                <div className="connection-error-list">
                  {detail.errors.map((error, index) => (
                    <div className="connection-error" key={`${error.at}-${error.code}-${index}`}>
                      <AlertTriangle size={14} aria-hidden="true" />
                      <div>
                        <strong>{error.code}</strong>
                        <p>{error.message}</p>
                        <span>{formatDateTime(error.at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="connection-ok">
                  <CheckCircle2 size={14} aria-hidden="true" />
                  <span>Tidak ada error yang tercatat.</span>
                </div>
              )}
            </section>

            <p className="detail-footnote">
              Error pada prototype sudah disanitasi. Sistem produksi tidak boleh menampilkan token, header otorisasi,
              atau isi email pada pesan error.
            </p>
          </div>
        </Modal>
      ) : null}

      <ConfirmDialog
        open={Boolean(revokeId)}
        onClose={() => setRevokeId(null)}
        onConfirm={confirmRevoke}
        title="Cabut akses email?"
        description={revokeTarget ? `${revokeTarget.email} tidak akan memiliki izin aktif pada data demo.` : 'Akses akan dicabut.'}
        confirmLabel="Cabut akses"
        tone="danger"
      >
        <Callout tone="warning" title="Simulasi pencabutan">
          Izin akan dikosongkan dan status menjadi REVOKED. Tidak ada token nyata yang dicabut dan tidak ada
          penyedia email yang dihubungi.
        </Callout>
      </ConfirmDialog>
    </div>
  )
}
