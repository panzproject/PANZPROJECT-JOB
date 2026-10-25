import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { useApp } from '../../store/AppContext'
import { formatDateTime, formatIDR, relativeTime } from '../../lib/format'
import { getJobStatus } from '../../lib/status'
import { DeadlineLabel } from '../../components/jobs/Deadline'
import { AttachmentList, JobInstructions, JobHistoryList, SubmissionHistory } from '../../components/jobs/JobBits'
import { ExtendDeadlineDialog } from '../../components/admin/ExtendDeadlineDialog'
import {
  Badge,
  Button,
  Callout,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  Panel,
  SearchField,
  SimulationTag,
  StatusBadge,
  Tabs,
  TextAreaField,
} from '../../components/ui'
import { useToast } from '../../components/ui/Toast'

type ReviewTab = 'ALL' | 'SUBMITTED' | 'UNDER_REVIEW' | 'EXPIRY_REVIEW'
type Decision = 'APPROVE' | 'REVISION' | 'REJECT' | 'EXPIRE'

const priority: Record<string, number> = {
  EXPIRY_REVIEW: 0,
  SUBMITTED: 1,
  UNDER_REVIEW: 2,
}

const decisionCopy: Record<Decision, { label: string; confirm: string; tone: 'primary' | 'danger'; description: string }> = {
  APPROVE: {
    label: 'Setujui hasil',
    confirm: 'Setujui hasil',
    tone: 'primary',
    description: 'Pekerjaan selesai dan komisi dicatat satu kali.',
  },
  REVISION: {
    label: 'Minta revisi',
    confirm: 'Minta revisi',
    tone: 'primary',
    description: 'Seller dapat mengirim ulang hasil sebelum batas revisi.',
  },
  REJECT: {
    label: 'Tolak hasil',
    confirm: 'Tolak hasil',
    tone: 'danger',
    description: 'Pekerjaan ditutup sebagai ditolak tanpa komisi.',
  },
  EXPIRE: {
    label: 'Nyatakan kedaluwarsa',
    confirm: 'Nyatakan kedaluwarsa',
    tone: 'danger',
    description: 'Pekerjaan ditutup sebagai kedaluwarsa setelah review.',
  },
}

export default function ReviewQueue() {
  const { state, reviewJob } = useApp()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<ReviewTab>('ALL')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('job'))
  const [decision, setDecision] = useState<Decision>('APPROVE')
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [extendOpen, setExtendOpen] = useState(false)

  const queue = useMemo(
    () =>
      state.jobs
        .filter((job) => ['SUBMITTED', 'UNDER_REVIEW', 'EXPIRY_REVIEW'].includes(job.status))
        .sort((a, b) => {
          const priorityDiff = (priority[a.status] ?? 9) - (priority[b.status] ?? 9)
          if (priorityDiff !== 0) return priorityDiff
          return new Date(a.submittedAt ?? a.createdAt).getTime() - new Date(b.submittedAt ?? b.createdAt).getTime()
        }),
    [state.jobs],
  )

  const tabFiltered = tab === 'ALL' ? queue : queue.filter((job) => job.status === tab)
  const filteredQueue = tabFiltered.filter((job) => {
    if (!query.trim()) return true
    const needle = query.toLowerCase()
    const seller = state.sellers.find((item) => item.id === job.sellerId)?.name ?? ''
    return (
      job.id.toLowerCase().includes(needle) ||
      job.title.toLowerCase().includes(needle) ||
      seller.toLowerCase().includes(needle)
    )
  })

  const selected = state.jobs.find((job) => job.id === selectedId) ?? null
  const selectedSeller = state.sellers.find((seller) => seller.id === selected?.sellerId)
  const latestSubmission = selected?.submissions[selected.submissions.length - 1]
  const revisionLimitReached = Boolean(selected && selected.revisionCount >= state.settings.maxRevisions)
  const isExpiryReview = selected?.status === 'EXPIRY_REVIEW'

  useEffect(() => {
    if (filteredQueue.length === 0) {
      setSelectedId(null)
      return
    }
    if (!selectedId || !filteredQueue.some((job) => job.id === selectedId)) {
      setSelectedId(filteredQueue[0].id)
    }
  }, [filteredQueue, selectedId])

  useEffect(() => {
    setDecision('APPROVE')
    setReason('')
    setReasonError('')
  }, [selectedId])

  useEffect(() => {
    if (decision === 'EXPIRE' && !isExpiryReview) setDecision('APPROVE')
    if (decision === 'REVISION' && revisionLimitReached) setDecision('APPROVE')
  }, [decision, isExpiryReview, revisionLimitReached])

  const tabCounts = {
    ALL: queue.length,
    SUBMITTED: queue.filter((job) => job.status === 'SUBMITTED').length,
    UNDER_REVIEW: queue.filter((job) => job.status === 'UNDER_REVIEW').length,
    EXPIRY_REVIEW: queue.filter((job) => job.status === 'EXPIRY_REVIEW').length,
  }

  const chooseDecision = (next: Decision) => {
    if (next === 'REVISION' && revisionLimitReached) return
    if (next === 'EXPIRE' && !isExpiryReview) return
    setDecision(next)
    setReasonError('')
  }

  const submitDecision = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selected) return
    if (decision === 'REVISION' && revisionLimitReached) {
      setReasonError(`Batas maksimum ${state.settings.maxRevisions} revisi sudah tercapai.`)
      return
    }
    if (decision !== 'APPROVE' && reason.trim().length < 5) {
      setReasonError('Alasan wajib diisi minimal 5 karakter.')
      return
    }
    setReasonError('')
    setConfirmOpen(true)
  }

  const confirmDecision = () => {
    if (!selected) return
    const result = reviewJob(selected.id, decision, reason.trim(), reason.trim())
    if (result.ok) {
      toast.success(result.message, 'Review diproses')
      setConfirmOpen(false)
      setReason('')
      setReasonError('')
    } else {
      toast.error(result.message)
      setReasonError(result.message)
    }
  }

  return (
    <div className="page page-enter">
      <PageHeader
        eyebrow="Panel admin"
        title="Review queue"
        description="Periksa hasil pekerjaan dan berikan keputusan. Setiap keputusan tercatat pada audit log simulasi."
        actions={
          <Link to="/admin/jobs" className="btn btn--secondary">
            <ChevronRight size={15} aria-hidden="true" />
            Manajemen pekerjaan
          </Link>
        }
      />

      <div className="review-summary">
        <div>
          <span className="review-summary__icon" aria-hidden="true"><ClipboardCheck size={18} /></span>
          <div>
            <strong>{queue.length}</strong>
            <span>pekerjaan menunggu keputusan</span>
          </div>
        </div>
        <div>
          <span className="review-summary__icon is-expired" aria-hidden="true"><Clock3 size={18} /></span>
          <div>
            <strong>{tabCounts.EXPIRY_REVIEW}</strong>
            <span>review kedaluwarsa</span>
          </div>
        </div>
        <div>
          <span className="review-summary__icon is-success" aria-hidden="true"><ShieldCheck size={18} /></span>
          <div>
            <strong>{state.settings.maxRevisions}</strong>
            <span>maksimum permintaan revisi</span>
          </div>
        </div>
        <SimulationTag>Data lokal</SimulationTag>
      </div>

      <div className="review-layout">
        <Panel className="review-queue-panel" bodyClassName="review-queue-panel__body">
          <div className="review-queue-panel__head">
            <div>
              <h2>Antrean</h2>
              <p>Urut berdasarkan prioritas dan waktu kirim.</p>
            </div>
            <Badge tone={queue.length > 0 ? 'warning' : 'success'}>{queue.length} item</Badge>
          </div>
          <Tabs
            label="Filter antrean review"
            value={tab}
            onChange={(value) => setTab(value as ReviewTab)}
            items={[
              { id: 'ALL', label: 'Semua', count: tabCounts.ALL },
              { id: 'SUBMITTED', label: 'Menunggu', count: tabCounts.SUBMITTED },
              { id: 'UNDER_REVIEW', label: 'Direview', count: tabCounts.UNDER_REVIEW },
              { id: 'EXPIRY_REVIEW', label: 'Lewat deadline', count: tabCounts.EXPIRY_REVIEW },
            ]}
          />
          <div className="review-queue-search">
            <SearchField
              label="Cari antrean review"
              value={query}
              onChange={setQuery}
              placeholder="Cari ID, judul, atau seller…"
            />
          </div>

          {filteredQueue.length > 0 ? (
            <div className="review-queue-list">
              {filteredQueue.map((job) => {
                const seller = state.sellers.find((item) => item.id === job.sellerId)
                return (
                  <button
                    type="button"
                    key={job.id}
                    className={`review-queue-item${job.id === selectedId ? ' is-active' : ''}`}
                    onClick={() => setSelectedId(job.id)}
                    aria-current={job.id === selectedId ? 'true' : undefined}
                  >
                    <span className="review-queue-item__top">
                      <span className="cell-id">{job.id}</span>
                      <StatusBadge meta={getJobStatus(job)} />
                    </span>
                    <span className="review-queue-item__title">{job.title}</span>
                    <span className="review-queue-item__meta">
                      {seller?.name ?? 'Seller'} · dikirim {relativeTime(job.submittedAt ?? job.createdAt)}
                    </span>
                    <span className="review-queue-item__bottom">
                      <span>{formatIDR(job.rate)}</span>
                      <span>Revisi {job.revisionCount}/{state.settings.maxRevisions}</span>
                      <ChevronRight size={13} aria-hidden="true" />
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={query ? Search : CheckCircle2}
              title={query ? 'Tidak ada hasil' : 'Antrean bersih'}
              description={
                query
                  ? 'Tidak ada pekerjaan pada antrean review yang cocok dengan pencarian.'
                  : 'Semua hasil pekerjaan demo sudah diproses. Antrean baru akan muncul setelah seller mengirim hasil.'
              }
            />
          )}
        </Panel>

        {selected ? (
          <Panel
            className="review-workspace"
            bodyClassName="review-workspace__body"
            action={<StatusBadge meta={getJobStatus(selected)} />}
          >
            <div className="review-workspace__head">
              <div>
                <span className="cell-id">{selected.id} · {selected.category}</span>
                <h2>{selected.title}</h2>
                <p>
                  Dikirim {formatDateTime(selected.submittedAt ?? selected.createdAt)} oleh{' '}
                  <strong>{selectedSeller?.name ?? 'seller demo'}</strong>
                </p>
              </div>
              <div className="review-workspace__head-right">
                <span className="review-workspace__rate">{formatIDR(selected.rate)}</span>
                {selected.deadlineAt ? <DeadlineLabel deadlineAt={selected.deadlineAt} /> : null}
              </div>
            </div>

            {isExpiryReview ? (
              <Callout tone="warning" icon={AlertTriangle} title="Deadline telah terlewati">
                Pekerjaan masuk review kedaluwarsa. Putuskan hasil yang sudah dikirim, nyatakan kedaluwarsa, atau
                perpanjang deadline untuk mengembalikannya ke seller.
                <div className="callout__actions">
                  <Button
                    variant="secondary"
                    size="sm"
                    iconLeft={CalendarClock}
                    onClick={() => setExtendOpen(true)}
                  >
                    Perpanjang deadline
                  </Button>
                </div>
              </Callout>
            ) : null}

            <div className="review-meta-grid">
              <div>
                <span>Seller</span>
                <strong>{selectedSeller?.name ?? '—'}</strong>
                {selectedSeller ? <small className="mono">{selectedSeller.id}</small> : null}
              </div>
              <div>
                <span>Pengiriman</span>
                <strong>{selected.submissions.length} kali</strong>
                <small>Revisi {selected.revisionCount}/{state.settings.maxRevisions}</small>
              </div>
              <div>
                <span>Deadline</span>
                {selected.deadlineAt ? <DeadlineLabel deadlineAt={selected.deadlineAt} /> : <strong>—</strong>}
              </div>
              <div>
                <span>Status komisi</span>
                <Badge tone={selected.commissionRecorded ? 'success' : 'neutral'}>
                  {selected.commissionRecorded ? 'Sudah dicatat' : 'Belum dicatat'}
                </Badge>
              </div>
            </div>

            <div className="review-main-grid">
              <div className="review-main-column">
                <section className="review-block">
                  <div className="review-block__head">
                    <h3>Hasil terbaru</h3>
                    {latestSubmission ? (
                      <span className="mono">{latestSubmission.id}</span>
                    ) : (
                      <Badge tone="neutral">Tidak ada file</Badge>
                    )}
                  </div>
                  {latestSubmission ? (
                    <>
                      <div className="review-submission-note">
                        <span>Catatan seller</span>
                        <p>{latestSubmission.note}</p>
                      </div>
                      <div className="review-attachments">
                        <span className="review-attachments__label">Lampiran demo</span>
                        <AttachmentList attachments={latestSubmission.attachments} emptyLabel="Tidak ada lampiran." />
                      </div>
                    </>
                  ) : (
                    <p className="detail-empty">Pekerjaan ini tidak memiliki pengiriman yang dapat ditinjau.</p>
                  )}
                </section>

                <section className="review-block">
                  <div className="review-block__head">
                    <h3>Brief dan instruksi</h3>
                  </div>
                  <p className="detail-prose">{selected.description}</p>
                  <JobInstructions job={selected} />
                </section>

                <section className="review-block">
                  <div className="review-block__head">
                    <h3>Riwayat pengiriman</h3>
                    <Badge tone="neutral">{selected.submissions.length} pengiriman</Badge>
                  </div>
                  <SubmissionHistory submissions={selected.submissions} />
                </section>

                <section className="review-block">
                  <div className="review-block__head">
                    <h3>Riwayat status</h3>
                  </div>
                  <JobHistoryList history={selected.history} />
                </section>
              </div>

              <aside className="review-decision" aria-label="Form keputusan review">
                <div className="review-decision__head">
                  <span className="review-decision__step">Langkah berikutnya</span>
                  <h3>Beri keputusan</h3>
                  <p>Catatan akan dikirim ke seller dan dicatat pada audit log simulasi.</p>
                </div>

                <form className="review-decision__form" onSubmit={submitDecision} noValidate>
                  <div className="decision-options" role="group" aria-label="Pilih keputusan review">
                    <button
                      type="button"
                      className={`decision-option decision-option--approve${decision === 'APPROVE' ? ' is-active' : ''}`}
                      aria-pressed={decision === 'APPROVE'}
                      onClick={() => chooseDecision('APPROVE')}
                    >
                      <CheckCircle2 size={16} aria-hidden="true" />
                      <span>
                        <strong>Setujui</strong>
                        <small>Komisi dicatat sekali</small>
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`decision-option decision-option--revision${decision === 'REVISION' ? ' is-active' : ''}`}
                      aria-pressed={decision === 'REVISION'}
                      onClick={() => chooseDecision('REVISION')}
                      disabled={revisionLimitReached}
                    >
                      <RefreshCw size={16} aria-hidden="true" />
                      <span>
                        <strong>Revisi</strong>
                        <small>Maks. {state.settings.maxRevisions} kali</small>
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`decision-option decision-option--reject${decision === 'REJECT' ? ' is-active' : ''}`}
                      aria-pressed={decision === 'REJECT'}
                      onClick={() => chooseDecision('REJECT')}
                    >
                      <XCircle size={16} aria-hidden="true" />
                      <span>
                        <strong>Tolak</strong>
                        <small>Tanpa komisi</small>
                      </span>
                    </button>
                    {isExpiryReview ? (
                      <button
                        type="button"
                        className={`decision-option decision-option--expire${decision === 'EXPIRE' ? ' is-active' : ''}`}
                        aria-pressed={decision === 'EXPIRE'}
                        onClick={() => chooseDecision('EXPIRE')}
                      >
                        <Clock3 size={16} aria-hidden="true" />
                        <span>
                          <strong>Kedaluwarsa</strong>
                          <small>Tutup pekerjaan</small>
                        </span>
                      </button>
                    ) : null}
                  </div>

                  {revisionLimitReached ? (
                    <Callout tone="warning" title="Batas revisi tercapai">
                      Permintaan revisi tidak tersedia lagi. Setujui, tolak, atau nyatakan pekerjaan kedaluwarsa bila
                      relevan.
                    </Callout>
                  ) : null}

                  <TextAreaField
                    label={decision === 'APPROVE' ? 'Catatan persetujuan (opsional)' : 'Alasan keputusan'}
                    name="review-reason"
                    value={reason}
                    onChange={(event) => {
                      setReason(event.target.value)
                      setReasonError('')
                    }}
                    error={reasonError || undefined}
                    placeholder={
                      decision === 'APPROVE'
                        ? 'Contoh: hasil sesuai brief dan format.'
                        : decision === 'REVISION'
                          ? 'Jelaskan bagian yang perlu diperbaiki.'
                          : 'Jelaskan alasan penolakan atau kedaluwarsa.'
                    }
                    hint={
                      decision === 'APPROVE'
                        ? 'Opsional. Catatan ini akan tampil pada riwayat seller.'
                        : 'Wajib diisi minimal 5 karakter dan akan tampil ke seller.'
                    }
                    rows={4}
                    required={decision !== 'APPROVE'}
                  />

                  <div className="review-decision__effect">
                    {decision === 'APPROVE' ? (
                      <>
                        <span>Efek keputusan</span>
                        <p>
                          Status menjadi <strong>Disetujui</strong>. Komisi {formatIDR(selected.rate)} dicatat satu
                          kali pada saldo demo seller.
                        </p>
                      </>
                    ) : decision === 'REVISION' ? (
                      <>
                        <span>Efek keputusan</span>
                        <p>
                          Revisi ke-{selected.revisionCount + 1} dari {state.settings.maxRevisions}. Deadline seller
                          menjadi {state.settings.revisionHours} jam setelah keputusan.
                        </p>
                      </>
                    ) : decision === 'REJECT' ? (
                      <>
                        <span>Efek keputusan</span>
                        <p>Status menjadi <strong>Ditolak</strong>. Komisi tidak dicatat.</p>
                      </>
                    ) : (
                      <>
                        <span>Efek keputusan</span>
                        <p>Status menjadi <strong>Kedaluwarsa</strong>. Komisi tidak dicatat.</p>
                      </>
                    )}
                  </div>

                  <Button variant="primary" iconLeft={Send} type="submit" block>
                    {decisionCopy[decision].confirm}
                  </Button>
                  <p className="review-decision__disclaimer">
                    Tindakan ini hanya mengubah data demo. Tidak ada pembayaran atau email nyata.
                  </p>
                </form>
              </aside>
            </div>
          </Panel>
        ) : (
          <Panel className="review-workspace">
            <EmptyState
              icon={ClipboardCheck}
              title="Pilih pekerjaan dari antrean"
              description="Detail hasil, lampiran, dan formulir keputusan akan tampil di area ini."
            />
          </Panel>
        )}
      </div>

      <ExtendDeadlineDialog open={extendOpen} job={selected} onClose={() => setExtendOpen(false)} />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDecision}
        title={`${decisionCopy[decision].label}?`}
        description={decisionCopy[decision].description}
        confirmLabel={decisionCopy[decision].confirm}
        tone={decisionCopy[decision].tone}
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
            {reason.trim() ? (
              <div>
                <span>Catatan</span>
                <strong>{reason.trim()}</strong>
              </div>
            ) : null}
            {decision === 'APPROVE' ? (
              <div>
                <span>Komisi demo</span>
                <strong>{formatIDR(selected.rate)}</strong>
              </div>
            ) : null}
          </div>
        ) : null}
      </ConfirmDialog>
    </div>
  )
}
