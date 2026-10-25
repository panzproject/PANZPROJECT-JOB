import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Download, FileArchive, FileImage, FileText, History, Paperclip } from 'lucide-react';
import { formatDateTime, formatFileSize, relativeTime } from '../../lib/format';
import { Badge, EmptyState, SimulationTag } from '../ui';
import { useToast } from '../ui/Toast';
const attachmentIcon = (name) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg')
        return FileImage;
    if (ext === 'zip')
        return FileArchive;
    return FileText;
};
export function AttachmentList({ attachments, emptyLabel = 'Belum ada lampiran.', }) {
    const toast = useToast();
    if (attachments.length === 0) {
        return _jsx("p", { className: "detail-empty", children: emptyLabel });
    }
    return (_jsx("div", { className: "attachment-list", children: attachments.map((file) => {
            const Icon = attachmentIcon(file.name);
            return (_jsxs("div", { className: "attachment-item", children: [_jsx("span", { className: "attachment-item__icon", "aria-hidden": "true", children: _jsx(Icon, { size: 16 }) }), _jsxs("div", { className: "attachment-item__copy", children: [_jsx("p", { children: file.name }), _jsxs("span", { children: [formatFileSize(file.size), " \u00B7 lampiran demo"] })] }), _jsx("button", { type: "button", className: "icon-btn icon-btn--sm", onClick: () => toast.info('File ini hanya metadata demo dan tidak dapat diunduh.', 'Lampiran simulasi'), "aria-label": `Lihat lampiran demo ${file.name}`, children: _jsx(Download, { size: 14 }) })] }, `${file.name}-${file.size}`));
        }) }));
}
export function SubmissionHistory({ submissions }) {
    if (submissions.length === 0) {
        return (_jsx(EmptyState, { icon: Paperclip, title: "Belum ada pengiriman", description: "Riwayat pengiriman dan catatan review akan muncul di sini setelah hasil dikirim." }));
    }
    const sorted = [...submissions].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    return (_jsx("div", { className: "submission-history", children: sorted.map((submission, index) => (_jsxs("article", { className: "submission-item", children: [_jsxs("div", { className: "submission-item__head", children: [_jsxs("div", { children: [_jsxs("p", { className: "submission-item__title", children: ["Pengiriman ", sorted.length - index, _jsx("span", { className: "mono submission-item__id", children: submission.id })] }), _jsx("p", { className: "submission-item__time", children: formatDateTime(submission.submittedAt) })] }), submission.outcome ? (_jsx(Badge, { tone: submission.outcome === 'APPROVED'
                                ? 'success'
                                : submission.outcome === 'REVISION'
                                    ? 'warning'
                                    : 'danger', children: submission.outcome === 'APPROVED'
                                ? 'Disetujui'
                                : submission.outcome === 'REVISION'
                                    ? 'Revisi'
                                    : 'Ditolak' })) : (_jsx(Badge, { tone: "warning", children: "Menunggu review" }))] }), _jsx("p", { className: "submission-item__note", children: submission.note }), submission.adminNote ? (_jsxs("div", { className: "submission-item__admin-note", children: [_jsx("strong", { children: "Catatan admin" }), _jsx("p", { children: submission.adminNote })] })) : null, _jsx(AttachmentList, { attachments: submission.attachments })] }, submission.id))) }));
}
export function JobHistoryList({ history }) {
    const sorted = [...history].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return (_jsx("div", { className: "timeline", children: sorted.map((entry, index) => (_jsxs("div", { className: "timeline__item", children: [_jsx("span", { className: `timeline__dot${index === 0 ? ' is-current' : ''}`, "aria-hidden": "true" }), _jsxs("div", { className: "timeline__content", children: [_jsxs("div", { className: "timeline__top", children: [_jsx("p", { className: "timeline__action", children: entry.action }), _jsx("span", { className: "timeline__time", children: relativeTime(entry.at) })] }), _jsxs("p", { className: "timeline__meta", children: [entry.by, " \u00B7 ", formatDateTime(entry.at)] }), entry.detail ? _jsx("p", { className: "timeline__detail", children: entry.detail }) : null] })] }, `${entry.at}-${entry.action}-${index}`))) }));
}
export function JobInstructions({ job }) {
    return (_jsx("div", { className: "detail-prose", children: job.instructions.split('\n').map((line, index) => (_jsx("p", { children: line }, `${line}-${index}`))) }));
}
export function RevisionBanner({ job }) {
    if (!job.reviewNote || (job.status !== 'REVISION' && job.status !== 'REJECTED'))
        return null;
    return (_jsxs("div", { className: `revision-banner${job.status === 'REJECTED' ? ' revision-banner--danger' : ''}`, children: [_jsxs("div", { className: "revision-banner__head", children: [_jsx(History, { size: 15, "aria-hidden": "true" }), _jsx("strong", { children: job.status === 'REVISION' ? `Permintaan revisi ke-${job.revisionCount}` : 'Catatan penolakan' }), _jsx(SimulationTag, { children: "Catatan demo" })] }), _jsx("p", { children: job.reviewNote })] }));
}
