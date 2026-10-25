import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight, CircleSlash2, Clock3, Eye, RotateCcw, Search, Wallet, } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { formatDate, formatDateTime, formatIDR } from '../../lib/format';
import { TX_STATUS, TX_TYPE } from '../../lib/status';
import { Badge, Button, Callout, EmptyState, Modal, PageHeader, Panel, SelectField, SimulationTag, StatusBadge, TextField, } from '../../components/ui';
const PAGE_SIZE = 8;
const inputFromDate = (date) => new Date(`${date}T00:00:00`).getTime();
const inputToDate = (date) => new Date(`${date}T23:59:59.999`).getTime();
export default function Transactions() {
    const { state, currentSeller } = useApp();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [type, setType] = useState('ALL');
    const [status, setStatus] = useState('ALL');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const [selectedId, setSelectedId] = useState(null);
    const resetPage = () => setPage(1);
    const filtered = useMemo(() => {
        return state.transactions
            .filter((transaction) => {
            if (type !== 'ALL' && transaction.type !== type)
                return false;
            if (status !== 'ALL' && transaction.status !== status)
                return false;
            if (dateFrom && new Date(transaction.date).getTime() < inputFromDate(dateFrom))
                return false;
            if (dateTo && new Date(transaction.date).getTime() > inputToDate(dateTo))
                return false;
            if (query.trim()) {
                const needle = query.toLowerCase();
                return (transaction.id.toLowerCase().includes(needle) ||
                    transaction.description.toLowerCase().includes(needle) ||
                    transaction.reference.toLowerCase().includes(needle));
            }
            return true;
        })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [state.transactions, type, status, dateFrom, dateTo, query]);
    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const summary = useMemo(() => {
        const successful = filtered.filter((transaction) => transaction.status === 'SUCCESS');
        return {
            incoming: successful.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0),
            outgoing: Math.abs(successful.filter((item) => item.amount < 0).reduce((sum, item) => sum + item.amount, 0)),
            pending: Math.abs(filtered
                .filter((item) => item.status === 'PENDING')
                .reduce((sum, item) => sum + item.amount, 0)),
        };
    }, [filtered]);
    const selected = state.transactions.find((transaction) => transaction.id === selectedId) ?? null;
    const hasFilters = Boolean(query || type !== 'ALL' || status !== 'ALL' || dateFrom || dateTo);
    const resetFilters = () => {
        setQuery('');
        setType('ALL');
        setStatus('ALL');
        setDateFrom('');
        setDateTo('');
        resetPage();
    };
    const relatedJob = selected?.type === 'COMMISSION'
        ? state.jobs.find((job) => job.id === selected.reference && job.sellerId === currentSeller.id)
        : undefined;
    return (_jsxs("div", { className: "page page-enter", children: [_jsx(PageHeader, { eyebrow: "Keuangan seller", title: "Riwayat transaksi", description: "Telusuri komisi masuk, penarikan, koreksi, dan refund pada data demo. Gunakan filter untuk mempersempit daftar.", actions: _jsxs(Link, { to: "/seller/finance", className: "btn btn--secondary", children: [_jsx(ArrowLeft, { size: 15, "aria-hidden": "true" }), "Kembali ke keuangan"] }) }), _jsx(Callout, { tone: "info", icon: Wallet, title: "Seluruh transaksi adalah simulasi", children: "Tidak ada transaksi keuangan nyata. Status SUCCESS pada prototype hanya menandai data demo yang dianggap selesai, bukan konfirmasi pembayaran." }), _jsxs("div", { className: "tx-summary", "aria-label": "Ringkasan transaksi terfilter", children: [_jsxs("div", { className: "tx-summary__item", children: [_jsx("span", { className: "tx-summary__icon is-incoming", "aria-hidden": "true", children: _jsx(ArrowDownLeft, { size: 16 }) }), _jsxs("div", { children: [_jsx("span", { children: "Komisi masuk" }), _jsx("strong", { children: formatIDR(summary.incoming) })] })] }), _jsxs("div", { className: "tx-summary__item", children: [_jsx("span", { className: "tx-summary__icon is-outgoing", "aria-hidden": "true", children: _jsx(ArrowUpRight, { size: 16 }) }), _jsxs("div", { children: [_jsx("span", { children: "Penarikan berhasil" }), _jsx("strong", { children: formatIDR(summary.outgoing) })] })] }), _jsxs("div", { className: "tx-summary__item", children: [_jsx("span", { className: "tx-summary__icon is-pending", "aria-hidden": "true", children: _jsx(Clock3, { size: 16 }) }), _jsxs("div", { children: [_jsx("span", { children: "Nominal pending" }), _jsx("strong", { children: formatIDR(summary.pending) })] })] }), _jsxs("div", { className: "tx-summary__count", children: [_jsx("strong", { children: filtered.length }), _jsx("span", { children: "transaksi terfilter" })] })] }), _jsxs(Panel, { title: "Daftar transaksi", description: "Data demo, diurutkan dari yang terbaru.", action: _jsx(SimulationTag, { children: "Data lokal" }), children: [_jsxs("div", { className: "filter-panel", children: [_jsxs("div", { className: "filter-bar", children: [_jsxs("label", { className: "search-field transactions-search", children: [_jsx("span", { className: "sr-only", children: "Cari transaksi berdasarkan ID, deskripsi, atau referensi" }), _jsx(Search, { size: 14, className: "search-field__icon", "aria-hidden": "true" }), _jsx("input", { type: "search", className: "search-field__input", placeholder: "Cari ID, deskripsi, referensi\u2026", value: query, onChange: (event) => {
                                                    setQuery(event.target.value);
                                                    resetPage();
                                                } }), query ? (_jsx("button", { className: "search-field__clear", type: "button", onClick: () => { setQuery(''); resetPage(); }, "aria-label": "Hapus pencarian", children: "\u00D7" })) : null] }), _jsx(SelectField, { label: "Jenis", fieldClassName: "filter-bar__control", value: type, onChange: (event) => {
                                            setType(event.target.value);
                                            resetPage();
                                        }, options: [
                                            { value: 'ALL', label: 'Semua jenis' },
                                            { value: 'COMMISSION', label: 'Komisi' },
                                            { value: 'WITHDRAWAL', label: 'Penarikan' },
                                            { value: 'ADJUSTMENT', label: 'Koreksi' },
                                            { value: 'REFUND', label: 'Refund' },
                                        ] }), _jsx(SelectField, { label: "Status", fieldClassName: "filter-bar__control", value: status, onChange: (event) => {
                                            setStatus(event.target.value);
                                            resetPage();
                                        }, options: [
                                            { value: 'ALL', label: 'Semua status' },
                                            { value: 'SUCCESS', label: 'Berhasil' },
                                            { value: 'PENDING', label: 'Pending' },
                                            { value: 'FAILED', label: 'Gagal' },
                                        ] }), _jsx(TextField, { label: "Dari tanggal", type: "date", fieldClassName: "filter-bar__control", value: dateFrom, max: dateTo || undefined, onChange: (event) => {
                                            setDateFrom(event.target.value);
                                            resetPage();
                                        } }), _jsx(TextField, { label: "Sampai tanggal", type: "date", fieldClassName: "filter-bar__control", value: dateTo, min: dateFrom || undefined, onChange: (event) => {
                                            setDateTo(event.target.value);
                                            resetPage();
                                        } }), _jsx(Button, { variant: "ghost", size: "sm", iconLeft: RotateCcw, onClick: resetFilters, disabled: !hasFilters, className: "filter-reset", children: "Reset" })] }), dateFrom && dateTo && inputFromDate(dateFrom) > inputToDate(dateTo) ? (_jsx("p", { className: "field__error", role: "alert", children: "Tanggal awal tidak boleh melewati tanggal akhir. Sesuaikan filter tanggal." })) : null] }), filtered.length > 0 && !(dateFrom && dateTo && inputFromDate(dateFrom) > inputToDate(dateTo)) ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "table-wrap", children: _jsxs("table", { className: "data-table", children: [_jsx("caption", { className: "sr-only", children: "Riwayat transaksi seller, diurutkan dari terbaru" }), _jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Transaksi" }), _jsx("th", { scope: "col", children: "Jenis" }), _jsx("th", { scope: "col", children: "Tanggal" }), _jsx("th", { scope: "col", children: "Status" }), _jsx("th", { scope: "col", className: "num", children: "Nominal" }), _jsx("th", { scope: "col", children: _jsx("span", { className: "sr-only", children: "Aksi" }) })] }) }), _jsx("tbody", { children: pageItems.map((transaction) => (_jsxs("tr", { children: [_jsxs("td", { children: [_jsx("div", { className: "cell-title", children: transaction.description }), _jsxs("div", { className: "cell-sub", children: [_jsx("span", { className: "mono", children: transaction.id }), " \u00B7 Ref. ", transaction.reference] })] }), _jsx("td", { children: _jsx(Badge, { tone: "neutral", children: TX_TYPE[transaction.type].label }) }), _jsx("td", { children: formatDate(transaction.date) }), _jsx("td", { children: _jsx(StatusBadge, { meta: TX_STATUS[transaction.status] }) }), _jsxs("td", { className: `num cell-amount ${transaction.amount > 0 ? 'text-success' : transaction.status === 'FAILED' ? 'text-muted' : ''}`, children: [transaction.amount > 0 ? '+' : '−', " ", formatIDR(Math.abs(transaction.amount))] }), _jsx("td", { children: _jsx("div", { className: "cell-actions", children: _jsx(Button, { variant: "ghost", size: "sm", iconLeft: Eye, onClick: () => setSelectedId(transaction.id), "aria-label": `Lihat detail ${transaction.id}`, children: "Detail" }) }) })] }, transaction.id))) })] }) }), _jsxs("div", { className: "table-footer", children: [_jsxs("p", { className: "result-count", children: ["Menampilkan ", _jsxs("strong", { children: [(currentPage - 1) * PAGE_SIZE + 1, "\u2013", Math.min(currentPage * PAGE_SIZE, filtered.length)] }), ' ', "dari ", _jsx("strong", { children: filtered.length }), " transaksi"] }), _jsxs("nav", { className: "pagination", "aria-label": "Navigasi halaman transaksi", children: [_jsx("button", { type: "button", className: "pagination__button", onClick: () => setPage((value) => Math.max(1, value - 1)), disabled: currentPage === 1, "aria-label": "Halaman sebelumnya", children: "\u2039" }), Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (_jsx("button", { type: "button", className: `pagination__button${pageNumber === currentPage ? ' is-active' : ''}`, onClick: () => setPage(pageNumber), "aria-label": `Halaman ${pageNumber}`, "aria-current": pageNumber === currentPage ? 'page' : undefined, children: pageNumber }, pageNumber))), _jsx("button", { type: "button", className: "pagination__button", onClick: () => setPage((value) => Math.min(pageCount, value + 1)), disabled: currentPage === pageCount, "aria-label": "Halaman berikutnya", children: "\u203A" })] })] })] })) : (_jsx(EmptyState, { icon: CircleSlash2, title: hasFilters ? 'Tidak ada transaksi yang cocok' : 'Belum ada transaksi', description: hasFilters
                            ? 'Ubah atau reset filter untuk melihat transaksi demo lainnya.'
                            : 'Komisi dan penarikan pertama akan muncul di sini setelah alur demo dijalankan.', action: hasFilters ? (_jsx(Button, { variant: "secondary", size: "sm", iconLeft: RotateCcw, onClick: resetFilters, children: "Reset filter" })) : (_jsx(Button, { variant: "primary", size: "sm", onClick: () => navigate('/seller/finance'), children: "Buka keuangan" })) }))] }), selected ? (_jsx(Modal, { open: Boolean(selected), onClose: () => setSelectedId(null), title: selected.description, description: `${selected.id} · ${formatDateTime(selected.date)}`, eyebrow: "Detail transaksi", size: "md", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", onClick: () => setSelectedId(null), children: "Tutup" }), relatedJob ? (_jsx(Button, { variant: "primary", iconLeft: ArrowRight, onClick: () => {
                                setSelectedId(null);
                                navigate('/seller/jobs');
                            }, children: "Buka pekerjaan" })) : selected.type === 'WITHDRAWAL' ? (_jsx(Button, { variant: "primary", iconLeft: ArrowRight, onClick: () => {
                                setSelectedId(null);
                                navigate('/seller/finance');
                            }, children: "Buka keuangan" })) : null] }), children: _jsxs("div", { className: "tx-detail", children: [_jsxs("div", { className: "withdraw-detail__hero", children: [_jsxs("div", { children: [_jsx("span", { children: "Nominal transaksi" }), _jsxs("strong", { className: selected.amount > 0 ? 'text-success' : '', children: [selected.amount > 0 ? '+' : '−', " ", formatIDR(Math.abs(selected.amount))] })] }), _jsx(StatusBadge, { meta: TX_STATUS[selected.status] })] }), _jsxs("div", { className: "confirm-summary", children: [_jsxs("div", { children: [_jsx("span", { children: "ID transaksi" }), _jsx("strong", { className: "mono", children: selected.id })] }), _jsxs("div", { children: [_jsx("span", { children: "Jenis" }), _jsx("strong", { children: TX_TYPE[selected.type].label })] }), _jsxs("div", { children: [_jsx("span", { children: "Tanggal" }), _jsx("strong", { children: formatDateTime(selected.date) })] }), _jsxs("div", { children: [_jsx("span", { children: "Referensi" }), _jsx("strong", { className: "mono", children: selected.reference })] })] }), selected.status === 'PENDING' ? (_jsx(Callout, { tone: "warning", icon: Clock3, title: "Transaksi masih pending", children: "Nominal ini belum dianggap selesai. Untuk penarikan, saldo ditahan sampai admin menyelesaikan pemeriksaan pada data demo." })) : null, selected.status === 'FAILED' ? (_jsx(Callout, { tone: "danger", icon: CircleSlash2, title: "Transaksi gagal", children: "Transaksi gagal tidak mengubah saldo akhir. Pada demo, status ini terutama dipakai untuk penarikan yang dibatalkan seller atau ditolak admin." })) : null, _jsxs("p", { className: "detail-footnote", children: ["Catatan ini bersifat simulasi lokal. ", selected.type === 'COMMISSION' ? (_jsx(_Fragment, { children: "Komisi hanya dibuat sekali saat pekerjaan terkait disetujui." })) : selected.type === 'WITHDRAWAL' ? (_jsx(_Fragment, { children: "Pembayaran hanya boleh dikonfirmasi setelah pengajuan diproses admin." })) : (_jsx(_Fragment, { children: "Koreksi dan refund harus memiliki jejak audit pada sistem produksi." }))] })] }) })) : null] }));
}
