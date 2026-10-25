import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Banknote, CheckCircle2, Clock3, CreditCard, RotateCcw, Search, ShieldCheck, Timer, XCircle, } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { formatDate, formatDateTime, formatIDR, maskAccount } from '../../lib/format';
import { SELLER_STATUS, WITHDRAWAL_STATUS } from '../../lib/status';
import { ReasonDialog } from '../../components/common/ReasonDialog';
import { Badge, Button, Callout, CheckboxField, ConfirmDialog, EmptyState, Modal, PageHeader, Pagination, Panel, SearchField, SimulationTag, StatCard, StatusBadge, Tabs, TextField, } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
const PAGE_SIZE = 8;
const tabMatches = (withdrawal, tab) => tab === 'ALL' || withdrawal.status === tab;
export default function Withdrawals() {
    const { state, actOnWithdrawal } = useApp();
    const toast = useToast();
    const [searchParams] = useSearchParams();
    const [tab, setTab] = useState('ALL');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [selectedId, setSelectedId] = useState(searchParams.get('withdrawal'));
    const [confirmAction, setConfirmAction] = useState(null);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [paidOpen, setPaidOpen] = useState(false);
    const [paymentRef, setPaymentRef] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [paidError, setPaidError] = useState('');
    const counts = useMemo(() => ({
        ALL: state.withdrawals.length,
        PENDING: state.withdrawals.filter((item) => item.status === 'PENDING').length,
        APPROVED: state.withdrawals.filter((item) => item.status === 'APPROVED').length,
        PROCESSING: state.withdrawals.filter((item) => item.status === 'PROCESSING').length,
        PAID: state.withdrawals.filter((item) => item.status === 'PAID').length,
        REJECTED: state.withdrawals.filter((item) => item.status === 'REJECTED').length,
        CANCELLED: state.withdrawals.filter((item) => item.status === 'CANCELLED').length,
    }), [state.withdrawals]);
    const pendingTotal = state.withdrawals
        .filter((item) => item.status === 'PENDING')
        .reduce((sum, item) => sum + item.amount, 0);
    const processingItems = state.withdrawals.filter((item) => ['APPROVED', 'PROCESSING'].includes(item.status));
    const processingTotal = processingItems.reduce((sum, item) => sum + item.amount, 0);
    const paidTotal = state.withdrawals
        .filter((item) => item.status === 'PAID')
        .reduce((sum, item) => sum + item.amount, 0);
    const problemCount = state.withdrawals.filter((item) => ['REJECTED', 'CANCELLED'].includes(item.status)).length;
    const filtered = useMemo(() => {
        return state.withdrawals
            .filter((withdrawal) => {
            if (!tabMatches(withdrawal, tab))
                return false;
            if (!query.trim())
                return true;
            const needle = query.toLowerCase();
            return (withdrawal.id.toLowerCase().includes(needle) ||
                withdrawal.sellerName.toLowerCase().includes(needle) ||
                withdrawal.method.toLowerCase().includes(needle) ||
                withdrawal.accountName.toLowerCase().includes(needle) ||
                (withdrawal.paymentRef?.toLowerCase().includes(needle) ?? false));
        })
            .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    }, [state.withdrawals, tab, query]);
    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const selected = state.withdrawals.find((item) => item.id === selectedId) ?? null;
    const selectedSeller = state.sellers.find((seller) => seller.id === selected?.sellerId);
    const hasFilters = Boolean(query.trim());
    useEffect(() => {
        if (!paidOpen)
            return;
        setPaymentRef('');
        setConfirmed(false);
        setPaidError('');
    }, [paidOpen, selectedId]);
    const approve = () => {
        if (!selected)
            return;
        const result = actOnWithdrawal(selected.id, 'APPROVE', {});
        if (result.ok)
            toast.success(result.message, 'Penarikan disetujui');
        else
            toast.error(result.message);
        setConfirmAction(null);
    };
    const process = () => {
        if (!selected)
            return;
        const result = actOnWithdrawal(selected.id, 'PROCESS', {});
        if (result.ok)
            toast.success(result.message, 'Penarikan diproses');
        else
            toast.error(result.message);
        setConfirmAction(null);
    };
    const reject = (reason) => {
        if (!selected)
            return { ok: false, message: 'Pengajuan tidak ditemukan.' };
        const result = actOnWithdrawal(selected.id, 'REJECT', { reason });
        if (result.ok)
            toast.success(result.message, 'Penarikan ditolak');
        return result;
    };
    const markPaid = (event) => {
        event.preventDefault();
        if (!selected)
            return;
        if (!confirmed) {
            setPaidError('Centang konfirmasi verifikasi transfer terlebih dahulu.');
            return;
        }
        if (paymentRef.trim().length < 4) {
            setPaidError('Referensi pembayaran minimal 4 karakter.');
            return;
        }
        const result = actOnWithdrawal(selected.id, 'PAID', { confirmed, paymentRef: paymentRef.trim() });
        if (result.ok) {
            toast.success(result.message, 'Pembayaran dikonfirmasi');
            setPaidOpen(false);
            setPaidError('');
        }
        else {
            setPaidError(result.message);
            toast.error(result.message);
        }
    };
    return (_jsxs("div", { className: "page page-enter", children: [_jsx(PageHeader, { eyebrow: "Panel admin", title: "Penarikan seller", description: "Proses pengajuan penarikan sesuai urutan: setujui, proses, lalu konfirmasi pembayaran dengan referensi.", actions: _jsx(SimulationTag, { children: "Data lokal" }) }), _jsx(Callout, { tone: "warning", icon: ShieldCheck, title: "Tidak ada transfer nyata", children: "Status PAID hanya merupakan penanda demo setelah verifikasi transfer dan referensi pembayaran diisi. Jangan memasukkan data rekening nyata." }), _jsxs("div", { className: "stats-grid", children: [_jsx(StatCard, { label: "Menunggu persetujuan", value: formatIDR(pendingTotal), icon: Clock3, tone: "warning", footnote: `${counts.PENDING} pengajuan PENDING menahan saldo`, simulated: true }), _jsx(StatCard, { label: "Sedang diproses", value: formatIDR(processingTotal), icon: Timer, footnote: `${counts.APPROVED} disetujui · ${counts.PROCESSING} diproses`, simulated: true }), _jsx(StatCard, { label: "Total dibayar", value: formatIDR(paidTotal), icon: BadgeCheck, tone: "success", footnote: `${counts.PAID} penarikan berstatus PAID`, simulated: true }), _jsx(StatCard, { label: "Ditolak / dibatalkan", value: String(problemCount), icon: XCircle, tone: "danger", footnote: `${counts.REJECTED} ditolak · ${counts.CANCELLED} dibatalkan`, simulated: true })] }), _jsxs(Panel, { title: "Antrean penarikan", description: "Data demo diurutkan dari pengajuan terbaru.", action: _jsxs(Badge, { tone: counts.PENDING > 0 ? 'warning' : 'success', children: [counts.PENDING, " perlu ditinjau"] }), children: [_jsx(Tabs, { label: "Filter status penarikan", value: tab, onChange: (value) => {
                            setTab(value);
                            setPage(1);
                        }, items: [
                            { id: 'ALL', label: 'Semua', count: counts.ALL },
                            { id: 'PENDING', label: 'Menunggu', count: counts.PENDING },
                            { id: 'APPROVED', label: 'Disetujui', count: counts.APPROVED },
                            { id: 'PROCESSING', label: 'Diproses', count: counts.PROCESSING },
                            { id: 'PAID', label: 'Dibayar', count: counts.PAID },
                            { id: 'REJECTED', label: 'Ditolak', count: counts.REJECTED },
                            { id: 'CANCELLED', label: 'Dibatalkan', count: counts.CANCELLED },
                        ] }), _jsxs("div", { className: "filter-bar jobs-toolbar", children: [_jsx(SearchField, { label: "Cari penarikan berdasarkan ID seller atau referensi", value: query, onChange: (value) => {
                                    setQuery(value);
                                    setPage(1);
                                }, placeholder: "Cari ID, seller, metode, atau referensi\u2026" }), _jsx(Button, { variant: "ghost", size: "sm", iconLeft: RotateCcw, onClick: () => {
                                    setQuery('');
                                    setPage(1);
                                }, disabled: !hasFilters, className: "filter-reset", children: "Reset" }), _jsxs("span", { className: "filter-bar__result", children: [filtered.length, " pengajuan"] })] }), pageItems.length > 0 ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "table-wrap", children: _jsxs("table", { className: "data-table", children: [_jsx("caption", { className: "sr-only", children: "Antrean penarikan seller" }), _jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Pengajuan" }), _jsx("th", { scope: "col", children: "Seller" }), _jsx("th", { scope: "col", className: "num", children: "Nominal" }), _jsx("th", { scope: "col", children: "Metode" }), _jsx("th", { scope: "col", children: "Diajukan" }), _jsx("th", { scope: "col", children: "Status" }), _jsx("th", { scope: "col", children: _jsx("span", { className: "sr-only", children: "Aksi" }) })] }) }), _jsx("tbody", { children: pageItems.map((withdrawal) => (_jsxs("tr", { children: [_jsxs("td", { children: [_jsx("div", { className: "cell-title mono", children: withdrawal.id }), _jsx("div", { className: "cell-sub", children: withdrawal.paymentRef ? `Ref. ${withdrawal.paymentRef}` : 'Belum ada referensi transfer' })] }), _jsxs("td", { children: [_jsx("div", { className: "cell-title", children: withdrawal.sellerName }), _jsx("div", { className: "cell-sub mono", children: withdrawal.sellerId })] }), _jsx("td", { className: "num cell-amount", children: formatIDR(withdrawal.amount) }), _jsxs("td", { children: [_jsx("div", { className: "cell-title", children: withdrawal.method }), _jsx("div", { className: "cell-sub", children: maskAccount(withdrawal.accountNumber) })] }), _jsx("td", { children: formatDate(withdrawal.requestedAt) }), _jsx("td", { children: _jsx(StatusBadge, { meta: WITHDRAWAL_STATUS[withdrawal.status] }) }), _jsx("td", { children: _jsx("div", { className: "cell-actions", children: _jsx(Button, { variant: "secondary", size: "sm", iconRight: ArrowRight, onClick: () => setSelectedId(withdrawal.id), children: "Tinjau" }) }) })] }, withdrawal.id))) })] }) }), _jsxs("div", { className: "table-footer", children: [_jsxs("p", { className: "result-count", children: ["Menampilkan ", _jsxs("strong", { children: [(currentPage - 1) * PAGE_SIZE + 1, "\u2013", Math.min(currentPage * PAGE_SIZE, filtered.length)] }), ' ', "dari ", _jsx("strong", { children: filtered.length }), " pengajuan"] }), _jsx(Pagination, { page: currentPage, pageSize: PAGE_SIZE, total: filtered.length, onChange: setPage })] })] })) : (_jsx(EmptyState, { icon: Search, title: hasFilters ? 'Pengajuan tidak ditemukan' : 'Tidak ada pengajuan pada filter ini', description: hasFilters
                            ? 'Coba kata kunci lain atau reset pencarian.'
                            : 'Pengajuan penarikan seller akan tampil di antrean ini.', action: hasFilters ? (_jsx(Button, { variant: "secondary", size: "sm", onClick: () => setQuery(''), children: "Hapus pencarian" })) : undefined }))] }), selected ? (_jsx(Modal, { open: Boolean(selected), onClose: () => setSelectedId(null), title: `Penarikan ${selected.id}`, description: `${selected.sellerName} · diajukan ${formatDateTime(selected.requestedAt)}`, eyebrow: "Detail penarikan", size: "lg", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", onClick: () => setSelectedId(null), children: "Tutup" }), selected.status === 'PENDING' ? (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "danger", iconLeft: XCircle, onClick: () => setRejectOpen(true), children: "Tolak" }), _jsx(Button, { variant: "success", iconLeft: CheckCircle2, onClick: () => setConfirmAction('APPROVE'), children: "Setujui" })] })) : null, selected.status === 'APPROVED' ? (_jsx(Button, { variant: "primary", iconLeft: Timer, onClick: () => setConfirmAction('PROCESS'), children: "Tandai diproses" })) : null, selected.status === 'PROCESSING' ? (_jsx(Button, { variant: "success", iconLeft: BadgeCheck, onClick: () => setPaidOpen(true), children: "Konfirmasi pembayaran" })) : null] }), children: _jsxs("div", { className: "withdraw-detail", children: [_jsxs("div", { className: "withdraw-detail__hero", children: [_jsxs("div", { children: [_jsx("span", { children: "Nominal pengajuan" }), _jsx("strong", { children: formatIDR(selected.amount) })] }), _jsx(StatusBadge, { meta: WITHDRAWAL_STATUS[selected.status] })] }), _jsxs("div", { className: "admin-withdrawal-seller", children: [_jsxs("div", { children: [_jsx("span", { children: "Seller" }), _jsx("strong", { children: selected.sellerName }), _jsx("small", { children: selectedSeller?.email ?? selected.sellerId })] }), _jsxs("div", { children: [_jsx("span", { children: "Status seller" }), selectedSeller ? (_jsx(StatusBadge, { meta: SELLER_STATUS[selectedSeller.status] })) : (_jsx(Badge, { tone: "neutral", children: "Tidak ditemukan" }))] })] }), _jsxs("div", { className: "confirm-summary", children: [_jsxs("div", { children: [_jsx("span", { children: "Metode" }), _jsx("strong", { children: selected.method })] }), _jsxs("div", { children: [_jsx("span", { children: "Nama pemilik" }), _jsx("strong", { children: selected.accountName })] }), _jsxs("div", { children: [_jsx("span", { children: "Nomor akun" }), _jsx("strong", { children: maskAccount(selected.accountNumber) })] }), _jsxs("div", { children: [_jsx("span", { children: "Terakhir diperbarui" }), _jsx("strong", { children: formatDateTime(selected.updatedAt) })] }), selected.paymentRef ? (_jsxs("div", { children: [_jsx("span", { children: "Referensi pembayaran" }), _jsx("strong", { className: "mono", children: selected.paymentRef })] })) : null] }), selected.status === 'PENDING' ? (_jsx(Callout, { tone: "warning", icon: Clock3, title: "Saldo seller ditahan", children: "Tinjau kecocokan nama dan metode pembayaran sebelum menyetujui. Penolakan harus menyertakan alasan minimal 5 karakter." })) : null, selected.status === 'APPROVED' ? (_jsx(Callout, { tone: "info", icon: CreditCard, title: "Siap diproses", children: "Tandai pengajuan sebagai diproses setelah antrean transfer disiapkan. Status PAID tetap memerlukan referensi dan konfirmasi." })) : null, selected.status === 'PROCESSING' ? (_jsx(Callout, { tone: "info", icon: Banknote, title: "Menunggu konfirmasi transfer", children: "Konfirmasi pembayaran hanya dapat dicatat setelah referensi transfer diisi dan verifikasi dicentang." })) : null, selected.reason ? (_jsx(Callout, { tone: selected.status === 'REJECTED' ? 'danger' : 'warning', title: "Catatan keputusan", children: selected.reason })) : null, _jsxs("section", { className: "detail-section", children: [_jsx("h3", { children: "Riwayat status" }), _jsx("div", { className: "timeline", children: [...selected.timeline]
                                        .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
                                        .map((event, index, sorted) => (_jsxs("div", { className: "timeline__item", children: [_jsx("span", { className: `timeline__dot${index === sorted.length - 1 ? ' is-current' : ''}`, "aria-hidden": "true" }), _jsxs("div", { className: "timeline__content", children: [_jsxs("div", { className: "timeline__top", children: [_jsx("p", { className: "timeline__action", children: WITHDRAWAL_STATUS[event.status].label }), _jsx("span", { className: "timeline__time", children: formatDateTime(event.at) })] }), _jsxs("p", { className: "timeline__meta", children: ["oleh ", event.by] }), event.note ? _jsx("p", { className: "timeline__detail", children: event.note }) : null] })] }, `${event.at}-${event.status}-${index}`))) })] }), _jsx("p", { className: "detail-footnote", children: "Nomor akun disamarkan pada seluruh tampilan admin. Data pembayaran nyata tidak boleh digunakan pada prototype." })] }) })) : null, _jsx(ConfirmDialog, { open: confirmAction === 'APPROVE', onClose: () => setConfirmAction(null), onConfirm: approve, title: "Setujui penarikan?", description: selected
                    ? `${formatIDR(selected.amount)} untuk ${selected.sellerName} akan disetujui. Saldo tetap ditahan sampai pembayaran dikonfirmasi.`
                    : 'Pengajuan akan disetujui.', confirmLabel: "Setujui penarikan", children: selected ? (_jsxs("div", { className: "confirm-summary", children: [_jsxs("div", { children: [_jsx("span", { children: "Metode" }), _jsx("strong", { children: selected.method })] }), _jsxs("div", { children: [_jsx("span", { children: "Pemilik akun" }), _jsx("strong", { children: selected.accountName })] }), _jsxs("div", { children: [_jsx("span", { children: "Nomor akun" }), _jsx("strong", { children: maskAccount(selected.accountNumber) })] })] })) : null }), _jsx(ConfirmDialog, { open: confirmAction === 'PROCESS', onClose: () => setConfirmAction(null), onConfirm: process, title: "Tandai sebagai diproses?", description: "Pengajuan akan masuk tahap PROCESSING. Konfirmasi pembayaran masih diperlukan untuk status PAID.", confirmLabel: "Tandai diproses", children: selected ? (_jsxs("div", { className: "confirm-summary", children: [_jsxs("div", { children: [_jsx("span", { children: "Pengajuan" }), _jsx("strong", { className: "mono", children: selected.id })] }), _jsxs("div", { children: [_jsx("span", { children: "Nominal" }), _jsx("strong", { children: formatIDR(selected.amount) })] })] })) : null }), _jsx(ReasonDialog, { open: rejectOpen, onClose: () => setRejectOpen(false), onConfirm: reject, title: "Tolak penarikan?", description: selected ? `${selected.id} · ${formatIDR(selected.amount)}` : 'Pengajuan akan ditolak.', label: "Alasan penolakan", placeholder: "Contoh: nama pemilik rekening tidak sesuai dengan profil.", confirmLabel: "Tolak penarikan", tone: "danger", children: _jsx(Callout, { tone: "warning", title: "Saldo akan tersedia kembali", children: "Penolakan mengembalikan saldo tertahan ke saldo tersedia seller dan menandai transaksi terkait gagal pada data demo." }) }), _jsx(Modal, { open: paidOpen, onClose: () => setPaidOpen(false), title: "Konfirmasi pembayaran", description: selected ? `${selected.id} · ${formatIDR(selected.amount)}` : 'Catat pembayaran demo.', eyebrow: "Tahap akhir", size: "sm", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", onClick: () => setPaidOpen(false), children: "Batal" }), _jsx(Button, { variant: "success", iconLeft: BadgeCheck, type: "submit", form: "mark-paid-form", children: "Catat sebagai PAID" })] }), children: _jsxs("form", { id: "mark-paid-form", className: "form-stack", onSubmit: markPaid, noValidate: true, children: [_jsx(Callout, { tone: "warning", title: "Simulasi pembayaran", children: "Prototype tidak melakukan transfer. Hanya catat referensi fiktif untuk menyelesaikan status demo." }), _jsx(TextField, { label: "Referensi transfer", name: "paymentRef", value: paymentRef, onChange: (event) => {
                                setPaymentRef(event.target.value);
                                setPaidError('');
                            }, placeholder: "Contoh: TRF-BCA-DEMO-001", hint: "Minimal 4 karakter. Jangan gunakan kode transaksi nyata.", required: true }), _jsx(CheckboxField, { label: "Saya menyatakan bahwa verifikasi transfer sudah dilakukan pada simulasi ini.", description: "Status PAID tidak dapat dicatat tanpa konfirmasi ini.", checked: confirmed, onChange: (value) => {
                                setConfirmed(value);
                                setPaidError('');
                            }, error: paidError || undefined })] }) })] }));
}
