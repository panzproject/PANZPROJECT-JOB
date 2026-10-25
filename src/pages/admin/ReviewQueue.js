import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CalendarClock, CheckCircle2, ChevronRight, ClipboardCheck, Clock3, RefreshCw, Search, Send, ShieldCheck, XCircle, } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { formatDateTime, formatIDR, relativeTime } from '../../lib/format';
import { getJobStatus } from '../../lib/status';
import { DeadlineLabel } from '../../components/jobs/Deadline';
import { AttachmentList, JobInstructions, JobHistoryList, SubmissionHistory } from '../../components/jobs/JobBits';
import { ExtendDeadlineDialog } from '../../components/admin/ExtendDeadlineDialog';
import { Badge, Button, Callout, ConfirmDialog, EmptyState, PageHeader, Panel, SearchField, SimulationTag, StatusBadge, Tabs, TextAreaField, } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
const priority = {
    EXPIRY_REVIEW: 0,
    SUBMITTED: 1,
    UNDER_REVIEW: 2,
};
const decisionCopy = {
    APPROVE: {
        label: 'Setujui hasil',
        confirm: 'Setujui hasil',
        tone: 'primary',
        description: 'Pekerjaan selesai dan komisi dicatat satu kali.',
    },
    REVISION: {
        label: 'Minta revisi',
        confirm: 'Minta revisi',
        tone: 'primary',
        description: 'Seller dapat mengirim ulang hasil sebelum batas revisi.',
    },
    REJECT: {
        label: 'Tolak hasil',
        confirm: 'Tolak hasil',
        tone: 'danger',
        description: 'Pekerjaan ditutup sebagai ditolak tanpa komisi.',
    },
    EXPIRE: {
        label: 'Nyatakan kedaluwarsa',
        confirm: 'Nyatakan kedaluwarsa',
        tone: 'danger',
        description: 'Pekerjaan ditutup sebagai kedaluwarsa setelah review.',
    },
};
export default function ReviewQueue() {
    const { state, reviewJob } = useApp();
    const toast = useToast();
    const [searchParams] = useSearchParams();
    const [tab, setTab] = useState('ALL');
    const [query, setQuery] = useState('');
    const [selectedId, setSelectedId] = useState(searchParams.get('job'));
    const [decision, setDecision] = useState('APPROVE');
    const [reason, setReason] = useState('');
    const [reasonError, setReasonError] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [extendOpen, setExtendOpen] = useState(false);
    const queue = useMemo(() => state.jobs
        .filter((job) => ['SUBMITTED', 'UNDER_REVIEW', 'EXPIRY_REVIEW'].includes(job.status))
        .sort((a, b) => {
        const priorityDiff = (priority[a.status] ?? 9) - (priority[b.status] ?? 9);
        if (priorityDiff !== 0)
            return priorityDiff;
        return new Date(a.submittedAt ?? a.createdAt).getTime() - new Date(b.submittedAt ?? b.createdAt).getTime();
    }), [state.jobs]);
    const tabFiltered = tab === 'ALL' ? queue : queue.filter((job) => job.status === tab);
    const filteredQueue = tabFiltered.filter((job) => {
        if (!query.trim())
            return true;
        const needle = query.toLowerCase();
        const seller = state.sellers.find((item) => item.id === job.sellerId)?.name ?? '';
        return (job.id.toLowerCase().includes(needle) ||
            job.title.toLowerCase().includes(needle) ||
            seller.toLowerCase().includes(needle));
    });
    const selected = state.jobs.find((job) => job.id === selectedId) ?? null;
    const selectedSeller = state.sellers.find((seller) => seller.id === selected?.sellerId);
    const latestSubmission = selected?.submissions[selected.submissions.length - 1];
    const revisionLimitReached = Boolean(selected && selected.revisionCount >= state.settings.maxRevisions);
    const isExpiryReview = selected?.status === 'EXPIRY_REVIEW';
    useEffect(() => {
        if (filteredQueue.length === 0) {
            setSelectedId(null);
            return;
        }
        if (!selectedId || !filteredQueue.some((job) => job.id === selectedId)) {
            setSelectedId(filteredQueue[0].id);
        }
    }, [filteredQueue, selectedId]);
    useEffect(() => {
        setDecision('APPROVE');
        setReason('');
        setReasonError('');
    }, [selectedId]);
    useEffect(() => {
        if (decision === 'EXPIRE' && !isExpiryReview)
            setDecision('APPROVE');
        if (decision === 'REVISION' && revisionLimitReached)
            setDecision('APPROVE');
    }, [decision, isExpiryReview, revisionLimitReached]);
    const tabCounts = {
        ALL: queue.length,
        SUBMITTED: queue.filter((job) => job.status === 'SUBMITTED').length,
        UNDER_REVIEW: queue.filter((job) => job.status === 'UNDER_REVIEW').length,
        EXPIRY_REVIEW: queue.filter((job) => job.status === 'EXPIRY_REVIEW').length,
    };
    const chooseDecision = (next) => {
        if (next === 'REVISION' && revisionLimitReached)
            return;
        if (next === 'EXPIRE' && !isExpiryReview)
            return;
        setDecision(next);
        setReasonError('');
    };
    const submitDecision = (event) => {
        event.preventDefault();
        if (!selected)
            return;
        if (decision === 'REVISION' && revisionLimitReached) {
            setReasonError(`Batas maksimum ${state.settings.maxRevisions} revisi sudah tercapai.`);
            return;
        }
        if (decision !== 'APPROVE' && reason.trim().length < 5) {
            setReasonError('Alasan wajib diisi minimal 5 karakter.');
            return;
        }
        setReasonError('');
        setConfirmOpen(true);
    };
    const confirmDecision = () => {
        if (!selected)
            return;
        const result = reviewJob(selected.id, decision, reason.trim(), reason.trim());
        if (result.ok) {
            toast.success(result.message, 'Review diproses');
            setConfirmOpen(false);
            setReason('');
            setReasonError('');
        }
        else {
            toast.error(result.message);
            setReasonError(result.message);
        }
    };
    return (_jsxs("div", { className: "page page-enter", children: [_jsx(PageHeader, { eyebrow: "Panel admin", title: "Review queue", description: "Periksa hasil pekerjaan dan berikan keputusan. Setiap keputusan tercatat pada audit log simulasi.", actions: _jsxs(Link, { to: "/admin/jobs", className: "btn btn--secondary", children: [_jsx(ChevronRight, { size: 15, "aria-hidden": "true" }), "Manajemen pekerjaan"] }) }), _jsxs("div", { className: "review-summary", children: [_jsxs("div", { children: [_jsx("span", { className: "review-summary__icon", "aria-hidden": "true", children: _jsx(ClipboardCheck, { size: 18 }) }), _jsxs("div", { children: [_jsx("strong", { children: queue.length }), _jsx("span", { children: "pekerjaan menunggu keputusan" })] })] }), _jsxs("div", { children: [_jsx("span", { className: "review-summary__icon is-expired", "aria-hidden": "true", children: _jsx(Clock3, { size: 18 }) }), _jsxs("div", { children: [_jsx("strong", { children: tabCounts.EXPIRY_REVIEW }), _jsx("span", { children: "review kedaluwarsa" })] })] }), _jsxs("div", { children: [_jsx("span", { className: "review-summary__icon is-success", "aria-hidden": "true", children: _jsx(ShieldCheck, { size: 18 }) }), _jsxs("div", { children: [_jsx("strong", { children: state.settings.maxRevisions }), _jsx("span", { children: "maksimum permintaan revisi" })] })] }), _jsx(SimulationTag, { children: "Data lokal" })] }), _jsxs("div", { className: "review-layout", children: [_jsxs(Panel, { className: "review-queue-panel", bodyClassName: "review-queue-panel__body", children: [_jsxs("div", { className: "review-queue-panel__head", children: [_jsxs("div", { children: [_jsx("h2", { children: "Antrean" }), _jsx("p", { children: "Urut berdasarkan prioritas dan waktu kirim." })] }), _jsxs(Badge, { tone: queue.length > 0 ? 'warning' : 'success', children: [queue.length, " item"] })] }), _jsx(Tabs, { label: "Filter antrean review", value: tab, onChange: (value) => setTab(value), items: [
                                    { id: 'ALL', label: 'Semua', count: tabCounts.ALL },
                                    { id: 'SUBMITTED', label: 'Menunggu', count: tabCounts.SUBMITTED },
                                    { id: 'UNDER_REVIEW', label: 'Direview', count: tabCounts.UNDER_REVIEW },
                                    { id: 'EXPIRY_REVIEW', label: 'Lewat deadline', count: tabCounts.EXPIRY_REVIEW },
                                ] }), _jsx("div", { className: "review-queue-search", children: _jsx(SearchField, { label: "Cari antrean review", value: query, onChange: setQuery, placeholder: "Cari ID, judul, atau seller\u2026" }) }), filteredQueue.length > 0 ? (_jsx("div", { className: "review-queue-list", children: filteredQueue.map((job) => {
                                    const seller = state.sellers.find((item) => item.id === job.sellerId);
                                    return (_jsxs("button", { type: "button", className: `review-queue-item${job.id === selectedId ? ' is-active' : ''}`, onClick: () => setSelectedId(job.id), "aria-current": job.id === selectedId ? 'true' : undefined, children: [_jsxs("span", { className: "review-queue-item__top", children: [_jsx("span", { className: "cell-id", children: job.id }), _jsx(StatusBadge, { meta: getJobStatus(job) })] }), _jsx("span", { className: "review-queue-item__title", children: job.title }), _jsxs("span", { className: "review-queue-item__meta", children: [seller?.name ?? 'Seller', " \u00B7 dikirim ", relativeTime(job.submittedAt ?? job.createdAt)] }), _jsxs("span", { className: "review-queue-item__bottom", children: [_jsx("span", { children: formatIDR(job.rate) }), _jsxs("span", { children: ["Revisi ", job.revisionCount, "/", state.settings.maxRevisions] }), _jsx(ChevronRight, { size: 13, "aria-hidden": "true" })] })] }, job.id));
                                }) })) : (_jsx(EmptyState, { icon: query ? Search : CheckCircle2, title: query ? 'Tidak ada hasil' : 'Antrean bersih', description: query
                                    ? 'Tidak ada pekerjaan pada antrean review yang cocok dengan pencarian.'
                                    : 'Semua hasil pekerjaan demo sudah diproses. Antrean baru akan muncul setelah seller mengirim hasil.' }))] }), selected ? (_jsxs(Panel, { className: "review-workspace", bodyClassName: "review-workspace__body", action: _jsx(StatusBadge, { meta: getJobStatus(selected) }), children: [_jsxs("div", { className: "review-workspace__head", children: [_jsxs("div", { children: [_jsxs("span", { className: "cell-id", children: [selected.id, " \u00B7 ", selected.category] }), _jsx("h2", { children: selected.title }), _jsxs("p", { children: ["Dikirim ", formatDateTime(selected.submittedAt ?? selected.createdAt), " oleh", ' ', _jsx("strong", { children: selectedSeller?.name ?? 'seller demo' })] })] }), _jsxs("div", { className: "review-workspace__head-right", children: [_jsx("span", { className: "review-workspace__rate", children: formatIDR(selected.rate) }), selected.deadlineAt ? _jsx(DeadlineLabel, { deadlineAt: selected.deadlineAt }) : null] })] }), isExpiryReview ? (_jsxs(Callout, { tone: "warning", icon: AlertTriangle, title: "Deadline telah terlewati", children: ["Pekerjaan masuk review kedaluwarsa. Putuskan hasil yang sudah dikirim, nyatakan kedaluwarsa, atau perpanjang deadline untuk mengembalikannya ke seller.", _jsx("div", { className: "callout__actions", children: _jsx(Button, { variant: "secondary", size: "sm", iconLeft: CalendarClock, onClick: () => setExtendOpen(true), children: "Perpanjang deadline" }) })] })) : null, _jsxs("div", { className: "review-meta-grid", children: [_jsxs("div", { children: [_jsx("span", { children: "Seller" }), _jsx("strong", { children: selectedSeller?.name ?? '—' }), selectedSeller ? _jsx("small", { className: "mono", children: selectedSeller.id }) : null] }), _jsxs("div", { children: [_jsx("span", { children: "Pengiriman" }), _jsxs("strong", { children: [selected.submissions.length, " kali"] }), _jsxs("small", { children: ["Revisi ", selected.revisionCount, "/", state.settings.maxRevisions] })] }), _jsxs("div", { children: [_jsx("span", { children: "Deadline" }), selected.deadlineAt ? _jsx(DeadlineLabel, { deadlineAt: selected.deadlineAt }) : _jsx("strong", { children: "\u2014" })] }), _jsxs("div", { children: [_jsx("span", { children: "Status komisi" }), _jsx(Badge, { tone: selected.commissionRecorded ? 'success' : 'neutral', children: selected.commissionRecorded ? 'Sudah dicatat' : 'Belum dicatat' })] })] }), _jsxs("div", { className: "review-main-grid", children: [_jsxs("div", { className: "review-main-column", children: [_jsxs("section", { className: "review-block", children: [_jsxs("div", { className: "review-block__head", children: [_jsx("h3", { children: "Hasil terbaru" }), latestSubmission ? (_jsx("span", { className: "mono", children: latestSubmission.id })) : (_jsx(Badge, { tone: "neutral", children: "Tidak ada file" }))] }), latestSubmission ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "review-submission-note", children: [_jsx("span", { children: "Catatan seller" }), _jsx("p", { children: latestSubmission.note })] }), _jsxs("div", { className: "review-attachments", children: [_jsx("span", { className: "review-attachments__label", children: "Lampiran demo" }), _jsx(AttachmentList, { attachments: latestSubmission.attachments, emptyLabel: "Tidak ada lampiran." })] })] })) : (_jsx("p", { className: "detail-empty", children: "Pekerjaan ini tidak memiliki pengiriman yang dapat ditinjau." }))] }), _jsxs("section", { className: "review-block", children: [_jsx("div", { className: "review-block__head", children: _jsx("h3", { children: "Brief dan instruksi" }) }), _jsx("p", { className: "detail-prose", children: selected.description }), _jsx(JobInstructions, { job: selected })] }), _jsxs("section", { className: "review-block", children: [_jsxs("div", { className: "review-block__head", children: [_jsx("h3", { children: "Riwayat pengiriman" }), _jsxs(Badge, { tone: "neutral", children: [selected.submissions.length, " pengiriman"] })] }), _jsx(SubmissionHistory, { submissions: selected.submissions })] }), _jsxs("section", { className: "review-block", children: [_jsx("div", { className: "review-block__head", children: _jsx("h3", { children: "Riwayat status" }) }), _jsx(JobHistoryList, { history: selected.history })] })] }), _jsxs("aside", { className: "review-decision", "aria-label": "Form keputusan review", children: [_jsxs("div", { className: "review-decision__head", children: [_jsx("span", { className: "review-decision__step", children: "Langkah berikutnya" }), _jsx("h3", { children: "Beri keputusan" }), _jsx("p", { children: "Catatan akan dikirim ke seller dan dicatat pada audit log simulasi." })] }), _jsxs("form", { className: "review-decision__form", onSubmit: submitDecision, noValidate: true, children: [_jsxs("div", { className: "decision-options", role: "group", "aria-label": "Pilih keputusan review", children: [_jsxs("button", { type: "button", className: `decision-option decision-option--approve${decision === 'APPROVE' ? ' is-active' : ''}`, "aria-pressed": decision === 'APPROVE', onClick: () => chooseDecision('APPROVE'), children: [_jsx(CheckCircle2, { size: 16, "aria-hidden": "true" }), _jsxs("span", { children: [_jsx("strong", { children: "Setujui" }), _jsx("small", { children: "Komisi dicatat sekali" })] })] }), _jsxs("button", { type: "button", className: `decision-option decision-option--revision${decision === 'REVISION' ? ' is-active' : ''}`, "aria-pressed": decision === 'REVISION', onClick: () => chooseDecision('REVISION'), disabled: revisionLimitReached, children: [_jsx(RefreshCw, { size: 16, "aria-hidden": "true" }), _jsxs("span", { children: [_jsx("strong", { children: "Revisi" }), _jsxs("small", { children: ["Maks. ", state.settings.maxRevisions, " kali"] })] })] }), _jsxs("button", { type: "button", className: `decision-option decision-option--reject${decision === 'REJECT' ? ' is-active' : ''}`, "aria-pressed": decision === 'REJECT', onClick: () => chooseDecision('REJECT'), children: [_jsx(XCircle, { size: 16, "aria-hidden": "true" }), _jsxs("span", { children: [_jsx("strong", { children: "Tolak" }), _jsx("small", { children: "Tanpa komisi" })] })] }), isExpiryReview ? (_jsxs("button", { type: "button", className: `decision-option decision-option--expire${decision === 'EXPIRE' ? ' is-active' : ''}`, "aria-pressed": decision === 'EXPIRE', onClick: () => chooseDecision('EXPIRE'), children: [_jsx(Clock3, { size: 16, "aria-hidden": "true" }), _jsxs("span", { children: [_jsx("strong", { children: "Kedaluwarsa" }), _jsx("small", { children: "Tutup pekerjaan" })] })] })) : null] }), revisionLimitReached ? (_jsx(Callout, { tone: "warning", title: "Batas revisi tercapai", children: "Permintaan revisi tidak tersedia lagi. Setujui, tolak, atau nyatakan pekerjaan kedaluwarsa bila relevan." })) : null, _jsx(TextAreaField, { label: decision === 'APPROVE' ? 'Catatan persetujuan (opsional)' : 'Alasan keputusan', name: "review-reason", value: reason, onChange: (event) => {
                                                            setReason(event.target.value);
                                                            setReasonError('');
                                                        }, error: reasonError || undefined, placeholder: decision === 'APPROVE'
                                                            ? 'Contoh: hasil sesuai brief dan format.'
                                                            : decision === 'REVISION'
                                                                ? 'Jelaskan bagian yang perlu diperbaiki.'
                                                                : 'Jelaskan alasan penolakan atau kedaluwarsa.', hint: decision === 'APPROVE'
                                                            ? 'Opsional. Catatan ini akan tampil pada riwayat seller.'
                                                            : 'Wajib diisi minimal 5 karakter dan akan tampil ke seller.', rows: 4, required: decision !== 'APPROVE' }), _jsx("div", { className: "review-decision__effect", children: decision === 'APPROVE' ? (_jsxs(_Fragment, { children: [_jsx("span", { children: "Efek keputusan" }), _jsxs("p", { children: ["Status menjadi ", _jsx("strong", { children: "Disetujui" }), ". Komisi ", formatIDR(selected.rate), " dicatat satu kali pada saldo demo seller."] })] })) : decision === 'REVISION' ? (_jsxs(_Fragment, { children: [_jsx("span", { children: "Efek keputusan" }), _jsxs("p", { children: ["Revisi ke-", selected.revisionCount + 1, " dari ", state.settings.maxRevisions, ". Deadline seller menjadi ", state.settings.revisionHours, " jam setelah keputusan."] })] })) : decision === 'REJECT' ? (_jsxs(_Fragment, { children: [_jsx("span", { children: "Efek keputusan" }), _jsxs("p", { children: ["Status menjadi ", _jsx("strong", { children: "Ditolak" }), ". Komisi tidak dicatat."] })] })) : (_jsxs(_Fragment, { children: [_jsx("span", { children: "Efek keputusan" }), _jsxs("p", { children: ["Status menjadi ", _jsx("strong", { children: "Kedaluwarsa" }), ". Komisi tidak dicatat."] })] })) }), _jsx(Button, { variant: "primary", iconLeft: Send, type: "submit", block: true, children: decisionCopy[decision].confirm }), _jsx("p", { className: "review-decision__disclaimer", children: "Tindakan ini hanya mengubah data demo. Tidak ada pembayaran atau email nyata." })] })] })] })] })) : (_jsx(Panel, { className: "review-workspace", children: _jsx(EmptyState, { icon: ClipboardCheck, title: "Pilih pekerjaan dari antrean", description: "Detail hasil, lampiran, dan formulir keputusan akan tampil di area ini." }) }))] }), _jsx(ExtendDeadlineDialog, { open: extendOpen, job: selected, onClose: () => setExtendOpen(false) }), _jsx(ConfirmDialog, { open: confirmOpen, onClose: () => setConfirmOpen(false), onConfirm: confirmDecision, title: `${decisionCopy[decision].label}?`, description: decisionCopy[decision].description, confirmLabel: decisionCopy[decision].confirm, tone: decisionCopy[decision].tone, children: selected ? (_jsxs("div", { className: "confirm-summary", children: [_jsxs("div", { children: [_jsx("span", { children: "Pekerjaan" }), _jsx("strong", { children: selected.title })] }), _jsxs("div", { children: [_jsx("span", { children: "ID" }), _jsx("strong", { className: "mono", children: selected.id })] }), reason.trim() ? (_jsxs("div", { children: [_jsx("span", { children: "Catatan" }), _jsx("strong", { children: reason.trim() })] })) : null, decision === 'APPROVE' ? (_jsxs("div", { children: [_jsx("span", { children: "Komisi demo" }), _jsx("strong", { children: formatIDR(selected.rate) })] })) : null] })) : null })] }));
}
