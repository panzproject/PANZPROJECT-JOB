import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { formatDateTime } from '../../lib/format';
import { Button, Callout, Modal, TextAreaField, TextField } from '../ui';
import { useToast } from '../ui/Toast';
export function ExtendDeadlineDialog({ open, job, onClose, }) {
    const { extendJobDeadline } = useApp();
    const toast = useToast();
    const [hours, setHours] = useState('24');
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    useEffect(() => {
        if (!open)
            return;
        setHours('24');
        setReason('');
        setError('');
    }, [open]);
    const submit = (event) => {
        event.preventDefault();
        if (!job)
            return;
        const numericHours = Number(hours);
        if (!Number.isFinite(numericHours) || numericHours < 1 || numericHours > 72) {
            setError('Perpanjangan harus antara 1 dan 72 jam.');
            return;
        }
        if (reason.trim().length < 5) {
            setError('Alasan perpanjangan minimal 5 karakter.');
            return;
        }
        const result = extendJobDeadline(job.id, numericHours, reason.trim());
        if (result.ok) {
            toast.success(result.message, 'Deadline diperpanjang');
            onClose();
        }
        else {
            setError(result.message);
        }
    };
    return (_jsx(Modal, { open: open, onClose: onClose, title: "Perpanjang deadline", description: job ? `${job.id} · ${job.title}` : 'Pilih pekerjaan terlebih dahulu.', eyebrow: "Tindakan admin", size: "sm", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", onClick: onClose, children: "Batal" }), _jsx(Button, { variant: "primary", iconLeft: CalendarClock, type: "submit", form: "extend-deadline-form", children: "Perpanjang" })] }), children: _jsxs("form", { id: "extend-deadline-form", className: "form-stack", onSubmit: submit, noValidate: true, children: [_jsxs(Callout, { tone: "info", icon: CalendarClock, title: "Deadline saat ini", children: [job?.deadlineAt ? formatDateTime(job.deadlineAt) : 'Belum ada deadline aktif.', " \u00B7 perpanjangan maksimum 72 jam per tindakan pada data demo."] }), _jsx(TextField, { label: "Tambahan waktu (jam)", name: "hours", type: "number", min: 1, max: 72, value: hours, onChange: (event) => {
                        setHours(event.target.value);
                        setError('');
                    }, hint: "Antara 1 sampai 72 jam.", required: true }), _jsx(TextAreaField, { label: "Alasan perpanjangan", name: "reason", value: reason, onChange: (event) => {
                        setReason(event.target.value);
                        setError('');
                    }, error: error || undefined, placeholder: "Contoh: menunggu data referensi dari admin.", rows: 3, required: true })] }) }));
}
