import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { FileUp, Info, Paperclip, Plus, Send, Trash2 } from 'lucide-react';
import { formatFileSize } from '../../lib/format';
import { fileExtension } from '../../lib/status';
import { useApp } from '../../store/AppContext';
import { useToast } from '../ui/Toast';
import { Button, Callout, ConfirmDialog, Modal, SimulationTag, TextAreaField } from '../ui';
import { AttachmentList, JobInstructions, RevisionBanner } from '../jobs/JobBits';
import { DeadlineLabel } from '../jobs/Deadline';
export function SubmitWorkDialog({ job, open, onClose }) {
    const { state, submitJob } = useApp();
    const toast = useToast();
    const [note, setNote] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [error, setError] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);
    useEffect(() => {
        if (!open)
            return;
        setNote('');
        setAttachments([]);
        setError('');
        setConfirmOpen(false);
    }, [open, job.id]);
    const acceptedExtensions = state.settings.allowedFileTypes.map((type) => type.toLowerCase());
    const addFiles = (files) => {
        const messages = [];
        const additions = [];
        Array.from(files).forEach((file) => {
            const extension = fileExtension(file.name);
            const normalized = extension === 'JPEG' ? 'JPG' : extension;
            if (!acceptedExtensions.includes(normalized.toLowerCase())) {
                messages.push(`${file.name}: tipe file tidak diizinkan.`);
                return;
            }
            if (file.size > state.settings.uploadMaxMb * 1024 * 1024) {
                messages.push(`${file.name}: melebihi batas ${state.settings.uploadMaxMb} MB.`);
                return;
            }
            if (attachments.length + additions.length >= 5) {
                messages.push('Maksimum 5 lampiran per pengiriman pada demo ini.');
                return;
            }
            additions.push({
                name: file.name,
                size: file.size,
                type: file.type || 'application/octet-stream',
            });
        });
        if (additions.length > 0) {
            setAttachments((current) => {
                const merged = [...current];
                additions.forEach((addition) => {
                    if (!merged.some((item) => item.name === addition.name && item.size === addition.size)) {
                        merged.push(addition);
                    }
                });
                return merged;
            });
        }
        setError(messages.join(' '));
    };
    const handleInput = (event) => {
        if (event.target.files)
            addFiles(event.target.files);
        event.target.value = '';
    };
    const handleDrop = (event) => {
        event.preventDefault();
        if (event.dataTransfer.files)
            addFiles(event.dataTransfer.files);
    };
    const addDemoFile = () => {
        setAttachments((current) => {
            if (current.length >= 5) {
                setError('Maksimum 5 lampiran per pengiriman pada demo ini.');
                return current;
            }
            const base = `bukti-${job.id.toLowerCase()}`;
            const name = current.some((item) => item.name === `${base}.pdf`) ? `${base}-${current.length + 1}.pdf` : `${base}.pdf`;
            setError('');
            return [...current, { name, size: 734003, type: 'application/pdf' }];
        });
    };
    const removeAttachment = (name) => {
        setAttachments((current) => current.filter((item) => item.name !== name));
        setError('');
    };
    const requestSubmit = () => {
        if (attachments.length === 0) {
            setError('Tambahkan minimal satu lampiran demo sebelum mengirim hasil.');
            return;
        }
        setError('');
        setConfirmOpen(true);
    };
    const confirmSubmit = () => {
        const result = submitJob(job.id, note, attachments);
        if (result.ok) {
            setConfirmOpen(false);
            onClose();
            toast.success(result.message, 'Hasil terkirim');
        }
        else {
            setConfirmOpen(false);
            setError(result.message);
            toast.error(result.message);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx(Modal, { open: open, onClose: onClose, title: "Kirim hasil pekerjaan", description: `${job.id} · ${job.title}`, eyebrow: "Form pengiriman", size: "lg", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", onClick: onClose, children: "Batal" }), _jsx(Button, { variant: "primary", iconLeft: Send, onClick: requestSubmit, children: "Kirim hasil" })] }), children: _jsxs("div", { className: "submit-dialog", children: [_jsxs("div", { className: "detail-highlight", children: [_jsxs("div", { className: "detail-highlight__head", children: [_jsxs("div", { children: [_jsx("p", { className: "detail-highlight__label", children: "Instruksi pekerjaan" }), _jsx("h3", { children: job.title })] }), _jsx(SimulationTag, { children: "Lampiran lokal" })] }), _jsx(JobInstructions, { job: job }), _jsxs("div", { className: "detail-highlight__meta", children: [_jsx(BadgeDeadline, { job: job }), _jsxs("span", { className: "chip", children: [job.revisionCount, " revisi sebelumnya"] })] })] }), _jsx(RevisionBanner, { job: job }), _jsx(TextAreaField, { label: "Catatan seller", name: "seller-note", value: note, onChange: (event) => setNote(event.target.value), placeholder: "Tambahkan catatan singkat tentang hasil yang dikirim\u2026", hint: "Opsional. Jangan menyertakan password, token, atau data sensitif pada catatan maupun lampiran.", rows: 3 }), _jsxs("div", { children: [_jsx("span", { className: "field__label", children: "Lampiran hasil" }), _jsxs("p", { className: "field__hint", style: { marginTop: 4 }, children: [state.settings.allowedFileTypes.join(', '), " \u00B7 maksimum ", state.settings.uploadMaxMb, " MB per file \u00B7 maksimum 5 file."] }), _jsxs("label", { className: "upload-zone", onDragOver: (event) => event.preventDefault(), onDrop: handleDrop, children: [_jsx("input", { type: "file", className: "sr-only", multiple: true, accept: ".pdf,.png,.jpg,.jpeg,.zip", onChange: handleInput }), _jsx("span", { className: "upload-zone__icon", "aria-hidden": "true", children: _jsx(FileUp, { size: 19 }) }), _jsxs("span", { className: "upload-zone__text", children: [_jsx("strong", { children: "Pilih lampiran atau tarik file ke sini" }), _jsx("span", { children: "File hanya dicatat sebagai metadata demo dan tidak diunggah." })] })] }), _jsx("div", { className: "upload-zone__actions", children: _jsx(Button, { variant: "ghost", size: "sm", iconLeft: Plus, onClick: addDemoFile, children: "Gunakan lampiran demo" }) }), error ? (_jsx("p", { className: "field__error", role: "alert", children: error })) : null] }), attachments.length > 0 ? (_jsxs("div", { className: "upload-list", children: [_jsxs("div", { className: "upload-list__head", children: [_jsxs("span", { className: "icon-text", children: [_jsx(Paperclip, { size: 14, "aria-hidden": "true" }), attachments.length, " lampiran dipilih"] }), _jsx("span", { children: formatFileSize(attachments.reduce((acc, file) => acc + file.size, 0)) })] }), attachments.map((file) => (_jsxs("div", { className: "upload-list__item", children: [_jsx("span", { className: "upload-list__name", children: file.name }), _jsx("span", { className: "upload-list__size", children: formatFileSize(file.size) }), _jsx("button", { type: "button", className: "icon-btn icon-btn--sm icon-btn--danger", onClick: () => removeAttachment(file.name), "aria-label": `Hapus lampiran ${file.name}`, children: _jsx(Trash2, { size: 13 }) })] }, file.name)))] })) : null, job.submissions.length > 0 ? (_jsxs("div", { className: "submit-dialog__previous", children: [_jsxs(Callout, { tone: "info", icon: Info, title: "Pengiriman sebelumnya", children: [job.submissions.length, " pengiriman tersimpan pada data demo. Menambahkan pengiriman baru tidak menghapus riwayat sebelumnya."] }), _jsx(AttachmentList, { attachments: job.attachments, emptyLabel: "Belum ada lampiran sebelumnya." })] })) : null] }) }), _jsxs(ConfirmDialog, { open: confirmOpen, onClose: () => setConfirmOpen(false), onConfirm: confirmSubmit, title: "Kirim hasil pekerjaan?", description: `${attachments.length} lampiran akan dicatat untuk ${job.id}. Status demo akan berubah menjadi menunggu review.`, confirmLabel: "Ya, kirim hasil", children: [_jsxs("div", { className: "confirm-summary", children: [_jsxs("div", { children: [_jsx("span", { children: "Pekerjaan" }), _jsx("strong", { children: job.title })] }), _jsxs("div", { children: [_jsx("span", { children: "Lampiran" }), _jsxs("strong", { children: [attachments.length, " file (metadata demo)"] })] }), _jsxs("div", { children: [_jsx("span", { children: "Deadline" }), _jsx(DeadlineLabel, { deadlineAt: job.deadlineAt })] })] }), _jsx(Callout, { tone: "warning", title: "Simulasi pengiriman", children: "Tidak ada file yang dikirim ke server. Konfirmasi ini hanya mengubah state demo pada peramban." })] })] }));
}
function BadgeDeadline({ job }) {
    return _jsx(DeadlineLabel, { deadlineAt: job.deadlineAt });
}
