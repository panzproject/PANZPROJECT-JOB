import { useMemo, useState } from 'react'
import {
  BadgeCheck,
  Ban,
  BriefcaseBusiness,
  CircleSlash2,
  CreditCard,
  Mail,
  RotateCcw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react'
import { useApp } from '../../store/AppContext'
import type { Seller, SellerStatus } from '../../types'
import { formatDate, formatDateTime, formatIDR, maskAccount } from '../../lib/format'
import { getJobStatus, SELLER_STATUS } from '../../lib/status'
import { ReasonDialog } from '../../components/common/ReasonDialog'
import {
  Avatar,
  Badge,
  Button,
  Callout,
  ConfirmDialog,
  EmptyState,
  Modal,
  PageHeader,
  Pagination,
  Panel,
  SearchField,
  SelectField,
  SimulationTag,
  StatusBadge,
  Tabs,
} from '../../components/ui'
import { useToast } from '../../components/ui/Toast'

type SellerTab = 'ALL' | 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'CLOSED'
type ReasonAction = 'SUSPEND' | 'REJECT' | 'CLOSE'
type DetailTab = 'PROFILE' | 'JOBS'

const PAGE_SIZE = 8

const tabMatches = (seller: Seller, tab: SellerTab) => tab === 'ALL' || seller.status === tab

const actionCopy: Record<ReasonAction, { title: string; description: string; label: string; confirm: string; status: SellerStatus }> = {
  SUSPEND: {
    title: 'Tangguhkan seller?',
    description: 'Seller tidak dapat mengajukan penarikan atau mengirim hasil selama ditangguhkan.',
    label: 'Alasan penangguhan',
    confirm: 'Tangguhkan seller',
    status: 'SUSPENDED',
  },
  REJECT: {
    title: 'Tolak seller?',
    description: 'Pendaftaran seller akan ditolak pada data demo.',
    label: 'Alasan penolakan',
    confirm: 'Tolak seller',
    status: 'REJECTED',
  },
  CLOSE: {
    title: 'Tutup akun seller?',
    description: 'Akun akan ditutup pada data demo. Pekerjaan yang sudah ada tidak berubah otomatis.',
    label: 'Alasan penutupan akun',
    confirm: 'Tutup akun',
    status: 'CLOSED',
  },
}

export default function SellerManagement() {
  const { state, currentSeller, setSellerStatus } = useApp()
  const toast = useToast()
  const [tab, setTab] = useState<SellerTab>('ALL')
  const [query, setQuery] = useState('')
  const [verified, setVerified] = useState('ALL')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>('PROFILE')
  const [activateOpen, setActivateOpen] = useState(false)
  const [reasonAction, setReasonAction] = useState<ReasonAction | null>(null)

  const counts = useMemo(
    () => ({
      ALL: state.sellers.length,
      PENDING: state.sellers.filter((seller) => seller.status === 'PENDING').length,
      ACTIVE: state.sellers.filter((seller) => seller.status === 'ACTIVE').length,
      SUSPENDED: state.sellers.filter((seller) => seller.status === 'SUSPENDED').length,
      REJECTED: state.sellers.filter((seller) => seller.status === 'REJECTED').length,
      CLOSED: state.sellers.filter((seller) => seller.status === 'CLOSED').length,
    }),
    [state.sellers],
  )

  const filtered = useMemo(() => {
    return state.sellers
      .filter((seller) => {
        if (!tabMatches(seller, tab)) return false
        if (verified === 'VERIFIED' && !seller.emailVerified) return false
        if (verified === 'UNVERIFIED' && seller.emailVerified) return false
        if (!query.trim()) return true
        const needle = query.toLowerCase()
        return (
          seller.id.toLowerCase().includes(needle) ||
          seller.name.toLowerCase().includes(needle) ||
          seller.username.toLowerCase().includes(needle) ||
          seller.email.toLowerCase().includes(needle)
        )
      })
      .sort((a, b) => {
        const priority: Record<SellerStatus, number> = {
          PENDING: 0,
          ACTIVE: 1,
          SUSPENDED: 2,
          REJECTED: 3,
          CLOSED: 4,
        }
        const diff = priority[a.status] - priority[b.status]
        if (diff !== 0) return diff
        return a.name.localeCompare(b.name, 'id')
      })
  }, [state.sellers, tab, verified, query])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const hasFilters = Boolean(query.trim() || verified !== 'ALL')
  const selected = state.sellers.find((seller) => seller.id === selectedId) ?? null
  const selectedJobs = selected
    ? state.jobs.filter((job) => job.sellerId === selected.id).sort((a, b) => b.id.localeCompare(a.id, undefined, { numeric: true }))
    : []
  const selectedCompleted = selectedJobs.filter((job) => job.status === 'APPROVED').length
  const selectedActive = selectedJobs.filter((job) => ['CLAIMED', 'REVISION', 'SUBMITTED', 'UNDER_REVIEW', 'EXPIRY_REVIEW'].includes(job.status)).length
  const selectedEarnings = selectedCompleted > 0 ? selectedJobs.filter((job) => job.status === 'APPROVED').reduce((sum, job) => sum + job.rate, 0) : 0
  const isSelectedCurrent = selected?.id === currentSeller.id

  const resetFilters = () => {
    setQuery('')
    setVerified('ALL')
    setPage(1)
  }

  const activateSeller = () => {
    if (!selected) return
    const result = setSellerStatus(selected.id, 'ACTIVE', 'Aktivasi melalui Manajemen Seller prototype.')
    if (result.ok) toast.success(result.message, 'Seller diaktifkan')
    else toast.error(result.message)
    setActivateOpen(false)
  }

  const applyReason = (reason: string) => {
    if (!selected || !reasonAction) return { ok: false, message: 'Seller tidak ditemukan.' }
    const config = actionCopy[reasonAction]
    const result = setSellerStatus(selected.id, config.status, reason)
    if (result.ok) toast.success(result.message, 'Status seller diperbarui')
    return result
  }

  return (
    <div className="page page-enter">
      <PageHeader
        eyebrow="Panel admin"
        title="Manajemen seller"
        description="Tinjau profil, status, dan pekerjaan seller. Semua perubahan bersifat simulasi lokal tanpa autentikasi nyata."
        actions={<SimulationTag>Data lokal</SimulationTag>}
      />

      <Callout tone="info" icon={ShieldCheck} title="Perubahan status memengaruhi UI seller">
        Menangguhkan atau menutup seller demo akan tercermin pada kemampuan klaim, pengiriman hasil, dan penarikan.
        Tidak ada notifikasi eksternal yang dikirim.
      </Callout>

      <div className="seller-admin-summary">
        <div>
          <span>Total seller</span>
          <strong>{state.sellers.length}</strong>
        </div>
        <div>
          <span>Aktif</span>
          <strong>{counts.ACTIVE}</strong>
        </div>
        <div>
          <span>Menunggu persetujuan</span>
          <strong>{counts.PENDING}</strong>
        </div>
        <div>
          <span>Ditangguhkan</span>
          <strong>{counts.SUSPENDED}</strong>
        </div>
        <SimulationTag />
      </div>

      <Panel
        title="Daftar seller"
        description="Seller dengan status menunggu ditampilkan lebih dahulu."
        action={
          <Badge tone={counts.PENDING > 0 ? 'warning' : 'success'}>
            {counts.PENDING > 0 ? `${counts.PENDING} perlu ditinjau` : 'Tidak ada antrean'}
          </Badge>
        }
      >
        <Tabs
          label="Filter status seller"
          value={tab}
          onChange={(value) => {
            setTab(value as SellerTab)
            setPage(1)
          }}
          items={[
            { id: 'ALL', label: 'Semua', count: counts.ALL },
            { id: 'PENDING', label: 'Menunggu', count: counts.PENDING },
            { id: 'ACTIVE', label: 'Aktif', count: counts.ACTIVE },
            { id: 'SUSPENDED', label: 'Ditangguhkan', count: counts.SUSPENDED },
            { id: 'REJECTED', label: 'Ditolak', count: counts.REJECTED },
            { id: 'CLOSED', label: 'Ditutup', count: counts.CLOSED },
          ]}
        />

        <div className="filter-bar jobs-toolbar">
          <SearchField
            label="Cari seller berdasarkan nama, username, email, atau ID"
            value={query}
            onChange={(value) => {
              setQuery(value)
              setPage(1)
            }}
            placeholder="Cari nama, email, atau ID seller…"
          />
          <SelectField
            label="Verifikasi email"
            fieldClassName="filter-bar__control"
            value={verified}
            onChange={(event) => {
              setVerified(event.target.value)
              setPage(1)
            }}
            options={[
              { value: 'ALL', label: 'Semua' },
              { value: 'VERIFIED', label: 'Terverifikasi' },
              { value: 'UNVERIFIED', label: 'Belum terverifikasi' },
            ]}
          />
          <Button
            variant="ghost"
            size="sm"
            iconLeft={RotateCcw}
            onClick={resetFilters}
            disabled={!hasFilters}
            className="filter-reset"
          >
            Reset
          </Button>
          <span className="filter-bar__result">{filtered.length} seller</span>
        </div>

        {pageItems.length > 0 ? (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <caption className="sr-only">Daftar seller pada panel admin</caption>
                <thead>
                  <tr>
                    <th scope="col">Seller</th>
                    <th scope="col">Kontak</th>
                    <th scope="col">Status</th>
                    <th scope="col">Bergabung</th>
                    <th scope="col" className="num">Pekerjaan</th>
                    <th scope="col"><span className="sr-only">Aksi</span></th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((seller) => {
                    const sellerJobs = state.jobs.filter((job) => job.sellerId === seller.id)
                    return (
                      <tr key={seller.id}>
                        <td>
                          <div className="seller-cell">
                            <Avatar name={seller.name} size="sm" status={seller.status === 'ACTIVE' ? 'online' : 'offline'} />
                            <div>
                              <div className="cell-title">
                                {seller.name}
                                {seller.id === currentSeller.id ? <Badge tone="info">Akun demo</Badge> : null}
                              </div>
                              <div className="cell-sub">@{seller.username} · <span className="mono">{seller.id}</span></div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="cell-title">{seller.email}</div>
                          <div className="cell-sub">
                            {seller.emailVerified ? (
                              <span className="inline-status text-success"><BadgeCheck size={11} aria-hidden="true" /> Terverifikasi</span>
                            ) : (
                              <span className="inline-status text-warning"><Mail size={11} aria-hidden="true" /> Belum terverifikasi</span>
                            )}
                          </div>
                        </td>
                        <td><StatusBadge meta={SELLER_STATUS[seller.status]} /></td>
                        <td>{formatDate(seller.joinedAt)}</td>
                        <td className="num">
                          <div className="cell-title">{sellerJobs.length}</div>
                          <div className="cell-sub">{sellerJobs.filter((job) => job.status === 'APPROVED').length} selesai</div>
                        </td>
                        <td>
                          <div className="cell-actions">
                            <Button
                              variant="secondary"
                              size="sm"
                              iconLeft={Users}
                              onClick={() => {
                                setSelectedId(seller.id)
                                setDetailTab('PROFILE')
                              }}
                            >
                              Kelola
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              <p className="result-count">
                Menampilkan <strong>{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}</strong>{' '}
                dari <strong>{filtered.length}</strong> seller
              </p>
              <Pagination page={currentPage} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />
            </div>
          </>
        ) : (
          <EmptyState
            icon={Search}
            title="Seller tidak ditemukan"
            description="Tidak ada seller yang cocok dengan status, verifikasi, atau pencarian saat ini."
            action={
              hasFilters ? (
                <Button variant="secondary" size="sm" iconLeft={RotateCcw} onClick={resetFilters}>
                  Reset filter
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
          title={selected.name}
          description={`@${selected.username} · ${selected.id}`}
          eyebrow="Detail seller"
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setSelectedId(null)}>
                Tutup
              </Button>
              {selected.status !== 'ACTIVE' ? (
                <Button variant="success" iconLeft={UserCheck} onClick={() => setActivateOpen(true)}>
                  Aktifkan seller
                </Button>
              ) : null}
              {selected.status === 'PENDING' ? (
                <Button variant="danger" iconLeft={Ban} onClick={() => setReasonAction('REJECT')}>
                  Tolak pendaftaran
                </Button>
              ) : null}
              {selected.status === 'ACTIVE' ? (
                <Button variant="danger" iconLeft={Ban} onClick={() => setReasonAction('SUSPEND')}>
                  Tangguhkan
                </Button>
              ) : null}
              {selected.status === 'SUSPENDED' ? (
                <Button variant="danger" iconLeft={CircleSlash2} onClick={() => setReasonAction('CLOSE')}>
                  Tutup akun
                </Button>
              ) : null}
              {selected.status === 'ACTIVE' && !isSelectedCurrent ? (
                <Button variant="ghost" iconLeft={CircleSlash2} onClick={() => setReasonAction('CLOSE')}>
                  Tutup akun
                </Button>
              ) : null}
            </>
          }
        >
          <div className="seller-detail">
            <div className="seller-detail__hero">
              <Avatar name={selected.name} size="lg" status={selected.status === 'ACTIVE' ? 'online' : 'offline'} />
              <div>
                <div className="row">
                  <StatusBadge meta={SELLER_STATUS[selected.status]} />
                  {selected.emailVerified ? (
                    <Badge tone="info"><BadgeCheck size={10} aria-hidden="true" /> Email terverifikasi</Badge>
                  ) : (
                    <Badge tone="warning">Email belum terverifikasi</Badge>
                  )}
                  {isSelectedCurrent ? <Badge tone="neutral">Akun demo aktif</Badge> : null}
                </div>
                <p>{selected.email}</p>
                <span>Bergabung {formatDate(selected.joinedAt)} · {selectedJobs.length} pekerjaan</span>
              </div>
            </div>

            <Tabs
              label="Bagian detail seller"
              value={detailTab}
              onChange={(value) => setDetailTab(value as DetailTab)}
              items={[
                { id: 'PROFILE', label: 'Profil' },
                { id: 'JOBS', label: 'Pekerjaan', count: selectedJobs.length },
              ]}
            />

            {detailTab === 'PROFILE' ? (
              <div className="detail-tab-content">
                <div className="detail-stat-grid">
                  <div>
                    <span>Pekerjaan aktif</span>
                    <strong>{selectedActive}</strong>
                  </div>
                  <div>
                    <span>Pekerjaan selesai</span>
                    <strong>{selectedCompleted}</strong>
                  </div>
                  <div>
                    <span>Nilai komisi demo</span>
                    <strong>{formatIDR(selectedEarnings)}</strong>
                  </div>
                </div>

                <div className="confirm-summary">
                  <div>
                    <span>Seller ID</span>
                    <strong className="mono">{selected.id}</strong>
                  </div>
                  <div>
                    <span>Status akun</span>
                    <strong>{SELLER_STATUS[selected.status].label}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>{selected.email}</strong>
                  </div>
                  <div>
                    <span>Verifikasi email</span>
                    <strong>{selected.emailVerified ? 'Terverifikasi' : 'Belum terverifikasi'}</strong>
                  </div>
                  <div>
                    <span>Metode pembayaran</span>
                    <strong>{selected.paymentMethod?.provider ?? 'Belum diatur'}</strong>
                  </div>
                  <div>
                    <span>Nomor akun</span>
                    <strong>
                      {selected.paymentMethod ? maskAccount(selected.paymentMethod.accountNumber) : '—'}
                    </strong>
                  </div>
                </div>

                <Callout tone="info" icon={CreditCard} title="Data pembayaran demo">
                  Nomor akun ditampilkan tersamarkan. Prototype tidak menyimpan kredensial atau data rekening nyata.
                </Callout>

                {selected.note ? (
                  <div className="detail-section">
                    <h3>Catatan admin terakhir</h3>
                    <p className="detail-prose">{selected.note}</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="detail-tab-content">
                {selectedJobs.length > 0 ? (
                  <div className="seller-job-list">
                    {selectedJobs.slice(0, 6).map((job) => (
                      <div className="seller-job-row" key={job.id}>
                        <div>
                          <span className="mono">{job.id}</span>
                          <p>{job.title}</p>
                        </div>
                        <div className="seller-job-row__meta">
                          <span>{formatIDR(job.rate)}</span>
                          <StatusBadge meta={getJobStatus(job)} />
                        </div>
                      </div>
                    ))}
                    {selectedJobs.length > 6 ? (
                      <p className="detail-footnote">Menampilkan 6 dari {selectedJobs.length} pekerjaan seller.</p>
                    ) : null}
                  </div>
                ) : (
                  <EmptyState
                    icon={BriefcaseBusiness}
                    title="Belum ada pekerjaan"
                    description="Seller ini belum mengambil pekerjaan pada data demo."
                  />
                )}
              </div>
            )}

            <p className="detail-footnote">
              Aktivitas terakhir seller pada data demo: {formatDateTime(selected.joinedAt)} · tindakan status akan
              tercatat pada audit log.
            </p>
          </div>
        </Modal>
      ) : null}

      <ConfirmDialog
        open={activateOpen}
        onClose={() => setActivateOpen(false)}
        onConfirm={activateSeller}
        title="Aktifkan seller?"
        description={
          selected
            ? `${selected.name} akan dapat mengklaim pekerjaan dan mengajukan penarikan pada data demo.`
            : 'Seller akan diaktifkan pada data demo.'
        }
        confirmLabel="Aktifkan seller"
      >
        {selected ? (
          <div className="confirm-summary">
            <div>
              <span>Seller</span>
              <strong>{selected.name}</strong>
            </div>
            <div>
              <span>Status saat ini</span>
              <StatusBadge meta={SELLER_STATUS[selected.status]} />
            </div>
          </div>
        ) : null}
      </ConfirmDialog>

      <ReasonDialog
        open={Boolean(reasonAction)}
        onClose={() => setReasonAction(null)}
        onConfirm={applyReason}
        title={reasonAction ? actionCopy[reasonAction].title : 'Ubah status seller'}
        description={reasonAction ? actionCopy[reasonAction].description : 'Alasan akan dicatat pada audit log demo.'}
        label={reasonAction ? actionCopy[reasonAction].label : 'Alasan'}
        placeholder="Tulis alasan yang jelas untuk jejak audit demo."
        confirmLabel={reasonAction ? actionCopy[reasonAction].confirm : 'Simpan'}
        tone="danger"
      >
        {selected ? (
          <div className="confirm-summary">
            <div>
              <span>Seller</span>
              <strong>{selected.name}</strong>
            </div>
            <div>
              <span>ID</span>
              <strong className="mono">{selected.id}</strong>
            </div>
            <div>
              <span>Status saat ini</span>
              <StatusBadge meta={SELLER_STATUS[selected.status]} />
            </div>
          </div>
        ) : null}
      </ReasonDialog>
    </div>
  )
}
