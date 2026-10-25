import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { Eye, Fingerprint, History, RotateCcw, Search, ShieldCheck, } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { formatDateTime, relativeTime } from '../../lib/format';
import { AUDIT_CATEGORY } from '../../lib/status';
import { Badge, Button, Callout, EmptyState, Modal, PageHeader, Pagination, Panel, SearchField, SelectField, SimulationTag, Tabs, TextField, } from '../../components/ui';
const PAGE_SIZE = 10;
const fromTime = (value) => new Date(`${value}T00:00:00`).getTime();
const toTime = (value) => new Date(`${value}T23:59:59.999`).getTime();
export default function AuditLog() {
    const { state } = useApp();
    const [tab, setTab] = useState('ALL');
    const [query, setQuery] = useState('');
    const [actor, setActor] = useState('ALL');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const [selectedId, setSelectedId] = useState(null);
    const actors = useMemo(() => Array.from(new Set(state.audit.map((entry) => entry.actor))).sort((a, b) => a.localeCompare(b, 'id')), [state.audit]);
    const categoryCounts = useMemo(() => {
        const counts = {
            PEKERJAAN: 0,
            SELLER: 0,
            KEUANGAN: 0,
            KEAMANAN: 0,
            INTEGRASI: 0,
        };
        state.audit.forEach((entry) => {
            counts[entry.category] += 1;
        });
        return counts;
    }, [state.audit]);
    const invalidRange = Boolean(dateFrom && dateTo && fromTime(dateFrom) > toTime(dateTo));
    const filtered = useMemo(() => {
        return state.audit
            .filter((entry) => {
            if (tab !== 'ALL' && entry.category !== tab)
                return false;
            if (actor !== 'ALL' && entry.actor !== actor)
                return false;
            if (dateFrom && new Date(entry.timestamp).getTime() < fromTime(dateFrom))
                return false;
            if (dateTo && new Date(entry.timestamp).getTime() > toTime(dateTo))
                return false;
            if (!query.trim())
                return true;
            const needle = query.toLowerCase();
            return (entry.id.toLowerCase().includes(needle) ||
                entry.action.toLowerCase().includes(needle) ||
                entry.actor.toLowerCase().includes(needle) ||
                entry.objectRef.toLowerCase().includes(needle) ||
                entry.summary.toLowerCase().includes(needle) ||
                (entry.reason?.toLowerCase().includes(needle) ?? false));
        })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [state.audit, tab, actor, dateFrom, dateTo, query]);
    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const selected = state.audit.find((entry) => entry.id === selectedId) ?? null;
    const hasFilters = Boolean(query.trim() || tab !== 'ALL' || actor !== 'ALL' || dateFrom || dateTo);
    const resetFilters = () => {
        setTab('ALL');
        setQuery('');
        setActor('ALL');
        setDateFrom('');
        setDateTo('');
        setPage(1);
    };
    return (_jsxs("div", { className: "page page-enter", children: [_jsx(PageHeader, { eyebrow: "Panel admin", title: "Audit log", description: "Jejak tindakan admin dan seller pada data simulasi. Log dirancang hanya-baca dan tidak dapat disunting.", actions: _jsx(SimulationTag, { children: "Append-only demo" }) }), _jsx(Callout, { tone: "info", icon: ShieldCheck, title: "Log hanya-baca pada prototype", children: "Data audit tidak menyediakan aksi ubah atau hapus. Pada sistem produksi, log harus memiliki kontrol akses, retensi, dan penyimpanan append-only yang tahan manipulasi." }), _jsxs("div", { className: "audit-summary", children: [_jsxs("div", { children: [_jsx("span", { className: "audit-summary__icon", "aria-hidden": "true", children: _jsx(History, { size: 17 }) }), _jsxs("div", { children: [_jsx("strong", { children: state.audit.length }), _jsx("span", { children: "total entri audit" })] })] }), Object.keys(categoryCounts).map((category) => (_jsxs("div", { className: "audit-summary__category", children: [_jsx(Badge, { tone: AUDIT_CATEGORY[category].tone, children: AUDIT_CATEGORY[category].label }), _jsx("strong", { children: categoryCounts[category] })] }, category)))] }), _jsxs(Panel, { title: "Jejak audit", description: "Cari berdasarkan aktor, aksi, objek, atau ringkasan.", action: _jsxs(Badge, { tone: "neutral", children: [filtered.length, " hasil"] }), children: [_jsx(Tabs, { label: "Filter kategori audit", value: tab, onChange: (value) => {
                            setTab(value);
                            setPage(1);
                        }, items: [
                            { id: 'ALL', label: 'Semua', count: state.audit.length },
                            ...Object.keys(categoryCounts).map((category) => ({
                                id: category,
                                label: AUDIT_CATEGORY[category].label,
                                count: categoryCounts[category],
                            })),
                        ] }), _jsxs("div", { className: "filter-bar jobs-toolbar", children: [_jsx(SearchField, { label: "Cari audit log", value: query, onChange: (value) => {
                                    setQuery(value);
                                    setPage(1);
                                }, placeholder: "Cari aktor, aksi, atau referensi objek\u2026" }), _jsx(SelectField, { label: "Aktor", fieldClassName: "filter-bar__control", value: actor, onChange: (event) => {
                                    setActor(event.target.value);
                                    setPage(1);
                                }, options: [
                                    { value: 'ALL', label: 'Semua aktor' },
                                    ...actors.map((item) => ({ value: item, label: item })),
                                ] }), _jsx(TextField, { label: "Dari tanggal", type: "date", fieldClassName: "filter-bar__control", value: dateFrom, max: dateTo || undefined, onChange: (event) => {
                                    setDateFrom(event.target.value);
                                    setPage(1);
                                } }), _jsx(TextField, { label: "Sampai tanggal", type: "date", fieldClassName: "filter-bar__control", value: dateTo, min: dateFrom || undefined, onChange: (event) => {
                                    setDateTo(event.target.value);
                                    setPage(1);
                                } }), _jsx(Button, { variant: "ghost", size: "sm", iconLeft: RotateCcw, onClick: resetFilters, disabled: !hasFilters, className: "filter-reset", children: "Reset" })] }), invalidRange ? (_jsx("p", { className: "field__error", role: "alert", children: "Tanggal awal tidak boleh melewati tanggal akhir." })) : null, pageItems.length > 0 && !invalidRange ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "table-wrap", children: _jsxs("table", { className: "data-table audit-table", children: [_jsx("caption", { className: "sr-only", children: "Audit log admin, diurutkan dari yang terbaru" }), _jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Waktu" }), _jsx("th", { scope: "col", children: "Aktor" }), _jsx("th", { scope: "col", children: "Kategori" }), _jsx("th", { scope: "col", children: "Tindakan" }), _jsx("th", { scope: "col", children: "Objek" }), _jsx("th", { scope: "col", children: _jsx("span", { className: "sr-only", children: "Aksi" }) })] }) }), _jsx("tbody", { children: pageItems.map((entry) => (_jsxs("tr", { children: [_jsxs("td", { children: [_jsx("div", { className: "cell-title", children: relativeTime(entry.timestamp) }), _jsx("div", { className: "cell-sub", children: formatDateTime(entry.timestamp) })] }), _jsxs("td", { children: [_jsx("div", { className: "cell-title", children: entry.actor }), _jsx("div", { className: "cell-sub mono", children: entry.id })] }), _jsx("td", { children: _jsx(Badge, { tone: AUDIT_CATEGORY[entry.category].tone, children: AUDIT_CATEGORY[entry.category].label }) }), _jsxs("td", { children: [_jsx("div", { className: "cell-title", children: entry.action }), _jsx("div", { className: "cell-sub audit-summary-cell", children: entry.summary })] }), _jsxs("td", { children: [_jsx("div", { className: "cell-title", children: entry.objectType }), _jsx("div", { className: "cell-sub mono", children: entry.objectRef })] }), _jsx("td", { children: _jsx("div", { className: "cell-actions", children: _jsx(Button, { variant: "ghost", size: "sm", iconLeft: Eye, onClick: () => setSelectedId(entry.id), "aria-label": `Lihat detail audit ${entry.id}`, children: "Detail" }) }) })] }, entry.id))) })] }) }), _jsxs("div", { className: "table-footer", children: [_jsxs("p", { className: "result-count", children: ["Menampilkan ", _jsxs("strong", { children: [(currentPage - 1) * PAGE_SIZE + 1, "\u2013", Math.min(currentPage * PAGE_SIZE, filtered.length)] }), ' ', "dari ", _jsx("strong", { children: filtered.length }), " entri"] }), _jsx(Pagination, { page: currentPage, pageSize: PAGE_SIZE, total: filtered.length, onChange: setPage })] })] })) : (_jsx(EmptyState, { icon: hasFilters ? Search : History, title: hasFilters ? 'Audit tidak ditemukan' : 'Belum ada audit', description: hasFilters
                            ? 'Tidak ada entri audit yang cocok dengan filter dan pencarian saat ini.'
                            : 'Tindakan pada data demo akan tercatat di sini.', action: hasFilters ? (_jsx(Button, { variant: "secondary", size: "sm", iconLeft: RotateCcw, onClick: resetFilters, children: "Reset filter" })) : undefined }))] }), selected ? (_jsx(Modal, { open: Boolean(selected), onClose: () => setSelectedId(null), title: selected.action, description: `${selected.id} · ${formatDateTime(selected.timestamp)}`, eyebrow: "Detail audit", size: "md", footer: _jsx(Button, { variant: "secondary", onClick: () => setSelectedId(null), children: "Tutup" }), children: _jsx(AuditDetail, { entry: selected }) })) : null] }));
}
function AuditDetail({ entry }) {
    return (_jsxs("div", { className: "audit-detail", children: [_jsxs("div", { className: "audit-detail__badges", children: [_jsx(Badge, { tone: AUDIT_CATEGORY[entry.category].tone, children: AUDIT_CATEGORY[entry.category].label }), _jsxs(Badge, { tone: "neutral", children: [_jsx(Fingerprint, { size: 10, "aria-hidden": "true" }), " Append-only"] }), _jsx("span", { className: "mono", children: entry.id })] }), _jsxs("div", { className: "confirm-summary", children: [_jsxs("div", { children: [_jsx("span", { children: "Aktor" }), _jsx("strong", { children: entry.actor })] }), _jsxs("div", { children: [_jsx("span", { children: "Waktu" }), _jsx("strong", { children: formatDateTime(entry.timestamp) })] }), _jsxs("div", { children: [_jsx("span", { children: "Objek" }), _jsxs("strong", { children: [entry.objectType, " \u00B7 ", _jsx("span", { className: "mono", children: entry.objectRef })] })] }), _jsxs("div", { children: [_jsx("span", { children: "Kategori" }), _jsx("strong", { children: AUDIT_CATEGORY[entry.category].label })] })] }), _jsxs("section", { className: "detail-section", children: [_jsx("h3", { children: "Tindakan" }), _jsx("p", { className: "detail-prose", children: entry.action }), _jsx("p", { className: "detail-prose", children: entry.summary })] }), _jsxs("section", { className: "detail-section", children: [_jsx("h3", { children: "Alasan / catatan" }), _jsx("p", { className: "detail-prose", children: entry.reason ?? 'Tidak ada catatan tambahan.' })] }), _jsx(Callout, { tone: "info", icon: ShieldCheck, title: "Entri tidak dapat diubah", children: "Pada prototype, entri audit hanya ditambahkan oleh aksi aplikasi. Tidak ada tombol sunting atau hapus." })] }));
}
