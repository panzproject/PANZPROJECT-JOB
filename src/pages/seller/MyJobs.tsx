import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ClipboardList,
  FileCheck2,
  History,
  Info,
  RefreshCw,
  Search,
  Send,
  Clock3,
  Wallet,
} from 'lucide-react'
import { useApp } from '../../store/AppContext'
import type { Job, JobHistoryEntry, Submission } from '../../types'
import { formatDateTime, formatIDR, relativeTime } from '../../lib/format'
import { getJobStatus } from '../../lib/status'
import {
  Button,
  Callout,
  EmptyState,
  Modal,
  PageHeader,
  Panel,
  ProgressBar,
  SearchField,
  SimulationTag,
  StatusBadge,
  Tabs,
} from '../../components/ui'
import { JobInstructions, JobHistoryList, RevisionBanner, SubmissionHistory, AttachmentList } from '../../components/jobs/JobBits'
import { DeadlineLabel } from '../../components/jobs/Deadline'
import { SubmitWorkDialog } from '../../components/seller/SubmitWorkDialog'

type JobsTab = 'ALL' | 'ACTIVE' | 'REVIEW' | 'REVISION' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
type DetailTab = 'DETAIL' | 'SUBMISSIONS' | 'HISTORY'

const tabMatches: Record<JobsTab, (job: Job) => boolean> = {
  ALL: () => true,
  ACTIVE: (job) => job.status === 'CLAIMED',
  REVIEW: (job) => ['SUBMITTED', 'UNDER_REVIEW'].includes(job.status),
  REVISION: (job) => job.status === 'REVISION',
  APPROVED: (job) => job.status === 'APPROVED',
  REJECTED: (job) => job.status === 'REJECTED',
  EXPIRED: (job) => ['EXPIRED', 'EXPIRY_REVIEW'].includes(job.status),
}

const sortJobs = (jobs: Job[], tab: JobsTab) => {
  const sorted = [...jobs]
  if (tab === 'ACTIVE' || tab === 'REVISION') {
    return sorted.sort((a, b) => {
      const aTime = a.deadlineAt ? new Date(a.deadlineAt).getTime() : Number.MAX_SAFE_INTEGER
      const bTime = b.deadlineAt ? new Date(b.deadlineAt).getTime() : Number.MAX_SAFE_INTEGER
      return aTime - bTime
    })
  }
  return sorted.sort((a, b) => {
    const aTime = new Date(a.submittedAt ?? a.createdAt).getTime()
    const bTime = new Date(b.submittedAt ?? b.createdAt).getTime()
    return bTime - aTime
  })
}

export default function MyJobs() {
  const { state, currentSeller } = useApp()
  const navigate = useNavigate()
  const [tab, setTab] = useState<JobsTab>('ALL')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Job | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>('DETAIL')
  const [submitTarget, setSubmitTarget] = useState<Job | null>(null)

  const sellerJobs = useMemo(
    () => state.jobs.filter((job) => job.sellerId === currentSeller.id),
    [state.jobs, currentSeller.id],
  )

  useEffect(() => {
    setDetailTab('DETAIL')
  }, [selected?.id])

  const counts = {
    ALL: sellerJobs.length,
    ACTIVE: sellerJobs.filter(tabMatches.ACTIVE).length,
    REVIEW: sellerJobs.filter(tabMatches.REVIEW).length,
    REVISION: sellerJobs.filter(tabMatches.REVISION).length,
    APPROVED: sellerJobs.filter(tabMatches.APPROVED).length,
    REJECTED: sellerJobs.filter(tabMatches.REJECTED).length,
    EXPIRED: sellerJobs.filter(tabMatches.EXPIRED).length,
  }

  const filtered = sortJobs(
    sellerJobs.filter((job) => {
      if (!tabMatches[tab](job)) return false
      if (!query.trim()) return true
      const needle = query.toLowerCase()
      return job.title.toLowerCase().includes(needle) || job.id.toLowerCase().includes(needle)
    }),
    tab,
  )

  const liveSelected = selected ? state.jobs.find((job) => job.id === selected.id) ?? selected : null
  const canSubmit = liveSelected?.status === 'CLAIMED' || liveSelected?.status === 'REVISION'

  const openSubmit = (job: Job) => {
    setSelected(null)
    setSubmitTarget(job)
  }

  const emptyCopy = () => {
    if (query.trim()) {
      return {
        title: 'Pekerjaan tidak ditemukan',
        description: 'Coba kata kunci lain atau hapus pencarian untuk melihat semua pekerjaan.',
      }
    }
    if (tab === 'ACTIVE') {
      return {
        title: 'Tidak ada pekerjaan aktif',
        description: 'Ambil pekerjaan baru dari marketplace. Tidak ada batas maksimum pekerjaan aktif pada rancangan ini.',
      }
    }
    if (tab === 'REVISION') {
      return {
        title: 'Tidak ada revisi',
        description: 'Pekerjaan yang membutuhkan revisi akan tampil di sini beserta catatan admin.',
      }
    }
    return {
      title: 'Belum ada pekerjaan pada filter ini',
      description: 'Gunakan filter lain atau cari pekerjaan baru pada marketplace simulasi.',
    }
  }

  const empty = emptyCopy()

  return (
    <div className="page page-enter">
      <PageHeader
        eyebrow="Ruang kerja seller"
        title="Pekerjaan saya"
        description="Kelola pekerjaan aktif, revisi, dan riwayat pengiriman. Semua status dan deadline adalah simulasi lokal."
        actions={
          <Button variant="primary" iconLeft={Search} onClick={() => navigate('/seller/marketplace')}>
            Cari pekerjaan
          </Button>
        }
      />

      <div className="jobs-overview-bar">
        <div>
          <span className="jobs-overview-bar__label">Ringkasan pekerjaan</span>
          <div className="jobs-overview-bar__stats">
            <span><strong>{counts.ACTIVE}</strong> aktif</span>
            <span><strong>{counts.REVIEW}</strong> menunggu review</span>
            <span><strong>{counts.REVISION}</strong> revisi</span>
            <span><strong>{counts.APPROVED}</strong> selesai</span>
          </div>
        </div>
        <SimulationTag>State lokal</SimulationTag>
      </div>

      <Panel className="jobs-panel" bodyClassName="jobs-panel__body">
        <Tabs
          label="Filter status pekerjaan saya"
          value={tab}
          onChange={(value) => setTab(value as JobsTab)}
          items={[
            { id: 'ALL', label: 'Semua', count: counts.ALL },
            { id: 'ACTIVE', label: 'Aktif', count: counts.ACTIVE },
            { id: 'REVIEW', label: 'Menunggu Review', count: counts.REVIEW },
            { id: 'REVISION', label: 'Revisi', count: counts.REVISION },
            { id: 'APPROVED', label: 'Selesai', count: counts.APPROVED },
            { id: 'REJECTED', label: 'Ditolak', count: counts.REJECTED },
            { id: 'EXPIRED', label: 'Kedaluwarsa', count: counts.EXPIRED },
          ]}
        />
        <div className="jobs-toolbar">
          <SearchField
            label="Cari pekerjaan saya berdasarkan nama atau ID"
            value={query}
            onChange={setQuery}
            placeholder="Cari nama atau ID pekerjaan…"
          />
          <p className="result-count">
            <strong>{filtered.length}</strong> dari <strong>{counts[tab]}</strong> pekerjaan
          </p>
        </div>

        {filtered.length > 0 ? (
          <div className="myjob-list">
            {filtered.map((job) => {
              const status = getJobStatus(job)
              const isActionable = job.status === 'CLAIMED' || job.status === 'REVISION'
              return (
                <article className={`myjob-card${job.status === 'REVISION' ? ' myjob-card--revision' : ''}`} key={job.id}>
                  <div className="myjob-card__main">
                    <div className="myjob-card__top">
                      <span className="cell-id">{job.id}</span>
                      <StatusBadge meta={status} />
                      <span className="chip">{job.category}</span>
                    </div>
                    <h3 className="myjob-card__title">{job.title}</h3>
                    <div className="myjob-card__meta">
                      <span className="myjob-card__rate">
                        <Wallet size={12} aria-hidden="true" />
                        {formatIDR(job.rate)}
                      </span>
                      {isActionable ? (
                        <DeadlineLabel deadlineAt={job.deadlineAt} />
                      ) : job.submittedAt ? (
                        <span className="meta-text">
                          <Clock3 size={12} aria-hidden="true" />
                          Dikirim {formatDateTime(job.submittedAt)}
                        </span>
                      ) : job.status === 'EXPIRY_REVIEW' ? (
                        <span className="meta-text text-danger">
                          <Clock3 size={12} aria-hidden="true" />
                          Menunggu keputusan admin
                        </span>
                      ) : (
                        <span className="meta-text">Diperbarui {relativeTime(job.history[job.history.length - 1]?.at ?? job.createdAt)}</span>
                      )}
                      <span className="meta-text">{job.revisionCount}/{state.settings.maxRevisions} revisi</span>
                    </div>

                    {isActionable ? (
                      <div className="myjob-card__progress">
                        <ProgressBar
                          value={job.progress}
                          tone={job.status === 'REVISION' ? 'warning' : 'accent'}
                          label={`Progres ${job.title}`}
                        />
                        <span>{job.progress}%</span>
                      </div>
                    ) : null}

                    {job.status === 'REVISION' && job.reviewNote ? (
                      <div className="myjob-card__revision">
                        <Info size={13} aria-hidden="true" />
                        <p>{job.reviewNote}</p>
                      </div>
                    ) : null}

                    {job.status === 'EXPIRY_REVIEW' ? (
                      <div className="myjob-card__revision myjob-card__revision--warning">
                        <Clock3 size={13} aria-hidden="true" />
                        <p>Deadline terlewati. Pekerjaan berada di antrean review admin dan belum dialihkan ke seller lain.</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="myjob-card__actions">
                    <Button variant="secondary" size="sm" onClick={() => setSelected(job)}>
                      Lihat detail
                    </Button>
                    {isActionable ? (
                      <Button
                        variant="primary"
                        size="sm"
                        iconLeft={job.status === 'REVISION' ? RefreshCw : Send}
                        onClick={() => openSubmit(job)}
                        disabled={currentSeller.status !== 'ACTIVE'}
                      >
                        {job.status === 'REVISION' ? 'Kirim revisi' : 'Kirim hasil'}
                      </Button>
                    ) : job.status === 'APPROVED' ? (
                      <Button variant="ghost" size="sm" iconLeft={FileCheck2} onClick={() => setSelected(job)}>
                        Lihat hasil
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" iconLeft={ArrowRight} onClick={() => setSelected(job)}>
                        Riwayat
                      </Button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <EmptyState
            icon={tab === 'REVISION' ? RefreshCw : Search}
            title={empty.title}
            description={empty.description}
            action={
              query.trim() ? (
                <Button variant="secondary" size="sm" onClick={() => setQuery('')}>
                  Hapus pencarian
                </Button>
              ) : (
                <Button variant="primary" size="sm" iconLeft={ClipboardList} onClick={() => navigate('/seller/marketplace')}>
                  Buka marketplace
                </Button>
              )
            }
          />
        )}
      </Panel>

      {liveSelected ? (
        <Modal
          open={Boolean(selected)}
          onClose={() => setSelected(null)}
          title={liveSelected.title}
          description={`${liveSelected.id} · ${liveSelected.category}`}
          eyebrow="Detail pekerjaan saya"
          size="xl"
          footer={
            <>
              <Button variant="secondary" onClick={() => setSelected(null)}>
                Tutup
              </Button>
              {canSubmit ? (
                <Button
                  variant="primary"
                  iconLeft={liveSelected.status === 'REVISION' ? RefreshCw : Send}
                  onClick={() => openSubmit(liveSelected)}
                  disabled={currentSeller.status !== 'ACTIVE'}
                >
                  {liveSelected.status === 'REVISION' ? 'Kirim revisi' : 'Kirim hasil'}
                </Button>
              ) : null}
            </>
          }
        >
          <div className="job-detail">
            <div className="job-detail__top">
              <div className="row">
                <StatusBadge meta={getJobStatus(liveSelected)} />
                <span className="chip">{liveSelected.category}</span>
                <SimulationTag>Demo lokal</SimulationTag>
              </div>
              <span className="job-detail__rate">{formatIDR(liveSelected.rate)}</span>
            </div>

            <Tabs
              label="Bagian detail pekerjaan"
              value={detailTab}
              onChange={(value) => setDetailTab(value as DetailTab)}
              items={[
                { id: 'DETAIL', label: 'Detail' },
                { id: 'SUBMISSIONS', label: 'Pengiriman', count: liveSelected.submissions.length },
                { id: 'HISTORY', label: 'Riwayat', count: liveSelected.history.length },
              ]}
            />

            {detailTab === 'DETAIL' ? (
              <div className="detail-tab-content">
                <RevisionBanner job={liveSelected} />
                <p className="job-detail__description">{liveSelected.description}</p>
                <div className="detail-stat-grid">
                  <div>
                    <span>Status</span>
                    <StatusBadge meta={getJobStatus(liveSelected)} />
                  </div>
                  <div>
                    <span>Deadline</span>
                    {liveSelected.deadlineAt ? (
                      <DeadlineLabel deadlineAt={liveSelected.deadlineAt} />
                    ) : (
                      <strong>—</strong>
                    )}
                  </div>
                  <div>
                    <span>Revisi</span>
                    <strong>{liveSelected.revisionCount} / {state.settings.maxRevisions}</strong>
                  </div>
                </div>
                <div className="detail-meta-row">
                  <span>Diklaim {liveSelected.claimedAt ? formatDateTime(liveSelected.claimedAt) : '—'}</span>
                  <span>Dikirim {liveSelected.submittedAt ? formatDateTime(liveSelected.submittedAt) : '—'}</span>
                  <span>Progres {liveSelected.progress}%</span>
                </div>

                <section className="detail-section">
                  <h3><ClipboardList size={15} aria-hidden="true" /> Instruksi pekerjaan</h3>
                  <JobInstructions job={liveSelected} />
                </section>

                {liveSelected.status === 'EXPIRY_REVIEW' ? (
                  <Callout tone="warning" icon={Clock3} title="Menunggu keputusan admin">
                    Deadline demo telah terlewati. Admin dapat memperpanjang deadline atau menyatakan pekerjaan
                    kedaluwarsa. Pekerjaan tidak dialihkan otomatis ke seller lain.
                  </Callout>
                ) : null}

                {liveSelected.sellerNote ? (
                  <section className="detail-section">
                    <h3>Catatan seller terakhir</h3>
                    <p className="detail-prose">{liveSelected.sellerNote}</p>
                  </section>
                ) : null}

                <section className="detail-section">
                  <h3>Lampiran terakhir</h3>
                  <AttachmentList attachments={liveSelected.attachments} />
                </section>

                <p className="detail-footnote">
                  <History size={12} aria-hidden="true" /> Semua aktivitas pada halaman ini menggunakan data demo lokal.
                </p>
              </div>
            ) : null}

            {detailTab === 'SUBMISSIONS' ? (
              <div className="detail-tab-content">
                <Callout tone="info" title="Riwayat pengiriman tidak dihapus">
                  Setiap pengiriman dan catatan admin pada data demo disimpan. Maksimum {state.settings.maxRevisions}{' '}
                  permintaan revisi.
                </Callout>
                <SubmissionHistory submissions={liveSelected.submissions as Submission[]} />
              </div>
            ) : null}

            {detailTab === 'HISTORY' ? (
              <div className="detail-tab-content">
                <Callout tone="info" icon={History} title="Riwayat perubahan status">
                  Riwayat ini bersifat catatan demo. Audit log produksi harus append-only dan aksesnya dibatasi.
                </Callout>
                <JobHistoryList history={liveSelected.history as JobHistoryEntry[]} />
              </div>
            ) : null}
          </div>
        </Modal>
      ) : null}

      {submitTarget ? (
        <SubmitWorkDialog
          job={state.jobs.find((job) => job.id === submitTarget.id) ?? submitTarget}
          open={Boolean(submitTarget)}
          onClose={() => setSubmitTarget(null)}
        />
      ) : null}
    </div>
  )
}
