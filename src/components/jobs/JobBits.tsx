import { Download, FileArchive, FileImage, FileText, History, Paperclip } from 'lucide-react'
import type { DemoAttachment, Job, JobHistoryEntry, Submission } from '../../types'
import { formatDateTime, formatFileSize, relativeTime } from '../../lib/format'
import { Badge, EmptyState, SimulationTag } from '../ui'
import { useToast } from '../ui/Toast'

const attachmentIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') return FileImage
  if (ext === 'zip') return FileArchive
  return FileText
}

export function AttachmentList({
  attachments,
  emptyLabel = 'Belum ada lampiran.',
}: {
  attachments: DemoAttachment[]
  emptyLabel?: string
}) {
  const toast = useToast()
  if (attachments.length === 0) {
    return <p className="detail-empty">{emptyLabel}</p>
  }
  return (
    <div className="attachment-list">
      {attachments.map((file) => {
        const Icon = attachmentIcon(file.name)
        return (
          <div className="attachment-item" key={`${file.name}-${file.size}`}>
            <span className="attachment-item__icon" aria-hidden="true">
              <Icon size={16} />
            </span>
            <div className="attachment-item__copy">
              <p>{file.name}</p>
              <span>{formatFileSize(file.size)} · lampiran demo</span>
            </div>
            <button
              type="button"
              className="icon-btn icon-btn--sm"
              onClick={() => toast.info('File ini hanya metadata demo dan tidak dapat diunduh.', 'Lampiran simulasi')}
              aria-label={`Lihat lampiran demo ${file.name}`}
            >
              <Download size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export function SubmissionHistory({ submissions }: { submissions: Submission[] }) {
  if (submissions.length === 0) {
    return (
      <EmptyState
        icon={Paperclip}
        title="Belum ada pengiriman"
        description="Riwayat pengiriman dan catatan review akan muncul di sini setelah hasil dikirim."
      />
    )
  }

  const sorted = [...submissions].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  )

  return (
    <div className="submission-history">
      {sorted.map((submission, index) => (
        <article className="submission-item" key={submission.id}>
          <div className="submission-item__head">
            <div>
              <p className="submission-item__title">
                Pengiriman {sorted.length - index}
                <span className="mono submission-item__id">{submission.id}</span>
              </p>
              <p className="submission-item__time">{formatDateTime(submission.submittedAt)}</p>
            </div>
            {submission.outcome ? (
              <Badge
                tone={
                  submission.outcome === 'APPROVED'
                    ? 'success'
                    : submission.outcome === 'REVISION'
                      ? 'warning'
                      : 'danger'
                }
              >
                {submission.outcome === 'APPROVED'
                  ? 'Disetujui'
                  : submission.outcome === 'REVISION'
                    ? 'Revisi'
                    : 'Ditolak'}
              </Badge>
            ) : (
              <Badge tone="warning">Menunggu review</Badge>
            )}
          </div>
          <p className="submission-item__note">{submission.note}</p>
          {submission.adminNote ? (
            <div className="submission-item__admin-note">
              <strong>Catatan admin</strong>
              <p>{submission.adminNote}</p>
            </div>
          ) : null}
          <AttachmentList attachments={submission.attachments} />
        </article>
      ))}
    </div>
  )
}

export function JobHistoryList({ history }: { history: JobHistoryEntry[] }) {
  const sorted = [...history].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  return (
    <div className="timeline">
      {sorted.map((entry, index) => (
        <div className="timeline__item" key={`${entry.at}-${entry.action}-${index}`}>
          <span className={`timeline__dot${index === 0 ? ' is-current' : ''}`} aria-hidden="true" />
          <div className="timeline__content">
            <div className="timeline__top">
              <p className="timeline__action">{entry.action}</p>
              <span className="timeline__time">{relativeTime(entry.at)}</span>
            </div>
            <p className="timeline__meta">
              {entry.by} · {formatDateTime(entry.at)}
            </p>
            {entry.detail ? <p className="timeline__detail">{entry.detail}</p> : null}
          </div>
        </div>
      ))}
    </div>
  )
}

export function JobInstructions({ job }: { job: Job }) {
  return (
    <div className="detail-prose">
      {job.instructions.split('\n').map((line, index) => (
        <p key={`${line}-${index}`}>{line}</p>
      ))}
    </div>
  )
}

export function RevisionBanner({ job }: { job: Job }) {
  if (!job.reviewNote || (job.status !== 'REVISION' && job.status !== 'REJECTED')) return null
  return (
    <div className={`revision-banner${job.status === 'REJECTED' ? ' revision-banner--danger' : ''}`}>
      <div className="revision-banner__head">
        <History size={15} aria-hidden="true" />
        <strong>{job.status === 'REVISION' ? `Permintaan revisi ke-${job.revisionCount}` : 'Catatan penolakan'}</strong>
        <SimulationTag>Catatan demo</SimulationTag>
      </div>
      <p>{job.reviewNote}</p>
    </div>
  )
}
