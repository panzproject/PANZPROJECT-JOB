import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ChevronDown, CircleAlert, Info, RotateCcw, Settings, ShieldCheck, Store, UserRound, } from 'lucide-react';
import { findNavItem, getRoleHome, roleLabel } from '../../lib/navigation';
import { useApp } from '../../store/AppContext';
import { useClickOutside } from '../../lib/useClickOutside';
import { relativeTime } from '../../lib/format';
import { Avatar, Button, ConfirmDialog, IconButton, Modal } from '../ui';
import { useToast } from '../ui/Toast';
export function Topbar({ role }) {
    const { state, currentSeller, markNotificationRead, markAllNotificationsRead, resetDemo } = useApp();
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();
    const [menu, setMenu] = useState(null);
    const [resetOpen, setResetOpen] = useState(false);
    const [aboutOpen, setAboutOpen] = useState(false);
    const notifRef = useRef(null);
    const avatarRef = useRef(null);
    const closeMenu = useCallback(() => setMenu(null), []);
    useClickOutside(notifRef, menu === 'notif', closeMenu);
    useClickOutside(avatarRef, menu === 'avatar', closeMenu);
    useEffect(() => {
        setMenu(null);
    }, [location.pathname]);
    const navItem = findNavItem(role, location.pathname);
    const unread = state.notifications.filter((item) => !item.read).length;
    const reviewCount = state.jobs.filter((job) => ['SUBMITTED', 'UNDER_REVIEW', 'EXPIRY_REVIEW'].includes(job.status)).length;
    const withdrawalCount = state.withdrawals.filter((item) => item.status === 'PENDING').length;
    const sellerPending = state.sellers.filter((item) => item.status === 'PENDING').length;
    const adminActionCount = reviewCount + withdrawalCount + sellerPending;
    const latestNotifications = state.notifications.slice(0, 4);
    const switchRole = () => {
        const nextRole = role === 'seller' ? 'admin' : 'seller';
        navigate(getRoleHome(nextRole));
        setMenu(null);
    };
    const openNotification = (id, href) => {
        markNotificationRead(id);
        setMenu(null);
        navigate(href);
    };
    const confirmReset = () => {
        resetDemo();
        setResetOpen(false);
        toast.success('Data demo dikembalikan ke kondisi awal. Tidak ada data nyata yang tersentuh.', 'Demo direset');
    };
    return (_jsxs("header", { className: "topbar", children: [_jsx("div", { className: "topbar__left", children: _jsxs("div", { className: "topbar__title", children: [_jsxs("p", { className: "topbar__crumb", children: [roleLabel(role), " ", _jsx("span", { "aria-hidden": "true", children: "/" }), " ", _jsx("span", { className: "topbar__demo", children: "prototype" })] }), _jsx("h2", { children: navItem?.label ?? 'PANZ PROJECT' })] }) }), _jsxs("div", { className: "topbar__actions", children: [_jsxs("span", { className: "prototype-pill", children: [_jsx("span", { className: "prototype-pill__dot", "aria-hidden": "true" }), "Data simulasi"] }), _jsxs("div", { className: "role-switch", role: "group", "aria-label": "Pilih mode tampilan. Ini hanya simulasi UI, bukan kontrol keamanan.", children: [_jsxs("button", { type: "button", className: `role-switch__btn${role === 'seller' ? ' is-active' : ''}`, "aria-pressed": role === 'seller', onClick: () => {
                                    if (role !== 'seller')
                                        navigate(getRoleHome('seller'));
                                }, children: [_jsx(Store, { size: 15, "aria-hidden": "true" }), _jsx("span", { className: "role-switch__label", children: "Seller" })] }), _jsxs("button", { type: "button", className: `role-switch__btn${role === 'admin' ? ' is-active' : ''}`, "aria-pressed": role === 'admin', onClick: () => {
                                    if (role !== 'admin')
                                        navigate(getRoleHome('admin'));
                                }, children: [_jsx(ShieldCheck, { size: 15, "aria-hidden": "true" }), _jsx("span", { className: "role-switch__label", children: "Admin" })] })] }), _jsxs("div", { className: "topbar__popover-wrap", ref: notifRef, children: [_jsxs(IconButton, { label: role === 'seller' ? `Notifikasi, ${unread} belum dibaca` : `Tindakan admin, ${adminActionCount} item`, className: `topbar__icon-btn${menu === 'notif' ? ' is-active' : ''}`, "aria-haspopup": "menu", "aria-expanded": menu === 'notif', onClick: () => setMenu(menu === 'notif' ? null : 'notif'), children: [_jsx(Bell, { size: 18 }), (role === 'seller' ? unread : adminActionCount) > 0 ? (_jsx("span", { className: "notification-dot", "aria-hidden": "true", children: (role === 'seller' ? unread : adminActionCount) > 9 ? '9+' : role === 'seller' ? unread : adminActionCount })) : null] }), menu === 'notif' ? (_jsxs("div", { className: "menu-popover notification-menu", role: "menu", "aria-label": role === 'seller' ? 'Notifikasi terbaru' : 'Tindakan admin', children: [_jsxs("div", { className: "menu-popover__header", children: [_jsxs("div", { children: [_jsx("p", { className: "menu-popover__eyebrow", children: role === 'seller' ? 'Notifikasi' : 'Tindakan admin' }), _jsx("h3", { children: role === 'seller' ? (unread > 0 ? `${unread} belum dibaca` : 'Semua sudah dibaca') : `${adminActionCount} item menunggu` })] }), role === 'seller' && unread > 0 ? (_jsxs("button", { type: "button", className: "menu-popover__text-btn", onClick: markAllNotificationsRead, children: [_jsx(CheckCheck, { size: 14, "aria-hidden": "true" }), "Tandai semua"] })) : null] }), role === 'seller' ? (latestNotifications.length > 0 ? (_jsx("div", { className: "notification-menu__list", children: latestNotifications.map((item) => (_jsxs("button", { type: "button", role: "menuitem", className: `notification-menu__item${item.read ? '' : ' is-unread'}`, onClick: () => openNotification(item.id, item.href), children: [_jsx("span", { className: `notification-menu__marker notification-menu__marker--${item.kind}`, "aria-hidden": "true" }), _jsxs("span", { className: "notification-menu__copy", children: [_jsx("span", { className: "notification-menu__title", children: item.title }), _jsx("span", { className: "notification-menu__message", children: item.message }), _jsx("span", { className: "notification-menu__time", children: relativeTime(item.at) })] })] }, item.id))) })) : (_jsx("p", { className: "menu-popover__empty", children: "Belum ada notifikasi pada data demo." }))) : (_jsxs("div", { className: "notification-menu__list", children: [_jsxs("button", { type: "button", role: "menuitem", className: "notification-menu__item", onClick: () => {
                                                    setMenu(null);
                                                    navigate('/admin/reviews');
                                                }, children: [_jsx("span", { className: "notification-menu__icon", children: _jsx(CircleAlert, { size: 16 }) }), _jsxs("span", { className: "notification-menu__copy", children: [_jsx("span", { className: "notification-menu__title", children: "Review hasil" }), _jsxs("span", { className: "notification-menu__message", children: [reviewCount, " pengiriman menunggu keputusan"] })] })] }), _jsxs("button", { type: "button", role: "menuitem", className: "notification-menu__item", onClick: () => {
                                                    setMenu(null);
                                                    navigate('/admin/withdrawals');
                                                }, children: [_jsx("span", { className: "notification-menu__icon", children: _jsx(CircleAlert, { size: 16 }) }), _jsxs("span", { className: "notification-menu__copy", children: [_jsx("span", { className: "notification-menu__title", children: "Penarikan saldo" }), _jsxs("span", { className: "notification-menu__message", children: [withdrawalCount, " pengajuan berstatus PENDING"] })] })] }), _jsxs("button", { type: "button", role: "menuitem", className: "notification-menu__item", onClick: () => {
                                                    setMenu(null);
                                                    navigate('/admin/sellers');
                                                }, children: [_jsx("span", { className: "notification-menu__icon", children: _jsx(CircleAlert, { size: 16 }) }), _jsxs("span", { className: "notification-menu__copy", children: [_jsx("span", { className: "notification-menu__title", children: "Pendaftaran seller" }), _jsxs("span", { className: "notification-menu__message", children: [sellerPending, " seller menunggu persetujuan"] })] })] })] })), _jsx("div", { className: "menu-popover__footer", children: _jsxs("button", { type: "button", className: "menu-popover__footer-link", onClick: () => {
                                                setMenu(null);
                                                navigate(role === 'seller' ? '/seller/notifications' : '/admin/audit');
                                            }, children: [role === 'seller' ? 'Buka semua notifikasi' : 'Buka audit log', _jsx(ChevronDown, { size: 14, className: "rotate--90", "aria-hidden": "true" })] }) })] })) : null] }), _jsxs("div", { className: "topbar__popover-wrap", ref: avatarRef, children: [_jsxs("button", { type: "button", className: `topbar__avatar-btn${menu === 'avatar' ? ' is-active' : ''}`, onClick: () => setMenu(menu === 'avatar' ? null : 'avatar'), "aria-haspopup": "menu", "aria-expanded": menu === 'avatar', "aria-label": "Buka menu akun", children: [_jsx(Avatar, { name: role === 'seller' ? currentSeller.name : 'Admin PANZ', size: "sm" }), _jsx(ChevronDown, { size: 14, className: "topbar__avatar-chevron", "aria-hidden": "true" })] }), menu === 'avatar' ? (_jsxs("div", { className: "menu-popover account-menu", role: "menu", "aria-label": "Menu akun", children: [_jsxs("div", { className: "account-menu__identity", children: [_jsx(Avatar, { name: role === 'seller' ? currentSeller.name : 'Admin PANZ', size: "md" }), _jsxs("div", { children: [_jsx("p", { className: "account-menu__name", children: role === 'seller' ? currentSeller.name : 'Admin PANZ' }), _jsx("p", { className: "account-menu__email", children: role === 'seller' ? currentSeller.email : 'admin@panzproject.demo' })] })] }), _jsxs("div", { className: "account-menu__role", children: [_jsx("span", { children: "Mode aktif" }), _jsx("strong", { children: roleLabel(role) })] }), _jsx("div", { className: "menu-popover__divider" }), _jsxs("button", { type: "button", role: "menuitem", className: "menu-item", onClick: () => {
                                            setMenu(null);
                                            navigate(role === 'seller' ? '/seller/profile' : '/admin/settings');
                                        }, children: [role === 'seller' ? _jsx(UserRound, { size: 16 }) : _jsx(Settings, { size: 16 }), role === 'seller' ? 'Profil & Keamanan' : 'Pengaturan admin'] }), _jsxs("button", { type: "button", role: "menuitem", className: "menu-item", onClick: switchRole, children: [role === 'seller' ? _jsx(ShieldCheck, { size: 16 }) : _jsx(Store, { size: 16 }), "Beralih ke ", role === 'seller' ? 'Admin Panel' : 'Seller Panel'] }), _jsxs("button", { type: "button", role: "menuitem", className: "menu-item", onClick: () => {
                                            setAboutOpen(true);
                                            setMenu(null);
                                        }, children: [_jsx(Info, { size: 16 }), "Tentang prototype"] }), _jsxs("button", { type: "button", role: "menuitem", className: "menu-item menu-item--danger", onClick: () => {
                                            setResetOpen(true);
                                            setMenu(null);
                                        }, children: [_jsx(RotateCcw, { size: 16 }), "Reset data demo"] }), _jsx("p", { className: "account-menu__note", children: "Role selector hanya simulasi UI dan bukan sistem keamanan. Data tersimpan lokal di peramban ini." })] })) : null] })] }), _jsx(ConfirmDialog, { open: resetOpen, onClose: () => setResetOpen(false), onConfirm: confirmReset, title: "Reset seluruh data demo?", description: "Semua perubahan lokal pada prototype akan dikembalikan ke data seed awal.", confirmLabel: "Reset data demo", tone: "danger", children: _jsx("p", { className: "modal-copy", children: "Tidak ada data produksi yang tersentuh. Tindakan ini juga menghapus notifikasi, pengajuan, dan perubahan status yang dibuat selama sesi demo." }) }), _jsx(Modal, { open: aboutOpen, onClose: () => setAboutOpen(false), title: "Tentang prototype PANZ PROJECT", description: "Prototype visual interaktif tahap pertama. Bukan sistem produksi.", eyebrow: "Versi 0.1", size: "lg", footer: _jsx(Button, { variant: "secondary", onClick: () => setAboutOpen(false), children: "Tutup" }), children: _jsxs("div", { className: "about-grid", children: [_jsxs("div", { children: [_jsx("h3", { children: "Yang bisa dicoba" }), _jsxs("ul", { className: "check-list", children: [_jsx("li", { children: "Navigasi seller dan admin dengan role selector simulasi." }), _jsx("li", { children: "Pencarian, filter, klaim pekerjaan, pengiriman hasil demo." }), _jsx("li", { children: "Review hasil dan pencatatan komisi satu kali pada state lokal." }), _jsx("li", { children: "Pengajuan penarikan, alur status, dan audit log demo." }), _jsx("li", { children: "Manajemen pekerjaan, seller, email, serta pengaturan." })] })] }), _jsxs("div", { children: [_jsx("h3", { children: "Batasan tahap ini" }), _jsxs("ul", { className: "check-list check-list--muted", children: [_jsx("li", { children: "Tidak ada backend, database, autentikasi, OAuth, atau transaksi nyata." }), _jsx("li", { children: "Seluruh saldo, komisi, transfer, dan email adalah data simulasi." }), _jsx("li", { children: "File yang dipilih hanya dicatat metadatanya di peramban." }), _jsx("li", { children: "Data tersimpan di localStorage, bukan database produksi." }), _jsx("li", { children: "Role selector tidak memisahkan hak akses secara nyata." })] })] })] }) })] }));
}
