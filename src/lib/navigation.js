import { ArrowLeftRight, Bell, Briefcase, ClipboardCheck, ClipboardList, Gauge, LayoutDashboard, Mail, ScrollText, Search, Settings, ShieldCheck, Users, Wallet, Banknote, } from 'lucide-react';
export const sellerNav = [
    {
        label: 'Ruang kerja',
        items: [
            { label: 'Dashboard', shortLabel: 'Dashboard', path: '/seller/dashboard', icon: LayoutDashboard, primary: true },
            {
                label: 'Pekerjaan Tersedia',
                shortLabel: 'Cari Kerja',
                path: '/seller/marketplace',
                icon: Search,
                badge: 'available',
                primary: true,
            },
            {
                label: 'Pekerjaan Saya',
                shortLabel: 'Pekerjaan',
                path: '/seller/jobs',
                icon: ClipboardList,
                primary: true,
            },
        ],
    },
    {
        label: 'Keuangan',
        items: [
            { label: 'Keuangan', shortLabel: 'Keuangan', path: '/seller/finance', icon: Wallet, primary: true },
            { label: 'Riwayat Transaksi', shortLabel: 'Transaksi', path: '/seller/transactions', icon: ArrowLeftRight },
        ],
    },
    {
        label: 'Akun',
        items: [
            {
                label: 'Notifikasi',
                shortLabel: 'Notifikasi',
                path: '/seller/notifications',
                icon: Bell,
                badge: 'notifications',
            },
            { label: 'Profil & Keamanan', shortLabel: 'Profil', path: '/seller/profile', icon: ShieldCheck },
        ],
    },
];
export const adminNav = [
    {
        label: 'Operasional',
        items: [
            { label: 'Overview', shortLabel: 'Overview', path: '/admin/overview', icon: Gauge, primary: true },
            {
                label: 'Manajemen Pekerjaan',
                shortLabel: 'Pekerjaan',
                path: '/admin/jobs',
                icon: Briefcase,
                primary: true,
            },
            {
                label: 'Review Hasil',
                shortLabel: 'Review',
                path: '/admin/reviews',
                icon: ClipboardCheck,
                badge: 'review',
                primary: true,
            },
            {
                label: 'Manajemen Seller',
                shortLabel: 'Seller',
                path: '/admin/sellers',
                icon: Users,
                badge: 'pendingSellers',
            },
        ],
    },
    {
        label: 'Keuangan & akses',
        items: [
            {
                label: 'Penarikan Saldo',
                shortLabel: 'Penarikan',
                path: '/admin/withdrawals',
                icon: Banknote,
                badge: 'withdrawals',
                primary: true,
            },
            { label: 'Integrasi Email', shortLabel: 'Email', path: '/admin/email', icon: Mail },
        ],
    },
    {
        label: 'Sistem',
        items: [
            { label: 'Audit Log', shortLabel: 'Audit', path: '/admin/audit', icon: ScrollText },
            { label: 'Pengaturan', shortLabel: 'Pengaturan', path: '/admin/settings', icon: Settings },
        ],
    },
];
export const getNav = (role) => (role === 'seller' ? sellerNav : adminNav);
export const getNavItems = (role) => getNav(role).flatMap((group) => group.items);
export const findNavItem = (role, pathname) => getNavItems(role).find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
export const getRoleHome = (role) => (role === 'seller' ? '/seller/dashboard' : '/admin/overview');
export const roleLabel = (role) => (role === 'seller' ? 'Seller Panel' : 'Admin Panel');
