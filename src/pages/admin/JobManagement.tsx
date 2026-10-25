import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  ClipboardCheck,
  Lock,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Search,
  Send,
  Undo2,
  XCircle,
} from 'lucide-react'
import { useApp } from '../../store/AppContext'
import type { Job } from '../../types'
import { formatDate, formatDateTime, formatIDR, relativeTime } from '../../lib/format'
import { getJobStatus, JOB_CATEGORIES } from '../../lib/status'
import { JobFormDialog } from '../../components/admin/JobFormDialog'
import { ExtendDeadlineDialog } from '../../components/admin/ExtendDeadlineDialog'
import { ReasonDialog } from '../../components/common/ReasonDialog'
import { JobHistoryList, JobInstructions } from '../../components/jobs/JobBits'
import { DeadlineLabel } from '../../components/jobs/Deadline'
import {
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

type JobTab = 'ALL' | 'AVAILABLE' | 'ACTIVE' | 'REVIEW' | 'COMPLETED' | 'CLOSED'
type VisibilityFilter = 'ALL' | 'LIVE' | 'PAUSED'

const PAGE_SIZE = 9

const matchesTab = (job: Job, tab: JobTab) => {
  switch (tab) {
    case 'ALL':
      return true
    case 'AVAILABLE':
      return job.status === 'AVAILABLE'
    case 'ACTIVE':
      return job.status === 'CLAIMED' || job.status === 'REVISION'
    case 'REVIEW':
      return ['SUBMITTED', 'UNDER_REVIEW', 'EXPIRY_REVIEW'].includes(job.status)
    case 'COMPLETED':
      return ['APPROVED', 'REJECTED'].includes(job.status)
    case 'CLOSED':
      return ['CANCELLED', 'EXPIRED'].includes(job.status)
  }
}

export default function JobManagement() {
  const { state, toggleJobPause, closeJob, reopenJob } = useApp()
  const toast = useToast()
  const navigate = useNavigate()
  const [tab, setTab] = useState<JobTab>('ALL')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('ALL')
  const [visibility, setVisibility] = useState<VisibilityFilter>('ALL')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)
  const [extendOpen, setExtendOpen] = useState(false)
  const [reopenOpen, setReopenOpen] = useState(false)

  const counts = useMemo(
    () => ({
      ALL: state.jobs.length,
      AVAILABLE: state.jobs.filter((job) => matchesTab(job, 'AVAILABLE')).length,
      ACTIVE: state.jobs.filter((job) => matchesTab(job, 'ACTIVE')).length,
      REVIEW: state.jobs.filter((job) => matchesTab(job, 'REVIEW')).length,
      COMPLETED: state.jobs.filter((job) => matchesTab(job, 'COMPLETED')).length,
      CLOSED: state.jobs.filter((job) => matchesTab(job, 'CLOSED')).length,
    }),
    [state.jobs],
  )

  const filtered = useMemo(() => {
    return state.jobs
      .filter((job) => {
        if (!matchesTab(job, tab)) return false
        if (category !== 'ALL' && job.category !== category) return false
        if (visibility === 'PAUSED' && !job.paused) return false
        if (visibility === 'LIVE' && job.paused) return false
        if (!query.trim()) return true
        const needle = query.toLowerCase()
        const seller = state.sellers.find((item) => item.id === job.sellerId)?.name ?? ''
        return (
          job.id.toLowerCase().includes(needle) ||
          job.title.toLowerCase().includes(needle) ||
          seller.toLowerCase().includes(needle)
        )
      })
      .sort((a, b) => b.id.localeCompare(a.id, undefined, { numeric: true }))
  }, [state.jobs, state.sellers, tab, category, visibility, query])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const hasFilters = Boolean(query.trim() || category !== 'ALL' || visibility !== 'ALL')

  const selected = state.jobs.find((job) => job.id === selectedId) ?? null
  const selectedSeller = state.sellers.find((seller) => seller.id === selected?.sellerId)
  const canEdit = selected ? ['AVAILABLE', 'CANCELLED'].includes(selected.status) : false
  const canPause = selected?.status === 'AVAILABLE'
  const canExtend = selected ? ['CLAIMED', 'REVISION', 'EXPIRY_REVIEW'].includes(selected.status) : false
  const canClose = selected?.status === 'AVAILABLE'
  const canReopen = selected?.status === 'CANCELLED' && !selected.sellerId
  const canReview = selected ? ['SUBMITTED', 'UNDER_REVIEW', 'EXPIRY_REVIEW'].includes(selected.status) : false

  const resetFilters = () => {
    setQuery('')
    setCategory('ALL')
    setVisibility('ALL')
    setPage(1)
  }

  const handlePause = () => {
    if (!selected) return
    const result = toggleJobPause(selected.id)
    if (result.ok) toast.success(result.message, 'Status visibilitas diperbarui')
    else toast.error(result.message)
  }

  const handleClose = (reason: string) => {
    if (!selected) return { ok: false, message: 'Pekerjaan tidak ditemukan.' }
    const result = closeJob(selected.id, reason)
    if (result.ok) toast.success(result.message, 'Pekerjaan ditutup')
    return result
  }

  const handleReopen = () => {
    if (!selected) return
    const result = reopenJob(selected.id)
    if (result.ok) toast.success(result.message, 'Pekerjaan dibuka kembali')
    else toast.error(result.message)
    setReopenOpen(false)
  }

  const emptyAction = hasFilters ? (
    <Button variant="secondary" size="sm" iconLeft={RotateCcw} onClick={resetFilters}>
      Reset filter
    </Button>
  ) : (
    <Button variant="primary" size="sm" iconLeft={Plus} onClick={() => setCreateOpen(true)}>
      Buat pekerjaan
    </Button>
  )

  return (
    <div className="page page-enter">
      <PageHeader
        eyebrow="Panel admin"
        title="Manajemen pekerjaan"
        description="Buat, atur visibilitas, perpanjang deadline, dan tutup pekerjaan demo. Materi terkunci setelah diklaim."
        actions={
          <Button variant="primary" iconLeft={Plus} onClick={() => setCreateOpen(true)}>
            Buat pekerjaan
          </Button>
        }
      />

      <div className="admin-page-note">
        <div>
          <span>Total pekerjaan</span>
          <strong>{state.jobs.length}</strong>
        </div>
        <div>
          <span>Tersedia</span>
          <strong>{state.jobs.filter((job) => job.status === 'AVAILABLE' && !job.paused).length}</strong>
        </div>
        <div>
          <span>Dijeda</span>
          <strong>{state.jobs.filter((job) => job.paused).length}</strong>
        </div>
        <div>
          <span>Antrean review</span>
          <strong>{counts.REVIEW}</strong>
        </div>
        <SimulationTag />
      </div>

      <Panel
        title="Daftar pekerjaan"
        description="Gunakan tab, pencarian, dan filter untuk menemukan pekerjaan."
        action={<SimulationTag>Data lokal</SimulationTag>}
      >
        <Tabs
          label="Filter status pekerjaan"
          value={tab}
          onChange={(value) => {
            setTab(value as JobTab)
            setPage(1)
          }}
          items={[
            { id: 'ALL', label: 'Semua', count: counts.ALL },
            { id: 'AVAILABLE', label: 'Tersedia', count: counts.AVAILABLE },
            { id: 'ACTIVE', label: 'Dikerjakan', count: counts.ACTIVE },
            { id: 'REVIEW', label: 'Review', count: counts.REVIEW },
            { id: 'COMPLETED', label: 'Selesai', count: counts.COMPLETED },
            { id: 'CLOSED', label: 'Ditutup', count: counts.CLOSED },
          ]}
        />

        <div className="filter-bar jobs-toolbar">
          <SearchField
            label="Cari pekerjaan berdasarkan judul, ID, atau seller"
            value={query}
            onChange={(value) => {
              setQuery(value)
              setPage(1)
            }}
            placeholder="Cari judul, ID, atau seller…"
          />
          <SelectField
            label="Kategori"
            fieldClassName="filter-bar__control"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value)
              setPage(1)
            }}
            options={[
              { value: 'ALL', label: 'Semua kategori' },
              ...JOB_CATEGORIES.map((item) => ({ value: item, label: item })),
            ]}
          />
          <SelectField
            label="Visibilitas"
            fieldClassName="filter-bar__control"
            value={visibility}
            onChange={(event) => {
              setVisibility(event.target.value as VisibilityFilter)
              setPage(1)
            }}
            options={[
              { value: 'ALL', label: 'Semua' },
              { value: 'LIVE', label: 'Tampil' },
              { value: 'PAUSED', label: 'Dijeda' },
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
          <span className="filter-bar__result">{filtered.length} pekerjaan</span>
        </div>

        {pageItems.length > 0 ? (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <caption className="sr-only">Daftar pekerjaan pada panel admin</caption>
                <thead>
                  <tr>
                    <th scope="col">Pekerjaan</th>
                    <th scope="col">Kategori</th>
                    <th scope="col" className="num">Tarif</th>
                    <th scope="col">Seller</th>
                    <th scope="col">Status</th>
                    <th scope="col">Deadline</th>
                    <th scope="col"><span className="sr-only">Aksi</span></th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((job) => (
                    <tr key={job.id}>
                      <td>
                        <div className="cell-title">{job.title}</div>
                        <div className="cell-sub">
                          <span className="mono">{job.id}</span> · dibuat {relativeTime(job.createdAt)}
                        </div>
                      </td>
                      <td>{job.category}</td>
                      <td className="num cell-amount">{formatIDR(job.rate)}</td>
                      <td>
                        {job.sellerId ? (
                          <>
                            <div className="cell-title">{state.sellers.find((seller) => seller.id === job.sellerId)?.name ?? 'Seller tidak ditemukan'}</div>
                            <div className="cell-sub mono">{job.sellerId}</div>
                          </>
                        ) : (
                          <span className="text-muted">Belum diklaim</span>
                        )}
                      </td>
                      <td>
                        <div className="cell-status">
                          <StatusBadge meta={getJobStatus(job)} />
                          {job.paused ? <Badge tone="neutral">Dijeda</Badge> : null}
                        </div>
                      </td>
                      <td>
                        {job.deadlineAt ? (
                          <div>
                            <DeadlineLabel deadlineAt={job.deadlineAt} />
                            <div className="cell-sub">{formatDate(job.deadlineAt)}</div>
                          </div>
                        ) : (
                          <span className="text-muted">Belum ada</span>
                        )}
                      </td>
                      <td>
                        <div className="cell-actions">
                          {canReviewJob(job) ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              iconLeft={ClipboardCheck}
                              onClick={() => navigate(`/admin/review?job=${job.id}`)}
                            >
                              Review
                            </Button>
                          ) : null}
                          <Button variant="secondary" size="sm" iconLeft={Pencil} onClick={() => setSelectedId(job.id)}>
                            Kelola
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
                dari <strong>{filtered.length}</strong> pekerjaan
              </p>
              <Pagination page={currentPage} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />
            </div>
          </>
        ) : (
          <EmptyState
            icon={Search}
            title="Pekerjaan tidak ditemukan"
            description="Tidak ada pekerjaan yang cocok dengan tab dan filter saat ini."
            action={emptyAction}
          />
        )}
      </Panel>

      <JobFormDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      {selected ? (
        <Modal
          open={Boolean(selected)}
          onClose={() => setSelectedId(null)}
          title={selected.title}
          description={`${selected.id} · ${selected.category}`}
          eyebrow="Kelola pekerjaan"
          size="xl"
          footer={
            <>
              <Button variant="secondary" onClick={() => setSelectedId(null)}>
                Tutup
              </Button>
              {canReview ? (
                <Button
                  variant="primary"
                  iconLeft={ClipboardCheck}
                  onClick={() => {
                    setSelectedId(null)
                    navigate(`/admin/review?job=${selected.id}`)
                  }}
                >
                  Buka review
                </Button>
              ) : null}
              {canEdit ? (
                <Button variant="primary" iconLeft={Pencil} onClick={() => setEditOpen(true)}>
                  Edit pekerjaan
                </Button>
              ) : null}
            </>
          }
        >
          <div className="job-detail">
            <div className="job-detail__top">
              <div className="row">
                <StatusBadge meta={getJobStatus(selected)} />
                <Badge tone="neutral">{selected.category}</Badge>
                {selected.paused ? <Badge tone="neutral">Dijeda</Badge> : null}
                <SimulationTag>Demo</SimulationTag>
              </div>
              <span className="job-detail__rate">{formatIDR(selected.rate)}</span>
            </div>

            <div className="detail-stat-grid">
              <div>
                <span>Seller</span>
                <strong>{selectedSeller?.name ?? 'Belum diklaim'}</strong>
                {selectedSeller ? <small className="mono">{selectedSeller.id}</small> : null}
              </div>
              <div>
                <span>Deadline</span>
                {selected.deadlineAt ? (
                  <DeadlineLabel deadlineAt={selected.deadlineAt} />
                ) : (
                  <strong>Belum ada</strong>
                )}
              </div>
              <div>
                <span>Revisi</span>
                <strong>{selected.revisionCount} / {state.settings.maxRevisions}</strong>
              </div>
            </div>

            <div className="detail-meta-row">
              <span>Dibuat {formatDateTime(selected.createdAt)}</span>
              <span>Diklaim {selected.claimedAt ? formatDateTime(selected.claimedAt) : '—'}</span>
              <span>Dikirim {selected.submittedAt ? formatDateTime(selected.submittedAt) : '—'}</span>
            </div>

            <section className="detail-section">
              <h3><BriefcaseBusiness size={15} aria-hidden="true" /> Deskripsi</h3>
              <p className="detail-prose">{selected.description}</p>
            </section>

            <section className="detail-section">
              <h3><Send size={15} aria-hidden="true" /> Instruksi</h3>
              <JobInstructions job={selected} />
            </section>

            {selected.reviewNote ? (
              <Callout tone="warning" title="Catatan review terakhir">
                {selected.reviewNote}
              </Callout>
            ) : null}

            <section className="detail-section">
              <h3><Lock size={15} aria-hidden="true" /> Tindakan admin</h3>
              <div className="admin-action-grid">
                {canPause ? (
                  <Button
                    variant="secondary"
                    iconLeft={selected.paused ? Play : Pause}
                    onClick={handlePause}
                  >
                    {selected.paused ? 'Aktifkan di marketplace' : 'Jeda dari marketplace'}
                  </Button>
                ) : null}
                {canExtend ? (
                  <Button variant="secondary" iconLeft={CalendarClock} onClick={() => setExtendOpen(true)}>
                    Perpanjang deadline
                  </Button>
                ) : null}
                {canClose ? (
                  <Button variant="danger" iconLeft={XCircle} onClick={() => setCloseOpen(true)}>
                    Tutup pekerjaan
                  </Button>
                ) : null}
                {canReopen ? (
                  <Button variant="secondary" iconLeft={Undo2} onClick={() => setReopenOpen(true)}>
                    Buka kembali
                  </Button>
                ) : null}
                {canReview ? (
                  <Button
                    variant="secondary"
                    iconLeft={ArrowRight}
                    onClick={() => {
                      setSelectedId(null)
                      navigate(`/admin/review?job=${selected.id}`)
                    }}
                  >
                    Review hasil
                  </Button>
                ) : null}
                {!canPause && !canExtend && !canClose && !canReopen && !canReview && canEdit ? (
                  <p className="detail-footnote">Pekerjaan tersedia untuk diedit dan dipublikasikan kembali.</p>
                ) : null}
                {!canPause && !canExtend && !canClose && !canReopen && !canReview && !canEdit ? (
                  <p className="detail-footnote">
                    Pekerjaan final. Materi, tarif, dan status dikunci untuk menjaga konsistensi data demo.
                  </p>
                ) : null}
              </div>
              <p className="detail-footnote">
                Semua tindakan dicatat pada audit log demo. Perubahan tidak memengaruhi sistem nyata.
              </p>
            </section>

            <section className="detail-section">
              <h3>Riwayat pekerjaan</h3>
              <JobHistoryList history={selected.history} />
            </section>
          </div>
        </Modal>
      ) : null}

      <JobFormDialog open={editOpen} onClose={() => setEditOpen(false)} initial={selected} />

      <ExtendDeadlineDialog open={extendOpen} job={selected} onClose={() => setExtendOpen(false)} />

      <ReasonDialog
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        onConfirm={handleClose}
        title="Tutup pekerjaan?"
        description={selected ? `${selected.id} · ${selected.title}` : 'Pekerjaan akan ditutup.'}
        label="Alasan penutupan"
        placeholder="Contoh: brief tidak lagi relevan dengan kebutuhan demo."
        confirmLabel="Tutup pekerjaan"
        tone="danger"
      >
        <Callout tone="warning" title="Pekerjaan yang sudah diklaim tidak dapat ditutup">
          Penutupan hanya tersedia sebelum pekerjaan diklaim. Alasan akan masuk ke audit log.
        </Callout>
      </ReasonDialog>

      <ConfirmDialog
        open={reopenOpen}
        onClose={() => setReopenOpen(false)}
        onConfirm={handleReopen}
        title="Buka kembali pekerjaan ini?"
        description="Status akan diubah menjadi Tersedia dan pekerjaan kembali dapat muncul di marketplace demo."
        confirmLabel="Buka kembali"
      >
        {selected ? (
          <div className="confirm-summary">
            <div>
              <span>Pekerjaan</span>
              <strong>{selected.title}</strong>
            </div>
            <div>
              <span>ID</span>
              <strong className="mono">{selected.id}</strong>
            </div>
          </div>
        ) : null}
      </ConfirmDialog>
    </div>
  )
}

const canReviewJob = (job: Job) => ['SUBMITTED', 'UNDER_REVIEW', 'EXPIRY_REVIEW'].includes(job.status)
