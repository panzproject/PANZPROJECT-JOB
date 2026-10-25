import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useState } from 'react';
import { BriefcaseBusiness, Save } from 'lucide-react';
import { JOB_CATEGORIES } from '../../lib/status';
import { useApp } from '../../store/AppContext';
import { useToast } from '../ui/Toast';
import { Button, Callout, Modal, SelectField, TextAreaField, TextField } from '../ui';
const emptyForm = (deadlineHours) => ({
    title: '',
    category: JOB_CATEGORIES[0],
    description: '',
    instructions: '',
    rate: 75000,
    deadlineHours,
});
export function JobFormDialog({ open, onClose, initial, }) {
    const { state, createJob, updateJob } = useApp();
    const toast = useToast();
    const formId = useId();
    const [form, setForm] = useState(emptyForm(state.settings.deadlineHours));
    const [error, setError] = useState('');
    useEffect(() => {
        if (!open)
            return;
        if (initial) {
            setForm({
                title: initial.title,
                category: initial.category,
                description: initial.description,
                instructions: initial.instructions,
                rate: initial.rate,
                deadlineHours: initial.deadlineHours,
            });
        }
        else {
            setForm(emptyForm(state.settings.deadlineHours));
        }
        setError('');
    }, [open, initial, state.settings.deadlineHours]);
    const setField = (key, value) => {
        setForm((current) => ({ ...current, [key]: value }));
        setError('');
    };
    const handleSubmit = (event) => {
        event.preventDefault();
        const result = initial ? updateJob(initial.id, form) : createJob(form);
        if (result.ok) {
            onClose();
            toast.success(result.message, initial ? 'Pekerjaan diperbarui' : 'Pekerjaan dibuat');
        }
        else {
            setError(result.message);
        }
    };
    return (_jsx(Modal, { open: open, onClose: onClose, title: initial ? 'Edit pekerjaan' : 'Buat pekerjaan baru', description: initial
            ? `${initial.id} · tarif terkunci setelah pekerjaan diklaim.`
            : 'Pekerjaan baru langsung masuk marketplace simulasi sebagai tersedia.', eyebrow: "Manajemen pekerjaan", size: "lg", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", onClick: onClose, children: "Batal" }), _jsx(Button, { variant: "primary", iconLeft: Save, type: "submit", form: formId, children: initial ? 'Simpan perubahan' : 'Buat pekerjaan' })] }), children: _jsxs("form", { id: formId, className: "form-stack", onSubmit: handleSubmit, noValidate: true, children: [error ? (_jsx(Callout, { tone: "danger", title: "Tidak dapat menyimpan", children: error })) : null, initial ? (_jsx(Callout, { tone: "info", icon: BriefcaseBusiness, children: "Perubahan hanya diizinkan selama pekerjaan belum diklaim. Pekerjaan berjalan tidak diubah diam-diam oleh edit ini." })) : null, _jsx(TextField, { label: "Judul pekerjaan", name: "job-title", value: form.title, onChange: (event) => setField('title', event.target.value), placeholder: "Contoh: Riset harga produk elektronik", required: true, maxLength: 110 }), _jsxs("div", { className: "form-grid", children: [_jsx(SelectField, { label: "Kategori", name: "job-category", value: form.category, onChange: (event) => setField('category', event.target.value), options: JOB_CATEGORIES.map((category) => ({ value: category, label: category })), required: true }), _jsx(TextField, { label: "Tarif", name: "job-rate", value: form.rate ? Number(form.rate).toLocaleString('id-ID') : '', onChange: (event) => setField('rate', Number(event.target.value.replace(/\D/g, ''))), placeholder: "75000", prefix: "Rp", inputMode: "numeric", hint: "Tarif dikunci ketika pekerjaan berhasil diklaim.", required: true })] }), _jsx(TextField, { label: "Estimasi deadline (jam)", name: "job-deadline", type: "number", value: form.deadlineHours, onChange: (event) => setField('deadlineHours', Number(event.target.value)), min: 1, max: 168, hint: `Default pengaturan saat ini: ${state.settings.deadlineHours} jam. Deadline mulai dihitung ketika seller mengklaim.`, required: true }), _jsx(TextAreaField, { label: "Deskripsi singkat", name: "job-description", value: form.description, onChange: (event) => setField('description', event.target.value), placeholder: "Ringkasan pekerjaan yang akan tampil pada kartu marketplace\u2026", rows: 3, required: true, maxLength: 400 }), _jsx(TextAreaField, { label: "Instruksi pekerjaan", name: "job-instructions", value: form.instructions, onChange: (event) => setField('instructions', event.target.value), placeholder: 'Tulis langkah kerja, format hasil, dan batasan yang perlu dipatuhi…', rows: 6, hint: "Jangan meminta password, OTP, token akses, atau data sensitif dalam instruksi.", required: true })] }) }));
}
