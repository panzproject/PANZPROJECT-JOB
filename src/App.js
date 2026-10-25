import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
const SellerDashboard = lazy(() => import('./pages/seller/Dashboard'));
const Marketplace = lazy(() => import('./pages/seller/Marketplace'));
const MyJobs = lazy(() => import('./pages/seller/MyJobs'));
const Finance = lazy(() => import('./pages/seller/Finance'));
const Transactions = lazy(() => import('./pages/seller/Transactions'));
const Notifications = lazy(() => import('./pages/seller/Notifications'));
const Profile = lazy(() => import('./pages/seller/Profile'));
const AdminOverview = lazy(() => import('./pages/admin/Overview'));
const JobManagement = lazy(() => import('./pages/admin/JobManagement'));
const ReviewQueue = lazy(() => import('./pages/admin/ReviewQueue'));
const SellerManagement = lazy(() => import('./pages/admin/SellerManagement'));
const Withdrawals = lazy(() => import('./pages/admin/Withdrawals'));
const EmailIntegration = lazy(() => import('./pages/admin/EmailIntegration'));
const AuditLog = lazy(() => import('./pages/admin/AuditLog'));
const SettingsPage = lazy(() => import('./pages/admin/Settings'));
export default function App() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/seller/dashboard", replace: true }) }), _jsxs(Route, { element: _jsx(AppShell, {}), children: [_jsx(Route, { path: "/seller", element: _jsx(Navigate, { to: "/seller/dashboard", replace: true }) }), _jsx(Route, { path: "/seller/dashboard", element: _jsx(SellerDashboard, {}) }), _jsx(Route, { path: "/seller/marketplace", element: _jsx(Marketplace, {}) }), _jsx(Route, { path: "/seller/jobs", element: _jsx(MyJobs, {}) }), _jsx(Route, { path: "/seller/finance", element: _jsx(Finance, {}) }), _jsx(Route, { path: "/seller/transactions", element: _jsx(Transactions, {}) }), _jsx(Route, { path: "/seller/notifications", element: _jsx(Notifications, {}) }), _jsx(Route, { path: "/seller/profile", element: _jsx(Profile, {}) }), _jsx(Route, { path: "/admin", element: _jsx(Navigate, { to: "/admin/overview", replace: true }) }), _jsx(Route, { path: "/admin/overview", element: _jsx(AdminOverview, {}) }), _jsx(Route, { path: "/admin/jobs", element: _jsx(JobManagement, {}) }), _jsx(Route, { path: "/admin/reviews", element: _jsx(ReviewQueue, {}) }), _jsx(Route, { path: "/admin/sellers", element: _jsx(SellerManagement, {}) }), _jsx(Route, { path: "/admin/withdrawals", element: _jsx(Withdrawals, {}) }), _jsx(Route, { path: "/admin/email", element: _jsx(EmailIntegration, {}) }), _jsx(Route, { path: "/admin/audit", element: _jsx(AuditLog, {}) }), _jsx(Route, { path: "/admin/settings", element: _jsx(SettingsPage, {}) })] }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/seller/dashboard", replace: true }) })] }));
}
