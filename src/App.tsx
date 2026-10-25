import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'

const SellerDashboard = lazy(() => import('./pages/seller/Dashboard'))
const Marketplace = lazy(() => import('./pages/seller/Marketplace'))
const MyJobs = lazy(() => import('./pages/seller/MyJobs'))
const Finance = lazy(() => import('./pages/seller/Finance'))
const Transactions = lazy(() => import('./pages/seller/Transactions'))
const Notifications = lazy(() => import('./pages/seller/Notifications'))
const Profile = lazy(() => import('./pages/seller/Profile'))

const AdminOverview = lazy(() => import('./pages/admin/Overview'))
const JobManagement = lazy(() => import('./pages/admin/JobManagement'))
const ReviewQueue = lazy(() => import('./pages/admin/ReviewQueue'))
const SellerManagement = lazy(() => import('./pages/admin/SellerManagement'))
const Withdrawals = lazy(() => import('./pages/admin/Withdrawals'))
const EmailIntegration = lazy(() => import('./pages/admin/EmailIntegration'))
const AuditLog = lazy(() => import('./pages/admin/AuditLog'))
const SettingsPage = lazy(() => import('./pages/admin/Settings'))

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/seller/dashboard" replace />} />
      <Route element={<AppShell />}>
        <Route path="/seller" element={<Navigate to="/seller/dashboard" replace />} />
        <Route path="/seller/dashboard" element={<SellerDashboard />} />
        <Route path="/seller/marketplace" element={<Marketplace />} />
        <Route path="/seller/jobs" element={<MyJobs />} />
        <Route path="/seller/finance" element={<Finance />} />
        <Route path="/seller/transactions" element={<Transactions />} />
        <Route path="/seller/notifications" element={<Notifications />} />
        <Route path="/seller/profile" element={<Profile />} />

        <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
        <Route path="/admin/overview" element={<AdminOverview />} />
        <Route path="/admin/jobs" element={<JobManagement />} />
        <Route path="/admin/reviews" element={<ReviewQueue />} />
        <Route path="/admin/sellers" element={<SellerManagement />} />
        <Route path="/admin/withdrawals" element={<Withdrawals />} />
        <Route path="/admin/email" element={<EmailIntegration />} />
        <Route path="/admin/audit" element={<AuditLog />} />
        <Route path="/admin/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/seller/dashboard" replace />} />
    </Routes>
  )
}
