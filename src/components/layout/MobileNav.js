import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { getNav, getNavItems, roleLabel } from '../../lib/navigation';
import { useBadgeCounts } from './useBadgeCounts';
import { Modal, SimulationTag } from '../ui';
import { useApp } from '../../store/AppContext';
export function MobileNav({ role }) {
    const [open, setOpen] = useState(false);
    const location = useLocation();
    const badges = useBadgeCounts();
    const { currentSeller } = useApp();
    const items = getNavItems(role);
    const primary = items.filter((item) => item.primary);
    const secondary = items.filter((item) => !item.primary);
    const secondaryActive = secondary.some((item) => location.pathname === item.path);
    const groups = getNav(role);
    useEffect(() => {
        setOpen(false);
    }, [location.pathname]);
    return (_jsxs(_Fragment, { children: [_jsxs("nav", { className: "mobile-nav", "aria-label": "Navigasi utama seluler", children: [primary.map((item) => {
                        const Icon = item.icon;
                        const count = item.badge ? badges[item.badge] : 0;
                        return (_jsxs(NavLink, { to: item.path, className: ({ isActive }) => `mobile-nav__item${isActive ? ' is-active' : ''}`, children: [_jsxs("span", { className: "mobile-nav__icon", children: [_jsx(Icon, { size: 19, "aria-hidden": "true" }), count > 0 ? _jsx("span", { className: "mobile-nav__badge", children: count > 9 ? '9+' : count }) : null] }), _jsx("span", { children: item.shortLabel })] }, item.path));
                    }), _jsxs("button", { type: "button", className: `mobile-nav__item mobile-nav__menu${secondaryActive ? ' is-active' : ''}`, onClick: () => setOpen(true), "aria-haspopup": "dialog", "aria-expanded": open, children: [_jsx("span", { className: "mobile-nav__icon", children: _jsx(Menu, { size: 19, "aria-hidden": "true" }) }), _jsx("span", { children: "Menu" })] })] }), _jsxs(Modal, { open: open, onClose: () => setOpen(false), title: "Menu navigasi", description: `${roleLabel(role)} · seluruh data adalah simulasi lokal.`, eyebrow: "PANZ PROJECT", size: "md", footer: _jsx("button", { type: "button", className: "btn btn--secondary btn--block", onClick: () => setOpen(false), children: "Tutup menu" }), children: [_jsxs("div", { className: "mobile-menu__identity", children: [_jsxs("div", { children: [_jsx("p", { className: "mobile-menu__name", children: role === 'seller' ? currentSeller.name : 'Admin PANZ' }), _jsx("p", { className: "mobile-menu__role", children: roleLabel(role) })] }), _jsx(SimulationTag, {})] }), _jsx("div", { className: "mobile-menu__groups", children: groups.map((group) => (_jsxs("div", { className: "mobile-menu__group", children: [_jsx("p", { className: "sidebar__group-label", children: group.label }), group.items.map((item) => {
                                    const Icon = item.icon;
                                    const count = item.badge ? badges[item.badge] : 0;
                                    return (_jsxs(NavLink, { to: item.path, className: ({ isActive }) => `mobile-menu__link${isActive ? ' is-active' : ''}`, onClick: () => setOpen(false), children: [_jsx(Icon, { size: 18, "aria-hidden": "true" }), _jsx("span", { children: item.label }), count > 0 ? _jsx("span", { className: "sidebar__count", children: count }) : null] }, item.path));
                                })] }, group.label))) }), _jsxs("button", { type: "button", className: "mobile-menu__close-row", onClick: () => setOpen(false), children: [_jsx(X, { size: 16 }), "Tutup"] })] })] }));
}
