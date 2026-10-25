import { useEffect, useState, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button, Callout, Modal, TextAreaField } from '../ui'

export function ReasonDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  label,
  placeholder,
  confirmLabel,
  tone = 'primary',
  children,
  minLength = 5,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => { ok: boolean; message?: string }
  title: string
  description: string
  label: string
  placeholder: string
  confirmLabel: string
  tone?: 'primary' | 'danger'
  children?: ReactNode
  minLength?: number
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setReason('')
    setError('')
  }, [open])

  const submit = () => {
    if (reason.trim().length < minLength) {
      setError(`Alasan wajib diisi minimal ${minLength} karakter.`)
      return
    }
    const result = onConfirm(reason.trim())
    if (result.ok) {
      onClose()
    } else {
      setError(result.message ?? 'Tindakan tidak dapat diproses. Periksa kembali data demo.')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={submit}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="form-stack">
        {tone === 'danger' ? (
          <Callout tone="danger" icon={AlertTriangle} title="Tindakan sensitif">
            Alasan akan dicatat pada audit log demo. Perubahan hanya berlaku pada state lokal.
          </Callout>
        ) : null}
        {children}
        <TextAreaField
          label={label}
          name="reason"
          value={reason}
          onChange={(event) => {
            setReason(event.target.value)
            setError('')
          }}
          placeholder={placeholder}
          rows={4}
          required
          error={error || undefined}
          hint="Jangan menulis token, password, atau data sensitif pada alasan."
          autoFocus
        />
      </div>
    </Modal>
  )
}
