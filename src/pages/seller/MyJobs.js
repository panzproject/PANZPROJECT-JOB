import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ClipboardList, FileCheck2, History, Info, RefreshCw, Search, Send, Clock3, Wallet, } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { formatDateTime, formatIDR, relativeTime } from '../../lib/format';
import { getJobStatus } from '../../lib/status';
import { Button, Callout, EmptyState, Modal, PageHeader, Panel, ProgressBar, SearchField, SimulationTag, StatusBadge, Tabs, } from '../../components/ui';
import { JobInstructions, JobHistoryList, RevisionBanner, SubmissionHistory, AttachmentList } from '../../components/jobs/JobBits';
import { DeadlineLabel } from '../../components/jobs/Deadline';
import { SubmitWorkDialog } from '../../components/seller/SubmitWorkDialog';
const tabMatches = {
    ALL: () => true,
    ACTIVE: (job) => job.status === 'CLAIMED',
    REVIEW: (job) => ['SUBMITTED', 'UNDER_REVIEW'].includes(job.status),
    REVISION: (job) => job.status === 'REVISION',
    APPROVED: (job) => job.status === 'APPROVED',
    REJECTED: (job) => job.status === 'REJECTED',
    EXPIRED: (job) => ['EXPIRED', 'EXPIRY_REVIEW'].includes(job.status),
};
const sortJobs = (jobs, tab) => {
    const sorted = [...jobs];
    if (tab === 'ACTIVE' || tab === 'REVISION') {
        return sorted.sort((a, b) => {
            const aTime = a.deadlineAt ? new Date(a.deadlineAt).getTime() : Number.MAX_SAFE_INTEGER;
            const bTime = b.deadlineAt ? new Date(b.deadlineAt).getTime() : Number.MAX_SAFE_INTEGER;
            return aTime - bTime;
        });
    }
    return sorted.sort((a, b) => {
        const aTime = new Date(a.submittedAt ?? a.createdAt).getTime();
        const bTime = new Date(b.submittedAt ?? b.createdAt).getTime();
        return bTime - aTime;
    });
};
export default function MyJobs() {
    const { state, currentSeller } = useApp();
    const navigate = useNavigate();
    const [tab, setTab] = useState('ALL');
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState(null);
    const [detailTab, setDetailTab] = useState('DETAIL');
    const [submitTarget, setSubmitTarget] = useState(null);
    const sellerJobs = useMemo(() => state.jobs.filter((job) => job.sellerId === currentSeller.id), [state.jobs, currentSeller.id]);
    useEffect(() => {
        setDetailTab('DETAIL');
    }, [selected?.id]);
    const counts = {
        ALL: sellerJobs.length,
        ACTIVE: sellerJobs.filter(tabMatches.ACTIVE).length,
        REVIEW: sellerJobs.filter(tabMatches.REVIEW).length,
        REVISION: sellerJobs.filter(tabMatches.REVISION).length,
        APPROVED: sellerJobs.filter(tabMatches.APPROVED).length,
        REJECTED: sellerJobs.filter(tabMatches.REJECTED).length,
        EXPIRED: sellerJobs.filter(tabMatches.EXPIRED).length,
    };
    const filtered = sortJobs(sellerJobs.filter((job) => {
        if (!tabMatches[tab](job))
            return false;
        if (!query.trim())
            return true;
        const needle = query.toLowerCase();
        return job.title.toLowerCase().includes(needle) || job.id.toLowerCase().includes(needle);
    }), tab);
    const liveSelected = selected ? state.jobs.find((job) => job.id === selected.id) ?? selected : null;
    const canSubmit = liveSelected?.status === 'CLAIMED' || liveSelected?.status === 'REVISION';
    const openSubmit = (job) => {
        setSelected(null);
        setSubmitTarget(job);
    };
    const emptyCopy = () => {
        if (query.trim()) {
            return {
                title: 'Pekerjaan tidak ditemukan',
                description: 'Coba kata kunci lain atau hapus pencarian untuk melihat semua pekerjaan.',
            };
        }
        if (tab === 'ACTIVE') {
            return {
                title: 'Tidak ada pekerjaan aktif',
                description: 'Ambil pekerjaan baru dari marketplace. Tidak ada batas maksimum pekerjaan aktif pada rancangan ini.',
            };
        }
        if (tab === 'REVISION') {
            return {
                title: 'Tidak ada revisi',
                description: 'Pekerjaan yang membutuhkan revisi akan tampil di sini beserta catatan admin.',
            };
        }
        return {
            title: 'Belum ada pekerjaan pada filter ini',
            description: 'Gunakan filter lain atau cari pekerjaan baru pada marketplace simulasi.',
        };
    };
    const empty = emptyCopy();
    return (_jsxs("div", { className: "page page-enter", children: [_jsx(PageHeader, { eyebrow: "Ruang kerja seller", title: "Pekerjaan saya", description: "Kelola pekerjaan aktif, revisi, dan riwayat pengiriman. Semua status dan deadline adalah simulasi lokal.", actions: _jsx(Button, { variant: "primary", iconLeft: Search, onClick: () => navigate('/seller/marketplace'), children: "Cari pekerjaan" }) }), _jsxs("div", { className: "jobs-overview-bar", children: [_jsxs("div", { children: [_jsx("span", { className: "jobs-overview-bar__label", children: "Ringkasan pekerjaan" }), _jsxs("div", { className: "jobs-overview-bar__stats", children: [_jsxs("span", { children: [_jsx("strong", { children: counts.ACTIVE }), " aktif"] }), _jsxs("span", { children: [_jsx("strong", { children: counts.REVIEW }), " menunggu review"] }), _jsxs("span", { children: [_jsx("strong", { children: counts.REVISION }), " revisi"] }), _jsxs("span", { children: [_jsx("strong", { children: counts.APPROVED }), " selesai"] })] })] }), _jsx(SimulationTag, { children: "State lokal" })] }), _jsxs(Panel, { className: "jobs-panel", bodyClassName: "jobs-panel__body", children: [_jsx(Tabs, { label: "Filter status pekerjaan saya", value: tab, onChange: (value) => setTab(value), items: [
                            { id: 'ALL', label: 'Semua', count: counts.ALL },
                            { id: 'ACTIVE', label: 'Aktif', count: counts.ACTIVE },
                            { id: 'REVIEW', label: 'Menunggu Review', count: counts.REVIEW },
                            { id: 'REVISION', label: 'Revisi', count: counts.REVISION },
                            { id: 'APPROVED', label: 'Selesai', count: counts.APPROVED },
                            { id: 'REJECTED', label: 'Ditolak', count: counts.REJECTED },
                            { id: 'EXPIRED', label: 'Kedaluwarsa', count: counts.EXPIRED },
                        ] }), _jsxs("div", { className: "jobs-toolbar", children: [_jsx(SearchField, { label: "Cari pekerjaan saya berdasarkan nama atau ID", value: query, onChange: setQuery, placeholder: "Cari nama atau ID pekerjaan\u2026" }), _jsxs("p", { className: "result-count", children: [_jsx("strong", { children: filtered.length }), " dari ", _jsx("strong", { children: counts[tab] }), " pekerjaan"] })] }), filtered.length > 0 ? (_jsx("div", { className: "myjob-list", children: filtered.map((job) => {
                            const status = getJobStatus(job);
                            const isActionable = job.status === 'CLAIMED' || job.status === 'REVISION';
                            return (_jsxs("article", { className: `myjob-card${job.status === 'REVISION' ? ' myjob-card--revision' : ''}`, children: [_jsxs("div", { className: "myjob-card__main", children: [_jsxs("div", { className: "myjob-card__top", children: [_jsx("span", { className: "cell-id", children: job.id }), _jsx(StatusBadge, { meta: status }), _jsx("span", { className: "chip", children: job.category })] }), _jsx("h3", { className: "myjob-card__title", children: job.title }), _jsxs("div", { className: "myjob-card__meta", children: [_jsxs("span", { className: "myjob-card__rate", children: [_jsx(Wallet, { size: 12, "aria-hidden": "true" }), formatIDR(job.rate)] }), isActionable ? (_jsx(DeadlineLabel, { deadlineAt: job.deadlineAt })) : job.submittedAt ? (_jsxs("span", { className: "meta-text", children: [_jsx(Clock3, { size: 12, "aria-hidden": "true" }), "Dikirim ", formatDateTime(job.submittedAt)] })) : job.status === 'EXPIRY_REVIEW' ? (_jsxs("span", { className: "meta-text text-danger", children: [_jsx(Clock3, { size: 12, "aria-hidden": "true" }), "Menunggu keputusan admin"] })) : (_jsxs("span", { className: "meta-text", children: ["Diperbarui ", relativeTime(job.history[job.history.length - 1]?.at ?? job.createdAt)] })), _jsxs("span", { className: "meta-text", children: [job.revisionCount, "/", state.settings.maxRevisions, " revisi"] })] }), isActionable ? (_jsxs("div", { className: "myjob-card__progress", children: [_jsx(ProgressBar, { value: job.progress, tone: job.status === 'REVISION' ? 'warning' : 'accent', label: `Progres ${job.title}` }), _jsxs("span", { children: [job.progress, "%"] })] })) : null, job.status === 'REVISION' && job.reviewNote ? (_jsxs("div", { className: "myjob-card__revision", children: [_jsx(Info, { size: 13, "aria-hidden": "true" }), _jsx("p", { children: job.reviewNote })] })) : null, job.status === 'EXPIRY_REVIEW' ? (_jsxs("div", { className: "myjob-card__revision myjob-card__revision--warning", children: [_jsx(Clock3, { size: 13, "aria-hidden": "true" }), _jsx("p", { children: "Deadline terlewati. Pekerjaan berada di antrean review admin dan belum dialihkan ke seller lain." })] })) : null] }), _jsxs("div", { className: "myjob-card__actions", children: [_jsx(Button, { variant: "secondary", size: "sm", onClick: () => setSelected(job), children: "Lihat detail" }), isActionable ? (_jsx(Button, { variant: "primary", size: "sm", iconLeft: job.status === 'REVISION' ? RefreshCw : Send, onClick: () => openSubmit(job), disabled: currentSeller.status !== 'ACTIVE', children: job.status === 'REVISION' ? 'Kirim revisi' : 'Kirim hasil' })) : job.status === 'APPROVED' ? (_jsx(Button, { variant: "ghost", size: "sm", iconLeft: FileCheck2, onClick: () => setSelected(job), children: "Lihat hasil" })) : (_jsx(Button, { variant: "ghost", size: "sm", iconLeft: ArrowRight, onClick: () => setSelected(job), children: "Riwayat" }))] })] }, job.id));
                        }) })) : (_jsx(EmptyState, { icon: tab === 'REVISION' ? RefreshCw : Search, title: empty.title, description: empty.description, action: query.trim() ? (_jsx(Button, { variant: "secondary", size: "sm", onClick: () => setQuery(''), children: "Hapus pencarian" })) : (_jsx(Button, { variant: "primary", size: "sm", iconLeft: ClipboardList, onClick: () => navigate('/seller/marketplace'), children: "Buka marketplace" })) }))] }), liveSelected ? (_jsx(Modal, { open: Boolean(selected), onClose: () => setSelected(null), title: liveSelected.title, description: `${liveSelected.id} · ${liveSelected.category}`, eyebrow: "Detail pekerjaan saya", size: "xl", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", onClick: () => setSelected(null), children: "Tutup" }), canSubmit ? (_jsx(Button, { variant: "primary", iconLeft: liveSelected.status === 'REVISION' ? RefreshCw : Send, onClick: () => openSubmit(liveSelected), disabled: currentSeller.status !== 'ACTIVE', children: liveSelected.status === 'REVISION' ? 'Kirim revisi' : 'Kirim hasil' })) : null] }), children: _jsxs("div", { className: "job-detail", children: [_jsxs("div", { className: "job-detail__top", children: [_jsxs("div", { className: "row", children: [_jsx(StatusBadge, { meta: getJobStatus(liveSelected) }), _jsx("span", { className: "chip", children: liveSelected.category }), _jsx(SimulationTag, { children: "Demo lokal" })] }), _jsx("span", { className: "job-detail__rate", children: formatIDR(liveSelected.rate) })] }), _jsx(Tabs, { label: "Bagian detail pekerjaan", value: detailTab, onChange: (value) => setDetailTab(value), items: [
                                { id: 'DETAIL', label: 'Detail' },
                                { id: 'SUBMISSIONS', label: 'Pengiriman', count: liveSelected.submissions.length },
                                { id: 'HISTORY', label: 'Riwayat', count: liveSelected.history.length },
                            ] }), detailTab === 'DETAIL' ? (_jsxs("div", { className: "detail-tab-content", children: [_jsx(RevisionBanner, { job: liveSelected }), _jsx("p", { className: "job-detail__description", children: liveSelected.description }), _jsxs("div", { className: "detail-stat-grid", children: [_jsxs("div", { children: [_jsx("span", { children: "Status" }), _jsx(StatusBadge, { meta: getJobStatus(liveSelected) })] }), _jsxs("div", { children: [_jsx("span", { children: "Deadline" }), liveSelected.deadlineAt ? (_jsx(DeadlineLabel, { deadlineAt: liveSelected.deadlineAt })) : (_jsx("strong", { children: "\u2014" }))] }), _jsxs("div", { children: [_jsx("span", { children: "Revisi" }), _jsxs("strong", { children: [liveSelected.revisionCount, " / ", state.settings.maxRevisions] })] })] }), _jsxs("div", { className: "detail-meta-row", children: [_jsxs("span", { children: ["Diklaim ", liveSelected.claimedAt ? formatDateTime(liveSelected.claimedAt) : '—'] }), _jsxs("span", { children: ["Dikirim ", liveSelected.submittedAt ? formatDateTime(liveSelected.submittedAt) : '—'] }), _jsxs("span", { children: ["Progres ", liveSelected.progress, "%"] })] }), _jsxs("section", { className: "detail-section", children: [_jsxs("h3", { children: [_jsx(ClipboardList, { size: 15, "aria-hidden": "true" }), " Instruksi pekerjaan"] }), _jsx(JobInstructions, { job: liveSelected })] }), liveSelected.status === 'EXPIRY_REVIEW' ? (_jsx(Callout, { tone: "warning", icon: Clock3, title: "Menunggu keputusan admin", children: "Deadline demo telah terlewati. Admin dapat memperpanjang deadline atau menyatakan pekerjaan kedaluwarsa. Pekerjaan tidak dialihkan otomatis ke seller lain." })) : null, liveSelected.sellerNote ? (_jsxs("section", { className: "detail-section", children: [_jsx("h3", { children: "Catatan seller terakhir" }), _jsx("p", { className: "detail-prose", children: liveSelected.sellerNote })] })) : null, _jsxs("section", { className: "detail-section", children: [_jsx("h3", { children: "Lampiran terakhir" }), _jsx(AttachmentList, { attachments: liveSelected.attachments })] }), _jsxs("p", { className: "detail-footnote", children: [_jsx(History, { size: 12, "aria-hidden": "true" }), " Semua aktivitas pada halaman ini menggunakan data demo lokal."] })] })) : null, detailTab === 'SUBMISSIONS' ? (_jsxs("div", { className: "detail-tab-content", children: [_jsxs(Callout, { tone: "info", title: "Riwayat pengiriman tidak dihapus", children: ["Setiap pengiriman dan catatan admin pada data demo disimpan. Maksimum ", state.settings.maxRevisions, ' ', "permintaan revisi."] }), _jsx(SubmissionHistory, { submissions: liveSelected.submissions })] })) : null, detailTab === 'HISTORY' ? (_jsxs("div", { className: "detail-tab-content", children: [_jsx(Callout, { tone: "info", icon: History, title: "Riwayat perubahan status", children: "Riwayat ini bersifat catatan demo. Audit log produksi harus append-only dan aksesnya dibatasi." }), _jsx(JobHistoryList, { history: liveSelected.history })] })) : null] }) })) : null, submitTarget ? (_jsx(SubmitWorkDialog, { job: state.jobs.find((job) => job.id === submitTarget.id) ?? submitTarget, open: Boolean(submitTarget), onClose: () => setSubmitTarget(null) })) : null] }));
}
