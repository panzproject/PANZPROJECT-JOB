import { useEffect, useState, type FormEvent } from 'react'
import {
  BellRing,
  BriefcaseBusiness,
  Database,
  MailCheck,
  RotateCcw,
  Save,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react'
import { useApp } from '../../store/AppContext'
import type { Settings as AppSettings } from '../../types'
import { ALLOWED_UPLOAD_TYPES } from '../../lib/status'
import {
  Badge,
  Button,
  Callout,
  CheckboxField,
  PageHeader,
  Panel,
  SelectField,
  SimulationTag,
  SwitchField,
  TextField,
} from '../../components/ui'
import { useToast } from '../../components/ui/Toast'

export default function Settings() {
  const { state, updateSettings } = useApp()
  const toast = useToast()
  const [form, setForm] = useState<AppSettings>(state.settings)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    setForm(state.settings)
  }, [state.settings])

  const dirty = JSON.stringify(form) !== JSON.stringify(state.settings)

  const patch = (partial: Partial<AppSettings>) => {
    setForm((current) => ({ ...current, ...partial }))
    setFormError('')
  }

  const toggleFileType = (type: string, checked: boolean) => {
    patch({
      allowedFileTypes: checked
        ? [...form.allowedFileTypes, type]
        : form.allowedFileTypes.filter((item) => item !== type),
    })
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!dirty) return
    if (form.allowedFileTypes.length === 0) {
      setFormError('Pilih minimal satu tipe file yang diizinkan.')
      return
    }
    const result = updateSettings(form)
    if (result.ok) {
      toast.success(result.message, 'Pengaturan disimpan')
      setFormError('')
    } else {
      setFormError(result.message)
      toast.error(result.message)
    }
  }

  const reset = () => {
    setForm(state.settings)
    setFormError('')
  }

  return (
    <div className="page page-enter">
      <PageHeader
        eyebrow="Panel admin"
        title="Pengaturan"
        description="Konfigurasi operasional, keamanan, unggahan, dan integrasi pada prototype. Perubahan tercatat pada audit log demo."
        actions={<SimulationTag>Konfigurasi lokal</SimulationTag>}
      />

      <Callout tone="warning" icon={ShieldCheck} title="Pengaturan prototipe">
        Nilai di halaman ini disimpan pada state lokal dan tidak mengubah sistem produksi, mengaktifkan MFA nyata,
        atau memulai sinkronisasi email. Pekerjaan yang sudah berjalan tidak diubah diam-diam.
      </Callout>

      <form id="settings-form" className="settings-form" onSubmit={submit} noValidate>
        <div className="settings-grid">
          <div className="settings-column">
            <Panel
              title="Operasional pekerjaan"
              description="Default untuk pekerjaan baru dan permintaan revisi."
              action={<BriefcaseBusiness size={17} className="panel__icon" aria-hidden="true" />}
            >
              <div className="settings-fields">
                <TextField
                  label="Deadline default pekerjaan (jam)"
                  name="deadlineHours"
                  type="number"
                  min={1}
                  max={168}
                  value={form.deadlineHours}
                  onChange={(event) => patch({ deadlineHours: Number(event.target.value) })}
                  hint="Berlaku untuk pekerjaan baru. Rentang 1–168 jam."
                  required
                />
                <TextField
                  label="Durasi revisi (jam)"
                  name="revisionHours"
                  type="number"
                  min={1}
                  max={72}
                  value={form.revisionHours}
                  onChange={(event) => patch({ revisionHours: Number(event.target.value) })}
                  hint="Diberikan setelah admin meminta revisi. Rentang 1–72 jam."
                  required
                />
                <SelectField
                  label="Maksimum revisi"
                  value={String(form.maxRevisions)}
                  onChange={(event) => patch({ maxRevisions: Number(event.target.value) })}
                  hint="Batas maksimum permintaan revisi per pekerjaan."
                  options={[
                    { value: '1', label: '1 kali' },
                    { value: '2', label: '2 kali' },
                    { value: '3', label: '3 kali' },
                  ]}
                />
              </div>
              <Callout tone="info" title="Deadline yang berjalan tidak berubah">
                Perubahan default hanya berlaku pada pekerjaan baru. Gunakan perpanjangan deadline pada pekerjaan
                aktif agar perubahan tercatat eksplisit.
              </Callout>
            </Panel>

            <Panel
              title="Notifikasi seller"
              description="Preferensi demo untuk kanal notifikasi."
              action={<BellRing size={17} className="panel__icon" aria-hidden="true" />}
            >
              <div className="settings-switches">
                <SwitchField
                  label="Pekerjaan baru"
                  description="Tandai preferensi notifikasi saat pekerjaan baru tersedia."
                  checked={form.notifyNewJobs}
                  onChange={(checked) => patch({ notifyNewJobs: checked })}
                />
                <SwitchField
                  label="Keputusan review"
                  description="Tandai preferensi notifikasi saat hasil disetujui, direvisi, atau ditolak."
                  checked={form.notifyReview}
                  onChange={(checked) => patch({ notifyReview: checked })}
                />
                <SwitchField
                  label="Pengingat deadline"
                  description="Tandai preferensi pengingat sebelum deadline pekerjaan."
                  checked={form.notifyDeadline}
                  onChange={(checked) => patch({ notifyDeadline: checked })}
                />
              </div>
              <p className="detail-footnote">
                Preferensi ini disimpan sebagai konfigurasi demo. Pengiriman email atau push notification nyata
                belum diimplementasikan.
              </p>
            </Panel>

            <Panel
              title="Unggahan berkas"
              description="Batas dan tipe lampiran hasil pekerjaan."
              action={<UploadCloud size={17} className="panel__icon" aria-hidden="true" />}
            >
              <div className="settings-fields">
                <TextField
                  label="Ukuran maksimum berkas (MB)"
                  name="uploadMaxMb"
                  type="number"
                  min={1}
                  max={50}
                  value={form.uploadMaxMb}
                  onChange={(event) => patch({ uploadMaxMb: Number(event.target.value) })}
                  hint="Rentang 1–50 MB pada simulasi."
                  required
                />
              </div>
              <div className="settings-checks">
                <span className="settings-checks__label">Tipe file diizinkan</span>
                {ALLOWED_UPLOAD_TYPES.map((type) => (
                  <CheckboxField
                    key={type}
                    label={`${type} (${type === 'JPG' ? 'gambar' : type === 'PNG' ? 'gambar' : type === 'ZIP' ? 'arsip' : 'dokumen'})`}
                    checked={form.allowedFileTypes.includes(type)}
                    onChange={(checked) => toggleFileType(type, checked)}
                  />
                ))}
              </div>
              <p className="detail-footnote">
                Prototype hanya menampilkan metadata lampiran — tidak ada berkas yang benar-benar diunggah.
              </p>
            </Panel>
          </div>

          <div className="settings-column">
            <Panel
              title="Keamanan admin"
              description="Kebijakan sesi dan penanda MFA."
              action={<ShieldCheck size={17} className="panel__icon" aria-hidden="true" />}
            >
              <div className="settings-switches">
                <SwitchField
                  label="MFA admin (penanda demo)"
                  description="Menandai kebijakan MFA aktif pada konfigurasi. Tidak ada verifikasi faktor kedua nyata."
                  checked={form.adminMfa}
                  onChange={(checked) => patch({ adminMfa: checked })}
                />
              </div>
              <div className="settings-fields">
                <SelectField
                  label="Batas waktu sesi (menit)"
                  value={String(form.sessionTimeoutMinutes)}
                  onChange={(event) => patch({ sessionTimeoutMinutes: Number(event.target.value) })}
                  options={[
                    { value: '30', label: '30 menit' },
                    { value: '60', label: '60 menit' },
                    { value: '120', label: '120 menit' },
                    { value: '240', label: '240 menit' },
                  ]}
                  hint="Preferensi kebijakan; tidak mengakhiri sesi prototype."
                />
              </div>
              <Callout tone="warning" title="MFA belum diimplementasikan">
                Mengaktifkan penanda ini tidak mengubah alur login. Autentikasi nyata berada di luar cakupan
                prototype.
              </Callout>
            </Panel>

            <Panel
              title="Retensi dan cadangan"
              description="Kebijakan penyimpanan data demo."
              action={<Database size={17} className="panel__icon" aria-hidden="true" />}
            >
              <div className="settings-fields">
                <TextField
                  label="Retensi data (hari)"
                  name="retentionDays"
                  type="number"
                  min={30}
                  max={3650}
                  value={form.retentionDays}
                  onChange={(event) => patch({ retentionDays: Number(event.target.value) })}
                  hint="Rentang 30–3.650 hari."
                  required
                />
                <SelectField
                  label="Frekuensi cadangan"
                  value={form.backupFrequency}
                  onChange={(event) => patch({ backupFrequency: event.target.value })}
                  options={[
                    { value: 'Harian', label: 'Harian' },
                    { value: 'Mingguan', label: 'Mingguan' },
                    { value: 'Bulanan', label: 'Bulanan' },
                  ]}
                  hint="Hanya penanda kebijakan; tidak ada pencadangan nyata."
                />
              </div>
              <div className="settings-policy">
                <span>Retensi aktif</span>
                <Badge tone="info">{form.retentionDays} hari (demo)</Badge>
              </div>
            </Panel>

            <Panel
              title="Integrasi email"
              description="Kebijakan sinkronisasi pada prototype."
              action={<MailCheck size={17} className="panel__icon" aria-hidden="true" />}
            >
              <div className="settings-switches">
                <SwitchField
                  label="Sinkronisasi email aktif"
                  description="Menandai kebijakan bahwa integrasi email diizinkan pada konfigurasi demo."
                  checked={form.emailSyncEnabled}
                  onChange={(checked) => patch({ emailSyncEnabled: checked })}
                />
              </div>
              <div className="settings-policy">
                <span>Koneksi terhubung</span>
                <Badge tone="success">{state.connections.filter((item) => item.status === 'CONNECTED').length}</Badge>
              </div>
              <p className="detail-footnote">
                Toggle ini tidak memulai OAuth, sinkronisasi, atau pembacaan email. Kelola metadata koneksi di halaman
                Integrasi Email.
              </p>
            </Panel>

            <Panel title="Kebijakan aktif" description="Ringkasan konfigurasi yang akan disimpan.">
              <div className="settings-policy-list">
                <div><span>Deadline baru</span><strong>{form.deadlineHours} jam</strong></div>
                <div><span>Deadline revisi</span><strong>{form.revisionHours} jam</strong></div>
                <div><span>Maksimum revisi</span><strong>{form.maxRevisions} kali</strong></div>
                <div><span>Ukuran upload</span><strong>{form.uploadMaxMb} MB</strong></div>
                <div><span>Batas sesi</span><strong>{form.sessionTimeoutMinutes} menit</strong></div>
                <div><span>Pencadangan</span><strong>{form.backupFrequency}</strong></div>
              </div>
            </Panel>
          </div>
        </div>

        {formError ? (
          <Callout tone="danger" title="Pengaturan belum disimpan">
            {formError}
          </Callout>
        ) : null}

        <div className="settings-savebar">
          <div className="settings-savebar__status">
            <span>{dirty ? 'Ada perubahan yang belum disimpan.' : 'Semua perubahan sudah tersimpan.'}</span>
            {dirty ? <Badge tone="warning">Belum disimpan</Badge> : <Badge tone="success">Tersimpan</Badge>}
          </div>
          <div className="settings-savebar__actions">
            <Button variant="ghost" iconLeft={RotateCcw} onClick={reset} disabled={!dirty} type="button">
              Batalkan perubahan
            </Button>
            <Button variant="primary" iconLeft={Save} type="submit" disabled={!dirty}>
              Simpan pengaturan
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
