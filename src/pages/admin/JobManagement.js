import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, CalendarClock, ClipboardCheck, Lock, Pause, Pencil, Play, Plus, RotateCcw, Search, Send, Undo2, XCircle, } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { formatDate, formatDateTime, formatIDR, relativeTime } from '../../lib/format';
import { getJobStatus, JOB_CATEGORIES } from '../../lib/status';
import { JobFormDialog } from '../../components/admin/JobFormDialog';
import { ExtendDeadlineDialog } from '../../components/admin/ExtendDeadlineDialog';
import { ReasonDialog } from '../../components/common/ReasonDialog';
import { JobHistoryList, JobInstructions } from '../../components/jobs/JobBits';
import { DeadlineLabel } from '../../components/jobs/Deadline';
import { Badge, Button, Callout, ConfirmDialog, EmptyState, Modal, PageHeader, Pagination, Panel, SearchField, SelectField, SimulationTag, StatusBadge, Tabs, } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
const PAGE_SIZE = 9;
const matchesTab = (job, tab) => {
    switch (tab) {
        case 'ALL':
            return true;
        case 'AVAILABLE':
            return job.status === 'AVAILABLE';
        case 'ACTIVE':
            return job.status === 'CLAIMED' || job.status === 'REVISION';
        case 'REVIEW':
            return ['SUBMITTED', 'UNDER_REVIEW', 'EXPIRY_REVIEW'].includes(job.status);
        case 'COMPLETED':
            return ['APPROVED', 'REJECTED'].includes(job.status);
        case 'CLOSED':
            return ['CANCELLED', 'EXPIRED'].includes(job.status);
    }
};
export default function JobManagement() {
    const { state, toggleJobPause, closeJob, reopenJob } = useApp();
    const toast = useToast();
    const navigate = useNavigate();
    const [tab, setTab] = useState('ALL');
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('ALL');
    const [visibility, setVisibility] = useState('ALL');
    const [page, setPage] = useState(1);
    const [selectedId, setSelectedId] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [closeOpen, setCloseOpen] = useState(false);
    const [extendOpen, setExtendOpen] = useState(false);
    const [reopenOpen, setReopenOpen] = useState(false);
    const counts = useMemo(() => ({
        ALL: state.jobs.length,
        AVAILABLE: state.jobs.filter((job) => matchesTab(job, 'AVAILABLE')).length,
        ACTIVE: state.jobs.filter((job) => matchesTab(job, 'ACTIVE')).length,
        REVIEW: state.jobs.filter((job) => matchesTab(job, 'REVIEW')).length,
        COMPLETED: state.jobs.filter((job) => matchesTab(job, 'COMPLETED')).length,
        CLOSED: state.jobs.filter((job) => matchesTab(job, 'CLOSED')).length,
    }), [state.jobs]);
    const filtered = useMemo(() => {
        return state.jobs
            .filter((job) => {
            if (!matchesTab(job, tab))
                return false;
            if (category !== 'ALL' && job.category !== category)
                return false;
            if (visibility === 'PAUSED' && !job.paused)
                return false;
            if (visibility === 'LIVE' && job.paused)
                return false;
            if (!query.trim())
                return true;
            const needle = query.toLowerCase();
            const seller = state.sellers.find((item) => item.id === job.sellerId)?.name ?? '';
            return (job.id.toLowerCase().includes(needle) ||
                job.title.toLowerCase().includes(needle) ||
                seller.toLowerCase().includes(needle));
        })
            .sort((a, b) => b.id.localeCompare(a.id, undefined, { numeric: true }));
    }, [state.jobs, state.sellers, tab, category, visibility, query]);
    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const hasFilters = Boolean(query.trim() || category !== 'ALL' || visibility !== 'ALL');
    const selected = state.jobs.find((job) => job.id === selectedId) ?? null;
    const selectedSeller = state.sellers.find((seller) => seller.id === selected?.sellerId);
    const canEdit = selected ? ['AVAILABLE', 'CANCELLED'].includes(selected.status) : false;
    const canPause = selected?.status === 'AVAILABLE';
    const canExtend = selected ? ['CLAIMED', 'REVISION', 'EXPIRY_REVIEW'].includes(selected.status) : false;
    const canClose = selected?.status === 'AVAILABLE';
    const canReopen = selected?.status === 'CANCELLED' && !selected.sellerId;
    const canReview = selected ? ['SUBMITTED', 'UNDER_REVIEW', 'EXPIRY_REVIEW'].includes(selected.status) : false;
    const resetFilters = () => {
        setQuery('');
        setCategory('ALL');
        setVisibility('ALL');
        setPage(1);
    };
    const handlePause = () => {
        if (!selected)
            return;
        const result = toggleJobPause(selected.id);
        if (result.ok)
            toast.success(result.message, 'Status visibilitas diperbarui');
        else
            toast.error(result.message);
    };
    const handleClose = (reason) => {
        if (!selected)
            return { ok: false, message: 'Pekerjaan tidak ditemukan.' };
        const result = closeJob(selected.id, reason);
        if (result.ok)
            toast.success(result.message, 'Pekerjaan ditutup');
        return result;
    };
    const handleReopen = () => {
        if (!selected)
            return;
        const result = reopenJob(selected.id);
        if (result.ok)
            toast.success(result.message, 'Pekerjaan dibuka kembali');
        else
            toast.error(result.message);
        setReopenOpen(false);
    };
    const emptyAction = hasFilters ? (_jsx(Button, { variant: "secondary", size: "sm", iconLeft: RotateCcw, onClick: resetFilters, children: "Reset filter" })) : (_jsx(Button, { variant: "primary", size: "sm", iconLeft: Plus, onClick: () => setCreateOpen(true), children: "Buat pekerjaan" }));
    return (_jsxs("div", { className: "page page-enter", children: [_jsx(PageHeader, { eyebrow: "Panel admin", title: "Manajemen pekerjaan", description: "Buat, atur visibilitas, perpanjang deadline, dan tutup pekerjaan demo. Materi terkunci setelah diklaim.", actions: _jsx(Button, { variant: "primary", iconLeft: Plus, onClick: () => setCreateOpen(true), children: "Buat pekerjaan" }) }), _jsxs("div", { className: "admin-page-note", children: [_jsxs("div", { children: [_jsx("span", { children: "Total pekerjaan" }), _jsx("strong", { children: state.jobs.length })] }), _jsxs("div", { children: [_jsx("span", { children: "Tersedia" }), _jsx("strong", { children: state.jobs.filter((job) => job.status === 'AVAILABLE' && !job.paused).length })] }), _jsxs("div", { children: [_jsx("span", { children: "Dijeda" }), _jsx("strong", { children: state.jobs.filter((job) => job.paused).length })] }), _jsxs("div", { children: [_jsx("span", { children: "Antrean review" }), _jsx("strong", { children: counts.REVIEW })] }), _jsx(SimulationTag, {})] }), _jsxs(Panel, { title: "Daftar pekerjaan", description: "Gunakan tab, pencarian, dan filter untuk menemukan pekerjaan.", action: _jsx(SimulationTag, { children: "Data lokal" }), children: [_jsx(Tabs, { label: "Filter status pekerjaan", value: tab, onChange: (value) => {
                            setTab(value);
                            setPage(1);
                        }, items: [
                            { id: 'ALL', label: 'Semua', count: counts.ALL },
                            { id: 'AVAILABLE', label: 'Tersedia', count: counts.AVAILABLE },
                            { id: 'ACTIVE', label: 'Dikerjakan', count: counts.ACTIVE },
                            { id: 'REVIEW', label: 'Review', count: counts.REVIEW },
                            { id: 'COMPLETED', label: 'Selesai', count: counts.COMPLETED },
                            { id: 'CLOSED', label: 'Ditutup', count: counts.CLOSED },
                        ] }), _jsxs("div", { className: "filter-bar jobs-toolbar", children: [_jsx(SearchField, { label: "Cari pekerjaan berdasarkan judul, ID, atau seller", value: query, onChange: (value) => {
                                    setQuery(value);
                                    setPage(1);
                                }, placeholder: "Cari judul, ID, atau seller\u2026" }), _jsx(SelectField, { label: "Kategori", fieldClassName: "filter-bar__control", value: category, onChange: (event) => {
                                    setCategory(event.target.value);
                                    setPage(1);
                                }, options: [
                                    { value: 'ALL', label: 'Semua kategori' },
                                    ...JOB_CATEGORIES.map((item) => ({ value: item, label: item })),
                                ] }), _jsx(SelectField, { label: "Visibilitas", fieldClassName: "filter-bar__control", value: visibility, onChange: (event) => {
                                    setVisibility(event.target.value);
                                    setPage(1);
                                }, options: [
                                    { value: 'ALL', label: 'Semua' },
                                    { value: 'LIVE', label: 'Tampil' },
                                    { value: 'PAUSED', label: 'Dijeda' },
                                ] }), _jsx(Button, { variant: "ghost", size: "sm", iconLeft: RotateCcw, onClick: resetFilters, disabled: !hasFilters, className: "filter-reset", children: "Reset" }), _jsxs("span", { className: "filter-bar__result", children: [filtered.length, " pekerjaan"] })] }), pageItems.length > 0 ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "table-wrap", children: _jsxs("table", { className: "data-table", children: [_jsx("caption", { className: "sr-only", children: "Daftar pekerjaan pada panel admin" }), _jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Pekerjaan" }), _jsx("th", { scope: "col", children: "Kategori" }), _jsx("th", { scope: "col", className: "num", children: "Tarif" }), _jsx("th", { scope: "col", children: "Seller" }), _jsx("th", { scope: "col", children: "Status" }), _jsx("th", { scope: "col", children: "Deadline" }), _jsx("th", { scope: "col", children: _jsx("span", { className: "sr-only", children: "Aksi" }) })] }) }), _jsx("tbody", { children: pageItems.map((job) => (_jsxs("tr", { children: [_jsxs("td", { children: [_jsx("div", { className: "cell-title", children: job.title }), _jsxs("div", { className: "cell-sub", children: [_jsx("span", { className: "mono", children: job.id }), " \u00B7 dibuat ", relativeTime(job.createdAt)] })] }), _jsx("td", { children: job.category }), _jsx("td", { className: "num cell-amount", children: formatIDR(job.rate) }), _jsx("td", { children: job.sellerId ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "cell-title", children: state.sellers.find((seller) => seller.id === job.sellerId)?.name ?? 'Seller tidak ditemukan' }), _jsx("div", { className: "cell-sub mono", children: job.sellerId })] })) : (_jsx("span", { className: "text-muted", children: "Belum diklaim" })) }), _jsx("td", { children: _jsxs("div", { className: "cell-status", children: [_jsx(StatusBadge, { meta: getJobStatus(job) }), job.paused ? _jsx(Badge, { tone: "neutral", children: "Dijeda" }) : null] }) }), _jsx("td", { children: job.deadlineAt ? (_jsxs("div", { children: [_jsx(DeadlineLabel, { deadlineAt: job.deadlineAt }), _jsx("div", { className: "cell-sub", children: formatDate(job.deadlineAt) })] })) : (_jsx("span", { className: "text-muted", children: "Belum ada" })) }), _jsx("td", { children: _jsxs("div", { className: "cell-actions", children: [canReviewJob(job) ? (_jsx(Button, { variant: "ghost", size: "sm", iconLeft: ClipboardCheck, onClick: () => navigate(`/admin/review?job=${job.id}`), children: "Review" })) : null, _jsx(Button, { variant: "secondary", size: "sm", iconLeft: Pencil, onClick: () => setSelectedId(job.id), children: "Kelola" })] }) })] }, job.id))) })] }) }), _jsxs("div", { className: "table-footer", children: [_jsxs("p", { className: "result-count", children: ["Menampilkan ", _jsxs("strong", { children: [(currentPage - 1) * PAGE_SIZE + 1, "\u2013", Math.min(currentPage * PAGE_SIZE, filtered.length)] }), ' ', "dari ", _jsx("strong", { children: filtered.length }), " pekerjaan"] }), _jsx(Pagination, { page: currentPage, pageSize: PAGE_SIZE, total: filtered.length, onChange: setPage })] })] })) : (_jsx(EmptyState, { icon: Search, title: "Pekerjaan tidak ditemukan", description: "Tidak ada pekerjaan yang cocok dengan tab dan filter saat ini.", action: emptyAction }))] }), _jsx(JobFormDialog, { open: createOpen, onClose: () => setCreateOpen(false) }), selected ? (_jsx(Modal, { open: Boolean(selected), onClose: () => setSelectedId(null), title: selected.title, description: `${selected.id} · ${selected.category}`, eyebrow: "Kelola pekerjaan", size: "xl", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", onClick: () => setSelectedId(null), children: "Tutup" }), canReview ? (_jsx(Button, { variant: "primary", iconLeft: ClipboardCheck, onClick: () => {
                                setSelectedId(null);
                                navigate(`/admin/review?job=${selected.id}`);
                            }, children: "Buka review" })) : null, canEdit ? (_jsx(Button, { variant: "primary", iconLeft: Pencil, onClick: () => setEditOpen(true), children: "Edit pekerjaan" })) : null] }), children: _jsxs("div", { className: "job-detail", children: [_jsxs("div", { className: "job-detail__top", children: [_jsxs("div", { className: "row", children: [_jsx(StatusBadge, { meta: getJobStatus(selected) }), _jsx(Badge, { tone: "neutral", children: selected.category }), selected.paused ? _jsx(Badge, { tone: "neutral", children: "Dijeda" }) : null, _jsx(SimulationTag, { children: "Demo" })] }), _jsx("span", { className: "job-detail__rate", children: formatIDR(selected.rate) })] }), _jsxs("div", { className: "detail-stat-grid", children: [_jsxs("div", { children: [_jsx("span", { children: "Seller" }), _jsx("strong", { children: selectedSeller?.name ?? 'Belum diklaim' }), selectedSeller ? _jsx("small", { className: "mono", children: selectedSeller.id }) : null] }), _jsxs("div", { children: [_jsx("span", { children: "Deadline" }), selected.deadlineAt ? (_jsx(DeadlineLabel, { deadlineAt: selected.deadlineAt })) : (_jsx("strong", { children: "Belum ada" }))] }), _jsxs("div", { children: [_jsx("span", { children: "Revisi" }), _jsxs("strong", { children: [selected.revisionCount, " / ", state.settings.maxRevisions] })] })] }), _jsxs("div", { className: "detail-meta-row", children: [_jsxs("span", { children: ["Dibuat ", formatDateTime(selected.createdAt)] }), _jsxs("span", { children: ["Diklaim ", selected.claimedAt ? formatDateTime(selected.claimedAt) : '—'] }), _jsxs("span", { children: ["Dikirim ", selected.submittedAt ? formatDateTime(selected.submittedAt) : '—'] })] }), _jsxs("section", { className: "detail-section", children: [_jsxs("h3", { children: [_jsx(BriefcaseBusiness, { size: 15, "aria-hidden": "true" }), " Deskripsi"] }), _jsx("p", { className: "detail-prose", children: selected.description })] }), _jsxs("section", { className: "detail-section", children: [_jsxs("h3", { children: [_jsx(Send, { size: 15, "aria-hidden": "true" }), " Instruksi"] }), _jsx(JobInstructions, { job: selected })] }), selected.reviewNote ? (_jsx(Callout, { tone: "warning", title: "Catatan review terakhir", children: selected.reviewNote })) : null, _jsxs("section", { className: "detail-section", children: [_jsxs("h3", { children: [_jsx(Lock, { size: 15, "aria-hidden": "true" }), " Tindakan admin"] }), _jsxs("div", { className: "admin-action-grid", children: [canPause ? (_jsx(Button, { variant: "secondary", iconLeft: selected.paused ? Play : Pause, onClick: handlePause, children: selected.paused ? 'Aktifkan di marketplace' : 'Jeda dari marketplace' })) : null, canExtend ? (_jsx(Button, { variant: "secondary", iconLeft: CalendarClock, onClick: () => setExtendOpen(true), children: "Perpanjang deadline" })) : null, canClose ? (_jsx(Button, { variant: "danger", iconLeft: XCircle, onClick: () => setCloseOpen(true), children: "Tutup pekerjaan" })) : null, canReopen ? (_jsx(Button, { variant: "secondary", iconLeft: Undo2, onClick: () => setReopenOpen(true), children: "Buka kembali" })) : null, canReview ? (_jsx(Button, { variant: "secondary", iconLeft: ArrowRight, onClick: () => {
                                                setSelectedId(null);
                                                navigate(`/admin/review?job=${selected.id}`);
                                            }, children: "Review hasil" })) : null, !canPause && !canExtend && !canClose && !canReopen && !canReview && canEdit ? (_jsx("p", { className: "detail-footnote", children: "Pekerjaan tersedia untuk diedit dan dipublikasikan kembali." })) : null, !canPause && !canExtend && !canClose && !canReopen && !canReview && !canEdit ? (_jsx("p", { className: "detail-footnote", children: "Pekerjaan final. Materi, tarif, dan status dikunci untuk menjaga konsistensi data demo." })) : null] }), _jsx("p", { className: "detail-footnote", children: "Semua tindakan dicatat pada audit log demo. Perubahan tidak memengaruhi sistem nyata." })] }), _jsxs("section", { className: "detail-section", children: [_jsx("h3", { children: "Riwayat pekerjaan" }), _jsx(JobHistoryList, { history: selected.history })] })] }) })) : null, _jsx(JobFormDialog, { open: editOpen, onClose: () => setEditOpen(false), initial: selected }), _jsx(ExtendDeadlineDialog, { open: extendOpen, job: selected, onClose: () => setExtendOpen(false) }), _jsx(ReasonDialog, { open: closeOpen, onClose: () => setCloseOpen(false), onConfirm: handleClose, title: "Tutup pekerjaan?", description: selected ? `${selected.id} · ${selected.title}` : 'Pekerjaan akan ditutup.', label: "Alasan penutupan", placeholder: "Contoh: brief tidak lagi relevan dengan kebutuhan demo.", confirmLabel: "Tutup pekerjaan", tone: "danger", children: _jsx(Callout, { tone: "warning", title: "Pekerjaan yang sudah diklaim tidak dapat ditutup", children: "Penutupan hanya tersedia sebelum pekerjaan diklaim. Alasan akan masuk ke audit log." }) }), _jsx(ConfirmDialog, { open: reopenOpen, onClose: () => setReopenOpen(false), onConfirm: handleReopen, title: "Buka kembali pekerjaan ini?", description: "Status akan diubah menjadi Tersedia dan pekerjaan kembali dapat muncul di marketplace demo.", confirmLabel: "Buka kembali", children: selected ? (_jsxs("div", { className: "confirm-summary", children: [_jsxs("div", { children: [_jsx("span", { children: "Pekerjaan" }), _jsx("strong", { children: selected.title })] }), _jsxs("div", { children: [_jsx("span", { children: "ID" }), _jsx("strong", { className: "mono", children: selected.id })] })] })) : null })] }));
}
const canReviewJob = (job) => ['SUBMITTED', 'UNDER_REVIEW', 'EXPIRY_REVIEW'].includes(job.status);
