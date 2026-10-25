import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { BellRing, BriefcaseBusiness, Database, MailCheck, RotateCcw, Save, ShieldCheck, UploadCloud, } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { ALLOWED_UPLOAD_TYPES } from '../../lib/status';
import { Badge, Button, Callout, CheckboxField, PageHeader, Panel, SelectField, SimulationTag, SwitchField, TextField, } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
export default function Settings() {
    const { state, updateSettings } = useApp();
    const toast = useToast();
    const [form, setForm] = useState(state.settings);
    const [formError, setFormError] = useState('');
    useEffect(() => {
        setForm(state.settings);
    }, [state.settings]);
    const dirty = JSON.stringify(form) !== JSON.stringify(state.settings);
    const patch = (partial) => {
        setForm((current) => ({ ...current, ...partial }));
        setFormError('');
    };
    const toggleFileType = (type, checked) => {
        patch({
            allowedFileTypes: checked
                ? [...form.allowedFileTypes, type]
                : form.allowedFileTypes.filter((item) => item !== type),
        });
    };
    const submit = (event) => {
        event.preventDefault();
        if (!dirty)
            return;
        if (form.allowedFileTypes.length === 0) {
            setFormError('Pilih minimal satu tipe file yang diizinkan.');
            return;
        }
        const result = updateSettings(form);
        if (result.ok) {
            toast.success(result.message, 'Pengaturan disimpan');
            setFormError('');
        }
        else {
            setFormError(result.message);
            toast.error(result.message);
        }
    };
    const reset = () => {
        setForm(state.settings);
        setFormError('');
    };
    return (_jsxs("div", { className: "page page-enter", children: [_jsx(PageHeader, { eyebrow: "Panel admin", title: "Pengaturan", description: "Konfigurasi operasional, keamanan, unggahan, dan integrasi pada prototype. Perubahan tercatat pada audit log demo.", actions: _jsx(SimulationTag, { children: "Konfigurasi lokal" }) }), _jsx(Callout, { tone: "warning", icon: ShieldCheck, title: "Pengaturan prototipe", children: "Nilai di halaman ini disimpan pada state lokal dan tidak mengubah sistem produksi, mengaktifkan MFA nyata, atau memulai sinkronisasi email. Pekerjaan yang sudah berjalan tidak diubah diam-diam." }), _jsxs("form", { id: "settings-form", className: "settings-form", onSubmit: submit, noValidate: true, children: [_jsxs("div", { className: "settings-grid", children: [_jsxs("div", { className: "settings-column", children: [_jsxs(Panel, { title: "Operasional pekerjaan", description: "Default untuk pekerjaan baru dan permintaan revisi.", action: _jsx(BriefcaseBusiness, { size: 17, className: "panel__icon", "aria-hidden": "true" }), children: [_jsxs("div", { className: "settings-fields", children: [_jsx(TextField, { label: "Deadline default pekerjaan (jam)", name: "deadlineHours", type: "number", min: 1, max: 168, value: form.deadlineHours, onChange: (event) => patch({ deadlineHours: Number(event.target.value) }), hint: "Berlaku untuk pekerjaan baru. Rentang 1\u2013168 jam.", required: true }), _jsx(TextField, { label: "Durasi revisi (jam)", name: "revisionHours", type: "number", min: 1, max: 72, value: form.revisionHours, onChange: (event) => patch({ revisionHours: Number(event.target.value) }), hint: "Diberikan setelah admin meminta revisi. Rentang 1\u201372 jam.", required: true }), _jsx(SelectField, { label: "Maksimum revisi", value: String(form.maxRevisions), onChange: (event) => patch({ maxRevisions: Number(event.target.value) }), hint: "Batas maksimum permintaan revisi per pekerjaan.", options: [
                                                            { value: '1', label: '1 kali' },
                                                            { value: '2', label: '2 kali' },
                                                            { value: '3', label: '3 kali' },
                                                        ] })] }), _jsx(Callout, { tone: "info", title: "Deadline yang berjalan tidak berubah", children: "Perubahan default hanya berlaku pada pekerjaan baru. Gunakan perpanjangan deadline pada pekerjaan aktif agar perubahan tercatat eksplisit." })] }), _jsxs(Panel, { title: "Notifikasi seller", description: "Preferensi demo untuk kanal notifikasi.", action: _jsx(BellRing, { size: 17, className: "panel__icon", "aria-hidden": "true" }), children: [_jsxs("div", { className: "settings-switches", children: [_jsx(SwitchField, { label: "Pekerjaan baru", description: "Tandai preferensi notifikasi saat pekerjaan baru tersedia.", checked: form.notifyNewJobs, onChange: (checked) => patch({ notifyNewJobs: checked }) }), _jsx(SwitchField, { label: "Keputusan review", description: "Tandai preferensi notifikasi saat hasil disetujui, direvisi, atau ditolak.", checked: form.notifyReview, onChange: (checked) => patch({ notifyReview: checked }) }), _jsx(SwitchField, { label: "Pengingat deadline", description: "Tandai preferensi pengingat sebelum deadline pekerjaan.", checked: form.notifyDeadline, onChange: (checked) => patch({ notifyDeadline: checked }) })] }), _jsx("p", { className: "detail-footnote", children: "Preferensi ini disimpan sebagai konfigurasi demo. Pengiriman email atau push notification nyata belum diimplementasikan." })] }), _jsxs(Panel, { title: "Unggahan berkas", description: "Batas dan tipe lampiran hasil pekerjaan.", action: _jsx(UploadCloud, { size: 17, className: "panel__icon", "aria-hidden": "true" }), children: [_jsx("div", { className: "settings-fields", children: _jsx(TextField, { label: "Ukuran maksimum berkas (MB)", name: "uploadMaxMb", type: "number", min: 1, max: 50, value: form.uploadMaxMb, onChange: (event) => patch({ uploadMaxMb: Number(event.target.value) }), hint: "Rentang 1\u201350 MB pada simulasi.", required: true }) }), _jsxs("div", { className: "settings-checks", children: [_jsx("span", { className: "settings-checks__label", children: "Tipe file diizinkan" }), ALLOWED_UPLOAD_TYPES.map((type) => (_jsx(CheckboxField, { label: `${type} (${type === 'JPG' ? 'gambar' : type === 'PNG' ? 'gambar' : type === 'ZIP' ? 'arsip' : 'dokumen'})`, checked: form.allowedFileTypes.includes(type), onChange: (checked) => toggleFileType(type, checked) }, type)))] }), _jsx("p", { className: "detail-footnote", children: "Prototype hanya menampilkan metadata lampiran \u2014 tidak ada berkas yang benar-benar diunggah." })] })] }), _jsxs("div", { className: "settings-column", children: [_jsxs(Panel, { title: "Keamanan admin", description: "Kebijakan sesi dan penanda MFA.", action: _jsx(ShieldCheck, { size: 17, className: "panel__icon", "aria-hidden": "true" }), children: [_jsx("div", { className: "settings-switches", children: _jsx(SwitchField, { label: "MFA admin (penanda demo)", description: "Menandai kebijakan MFA aktif pada konfigurasi. Tidak ada verifikasi faktor kedua nyata.", checked: form.adminMfa, onChange: (checked) => patch({ adminMfa: checked }) }) }), _jsx("div", { className: "settings-fields", children: _jsx(SelectField, { label: "Batas waktu sesi (menit)", value: String(form.sessionTimeoutMinutes), onChange: (event) => patch({ sessionTimeoutMinutes: Number(event.target.value) }), options: [
                                                        { value: '30', label: '30 menit' },
                                                        { value: '60', label: '60 menit' },
                                                        { value: '120', label: '120 menit' },
                                                        { value: '240', label: '240 menit' },
                                                    ], hint: "Preferensi kebijakan; tidak mengakhiri sesi prototype." }) }), _jsx(Callout, { tone: "warning", title: "MFA belum diimplementasikan", children: "Mengaktifkan penanda ini tidak mengubah alur login. Autentikasi nyata berada di luar cakupan prototype." })] }), _jsxs(Panel, { title: "Retensi dan cadangan", description: "Kebijakan penyimpanan data demo.", action: _jsx(Database, { size: 17, className: "panel__icon", "aria-hidden": "true" }), children: [_jsxs("div", { className: "settings-fields", children: [_jsx(TextField, { label: "Retensi data (hari)", name: "retentionDays", type: "number", min: 30, max: 3650, value: form.retentionDays, onChange: (event) => patch({ retentionDays: Number(event.target.value) }), hint: "Rentang 30\u20133.650 hari.", required: true }), _jsx(SelectField, { label: "Frekuensi cadangan", value: form.backupFrequency, onChange: (event) => patch({ backupFrequency: event.target.value }), options: [
                                                            { value: 'Harian', label: 'Harian' },
                                                            { value: 'Mingguan', label: 'Mingguan' },
                                                            { value: 'Bulanan', label: 'Bulanan' },
                                                        ], hint: "Hanya penanda kebijakan; tidak ada pencadangan nyata." })] }), _jsxs("div", { className: "settings-policy", children: [_jsx("span", { children: "Retensi aktif" }), _jsxs(Badge, { tone: "info", children: [form.retentionDays, " hari (demo)"] })] })] }), _jsxs(Panel, { title: "Integrasi email", description: "Kebijakan sinkronisasi pada prototype.", action: _jsx(MailCheck, { size: 17, className: "panel__icon", "aria-hidden": "true" }), children: [_jsx("div", { className: "settings-switches", children: _jsx(SwitchField, { label: "Sinkronisasi email aktif", description: "Menandai kebijakan bahwa integrasi email diizinkan pada konfigurasi demo.", checked: form.emailSyncEnabled, onChange: (checked) => patch({ emailSyncEnabled: checked }) }) }), _jsxs("div", { className: "settings-policy", children: [_jsx("span", { children: "Koneksi terhubung" }), _jsx(Badge, { tone: "success", children: state.connections.filter((item) => item.status === 'CONNECTED').length })] }), _jsx("p", { className: "detail-footnote", children: "Toggle ini tidak memulai OAuth, sinkronisasi, atau pembacaan email. Kelola metadata koneksi di halaman Integrasi Email." })] }), _jsx(Panel, { title: "Kebijakan aktif", description: "Ringkasan konfigurasi yang akan disimpan.", children: _jsxs("div", { className: "settings-policy-list", children: [_jsxs("div", { children: [_jsx("span", { children: "Deadline baru" }), _jsxs("strong", { children: [form.deadlineHours, " jam"] })] }), _jsxs("div", { children: [_jsx("span", { children: "Deadline revisi" }), _jsxs("strong", { children: [form.revisionHours, " jam"] })] }), _jsxs("div", { children: [_jsx("span", { children: "Maksimum revisi" }), _jsxs("strong", { children: [form.maxRevisions, " kali"] })] }), _jsxs("div", { children: [_jsx("span", { children: "Ukuran upload" }), _jsxs("strong", { children: [form.uploadMaxMb, " MB"] })] }), _jsxs("div", { children: [_jsx("span", { children: "Batas sesi" }), _jsxs("strong", { children: [form.sessionTimeoutMinutes, " menit"] })] }), _jsxs("div", { children: [_jsx("span", { children: "Pencadangan" }), _jsx("strong", { children: form.backupFrequency })] })] }) })] })] }), formError ? (_jsx(Callout, { tone: "danger", title: "Pengaturan belum disimpan", children: formError })) : null, _jsxs("div", { className: "settings-savebar", children: [_jsxs("div", { className: "settings-savebar__status", children: [_jsx("span", { children: dirty ? 'Ada perubahan yang belum disimpan.' : 'Semua perubahan sudah tersimpan.' }), dirty ? _jsx(Badge, { tone: "warning", children: "Belum disimpan" }) : _jsx(Badge, { tone: "success", children: "Tersimpan" })] }), _jsxs("div", { className: "settings-savebar__actions", children: [_jsx(Button, { variant: "ghost", iconLeft: RotateCcw, onClick: reset, disabled: !dirty, type: "button", children: "Batalkan perubahan" }), _jsx(Button, { variant: "primary", iconLeft: Save, type: "submit", disabled: !dirty, children: "Simpan pengaturan" })] })] })] })] }));
}
