import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink } from 'react-router-dom';
import { FlaskConical, ShieldCheck } from 'lucide-react';
import { getNav, roleLabel } from '../../lib/navigation';
import { useBadgeCounts } from './useBadgeCounts';
import { Avatar } from '../ui/primitives';
import { useApp } from '../../store/AppContext';
export function Sidebar({ role }) {
    const badges = useBadgeCounts();
    const { currentSeller } = useApp();
    const groups = getNav(role);
    return (_jsxs("aside", { className: "sidebar", children: [_jsxs(NavLink, { to: role === 'seller' ? '/seller/dashboard' : '/admin/overview', className: "brand", "aria-label": "PANZ PROJECT \u2014 kembali ke beranda", children: [_jsx("span", { className: "brand__mark", "aria-hidden": "true", children: _jsx("span", { children: "P" }) }), _jsxs("span", { className: "brand__text", children: [_jsx("span", { className: "brand__name", children: "PANZ" }), _jsx("span", { className: "brand__sub", children: "PROJECT" })] })] }), _jsxs("div", { className: "workspace-pill", children: [_jsx("span", { className: "workspace-pill__icon", "aria-hidden": "true", children: role === 'seller' ? _jsx(FlaskConical, { size: 14 }) : _jsx(ShieldCheck, { size: 14 }) }), _jsx("span", { children: roleLabel(role) }), _jsx("span", { className: "workspace-pill__demo", children: "DEMO" })] }), _jsx("nav", { className: "sidebar__nav", "aria-label": `Navigasi ${roleLabel(role)}`, children: groups.map((group) => (_jsxs("div", { className: "sidebar__group", children: [_jsx("p", { className: "sidebar__group-label", children: group.label }), group.items.map((item) => {
                            const Icon = item.icon;
                            const count = item.badge ? badges[item.badge] : 0;
                            return (_jsxs(NavLink, { to: item.path, className: ({ isActive }) => `sidebar__link${isActive ? ' is-active' : ''}`, children: [_jsx(Icon, { size: 18, className: "sidebar__icon", "aria-hidden": "true" }), _jsx("span", { className: "sidebar__label", children: item.label }), count > 0 ? _jsx("span", { className: "sidebar__count", children: count > 99 ? '99+' : count }) : null] }, item.path));
                        })] }, group.label))) }), _jsxs("div", { className: "sidebar__footer", children: [_jsxs("div", { className: "sidebar__seller", children: [_jsx(Avatar, { name: role === 'seller' ? currentSeller.name : 'Admin PANZ', size: "sm" }), _jsxs("div", { children: [_jsx("p", { className: "sidebar__seller-name", children: role === 'seller' ? currentSeller.name : 'Admin PANZ' }), _jsx("p", { className: "sidebar__seller-role", children: role === 'seller' ? 'Seller workspace' : 'Administrator' })] })] }), _jsxs("div", { className: "sidebar__demo-note", children: [_jsx("span", { className: "sidebar__demo-dot", "aria-hidden": "true" }), _jsx("p", { children: "Prototype \u00B7 data demo lokal. Tidak ada uang atau email yang diproses." })] })] })] }));
}
