import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BriefcaseBusiness,
  ClipboardCheck,
  Clock3,
  History,
  Mail,
  MailWarning,
  Plus,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react'
import { useApp } from '../../store/AppContext'
import { formatDate, formatIDR, relativeTime } from '../../lib/format'
import { AUDIT_CATEGORY, getJobStatus, SELLER_STATUS, WITHDRAWAL_STATUS } from '../../lib/status'
import { JobFormDialog } from '../../components/admin/JobFormDialog'
import {
  Badge,
  Button,
  Callout,
  EmptyState,
  PageHeader,
  Panel,
  ProgressBar,
  SimulationTag,
  StatCard,
  StatusBadge,
} from '../../components/ui'

export default function Overview() {
  const { state } = useApp()
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)

  const activeSellers = state.sellers.filter((seller) => seller.status === 'ACTIVE')
  const pendingSellers = state.sellers.filter((seller) => seller.status === 'PENDING')
  const suspendedSellers = state.sellers.filter((seller) => seller.status === 'SUSPENDED')
  const reviewJobs = useMemo(
    () =>
      state.jobs
        .filter((job) => ['SUBMITTED', 'UNDER_REVIEW', 'EXPIRY_REVIEW'].includes(job.status))
        .sort((a, b) => new Date(a.submittedAt ?? a.createdAt).getTime() - new Date(b.submittedAt ?? b.createdAt).getTime()),
    [state.jobs],
  )
  const pendingWithdrawals = useMemo(
    () =>
      state.withdrawals
        .filter((item) => item.status === 'PENDING')
        .sort((a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime()),
    [state.withdrawals],
  )
  const pendingWithdrawalTotal = pendingWithdrawals.reduce((sum, item) => sum + item.amount, 0)
  const availableJobs = state.jobs.filter((job) => job.status === 'AVAILABLE' && !job.paused)
  const pausedJobs = state.jobs.filter((job) => job.paused)
  const recentAudit = [...state.audit]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)
  const emailAttention = state.connections.filter((connection) => connection.status === 'NEEDS_ATTENTION')
  const connectedEmails = state.connections.filter((connection) => connection.status === 'CONNECTED')
  const sellerComposition = (['ACTIVE', 'PENDING', 'SUSPENDED', 'REJECTED', 'CLOSED'] as const).map((status) => ({
    status,
    count: state.sellers.filter((seller) => seller.status === status).length,
  }))
  const totalSellers = Math.max(state.sellers.length, 1)

  const sellerName = (sellerId: string | null | undefined) =>
    state.sellers.find((seller) => seller.id === sellerId)?.name ?? 'Belum diklaim'

  return (
    <div className="page page-enter">
      <PageHeader
        eyebrow="Panel admin"
        title="Ringkasan operasional"
        description="Pantau antrean review, penarikan, seller, dan integrasi email dari satu halaman simulasi."
        actions={
          <>
            <Button variant="secondary" iconLeft={ClipboardCheck} onClick={() => navigate('/admin/review')}>
              Buka review queue
            </Button>
            <Button variant="primary" iconLeft={Plus} onClick={() => setCreateOpen(true)}>
              Buat pekerjaan
            </Button>
          </>
        }
      />

      <Callout tone="warning" title="Mode admin simulasi">
        Anda dapat berpindah peran tanpa autentikasi. Semua angka, antrean, dan tindakan admin hanya berlaku pada
        data demo lokal dan tidak menyentuh sistem nyata.
      </Callout>

      <div className="stats-grid">
        <StatCard
          label="Seller aktif"
          value={String(activeSellers.length)}
          icon={Users}
          footnote={`${pendingSellers.length} menunggu persetujuan · ${suspendedSellers.length} ditangguhkan`}
          simulated
        />
        <StatCard
          label="Antrean review"
          value={String(reviewJobs.length)}
          icon={ClipboardCheck}
          tone="warning"
          footnote={`${reviewJobs.filter((job) => job.status === 'EXPIRY_REVIEW').length} review kedaluwarsa`}
          simulated
        />
        <StatCard
          label="Penarikan menunggu"
          value={formatIDR(pendingWithdrawalTotal)}
          icon={Banknote}
          tone="warning"
          footnote={`${pendingWithdrawals.length} pengajuan PENDING`}
          simulated
        />
        <StatCard
          label="Pekerjaan tersedia"
          value={String(availableJobs.length)}
          icon={BriefcaseBusiness}
          tone="success"
          footnote={`${pausedJobs.length} pekerjaan dijeda`}
          simulated
        />
      </div>

      <div className="admin-overview-grid">
        <Panel
          title="Antrean review prioritas"
          description="Diurutkan dari pengiriman paling lama."
          action={
            <Link to="/admin/review" className="text-link">
              Semua antrean
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          }
        >
          {reviewJobs.length > 0 ? (
            <div className="admin-queue-list">
              {reviewJobs.slice(0, 5).map((job) => (
                <button
                  type="button"
                  className="admin-queue-row"
                  key={job.id}
                  onClick={() => navigate(`/admin/review?job=${job.id}`)}
                >
                  <span className="admin-queue-row__main">
                    <span className="admin-queue-row__top">
                      <span className="cell-id">{job.id}</span>
                      <StatusBadge meta={getJobStatus(job)} />
                      {job.status === 'EXPIRY_REVIEW' ? <Badge tone="danger">Deadline lewat</Badge> : null}
                    </span>
                    <span className="admin-queue-row__title">{job.title}</span>
                    <span className="admin-queue-row__meta">
                  {sellerName(job.sellerId) ?? 'Belum diklaim'} · Dikirim {relativeTime(job.submittedAt ?? job.createdAt)} ·{' '}
                  {job.submissions.length} pengiriman
                    </span>
                  </span>
                  <span className="admin-queue-row__action">
                    <span>{formatIDR(job.rate)}</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ClipboardCheck}
              title="Antrean review kosong"
              description="Tidak ada hasil pekerjaan yang menunggu keputusan admin pada data demo."
            />
          )}
          <p className="detail-footnote">
            <Clock3 size={12} aria-hidden="true" /> Klik baris untuk membuka pekerjaan pada review queue.
          </p>
        </Panel>

        <div className="admin-overview-side">
          <Panel
            title="Kesehatan integrasi email"
            description="Koneksi demo untuk operasional."
            action={
              <Link to="/admin/integrations" className="text-link">
                Kelola
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            }
          >
            {emailAttention.length > 0 ? (
              <div className="admin-alert">
                <span className="admin-alert__icon" aria-hidden="true"><MailWarning size={18} /></span>
                <div>
                  <strong>{emailAttention.length} koneksi memerlukan perhatian</strong>
                  <p>{emailAttention.map((connection) => connection.email).join(', ')}</p>
                </div>
              </div>
            ) : (
              <div className="admin-alert admin-alert--success">
                <span className="admin-alert__icon" aria-hidden="true"><ShieldCheck size={18} /></span>
                <div>
                  <strong>Semua koneksi sehat</strong>
                  <p>Tidak ada error integrasi pada data demo.</p>
                </div>
              </div>
            )}
            <div className="admin-mini-stats">
              <div>
                <span><Mail size={12} aria-hidden="true" /> Terhubung</span>
                <strong>{connectedEmails.length}</strong>
              </div>
              <div>
                <span><AlertTriangle size={12} aria-hidden="true" /> Perlu perhatian</span>
                <strong>{emailAttention.length}</strong>
              </div>
            </div>
          </Panel>

          <Panel
            title="Penarikan menunggu"
            description="Pengajuan yang menahan saldo seller."
            action={
              <Link to="/admin/withdrawals" className="text-link">
                Kelola
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            }
          >
            {pendingWithdrawals.length > 0 ? (
              <div className="admin-withdrawal-list">
                {pendingWithdrawals.slice(0, 3).map((withdrawal) => (
                  <button
                    type="button"
                    className="admin-withdrawal-row"
                    key={withdrawal.id}
                    onClick={() => navigate(`/admin/withdrawals?withdrawal=${withdrawal.id}`)}
                  >
                    <span>
                      <strong>{formatIDR(withdrawal.amount)}</strong>
                      <small>{withdrawal.sellerName} · {withdrawal.method}</small>
                    </span>
                    <StatusBadge meta={WITHDRAWAL_STATUS[withdrawal.status]} />
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Wallet}
                title="Tidak ada penarikan pending"
                description="Semua pengajuan demo sudah diproses."
              />
            )}
          </Panel>
        </div>
      </div>

      <div className="admin-overview-bottom">
        <Panel
          title="Aktivitas audit terbaru"
          description="Catatan tindakan admin dan seller pada demo."
          action={
            <Link to="/admin/audit" className="text-link">
              Audit log
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          }
        >
          {recentAudit.length > 0 ? (
            <div className="admin-audit-list">
              {recentAudit.map((entry) => (
                <div className="admin-audit-row" key={entry.id}>
                  <span className="admin-audit-row__icon" aria-hidden="true"><History size={14} /></span>
                  <div className="admin-audit-row__copy">
                    <p>{entry.action}</p>
                    <span>
                      {entry.actor} · {AUDIT_CATEGORY[entry.category].label} · {formatDate(entry.timestamp)} ·{' '}
                      <span className="mono">{entry.objectRef}</span>
                    </span>
                  </div>
                  <span className="admin-audit-row__time">{relativeTime(entry.timestamp)}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={History}
              title="Belum ada audit"
              description="Tindakan pada data demo akan tercatat di sini."
            />
          )}
        </Panel>

        <Panel title="Komposisi seller" description={`${state.sellers.length} seller pada data demo.`} action={<SimulationTag />}>
          <div className="seller-composition">
            {sellerComposition.map((item) => (
              <div className="seller-composition__row" key={item.status}>
                <div className="seller-composition__top">
                  <StatusBadge meta={SELLER_STATUS[item.status]} />
                  <strong>{item.count}</strong>
                </div>
                <ProgressBar
                  value={Math.round((item.count / totalSellers) * 100)}
                  tone={item.status === 'ACTIVE' ? 'success' : item.status === 'PENDING' ? 'warning' : 'accent'}
                  label={`Jumlah seller berstatus ${SELLER_STATUS[item.status].label}`}
                />
              </div>
            ))}
          </div>
          <div className="seller-composition__footer">
            <Button variant="secondary" size="sm" iconRight={ArrowRight} onClick={() => navigate('/admin/sellers')}>
              Kelola seller
            </Button>
            <span>{activeSellers.length} seller dapat mengerjakan pekerjaan.</span>
          </div>
        </Panel>
      </div>

      <JobFormDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
