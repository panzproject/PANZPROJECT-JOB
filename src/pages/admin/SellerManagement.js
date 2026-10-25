import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { BadgeCheck, Ban, BriefcaseBusiness, CircleSlash2, CreditCard, Mail, RotateCcw, Search, ShieldCheck, UserCheck, Users, } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { formatDate, formatDateTime, formatIDR, maskAccount } from '../../lib/format';
import { getJobStatus, SELLER_STATUS } from '../../lib/status';
import { ReasonDialog } from '../../components/common/ReasonDialog';
import { Avatar, Badge, Button, Callout, ConfirmDialog, EmptyState, Modal, PageHeader, Pagination, Panel, SearchField, SelectField, SimulationTag, StatusBadge, Tabs, } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
const PAGE_SIZE = 8;
const tabMatches = (seller, tab) => tab === 'ALL' || seller.status === tab;
const actionCopy = {
    SUSPEND: {
        title: 'Tangguhkan seller?',
        description: 'Seller tidak dapat mengajukan penarikan atau mengirim hasil selama ditangguhkan.',
        label: 'Alasan penangguhan',
        confirm: 'Tangguhkan seller',
        status: 'SUSPENDED',
    },
    REJECT: {
        title: 'Tolak seller?',
        description: 'Pendaftaran seller akan ditolak pada data demo.',
        label: 'Alasan penolakan',
        confirm: 'Tolak seller',
        status: 'REJECTED',
    },
    CLOSE: {
        title: 'Tutup akun seller?',
        description: 'Akun akan ditutup pada data demo. Pekerjaan yang sudah ada tidak berubah otomatis.',
        label: 'Alasan penutupan akun',
        confirm: 'Tutup akun',
        status: 'CLOSED',
    },
};
export default function SellerManagement() {
    const { state, currentSeller, setSellerStatus } = useApp();
    const toast = useToast();
    const [tab, setTab] = useState('ALL');
    const [query, setQuery] = useState('');
    const [verified, setVerified] = useState('ALL');
    const [page, setPage] = useState(1);
    const [selectedId, setSelectedId] = useState(null);
    const [detailTab, setDetailTab] = useState('PROFILE');
    const [activateOpen, setActivateOpen] = useState(false);
    const [reasonAction, setReasonAction] = useState(null);
    const counts = useMemo(() => ({
        ALL: state.sellers.length,
        PENDING: state.sellers.filter((seller) => seller.status === 'PENDING').length,
        ACTIVE: state.sellers.filter((seller) => seller.status === 'ACTIVE').length,
        SUSPENDED: state.sellers.filter((seller) => seller.status === 'SUSPENDED').length,
        REJECTED: state.sellers.filter((seller) => seller.status === 'REJECTED').length,
        CLOSED: state.sellers.filter((seller) => seller.status === 'CLOSED').length,
    }), [state.sellers]);
    const filtered = useMemo(() => {
        return state.sellers
            .filter((seller) => {
            if (!tabMatches(seller, tab))
                return false;
            if (verified === 'VERIFIED' && !seller.emailVerified)
                return false;
            if (verified === 'UNVERIFIED' && seller.emailVerified)
                return false;
            if (!query.trim())
                return true;
            const needle = query.toLowerCase();
            return (seller.id.toLowerCase().includes(needle) ||
                seller.name.toLowerCase().includes(needle) ||
                seller.username.toLowerCase().includes(needle) ||
                seller.email.toLowerCase().includes(needle));
        })
            .sort((a, b) => {
            const priority = {
                PENDING: 0,
                ACTIVE: 1,
                SUSPENDED: 2,
                REJECTED: 3,
                CLOSED: 4,
            };
            const diff = priority[a.status] - priority[b.status];
            if (diff !== 0)
                return diff;
            return a.name.localeCompare(b.name, 'id');
        });
    }, [state.sellers, tab, verified, query]);
    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const hasFilters = Boolean(query.trim() || verified !== 'ALL');
    const selected = state.sellers.find((seller) => seller.id === selectedId) ?? null;
    const selectedJobs = selected
        ? state.jobs.filter((job) => job.sellerId === selected.id).sort((a, b) => b.id.localeCompare(a.id, undefined, { numeric: true }))
        : [];
    const selectedCompleted = selectedJobs.filter((job) => job.status === 'APPROVED').length;
    const selectedActive = selectedJobs.filter((job) => ['CLAIMED', 'REVISION', 'SUBMITTED', 'UNDER_REVIEW', 'EXPIRY_REVIEW'].includes(job.status)).length;
    const selectedEarnings = selectedCompleted > 0 ? selectedJobs.filter((job) => job.status === 'APPROVED').reduce((sum, job) => sum + job.rate, 0) : 0;
    const isSelectedCurrent = selected?.id === currentSeller.id;
    const resetFilters = () => {
        setQuery('');
        setVerified('ALL');
        setPage(1);
    };
    const activateSeller = () => {
        if (!selected)
            return;
        const result = setSellerStatus(selected.id, 'ACTIVE', 'Aktivasi melalui Manajemen Seller prototype.');
        if (result.ok)
            toast.success(result.message, 'Seller diaktifkan');
        else
            toast.error(result.message);
        setActivateOpen(false);
    };
    const applyReason = (reason) => {
        if (!selected || !reasonAction)
            return { ok: false, message: 'Seller tidak ditemukan.' };
        const config = actionCopy[reasonAction];
        const result = setSellerStatus(selected.id, config.status, reason);
        if (result.ok)
            toast.success(result.message, 'Status seller diperbarui');
        return result;
    };
    return (_jsxs("div", { className: "page page-enter", children: [_jsx(PageHeader, { eyebrow: "Panel admin", title: "Manajemen seller", description: "Tinjau profil, status, dan pekerjaan seller. Semua perubahan bersifat simulasi lokal tanpa autentikasi nyata.", actions: _jsx(SimulationTag, { children: "Data lokal" }) }), _jsx(Callout, { tone: "info", icon: ShieldCheck, title: "Perubahan status memengaruhi UI seller", children: "Menangguhkan atau menutup seller demo akan tercermin pada kemampuan klaim, pengiriman hasil, dan penarikan. Tidak ada notifikasi eksternal yang dikirim." }), _jsxs("div", { className: "seller-admin-summary", children: [_jsxs("div", { children: [_jsx("span", { children: "Total seller" }), _jsx("strong", { children: state.sellers.length })] }), _jsxs("div", { children: [_jsx("span", { children: "Aktif" }), _jsx("strong", { children: counts.ACTIVE })] }), _jsxs("div", { children: [_jsx("span", { children: "Menunggu persetujuan" }), _jsx("strong", { children: counts.PENDING })] }), _jsxs("div", { children: [_jsx("span", { children: "Ditangguhkan" }), _jsx("strong", { children: counts.SUSPENDED })] }), _jsx(SimulationTag, {})] }), _jsxs(Panel, { title: "Daftar seller", description: "Seller dengan status menunggu ditampilkan lebih dahulu.", action: _jsx(Badge, { tone: counts.PENDING > 0 ? 'warning' : 'success', children: counts.PENDING > 0 ? `${counts.PENDING} perlu ditinjau` : 'Tidak ada antrean' }), children: [_jsx(Tabs, { label: "Filter status seller", value: tab, onChange: (value) => {
                            setTab(value);
                            setPage(1);
                        }, items: [
                            { id: 'ALL', label: 'Semua', count: counts.ALL },
                            { id: 'PENDING', label: 'Menunggu', count: counts.PENDING },
                            { id: 'ACTIVE', label: 'Aktif', count: counts.ACTIVE },
                            { id: 'SUSPENDED', label: 'Ditangguhkan', count: counts.SUSPENDED },
                            { id: 'REJECTED', label: 'Ditolak', count: counts.REJECTED },
                            { id: 'CLOSED', label: 'Ditutup', count: counts.CLOSED },
                        ] }), _jsxs("div", { className: "filter-bar jobs-toolbar", children: [_jsx(SearchField, { label: "Cari seller berdasarkan nama, username, email, atau ID", value: query, onChange: (value) => {
                                    setQuery(value);
                                    setPage(1);
                                }, placeholder: "Cari nama, email, atau ID seller\u2026" }), _jsx(SelectField, { label: "Verifikasi email", fieldClassName: "filter-bar__control", value: verified, onChange: (event) => {
                                    setVerified(event.target.value);
                                    setPage(1);
                                }, options: [
                                    { value: 'ALL', label: 'Semua' },
                                    { value: 'VERIFIED', label: 'Terverifikasi' },
                                    { value: 'UNVERIFIED', label: 'Belum terverifikasi' },
                                ] }), _jsx(Button, { variant: "ghost", size: "sm", iconLeft: RotateCcw, onClick: resetFilters, disabled: !hasFilters, className: "filter-reset", children: "Reset" }), _jsxs("span", { className: "filter-bar__result", children: [filtered.length, " seller"] })] }), pageItems.length > 0 ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "table-wrap", children: _jsxs("table", { className: "data-table", children: [_jsx("caption", { className: "sr-only", children: "Daftar seller pada panel admin" }), _jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Seller" }), _jsx("th", { scope: "col", children: "Kontak" }), _jsx("th", { scope: "col", children: "Status" }), _jsx("th", { scope: "col", children: "Bergabung" }), _jsx("th", { scope: "col", className: "num", children: "Pekerjaan" }), _jsx("th", { scope: "col", children: _jsx("span", { className: "sr-only", children: "Aksi" }) })] }) }), _jsx("tbody", { children: pageItems.map((seller) => {
                                                const sellerJobs = state.jobs.filter((job) => job.sellerId === seller.id);
                                                return (_jsxs("tr", { children: [_jsx("td", { children: _jsxs("div", { className: "seller-cell", children: [_jsx(Avatar, { name: seller.name, size: "sm", status: seller.status === 'ACTIVE' ? 'online' : 'offline' }), _jsxs("div", { children: [_jsxs("div", { className: "cell-title", children: [seller.name, seller.id === currentSeller.id ? _jsx(Badge, { tone: "info", children: "Akun demo" }) : null] }), _jsxs("div", { className: "cell-sub", children: ["@", seller.username, " \u00B7 ", _jsx("span", { className: "mono", children: seller.id })] })] })] }) }), _jsxs("td", { children: [_jsx("div", { className: "cell-title", children: seller.email }), _jsx("div", { className: "cell-sub", children: seller.emailVerified ? (_jsxs("span", { className: "inline-status text-success", children: [_jsx(BadgeCheck, { size: 11, "aria-hidden": "true" }), " Terverifikasi"] })) : (_jsxs("span", { className: "inline-status text-warning", children: [_jsx(Mail, { size: 11, "aria-hidden": "true" }), " Belum terverifikasi"] })) })] }), _jsx("td", { children: _jsx(StatusBadge, { meta: SELLER_STATUS[seller.status] }) }), _jsx("td", { children: formatDate(seller.joinedAt) }), _jsxs("td", { className: "num", children: [_jsx("div", { className: "cell-title", children: sellerJobs.length }), _jsxs("div", { className: "cell-sub", children: [sellerJobs.filter((job) => job.status === 'APPROVED').length, " selesai"] })] }), _jsx("td", { children: _jsx("div", { className: "cell-actions", children: _jsx(Button, { variant: "secondary", size: "sm", iconLeft: Users, onClick: () => {
                                                                        setSelectedId(seller.id);
                                                                        setDetailTab('PROFILE');
                                                                    }, children: "Kelola" }) }) })] }, seller.id));
                                            }) })] }) }), _jsxs("div", { className: "table-footer", children: [_jsxs("p", { className: "result-count", children: ["Menampilkan ", _jsxs("strong", { children: [(currentPage - 1) * PAGE_SIZE + 1, "\u2013", Math.min(currentPage * PAGE_SIZE, filtered.length)] }), ' ', "dari ", _jsx("strong", { children: filtered.length }), " seller"] }), _jsx(Pagination, { page: currentPage, pageSize: PAGE_SIZE, total: filtered.length, onChange: setPage })] })] })) : (_jsx(EmptyState, { icon: Search, title: "Seller tidak ditemukan", description: "Tidak ada seller yang cocok dengan status, verifikasi, atau pencarian saat ini.", action: hasFilters ? (_jsx(Button, { variant: "secondary", size: "sm", iconLeft: RotateCcw, onClick: resetFilters, children: "Reset filter" })) : undefined }))] }), selected ? (_jsx(Modal, { open: Boolean(selected), onClose: () => setSelectedId(null), title: selected.name, description: `@${selected.username} · ${selected.id}`, eyebrow: "Detail seller", size: "lg", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", onClick: () => setSelectedId(null), children: "Tutup" }), selected.status !== 'ACTIVE' ? (_jsx(Button, { variant: "success", iconLeft: UserCheck, onClick: () => setActivateOpen(true), children: "Aktifkan seller" })) : null, selected.status === 'PENDING' ? (_jsx(Button, { variant: "danger", iconLeft: Ban, onClick: () => setReasonAction('REJECT'), children: "Tolak pendaftaran" })) : null, selected.status === 'ACTIVE' ? (_jsx(Button, { variant: "danger", iconLeft: Ban, onClick: () => setReasonAction('SUSPEND'), children: "Tangguhkan" })) : null, selected.status === 'SUSPENDED' ? (_jsx(Button, { variant: "danger", iconLeft: CircleSlash2, onClick: () => setReasonAction('CLOSE'), children: "Tutup akun" })) : null, selected.status === 'ACTIVE' && !isSelectedCurrent ? (_jsx(Button, { variant: "ghost", iconLeft: CircleSlash2, onClick: () => setReasonAction('CLOSE'), children: "Tutup akun" })) : null] }), children: _jsxs("div", { className: "seller-detail", children: [_jsxs("div", { className: "seller-detail__hero", children: [_jsx(Avatar, { name: selected.name, size: "lg", status: selected.status === 'ACTIVE' ? 'online' : 'offline' }), _jsxs("div", { children: [_jsxs("div", { className: "row", children: [_jsx(StatusBadge, { meta: SELLER_STATUS[selected.status] }), selected.emailVerified ? (_jsxs(Badge, { tone: "info", children: [_jsx(BadgeCheck, { size: 10, "aria-hidden": "true" }), " Email terverifikasi"] })) : (_jsx(Badge, { tone: "warning", children: "Email belum terverifikasi" })), isSelectedCurrent ? _jsx(Badge, { tone: "neutral", children: "Akun demo aktif" }) : null] }), _jsx("p", { children: selected.email }), _jsxs("span", { children: ["Bergabung ", formatDate(selected.joinedAt), " \u00B7 ", selectedJobs.length, " pekerjaan"] })] })] }), _jsx(Tabs, { label: "Bagian detail seller", value: detailTab, onChange: (value) => setDetailTab(value), items: [
                                { id: 'PROFILE', label: 'Profil' },
                                { id: 'JOBS', label: 'Pekerjaan', count: selectedJobs.length },
                            ] }), detailTab === 'PROFILE' ? (_jsxs("div", { className: "detail-tab-content", children: [_jsxs("div", { className: "detail-stat-grid", children: [_jsxs("div", { children: [_jsx("span", { children: "Pekerjaan aktif" }), _jsx("strong", { children: selectedActive })] }), _jsxs("div", { children: [_jsx("span", { children: "Pekerjaan selesai" }), _jsx("strong", { children: selectedCompleted })] }), _jsxs("div", { children: [_jsx("span", { children: "Nilai komisi demo" }), _jsx("strong", { children: formatIDR(selectedEarnings) })] })] }), _jsxs("div", { className: "confirm-summary", children: [_jsxs("div", { children: [_jsx("span", { children: "Seller ID" }), _jsx("strong", { className: "mono", children: selected.id })] }), _jsxs("div", { children: [_jsx("span", { children: "Status akun" }), _jsx("strong", { children: SELLER_STATUS[selected.status].label })] }), _jsxs("div", { children: [_jsx("span", { children: "Email" }), _jsx("strong", { children: selected.email })] }), _jsxs("div", { children: [_jsx("span", { children: "Verifikasi email" }), _jsx("strong", { children: selected.emailVerified ? 'Terverifikasi' : 'Belum terverifikasi' })] }), _jsxs("div", { children: [_jsx("span", { children: "Metode pembayaran" }), _jsx("strong", { children: selected.paymentMethod?.provider ?? 'Belum diatur' })] }), _jsxs("div", { children: [_jsx("span", { children: "Nomor akun" }), _jsx("strong", { children: selected.paymentMethod ? maskAccount(selected.paymentMethod.accountNumber) : '—' })] })] }), _jsx(Callout, { tone: "info", icon: CreditCard, title: "Data pembayaran demo", children: "Nomor akun ditampilkan tersamarkan. Prototype tidak menyimpan kredensial atau data rekening nyata." }), selected.note ? (_jsxs("div", { className: "detail-section", children: [_jsx("h3", { children: "Catatan admin terakhir" }), _jsx("p", { className: "detail-prose", children: selected.note })] })) : null] })) : (_jsx("div", { className: "detail-tab-content", children: selectedJobs.length > 0 ? (_jsxs("div", { className: "seller-job-list", children: [selectedJobs.slice(0, 6).map((job) => (_jsxs("div", { className: "seller-job-row", children: [_jsxs("div", { children: [_jsx("span", { className: "mono", children: job.id }), _jsx("p", { children: job.title })] }), _jsxs("div", { className: "seller-job-row__meta", children: [_jsx("span", { children: formatIDR(job.rate) }), _jsx(StatusBadge, { meta: getJobStatus(job) })] })] }, job.id))), selectedJobs.length > 6 ? (_jsxs("p", { className: "detail-footnote", children: ["Menampilkan 6 dari ", selectedJobs.length, " pekerjaan seller."] })) : null] })) : (_jsx(EmptyState, { icon: BriefcaseBusiness, title: "Belum ada pekerjaan", description: "Seller ini belum mengambil pekerjaan pada data demo." })) })), _jsxs("p", { className: "detail-footnote", children: ["Aktivitas terakhir seller pada data demo: ", formatDateTime(selected.joinedAt), " \u00B7 tindakan status akan tercatat pada audit log."] })] }) })) : null, _jsx(ConfirmDialog, { open: activateOpen, onClose: () => setActivateOpen(false), onConfirm: activateSeller, title: "Aktifkan seller?", description: selected
                    ? `${selected.name} akan dapat mengklaim pekerjaan dan mengajukan penarikan pada data demo.`
                    : 'Seller akan diaktifkan pada data demo.', confirmLabel: "Aktifkan seller", children: selected ? (_jsxs("div", { className: "confirm-summary", children: [_jsxs("div", { children: [_jsx("span", { children: "Seller" }), _jsx("strong", { children: selected.name })] }), _jsxs("div", { children: [_jsx("span", { children: "Status saat ini" }), _jsx(StatusBadge, { meta: SELLER_STATUS[selected.status] })] })] })) : null }), _jsx(ReasonDialog, { open: Boolean(reasonAction), onClose: () => setReasonAction(null), onConfirm: applyReason, title: reasonAction ? actionCopy[reasonAction].title : 'Ubah status seller', description: reasonAction ? actionCopy[reasonAction].description : 'Alasan akan dicatat pada audit log demo.', label: reasonAction ? actionCopy[reasonAction].label : 'Alasan', placeholder: "Tulis alasan yang jelas untuk jejak audit demo.", confirmLabel: reasonAction ? actionCopy[reasonAction].confirm : 'Simpan', tone: "danger", children: selected ? (_jsxs("div", { className: "confirm-summary", children: [_jsxs("div", { children: [_jsx("span", { children: "Seller" }), _jsx("strong", { children: selected.name })] }), _jsxs("div", { children: [_jsx("span", { children: "ID" }), _jsx("strong", { className: "mono", children: selected.id })] }), _jsxs("div", { children: [_jsx("span", { children: "Status saat ini" }), _jsx(StatusBadge, { meta: SELLER_STATUS[selected.status] })] })] })) : null })] }));
}
