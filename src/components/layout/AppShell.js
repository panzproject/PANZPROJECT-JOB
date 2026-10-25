import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { PageSkeleton } from '../ui';
export function AppShell() {
    const location = useLocation();
    const role = location.pathname.startsWith('/admin') ? 'admin' : 'seller';
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);
    return (_jsxs("div", { className: "app-shell", children: [_jsx("a", { className: "skip-link", href: "#main-content", children: "Lewati ke konten utama" }), _jsx(Sidebar, { role: role }), _jsxs("div", { className: "app-frame", children: [_jsx(Topbar, { role: role }), _jsxs("main", { id: "main-content", className: "app-content", tabIndex: -1, children: [_jsx("div", { className: "content-inner", children: _jsx(Suspense, { fallback: _jsx(PageSkeleton, {}), children: _jsx(Outlet, {}) }) }), _jsxs("footer", { className: "app-footer", children: [_jsx("span", { children: "PANZ PROJECT \u00B7 Prototype 0.1" }), _jsx("span", { children: "Data simulasi lokal \u00B7 tidak ada uang, email, atau data nyata yang diproses" })] })] })] }), _jsx(MobileNav, { role: role })] }));
}
