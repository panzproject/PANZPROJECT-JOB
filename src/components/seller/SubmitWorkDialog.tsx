import { useEffect, useState, type ChangeEvent, type DragEvent } from 'react'
import { FileUp, Info, Paperclip, Plus, Send, Trash2 } from 'lucide-react'
import type { DemoAttachment, Job } from '../../types'
import { formatFileSize } from '../../lib/format'
import { fileExtension } from '../../lib/status'
import { useApp } from '../../store/AppContext'
import { useToast } from '../ui/Toast'
import { Button, Callout, ConfirmDialog, Modal, SimulationTag, TextAreaField } from '../ui'
import { AttachmentList, JobInstructions, RevisionBanner } from '../jobs/JobBits'
import { DeadlineLabel } from '../jobs/Deadline'

export function SubmitWorkDialog({ job, open, onClose }: { job: Job; open: boolean; onClose: () => void }) {
  const { state, submitJob } = useApp()
  const toast = useToast()
  const [note, setNote] = useState('')
  const [attachments, setAttachments] = useState<DemoAttachment[]>([])
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setNote('')
    setAttachments([])
    setError('')
    setConfirmOpen(false)
  }, [open, job.id])

  const acceptedExtensions = state.settings.allowedFileTypes.map((type) => type.toLowerCase())

  const addFiles = (files: FileList | File[]) => {
    const messages: string[] = []
    const additions: DemoAttachment[] = []
    Array.from(files).forEach((file) => {
      const extension = fileExtension(file.name)
      const normalized = extension === 'JPEG' ? 'JPG' : extension
      if (!acceptedExtensions.includes(normalized.toLowerCase())) {
        messages.push(`${file.name}: tipe file tidak diizinkan.`)
        return
      }
      if (file.size > state.settings.uploadMaxMb * 1024 * 1024) {
        messages.push(`${file.name}: melebihi batas ${state.settings.uploadMaxMb} MB.`)
        return
      }
      if (attachments.length + additions.length >= 5) {
        messages.push('Maksimum 5 lampiran per pengiriman pada demo ini.')
        return
      }
      additions.push({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
      })
    })
    if (additions.length > 0) {
      setAttachments((current) => {
        const merged = [...current]
        additions.forEach((addition) => {
          if (!merged.some((item) => item.name === addition.name && item.size === addition.size)) {
            merged.push(addition)
          }
        })
        return merged
      })
    }
    setError(messages.join(' '))
  }

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addFiles(event.target.files)
    event.target.value = ''
  }

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    if (event.dataTransfer.files) addFiles(event.dataTransfer.files)
  }

  const addDemoFile = () => {
    setAttachments((current) => {
      if (current.length >= 5) {
        setError('Maksimum 5 lampiran per pengiriman pada demo ini.')
        return current
      }
      const base = `bukti-${job.id.toLowerCase()}`
      const name = current.some((item) => item.name === `${base}.pdf`) ? `${base}-${current.length + 1}.pdf` : `${base}.pdf`
      setError('')
      return [...current, { name, size: 734003, type: 'application/pdf' }]
    })
  }

  const removeAttachment = (name: string) => {
    setAttachments((current) => current.filter((item) => item.name !== name))
    setError('')
  }

  const requestSubmit = () => {
    if (attachments.length === 0) {
      setError('Tambahkan minimal satu lampiran demo sebelum mengirim hasil.')
      return
    }
    setError('')
    setConfirmOpen(true)
  }

  const confirmSubmit = () => {
    const result = submitJob(job.id, note, attachments)
    if (result.ok) {
      setConfirmOpen(false)
      onClose()
      toast.success(result.message, 'Hasil terkirim')
    } else {
      setConfirmOpen(false)
      setError(result.message)
      toast.error(result.message)
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Kirim hasil pekerjaan"
        description={`${job.id} · ${job.title}`}
        eyebrow="Form pengiriman"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button variant="primary" iconLeft={Send} onClick={requestSubmit}>
              Kirim hasil
            </Button>
          </>
        }
      >
        <div className="submit-dialog">
          <div className="detail-highlight">
            <div className="detail-highlight__head">
              <div>
                <p className="detail-highlight__label">Instruksi pekerjaan</p>
                <h3>{job.title}</h3>
              </div>
              <SimulationTag>Lampiran lokal</SimulationTag>
            </div>
            <JobInstructions job={job} />
            <div className="detail-highlight__meta">
              <BadgeDeadline job={job} />
              <span className="chip">{job.revisionCount} revisi sebelumnya</span>
            </div>
          </div>

          <RevisionBanner job={job} />

          <TextAreaField
            label="Catatan seller"
            name="seller-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Tambahkan catatan singkat tentang hasil yang dikirim…"
            hint="Opsional. Jangan menyertakan password, token, atau data sensitif pada catatan maupun lampiran."
            rows={3}
          />

          <div>
            <span className="field__label">Lampiran hasil</span>
            <p className="field__hint" style={{ marginTop: 4 }}>
              {state.settings.allowedFileTypes.join(', ')} · maksimum {state.settings.uploadMaxMb} MB per file · maksimum 5 file.
            </p>
            <label
              className="upload-zone"
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              <input
                type="file"
                className="sr-only"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.zip"
                onChange={handleInput}
              />
              <span className="upload-zone__icon" aria-hidden="true">
                <FileUp size={19} />
              </span>
              <span className="upload-zone__text">
                <strong>Pilih lampiran atau tarik file ke sini</strong>
                <span>File hanya dicatat sebagai metadata demo dan tidak diunggah.</span>
              </span>
            </label>
            <div className="upload-zone__actions">
              <Button variant="ghost" size="sm" iconLeft={Plus} onClick={addDemoFile}>
                Gunakan lampiran demo
              </Button>
            </div>
            {error ? (
              <p className="field__error" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          {attachments.length > 0 ? (
            <div className="upload-list">
              <div className="upload-list__head">
                <span className="icon-text">
                  <Paperclip size={14} aria-hidden="true" />
                  {attachments.length} lampiran dipilih
                </span>
                <span>{formatFileSize(attachments.reduce((acc, file) => acc + file.size, 0))}</span>
              </div>
              {attachments.map((file) => (
                <div className="upload-list__item" key={file.name}>
                  <span className="upload-list__name">{file.name}</span>
                  <span className="upload-list__size">{formatFileSize(file.size)}</span>
                  <button
                    type="button"
                    className="icon-btn icon-btn--sm icon-btn--danger"
                    onClick={() => removeAttachment(file.name)}
                    aria-label={`Hapus lampiran ${file.name}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {job.submissions.length > 0 ? (
            <div className="submit-dialog__previous">
              <Callout tone="info" icon={Info} title="Pengiriman sebelumnya">
                {job.submissions.length} pengiriman tersimpan pada data demo. Menambahkan pengiriman baru tidak menghapus riwayat
                sebelumnya.
              </Callout>
              <AttachmentList attachments={job.attachments} emptyLabel="Belum ada lampiran sebelumnya." />
            </div>
          ) : null}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmSubmit}
        title="Kirim hasil pekerjaan?"
        description={`${attachments.length} lampiran akan dicatat untuk ${job.id}. Status demo akan berubah menjadi menunggu review.`}
        confirmLabel="Ya, kirim hasil"
      >
        <div className="confirm-summary">
          <div>
            <span>Pekerjaan</span>
            <strong>{job.title}</strong>
          </div>
          <div>
            <span>Lampiran</span>
            <strong>{attachments.length} file (metadata demo)</strong>
          </div>
          <div>
            <span>Deadline</span>
            <DeadlineLabel deadlineAt={job.deadlineAt} />
          </div>
        </div>
        <Callout tone="warning" title="Simulasi pengiriman">
          Tidak ada file yang dikirim ke server. Konfirmasi ini hanya mengubah state demo pada peramban.
        </Callout>
      </ConfirmDialog>
    </>
  )
}

function BadgeDeadline({ job }: { job: Job }) {
  return <DeadlineLabel deadlineAt={job.deadlineAt} />
}
