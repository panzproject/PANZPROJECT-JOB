import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Bell,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Search,
  Send,
  ShieldAlert,
  Wallet,
} from 'lucide-react'
import { useApp } from '../../store/AppContext'
import { formatDate, formatIDR, relativeTime } from '../../lib/format'
import { getJobStatus } from '../../lib/status'
import { DeadlineLabel } from '../../components/jobs/Deadline'
import {
  Badge,
  Callout,
  EmptyState,
  PageHeader,
  Panel,
  ProgressBar,
  SimulationTag,
  StatCard,
  StatusBadge,
} from '../../components/ui'

const greeting = () => {
  const hour = new Date().getHours()
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 19) return 'Selamat sore'
  return 'Selamat malam'
}

export default function SellerDashboard() {
  const { state, currentSeller, markNotificationRead } = useApp()
  const navigate = useNavigate()
  const jobs = state.jobs.filter((job) => job.sellerId === currentSeller.id)
  const activeJobs = jobs.filter((job) => job.status === 'CLAIMED')
  const waitingReview = jobs.filter((job) => ['SUBMITTED', 'UNDER_REVIEW'].includes(job.status))
  const revisionJobs = jobs.filter((job) => job.status === 'REVISION')
  const available = state.jobs.filter((job) => job.status === 'AVAILABLE' && !job.paused)
  const unread = state.notifications.filter((item) => !item.read)
  const latestNotifications = state.notifications.slice(0, 4)
  const deadlineJobs = [...activeJobs, ...revisionJobs]
    .filter((job) => job.deadlineAt)
    .sort((a, b) => new Date(a.deadlineAt ?? 0).getTime() - new Date(b.deadlineAt ?? 0).getTime())
    .slice(0, 4)

  const recentActivity = jobs
    .flatMap((job) =>
      job.history.map((entry) => ({
        ...entry,
        jobId: job.id,
        jobTitle: job.title,
        status: job.status,
      })),
    )
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 5)

  const quickActions = [
    { label: 'Cari pekerjaan', description: `${available.length} tersedia`, icon: Search, path: '/seller/marketplace' },
    { label: 'Pekerjaan saya', description: `${activeJobs.length + revisionJobs.length} perlu dikerjakan`, icon: ClipboardList, path: '/seller/jobs' },
    { label: 'Buka keuangan', description: formatIDR(state.wallet.available), icon: Wallet, path: '/seller/finance' },
    { label: 'Riwayat transaksi', description: `${state.transactions.length} transaksi demo`, icon: ArrowLeftRight, path: '/seller/transactions' },
    { label: 'Notifikasi', description: `${unread.length} belum dibaca`, icon: Bell, path: '/seller/notifications' },
  ]

  const heldPercent = Math.round((state.wallet.held / Math.max(state.wallet.available + state.wallet.held, 1)) * 100)
  const firstName = currentSeller.name.split(' ')[0]

  return (
    <div className="page page-enter">
      <PageHeader
        eyebrow={`Seller workspace · ${formatDate(new Date().toISOString())}`}
        title={`${greeting()}, ${firstName}`}
        description="Pantau pekerjaan aktif, deadline, dan saldo demo Anda dalam satu ruang kerja."
        actions={
          <>
            <Link to="/seller/marketplace" className="btn btn--primary">
              <Search size={16} aria-hidden="true" />
              Cari pekerjaan
            </Link>
            <Link to="/seller/finance" className="btn btn--secondary">
              <Banknote size={16} aria-hidden="true" />
              Ajukan penarikan
            </Link>
          </>
        }
      />

      {currentSeller.status !== 'ACTIVE' ? (
        <Callout tone="danger" icon={ShieldAlert} title="Akun seller tidak aktif pada data demo">
          Status akun saat ini {currentSeller.status}. Klaim pekerjaan dan penarikan saldo dibatasi pada prototype. Buka{' '}
          <Link to="/seller/profile" className="text-accent">
            Profil & Keamanan
          </Link>{' '}
          untuk melihat detail.
        </Callout>
      ) : null}

      <div className="dashboard-top">
        <section className="balance-hero" aria-labelledby="balance-title">
          <div className="balance-hero__glow" aria-hidden="true" />
          <div className="balance-hero__top">
            <div>
              <div className="balance-hero__label-row">
                <p className="balance-hero__label" id="balance-title">
                  Saldo tersedia
                </p>
                <SimulationTag>Saldo demo</SimulationTag>
              </div>
              <p className="balance-hero__amount">{formatIDR(state.wallet.available)}</p>
              <p className="balance-hero__caption">
                Rp {state.wallet.held.toLocaleString('id-ID')} sedang ditahan untuk pengajuan yang menunggu.
              </p>
            </div>
            <span className="balance-hero__icon" aria-hidden="true">
              <Wallet size={22} />
            </span>
          </div>

          <div className="balance-breakdown">
            <div className="balance-breakdown__labels">
              <span>Tersedia</span>
              <span>Tertahan · {heldPercent}%</span>
            </div>
            <div className="balance-breakdown__track" aria-hidden="true">
              <span style={{ width: `${100 - heldPercent}%` }} />
              <span style={{ width: `${heldPercent}%` }} />
            </div>
          </div>

          <div className="balance-hero__footer">
            <div className="balance-hero__meta">
              <div>
                <span>Total penghasilan</span>
                <strong>{formatIDR(state.wallet.lifetimeEarnings)}</strong>
              </div>
              <div>
                <span>Metode payout</span>
                <strong>{currentSeller.paymentMethod?.provider ?? 'Belum diatur'}</strong>
              </div>
            </div>
            <div className="balance-hero__actions">
              <Link to="/seller/finance" className="btn btn--primary btn--sm">
                Kelola saldo
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
              <Link to="/seller/transactions" className="btn btn--secondary btn--sm">
                Lihat transaksi
              </Link>
            </div>
          </div>
        </section>

        <Panel title="Aksi cepat" description="Jalan pintas ke tugas yang paling sering digunakan.">
          <div className="quick-actions">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.path}
                  type="button"
                  className="quick-action"
                  onClick={() => navigate(action.path)}
                >
                  <span className="quick-action__icon" aria-hidden="true">
                    <Icon size={16} />
                  </span>
                  <span className="quick-action__copy">
                    <strong>{action.label}</strong>
                    <span>{action.description}</span>
                  </span>
                  <ArrowUpRight size={14} className="quick-action__arrow" aria-hidden="true" />
                </button>
              )
            })}
          </div>
        </Panel>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Pekerjaan aktif"
          value={activeJobs.length}
          icon={ClipboardList}
          footnote={
            <>
              <strong>{activeJobs.length}</strong> pekerjaan sedang dikerjakan
            </>
          }
        />
        <StatCard
          label="Menunggu review"
          value={waitingReview.length}
          icon={Clock3}
          tone="warning"
          footnote="Hasil sudah dikirim ke antrean admin"
        />
        <StatCard
          label="Perlu revisi"
          value={revisionJobs.length}
          icon={Send}
          tone="purple"
          footnote="Periksa catatan admin sebelum mengirim ulang"
        />
        <StatCard
          label="Total penghasilan"
          value={formatIDR(state.wallet.lifetimeEarnings)}
          icon={CheckCircle2}
          tone="success"
          simulated
          footnote="Akumulasi komisi disetujui pada data demo"
        />
      </div>

      <div className="dashboard-main">
        <Panel
          title="Pekerjaan aktif"
          description="Pekerjaan yang saat ini Anda kerjakan."
          action={
            <Link to="/seller/jobs" className="text-link">
              Lihat semua
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          }
        >
          {activeJobs.length > 0 ? (
            <div className="job-list">
              {activeJobs.map((job) => {
                const status = getJobStatus(job)
                return (
                  <div className="job-row" key={job.id}>
                    <div className="job-row__body">
                      <div className="job-row__heading">
                        <span className="cell-id">{job.id}</span>
                        <StatusBadge meta={status} />
                      </div>
                      <p className="job-row__title">{job.title}</p>
                      <div className="job-row__meta">
                        <span>{job.category}</span>
                        <span className="dot-sep" aria-hidden="true" />
                        <span className="job-row__rate">{formatIDR(job.rate)}</span>
                        <span className="dot-sep" aria-hidden="true" />
                        <DeadlineLabel deadlineAt={job.deadlineAt} />
                      </div>
                      <div className="job-row__progress">
                        <ProgressBar value={job.progress} label={`Progres ${job.title}`} />
                        <span>{job.progress}%</span>
                      </div>
                    </div>
                    <Link to="/seller/jobs" className="btn btn--secondary btn--sm job-row__action">
                      Kelola
                    </Link>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={ClipboardList}
              title="Belum ada pekerjaan aktif"
              description="Ambil pekerjaan baru dari marketplace untuk mulai mengerjakan pada simulasi."
              action={
                <Link to="/seller/marketplace" className="btn btn--primary btn--sm">
                  Cari pekerjaan
                </Link>
              }
            />
          )}
        </Panel>

        <Panel
          title="Ringkasan deadline"
          description="Berlaku pada pekerjaan aktif dan revisi."
          action={
            <Badge tone={deadlineJobs.some((job) => job.deadlineAt && new Date(job.deadlineAt).getTime() - Date.now() < 6 * 3600000) ? 'danger' : 'neutral'}>
              {deadlineJobs.length} deadline
            </Badge>
          }
        >
          {deadlineJobs.length > 0 ? (
            <div className="deadline-list">
              {deadlineJobs.map((job) => (
                <Link to="/seller/jobs" className="deadline-item" key={job.id}>
                  <div className="deadline-item__top">
                    <span className="cell-id">{job.id}</span>
                    <DeadlineLabel deadlineAt={job.deadlineAt} />
                  </div>
                  <p className="deadline-item__title">{job.title}</p>
                  <div className="deadline-item__bottom">
                    <ProgressBar
                      value={job.progress}
                      tone={job.status === 'REVISION' ? 'warning' : 'accent'}
                      label={`Progres ${job.title}`}
                    />
                    <span>{job.progress}%</span>
                  </div>
                </Link>
              ))}
              <p className="deadline-note">Deadline dihitung lokal dari data demo, bukan SLA produksi.</p>
            </div>
          ) : (
            <EmptyState
              icon={Clock3}
              title="Tidak ada deadline mendesak"
              description="Semua pekerjaan aktif akan menampilkan sisa waktu di sini."
            />
          )}
        </Panel>
      </div>

      <div className="dashboard-bottom">
        <Panel
          title="Notifikasi terbaru"
          description={`${unread.length} belum dibaca dari data demo.`}
          action={
            <Link to="/seller/notifications" className="text-link">
              Lihat semua
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          }
        >
          {latestNotifications.length > 0 ? (
            <div className="notification-list">
              {latestNotifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={`notification-row${notification.read ? '' : ' is-unread'}`}
                  onClick={() => {
                    markNotificationRead(notification.id)
                    navigate(notification.href)
                  }}
                >
                  <span className={`notification-row__dot notification-row__dot--${notification.kind}`} aria-hidden="true" />
                  <span className="notification-row__copy">
                    <span className="notification-row__title">{notification.title}</span>
                    <span className="notification-row__message">{notification.message}</span>
                  </span>
                  <span className="notification-row__time">{relativeTime(notification.at)}</span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Bell}
              title="Tidak ada notifikasi"
              description="Notifikasi pekerjaan dan keuangan akan muncul di sini."
            />
          )}
        </Panel>

        <Panel title="Aktivitas terbaru" description="Rekam jejak pekerjaan dari data demo.">
          {recentActivity.length > 0 ? (
            <div className="activity-list">
              {recentActivity.map((activity, index) => (
                <div className="activity-row" key={`${activity.at}-${activity.action}-${index}`}>
                  <span className={`activity-row__dot${index === 0 ? ' is-current' : ''}`} aria-hidden="true" />
                  <div className="activity-row__copy">
                    <p>
                      {activity.action} <span className="cell-id">{activity.jobId}</span>
                    </p>
                    <span>{activity.jobTitle}</span>
                  </div>
                  <span className="activity-row__time">{relativeTime(activity.at)}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Clock3}
              title="Belum ada aktivitas"
              description="Aktivitas pekerjaan akan tercatat pada data demo setelah Anda mulai bertindak."
            />
          )}
        </Panel>
      </div>
    </div>
  )
}
