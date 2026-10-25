import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bell, BriefcaseBusiness, CheckCheck, Check, Circle, Info, Settings2, ShieldCheck, Wallet, } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { formatDateTime, relativeTime } from '../../lib/format';
import { Badge, Button, Callout, EmptyState, Modal, PageHeader, Panel, SimulationTag, Tabs, } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
const KIND_META = {
    job: { label: 'Pekerjaan', icon: BriefcaseBusiness },
    finance: { label: 'Keuangan', icon: Wallet },
    account: { label: 'Akun', icon: ShieldCheck },
    system: { label: 'Sistem', icon: Settings2 },
};
export default function Notifications() {
    const { state, markNotificationRead, markAllNotificationsRead } = useApp();
    const toast = useToast();
    const navigate = useNavigate();
    const [filter, setFilter] = useState('ALL');
    const [selectedId, setSelectedId] = useState(null);
    const notifications = [...state.notifications].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    const unreadCount = notifications.filter((item) => !item.read).length;
    const visible = filter === 'UNREAD' ? notifications.filter((item) => !item.read) : notifications;
    const selected = notifications.find((item) => item.id === selectedId) ?? null;
    const openNotification = (notification) => {
        setSelectedId(notification.id);
        if (!notification.read)
            markNotificationRead(notification.id);
    };
    const markAll = () => {
        markAllNotificationsRead();
        toast.success('Semua notifikasi ditandai sudah dibaca.', 'Notifikasi diperbarui');
    };
    return (_jsxs("div", { className: "page page-enter", children: [_jsx(PageHeader, { eyebrow: "Kotak masuk seller", title: "Notifikasi", description: "Pantau kabar revisi, komisi, deadline, dan keamanan akun pada data simulasi.", actions: _jsx(Button, { variant: "secondary", iconLeft: CheckCheck, onClick: markAll, disabled: unreadCount === 0, children: "Tandai semua dibaca" }) }), _jsx(Callout, { tone: "warning", title: "Notifikasi simulasi", children: "Tidak ada email atau push notification nyata yang dikirim. Semua item di halaman ini dibuat dari data demo lokal dan akan kembali setelah reset data." }), _jsxs("div", { className: "notification-overview", children: [_jsxs("div", { className: "notification-overview__count", children: [_jsx("span", { className: `notification-overview__icon${unreadCount > 0 ? ' has-unread' : ''}`, "aria-hidden": "true", children: _jsx(Bell, { size: 18 }) }), _jsxs("div", { children: [_jsx("strong", { children: unreadCount }), _jsxs("span", { children: ["belum dibaca dari ", notifications.length, " notifikasi"] })] })] }), _jsx(SimulationTag, {})] }), _jsxs(Panel, { bodyClassName: "notification-panel__body", children: [_jsx(Tabs, { label: "Filter notifikasi", value: filter, onChange: (value) => setFilter(value), items: [
                            { id: 'ALL', label: 'Semua', count: notifications.length },
                            { id: 'UNREAD', label: 'Belum dibaca', count: unreadCount },
                        ] }), visible.length > 0 ? (_jsx("div", { className: "notification-list", children: visible.map((notification) => {
                            const meta = KIND_META[notification.kind];
                            const KindIcon = meta.icon;
                            return (_jsxs("div", { className: `notification-row${notification.read ? '' : ' is-unread'}`, children: [_jsxs("button", { type: "button", className: "notification-row__main", onClick: () => openNotification(notification), "aria-label": `Buka notifikasi ${notification.title}${notification.read ? '' : ', belum dibaca'}`, children: [_jsx("span", { className: `notification-row__icon notification-row__icon--${notification.kind}`, "aria-hidden": "true", children: _jsx(KindIcon, { size: 17 }) }), _jsxs("span", { className: "notification-row__copy", children: [_jsxs("span", { className: "notification-row__topline", children: [_jsx("span", { className: "notification-row__title", children: notification.title }), !notification.read ? (_jsxs("span", { className: "notification-row__unread", children: [_jsx(Circle, { size: 6, fill: "currentColor", "aria-hidden": "true" }), "Baru"] })) : null] }), _jsx("span", { className: "notification-row__message", children: notification.message }), _jsxs("span", { className: "notification-row__meta", children: [_jsx(Badge, { tone: "neutral", children: meta.label }), _jsx("span", { title: formatDateTime(notification.at), children: relativeTime(notification.at) }), _jsx("span", { className: "mono", children: notification.id })] })] })] }), _jsxs("div", { className: "notification-row__actions", children: [!notification.read ? (_jsx(Button, { variant: "ghost", size: "sm", iconLeft: Check, onClick: () => markNotificationRead(notification.id), "aria-label": `Tandai ${notification.title} sudah dibaca`, children: "Tandai" })) : null, _jsx(Button, { variant: "ghost", size: "sm", iconRight: ArrowRight, onClick: () => openNotification(notification), "aria-label": `Lihat detail ${notification.title}`, children: "Detail" })] })] }, notification.id));
                        }) })) : (_jsx(EmptyState, { icon: filter === 'UNREAD' ? CheckCheck : Bell, title: filter === 'UNREAD' ? 'Semua sudah dibaca' : 'Belum ada notifikasi', description: filter === 'UNREAD'
                            ? 'Tidak ada notifikasi baru pada data demo. Anda dapat melihat seluruh riwayat notifikasi.'
                            : 'Kabar pekerjaan dan keuangan akan muncul di sini setelah aktivitas demo berjalan.', action: filter === 'UNREAD' ? (_jsx(Button, { variant: "secondary", size: "sm", onClick: () => setFilter('ALL'), children: "Lihat semua notifikasi" })) : (_jsx(Button, { variant: "primary", size: "sm", onClick: () => navigate('/seller/dashboard'), children: "Kembali ke dashboard" })) }))] }), selected ? (_jsx(Modal, { open: Boolean(selected), onClose: () => setSelectedId(null), title: selected.title, description: `${KIND_META[selected.kind].label} · ${formatDateTime(selected.at)}`, eyebrow: "Detail notifikasi", size: "md", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", onClick: () => setSelectedId(null), children: "Tutup" }), _jsx(Button, { variant: "primary", iconRight: ArrowRight, onClick: () => {
                                markNotificationRead(selected.id);
                                setSelectedId(null);
                                navigate(selected.href);
                            }, children: "Buka halaman terkait" })] }), children: _jsxs("div", { className: "notification-detail", children: [_jsxs("div", { className: "notification-detail__meta", children: [_jsx(Badge, { tone: "neutral", children: KIND_META[selected.kind].label }), _jsxs(Badge, { tone: "success", children: [_jsx(Check, { size: 10, "aria-hidden": "true" }), " Dibaca"] }), _jsx("span", { className: "mono", children: selected.id })] }), _jsx("p", { className: "notification-detail__message", children: selected.message }), _jsxs("div", { className: "notification-detail__when", children: [_jsx(Info, { size: 13, "aria-hidden": "true" }), _jsxs("span", { children: [formatDateTime(selected.at), " \u00B7 ", relativeTime(selected.at)] })] }), _jsx(Callout, { tone: "info", title: "Tautan tujuan simulasi", children: "Tombol di bawah membuka halaman terkait pada prototype. Tidak ada data yang dikirim keluar peramban." })] }) })) : null] }));
}
