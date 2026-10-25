import { useEffect, useId, useState, type FormEvent } from 'react'
import { BriefcaseBusiness, Save } from 'lucide-react'
import type { Job, NewJobInput } from '../../types'
import { JOB_CATEGORIES } from '../../lib/status'
import { useApp } from '../../store/AppContext'
import { useToast } from '../ui/Toast'
import { Button, Callout, Modal, SelectField, TextAreaField, TextField } from '../ui'

const emptyForm = (deadlineHours: number): NewJobInput => ({
  title: '',
  category: JOB_CATEGORIES[0],
  description: '',
  instructions: '',
  rate: 75000,
  deadlineHours,
})

export function JobFormDialog({
  open,
  onClose,
  initial,
}: {
  open: boolean
  onClose: () => void
  initial?: Job | null
}) {
  const { state, createJob, updateJob } = useApp()
  const toast = useToast()
  const formId = useId()
  const [form, setForm] = useState<NewJobInput>(emptyForm(state.settings.deadlineHours))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        title: initial.title,
        category: initial.category,
        description: initial.description,
        instructions: initial.instructions,
        rate: initial.rate,
        deadlineHours: initial.deadlineHours,
      })
    } else {
      setForm(emptyForm(state.settings.deadlineHours))
    }
    setError('')
  }, [open, initial, state.settings.deadlineHours])

  const setField = <K extends keyof NewJobInput>(key: K, value: NewJobInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setError('')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = initial ? updateJob(initial.id, form) : createJob(form)
    if (result.ok) {
      onClose()
      toast.success(result.message, initial ? 'Pekerjaan diperbarui' : 'Pekerjaan dibuat')
    } else {
      setError(result.message)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit pekerjaan' : 'Buat pekerjaan baru'}
      description={
        initial
          ? `${initial.id} · tarif terkunci setelah pekerjaan diklaim.`
          : 'Pekerjaan baru langsung masuk marketplace simulasi sebagai tersedia.'
      }
      eyebrow="Manajemen pekerjaan"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" iconLeft={Save} type="submit" form={formId}>
            {initial ? 'Simpan perubahan' : 'Buat pekerjaan'}
          </Button>
        </>
      }
    >
      <form id={formId} className="form-stack" onSubmit={handleSubmit} noValidate>
        {error ? (
          <Callout tone="danger" title="Tidak dapat menyimpan">
            {error}
          </Callout>
        ) : null}
        {initial ? (
          <Callout tone="info" icon={BriefcaseBusiness}>
            Perubahan hanya diizinkan selama pekerjaan belum diklaim. Pekerjaan berjalan tidak diubah diam-diam oleh
            edit ini.
          </Callout>
        ) : null}

        <TextField
          label="Judul pekerjaan"
          name="job-title"
          value={form.title}
          onChange={(event) => setField('title', event.target.value)}
          placeholder="Contoh: Riset harga produk elektronik"
          required
          maxLength={110}
        />

        <div className="form-grid">
          <SelectField
            label="Kategori"
            name="job-category"
            value={form.category}
            onChange={(event) => setField('category', event.target.value)}
            options={JOB_CATEGORIES.map((category) => ({ value: category, label: category }))}
            required
          />
          <TextField
            label="Tarif"
            name="job-rate"
            value={form.rate ? Number(form.rate).toLocaleString('id-ID') : ''}
            onChange={(event) => setField('rate', Number(event.target.value.replace(/\D/g, '')))}
            placeholder="75000"
            prefix="Rp"
            inputMode="numeric"
            hint="Tarif dikunci ketika pekerjaan berhasil diklaim."
            required
          />
        </div>

        <TextField
          label="Estimasi deadline (jam)"
          name="job-deadline"
          type="number"
          value={form.deadlineHours}
          onChange={(event) => setField('deadlineHours', Number(event.target.value))}
          min={1}
          max={168}
          hint={`Default pengaturan saat ini: ${state.settings.deadlineHours} jam. Deadline mulai dihitung ketika seller mengklaim.`}
          required
        />

        <TextAreaField
          label="Deskripsi singkat"
          name="job-description"
          value={form.description}
          onChange={(event) => setField('description', event.target.value)}
          placeholder="Ringkasan pekerjaan yang akan tampil pada kartu marketplace…"
          rows={3}
          required
          maxLength={400}
        />

        <TextAreaField
          label="Instruksi pekerjaan"
          name="job-instructions"
          value={form.instructions}
          onChange={(event) => setField('instructions', event.target.value)}
          placeholder={'Tulis langkah kerja, format hasil, dan batasan yang perlu dipatuhi…'}
          rows={6}
          hint="Jangan meminta password, OTP, token akses, atau data sensitif dalam instruksi."
          required
        />
      </form>
    </Modal>
  )
}
