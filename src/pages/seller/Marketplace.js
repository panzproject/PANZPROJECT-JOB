import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { BadgeCheck, CalendarClock, CheckCircle2, ClipboardList, Clock3, Lock, RefreshCw, Search, ShieldCheck, Sparkles, Wallet, } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { formatIDR, relativeTime } from '../../lib/format';
import { JOB_CATEGORIES, getJobStatus } from '../../lib/status';
import { Badge, Button, Callout, ConfirmDialog, EmptyState, Modal, PageHeader, SearchField, SimulationTag, StatusBadge, } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { JobInstructions } from '../../components/jobs/JobBits';
export default function Marketplace() {
    const { state, currentSeller, claimJob } = useApp();
    const toast = useToast();
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [sort, setSort] = useState('NEWEST');
    const [selected, setSelected] = useState(null);
    const [claimConfirm, setClaimConfirm] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const marketplaceJobs = state.jobs
        .filter((job) => job.status === 'AVAILABLE')
        .filter((job) => {
        const matchesQuery = !query.trim() ||
            job.title.toLowerCase().includes(query.toLowerCase()) ||
            job.id.toLowerCase().includes(query.toLowerCase());
        const matchesCategory = category === 'ALL' || job.category === category;
        const matchesStatus = statusFilter === 'ALL' ||
            (statusFilter === 'PAUSED' ? Boolean(job.paused) : !job.paused);
        return matchesQuery && matchesCategory && matchesStatus;
    })
        .sort((a, b) => {
        if (sort === 'RATE_HIGH')
            return b.rate - a.rate;
        if (sort === 'RATE_LOW')
            return a.rate - b.rate;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    const availableCount = state.jobs.filter((job) => job.status === 'AVAILABLE' && !job.paused).length;
    const hasFilters = Boolean(query.trim()) || category !== 'ALL' || statusFilter !== 'ALL';
    const resetFilters = () => {
        setQuery('');
        setCategory('ALL');
        setStatusFilter('ALL');
        setSort('NEWEST');
    };
    const reload = () => {
        setRefreshing(true);
        window.setTimeout(() => {
            setRefreshing(false);
            toast.info('Daftar pekerjaan demo dimuat ulang dari state lokal.');
        }, 650);
    };
    const confirmClaim = () => {
        if (!selected)
            return;
        const result = claimJob(selected.id);
        setClaimConfirm(false);
        if (result.ok) {
            setSelected(null);
            toast.success(result.message, 'Simulasi klaim berhasil');
        }
        else {
            toast.error(result.message);
        }
    };
    const activeSelected = selected ? state.jobs.find((job) => job.id === selected.id) ?? selected : null;
    return (_jsxs("div", { className: "page page-enter", children: [_jsx(PageHeader, { eyebrow: "Marketplace pekerjaan", title: "Temukan pekerjaan berikutnya", description: `${availableCount} pekerjaan tersedia pada data demo. Tarif dikunci saat klaim dan deadline dihitung 24 jam sejak klaim berhasil.`, actions: _jsxs(_Fragment, { children: [_jsx(SimulationTag, { children: "Marketplace simulasi" }), _jsx(Button, { variant: "secondary", iconLeft: RefreshCw, onClick: reload, loading: refreshing, children: "Muat ulang" })] }) }), currentSeller.status !== 'ACTIVE' ? (_jsxs(Callout, { tone: "danger", title: "Akun demo tidak aktif", children: ["Seller dengan status ", currentSeller.status, " tidak dapat mengklaim pekerjaan pada simulasi."] })) : (_jsx(Callout, { tone: "info", icon: ShieldCheck, title: "Tarif terkunci setelah klaim", children: "Klaim pada prototype hanya mengubah data di peramban ini. Tidak ada penguncian global di server dan tidak ada uang yang diproses." })), _jsx("div", { className: "filter-panel", children: _jsxs("div", { className: "filter-bar", children: [_jsx(SearchField, { label: "Cari pekerjaan berdasarkan nama atau ID", value: query, onChange: setQuery, placeholder: "Cari nama atau ID pekerjaan\u2026" }), _jsxs("div", { className: "filter-bar__control", children: [_jsx("label", { className: "filter-label", htmlFor: "market-category", children: "Kategori" }), _jsx("div", { className: "select-wrap", children: _jsxs("select", { id: "market-category", className: "select", value: category, onChange: (event) => setCategory(event.target.value), children: [_jsx("option", { value: "ALL", children: "Semua kategori" }), JOB_CATEGORIES.map((item) => (_jsx("option", { value: item, children: item }, item)))] }) })] }), _jsxs("div", { className: "filter-bar__control", children: [_jsx("label", { className: "filter-label", htmlFor: "market-status", children: "Status" }), _jsx("div", { className: "select-wrap", children: _jsxs("select", { id: "market-status", className: "select", value: statusFilter, onChange: (event) => setStatusFilter(event.target.value), children: [_jsx("option", { value: "ALL", children: "Semua" }), _jsx("option", { value: "AVAILABLE", children: "Tersedia" }), _jsx("option", { value: "PAUSED", children: "Dijeda" })] }) })] }), _jsxs("div", { className: "filter-bar__control", children: [_jsx("label", { className: "filter-label", htmlFor: "market-sort", children: "Urutkan" }), _jsx("div", { className: "select-wrap", children: _jsxs("select", { id: "market-sort", className: "select", value: sort, onChange: (event) => setSort(event.target.value), children: [_jsx("option", { value: "NEWEST", children: "Terbaru" }), _jsx("option", { value: "RATE_HIGH", children: "Tarif tertinggi" }), _jsx("option", { value: "RATE_LOW", children: "Tarif terendah" })] }) })] }), _jsxs("p", { className: "filter-bar__result", children: [marketplaceJobs.length, " pekerjaan ditemukan"] })] }) }), refreshing ? (_jsx("div", { className: "job-grid", "aria-busy": "true", "aria-label": "Memuat pekerjaan", children: [0, 1, 2, 3].map((item) => (_jsxs("div", { className: "job-card job-card--skeleton", children: [_jsx("span", { className: "skeleton", style: { width: '30%', height: 18 } }), _jsx("span", { className: "skeleton", style: { width: '82%', height: 20 } }), _jsx("span", { className: "skeleton", style: { width: '100%', height: 11 } }), _jsx("span", { className: "skeleton", style: { width: '60%', height: 11 } }), _jsx("span", { className: "skeleton", style: { width: '100%', height: 48, marginTop: 14 } })] }, item))) })) : marketplaceJobs.length > 0 ? (_jsx("div", { className: "job-grid", children: marketplaceJobs.map((job) => {
                    const status = getJobStatus(job);
                    return (_jsxs("article", { className: `job-card${job.paused ? ' job-card--paused' : ''}`, children: [_jsxs("div", { className: "job-card__head", children: [_jsxs("div", { className: "job-card__chips", children: [_jsx("span", { className: "chip", children: job.category }), relativeTime(job.createdAt).includes('jam') || relativeTime(job.createdAt).includes('menit') ? (_jsxs("span", { className: "chip chip--new", children: [_jsx(Sparkles, { size: 10, "aria-hidden": "true" }), "Baru"] })) : null] }), _jsx(StatusBadge, { meta: status })] }), _jsxs("div", { children: [_jsx("p", { className: "cell-id", children: job.id }), _jsx("h3", { className: "job-card__title", children: job.title }), _jsx("p", { className: "job-card__description", children: job.description })] }), _jsxs("div", { className: "job-card__facts", children: [_jsxs("div", { children: [_jsxs("span", { className: "job-card__fact-label", children: [_jsx(Wallet, { size: 12, "aria-hidden": "true" }), "Tarif tetap"] }), _jsx("strong", { children: formatIDR(job.rate) })] }), _jsxs("div", { children: [_jsxs("span", { className: "job-card__fact-label", children: [_jsx(CalendarClock, { size: 12, "aria-hidden": "true" }), "Estimasi"] }), _jsxs("strong", { children: [job.deadlineHours, " jam"] })] })] }), _jsxs("div", { className: "job-card__footer", children: [_jsx("span", { className: "job-card__note", children: job.paused ? 'Dijeda admin' : `Dibuat ${relativeTime(job.createdAt)}` }), _jsx(Button, { variant: "secondary", size: "sm", onClick: () => setSelected(job), children: "Lihat detail" })] })] }, job.id));
                }) })) : (_jsx("div", { className: "panel", children: _jsx(EmptyState, { icon: Search, title: "Pekerjaan tidak ditemukan", description: "Coba kata kunci lain atau reset filter untuk melihat seluruh pekerjaan demo yang tersedia.", action: hasFilters ? (_jsx(Button, { variant: "primary", size: "sm", onClick: resetFilters, children: "Reset filter" })) : (_jsx(Button, { variant: "secondary", size: "sm", iconLeft: RefreshCw, onClick: reload, children: "Muat ulang data demo" })) }) })), activeSelected ? (_jsx(Modal, { open: Boolean(selected), onClose: () => setSelected(null), title: activeSelected.title, description: `${activeSelected.id} · ${activeSelected.category}`, eyebrow: "Detail pekerjaan", size: "lg", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", onClick: () => setSelected(null), children: "Tutup" }), _jsx(Button, { variant: "primary", iconLeft: ClipboardList, onClick: () => setClaimConfirm(true), disabled: activeSelected.status !== 'AVAILABLE' || activeSelected.paused || currentSeller.status !== 'ACTIVE', children: activeSelected.paused ? 'Dijeda admin' : 'Ambil pekerjaan' })] }), children: _jsxs("div", { className: "job-detail", children: [_jsxs("div", { className: "job-detail__top", children: [_jsx(StatusBadge, { meta: getJobStatus(activeSelected) }), _jsx(SimulationTag, { children: "Data demo" })] }), activeSelected.paused ? (_jsx(Callout, { tone: "warning", title: "Pekerjaan sedang dijeda", children: "Admin menjeda pekerjaan ini pada data demo. Detail tetap dapat dilihat, tetapi klaim dinonaktifkan." })) : null, _jsx("p", { className: "job-detail__description", children: activeSelected.description }), _jsxs("div", { className: "detail-stat-grid", children: [_jsxs("div", { children: [_jsx("span", { children: "Tarif tetap" }), _jsx("strong", { children: formatIDR(activeSelected.rate) })] }), _jsxs("div", { children: [_jsx("span", { children: "Estimasi deadline" }), _jsxs("strong", { children: [activeSelected.deadlineHours, " jam"] }), _jsx("small", { children: "Dihitung sejak klaim" })] }), _jsxs("div", { children: [_jsx("span", { children: "Maksimum revisi" }), _jsxs("strong", { children: [state.settings.maxRevisions, " kali"] })] })] }), _jsxs("section", { className: "detail-section", children: [_jsx("h3", { children: "Instruksi pekerjaan" }), _jsx(JobInstructions, { job: activeSelected })] }), _jsxs("section", { className: "detail-section", children: [_jsx("h3", { children: "Ketentuan penyelesaian" }), _jsxs("ul", { className: "rule-list", children: [_jsxs("li", { children: [_jsx(CheckCircle2, { size: 14, "aria-hidden": "true" }), " Hasil dikirim melalui halaman Pekerjaan Saya dengan minimal satu lampiran."] }), _jsxs("li", { children: [_jsx(Lock, { size: 14, "aria-hidden": "true" }), " Tarif terkunci ketika pekerjaan berhasil diklaim."] }), _jsxs("li", { children: [_jsx(Clock3, { size: 14, "aria-hidden": "true" }), " Deadline simulasi ", activeSelected.deadlineHours, " jam sejak klaim. Bukan SLA produksi."] }), _jsxs("li", { children: [_jsx(BadgeCheck, { size: 14, "aria-hidden": "true" }), " Maksimum ", state.settings.maxRevisions, " permintaan revisi. Hasil sebelumnya tetap tersimpan pada demo."] })] })] }), _jsx(Callout, { tone: "warning", title: "Klaim hanya simulasi UI", children: "Konfirmasi akan mengubah status pekerjaan secara lokal dan memindahkannya ke Pekerjaan Saya. Pekerjaan tidak dikunci secara global karena belum ada server." })] }) })) : null, _jsxs(ConfirmDialog, { open: claimConfirm, onClose: () => setClaimConfirm(false), onConfirm: confirmClaim, title: "Ambil pekerjaan ini?", description: activeSelected
                    ? `${activeSelected.id} · ${activeSelected.title} akan masuk ke Pekerjaan Saya dengan tarif ${formatIDR(activeSelected.rate)}.`
                    : 'Pekerjaan akan diklaim pada data demo.', confirmLabel: "Ya, ambil pekerjaan", children: [activeSelected ? (_jsxs("div", { className: "confirm-summary", children: [_jsxs("div", { children: [_jsx("span", { children: "Tarif terkunci" }), _jsx("strong", { children: formatIDR(activeSelected.rate) })] }), _jsxs("div", { children: [_jsx("span", { children: "Deadline simulasi" }), _jsxs("strong", { children: [activeSelected.deadlineHours, " jam sejak klaim"] })] }), _jsxs("div", { children: [_jsx("span", { children: "Status setelah klaim" }), _jsx(Badge, { tone: "accent", children: "Dikerjakan" })] })] })) : null, _jsx(Callout, { tone: "warning", title: "Bukan penguncian global", children: "State demo berubah hanya di peramban ini. Pada tahap backend, klaim harus memakai operasi database atomik agar satu pekerjaan hanya dapat diambil satu seller." })] })] }));
}
