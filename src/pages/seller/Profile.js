import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, CalendarDays, CreditCard, KeyRound, Laptop, Mail, MapPin, MonitorSmartphone, RefreshCw, Save, ShieldCheck, ShieldQuestion, Smartphone, UserRound, Wallet, } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { formatDate, formatDateTime, formatIDR, maskAccount, relativeTime } from '../../lib/format';
import { Avatar, Badge, Button, Callout, ConfirmDialog, PageHeader, Panel, SelectField, SimulationTag, TextField, } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
const bankProviders = ['Bank BCA', 'Bank Mandiri', 'Bank BNI', 'Bank BRI'];
const ewalletProviders = ['DANA', 'OVO', 'GoPay', 'ShopeePay'];
export default function Profile() {
    const { state, currentSeller, updateProfile, updatePaymentMethod, requestPasswordResetDemo, revokeSession } = useApp();
    const toast = useToast();
    const [name, setName] = useState(currentSeller.name);
    const [username, setUsername] = useState(currentSeller.username);
    const [email, setEmail] = useState(currentSeller.email);
    const [errors, setErrors] = useState({});
    const [profileError, setProfileError] = useState('');
    const [methodType, setMethodType] = useState(currentSeller.paymentMethod?.type ?? 'bank');
    const [provider, setProvider] = useState(currentSeller.paymentMethod?.provider ?? bankProviders[0]);
    const [accountName, setAccountName] = useState(currentSeller.paymentMethod?.accountName ?? currentSeller.name);
    const [accountNumber, setAccountNumber] = useState(currentSeller.paymentMethod?.accountNumber ?? '');
    const [paymentError, setPaymentError] = useState('');
    const [paymentErrors, setPaymentErrors] = useState({});
    const [revokeId, setRevokeId] = useState(null);
    useEffect(() => {
        setName(currentSeller.name);
        setUsername(currentSeller.username);
        setEmail(currentSeller.email);
        setMethodType(currentSeller.paymentMethod?.type ?? 'bank');
        setProvider(currentSeller.paymentMethod?.provider ?? bankProviders[0]);
        setAccountName(currentSeller.paymentMethod?.accountName ?? currentSeller.name);
        setAccountNumber(currentSeller.paymentMethod?.accountNumber ?? '');
        setErrors({});
        setPaymentErrors({});
        setProfileError('');
        setPaymentError('');
    }, [currentSeller.id]);
    const completedJobs = state.jobs.filter((job) => job.sellerId === currentSeller.id && job.status === 'APPROVED').length;
    const sessions = useMemo(() => [...state.sessions].sort((a, b) => Number(b.current) - Number(a.current)), [state.sessions]);
    const sessionToRevoke = sessions.find((session) => session.id === revokeId) ?? null;
    const providers = methodType === 'bank' ? bankProviders : ewalletProviders;
    const submitProfile = (event) => {
        event.preventDefault();
        const nextErrors = {};
        if (name.trim().length < 3)
            nextErrors.name = 'Nama minimal 3 karakter.';
        if (!/^[a-z0-9._]{3,30}$/i.test(username.trim())) {
            nextErrors.username = 'Gunakan 3–30 huruf, angka, titik, atau garis bawah.';
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
            nextErrors.email = 'Masukkan alamat email yang valid.';
        setErrors(nextErrors);
        setProfileError('');
        if (Object.keys(nextErrors).length > 0)
            return;
        const result = updateProfile({ name, username, email });
        if (result.ok) {
            toast.success(result.message, 'Profil disimpan');
        }
        else {
            setProfileError(result.message);
            toast.error(result.message);
        }
    };
    const resetProfileForm = () => {
        setName(currentSeller.name);
        setUsername(currentSeller.username);
        setEmail(currentSeller.email);
        setErrors({});
        setProfileError('');
    };
    const submitPayment = (event) => {
        event.preventDefault();
        const nextErrors = {};
        if (accountName.trim().length < 3)
            nextErrors.accountName = 'Nama pemilik akun wajib diisi minimal 3 karakter.';
        if (accountNumber.replace(/\D/g, '').length < 6)
            nextErrors.accountNumber = 'Nomor akun demo minimal 6 digit.';
        setPaymentErrors(nextErrors);
        setPaymentError('');
        if (Object.keys(nextErrors).length > 0)
            return;
        const result = updatePaymentMethod({
            type: methodType,
            provider,
            accountName: accountName.trim(),
            accountNumber: accountNumber.trim(),
        });
        if (result.ok) {
            toast.success(result.message, 'Metode pembayaran disimpan');
        }
        else {
            setPaymentError(result.message);
            toast.error(result.message);
        }
    };
    const changeMethodType = (value) => {
        const nextType = value;
        setMethodType(nextType);
        setProvider(nextType === 'bank' ? bankProviders[0] : ewalletProviders[0]);
    };
    const simulatePasswordReset = () => {
        const result = requestPasswordResetDemo();
        if (result.ok)
            toast.info(result.message, 'Simulasi keamanan');
        else
            toast.error(result.message);
    };
    const confirmRevoke = () => {
        if (!revokeId)
            return;
        const result = revokeSession(revokeId);
        if (result.ok)
            toast.success(result.message, 'Sesi dicabut');
        else
            toast.error(result.message);
        setRevokeId(null);
    };
    return (_jsxs("div", { className: "page page-enter", children: [_jsx(PageHeader, { eyebrow: "Akun seller", title: "Profil & keamanan", description: "Kelola identitas akun, metode pembayaran demo, dan sesi perangkat. Perubahan hanya tersimpan di peramban.", actions: _jsx(SimulationTag, { children: "Data lokal" }) }), _jsx(Callout, { tone: "warning", title: "Jangan gunakan data pribadi nyata", children: "Semua informasi di halaman ini adalah bagian dari prototype. Nomor rekening, email, dan sesi tidak terhubung ke layanan nyata." }), _jsxs("section", { className: "profile-hero", "aria-label": "Ringkasan akun seller", children: [_jsx(Avatar, { name: currentSeller.name, size: "lg", status: currentSeller.status === 'ACTIVE' ? 'online' : 'pending' }), _jsxs("div", { className: "profile-hero__copy", children: [_jsxs("div", { className: "profile-hero__title-row", children: [_jsx("h2", { children: currentSeller.name }), _jsx(Badge, { tone: currentSeller.status === 'ACTIVE' ? 'success' : 'warning', children: currentSeller.status === 'ACTIVE' ? 'Aktif' : currentSeller.status }), currentSeller.emailVerified ? (_jsxs(Badge, { tone: "info", children: [_jsx(BadgeCheck, { size: 10, "aria-hidden": "true" }), " Email terverifikasi"] })) : (_jsxs(Badge, { tone: "warning", children: [_jsx(ShieldQuestion, { size: 10, "aria-hidden": "true" }), " Email perlu verifikasi"] }))] }), _jsxs("p", { className: "profile-hero__username", children: ["@", currentSeller.username, " \u00B7 ", currentSeller.email] }), _jsxs("div", { className: "profile-hero__facts", children: [_jsxs("span", { children: [_jsx(CalendarDays, { size: 13, "aria-hidden": "true" }), " Bergabung ", formatDate(currentSeller.joinedAt)] }), _jsxs("span", { children: [_jsx(UserRound, { size: 13, "aria-hidden": "true" }), " Seller ID ", _jsx("span", { className: "mono", children: currentSeller.id })] }), _jsxs("span", { children: [_jsx(BadgeCheck, { size: 13, "aria-hidden": "true" }), " ", completedJobs, " pekerjaan disetujui"] })] })] }), _jsxs("div", { className: "profile-hero__score", children: [_jsx("span", { children: "Total penghasilan demo" }), _jsx("strong", { children: formatIDR(state.wallet.lifetimeEarnings) }), _jsxs("small", { children: ["Aktivitas terakhir", ' ', relativeTime(state.transactions[state.transactions.length - 1]?.date ?? currentSeller.joinedAt)] })] })] }), _jsxs("div", { className: "profile-grid", children: [_jsx(Panel, { title: "Informasi akun", description: "Nama, username, dan email yang digunakan pada prototype.", children: _jsxs("form", { className: "form-stack", onSubmit: submitProfile, noValidate: true, children: [profileError ? (_jsx(Callout, { tone: "danger", title: "Perubahan belum disimpan", children: profileError })) : null, _jsx(TextField, { label: "Nama lengkap", name: "name", value: name, onChange: (event) => setName(event.target.value), error: errors.name, hint: "Minimal 3 karakter.", autoComplete: "name", required: true }), _jsx(TextField, { label: "Username", name: "username", value: username, onChange: (event) => setUsername(event.target.value), error: errors.username, hint: "Huruf, angka, titik, atau garis bawah. 3\u201330 karakter.", prefix: "@", autoComplete: "username", required: true }), _jsx(TextField, { label: "Email", name: "email", type: "email", value: email, onChange: (event) => setEmail(event.target.value), error: errors.email, hint: email !== currentSeller.email
                                        ? 'Mengubah email akan mereset status verifikasi pada data demo.'
                                        : 'Email demo; tidak dikirim keluar.', autoComplete: "email", required: true }), _jsxs("div", { className: "form-actions", children: [_jsx(Button, { variant: "ghost", iconLeft: RefreshCw, onClick: resetProfileForm, type: "button", children: "Reset" }), _jsx(Button, { variant: "primary", iconLeft: Save, type: "submit", children: "Simpan perubahan" })] })] }) }), _jsxs(Panel, { title: "Metode pembayaran", description: "Tujuan penarikan pada simulasi keuangan.", action: currentSeller.paymentMethod ? (_jsx(Badge, { tone: "success", children: "Aktif" })) : (_jsx(Badge, { tone: "warning", children: "Belum diatur" })), children: [_jsxs("div", { className: "payment-current", children: [_jsx("span", { className: "payout-card__icon", "aria-hidden": "true", children: _jsx(CreditCard, { size: 20 }) }), _jsxs("div", { children: [_jsx("p", { children: currentSeller.paymentMethod?.provider ?? 'Belum ada metode' }), _jsx("span", { children: currentSeller.paymentMethod
                                                    ? `${maskAccount(currentSeller.paymentMethod.accountNumber)} · ${currentSeller.paymentMethod.accountName}`
                                                    : 'Isi formulir di bawah untuk data demo' })] })] }), _jsxs("form", { className: "form-stack", onSubmit: submitPayment, noValidate: true, children: [paymentError ? (_jsx(Callout, { tone: "danger", title: "Metode belum disimpan", children: paymentError })) : null, _jsxs("div", { className: "form-grid", children: [_jsx(SelectField, { label: "Jenis metode", value: methodType, onChange: (event) => changeMethodType(event.target.value), options: [
                                                    { value: 'bank', label: 'Transfer bank' },
                                                    { value: 'ewallet', label: 'E-wallet' },
                                                ] }), _jsx(SelectField, { label: "Penyedia", value: provider, onChange: (event) => setProvider(event.target.value), options: providers.map((item) => ({ value: item, label: item })) }), _jsx(TextField, { label: "Nama pemilik akun", name: "accountName", value: accountName, onChange: (event) => setAccountName(event.target.value), error: paymentErrors.accountName, autoComplete: "off", required: true }), _jsx(TextField, { label: "Nomor akun demo", name: "accountNumber", value: accountNumber, onChange: (event) => setAccountNumber(event.target.value.replace(/[^\d\s-]/g, '')), error: paymentErrors.accountNumber, hint: "Gunakan angka fiktif. Minimal 6 digit.", inputMode: "numeric", autoComplete: "off", required: true })] }), _jsx(Callout, { tone: "info", title: "Nomor akun disamarkan pada tampilan", children: "Setelah disimpan, nomor hanya ditampilkan sebagian. Data ini tidak terhubung ke bank atau e-wallet." }), _jsx("div", { className: "form-actions", children: _jsx(Button, { variant: "primary", iconLeft: Wallet, type: "submit", children: "Simpan metode demo" }) })] })] })] }), _jsxs("div", { className: "profile-security-grid", children: [_jsxs(Panel, { title: "Keamanan akun", description: "Kontrol keamanan yang tersedia pada prototype.", children: [_jsxs("div", { className: "security-list", children: [_jsxs("div", { className: "security-row", children: [_jsx("span", { className: "security-row__icon", "aria-hidden": "true", children: _jsx(KeyRound, { size: 17 }) }), _jsxs("div", { className: "security-row__copy", children: [_jsx("p", { children: "Kata sandi" }), _jsx("span", { children: "Simulasikan tautan ubah kata sandi. Tidak ada email yang dikirim." })] }), _jsx(Button, { variant: "secondary", size: "sm", onClick: simulatePasswordReset, children: "Simulasikan reset" })] }), _jsxs("div", { className: "security-row", children: [_jsx("span", { className: "security-row__icon", "aria-hidden": "true", children: _jsx(Mail, { size: 17 }) }), _jsxs("div", { className: "security-row__copy", children: [_jsx("p", { children: "Verifikasi email" }), _jsx("span", { children: currentSeller.emailVerified
                                                            ? 'Email demo sudah ditandai terverifikasi.'
                                                            : 'Perubahan email mereset status verifikasi pada data demo.' })] }), _jsx(Badge, { tone: currentSeller.emailVerified ? 'success' : 'warning', children: currentSeller.emailVerified ? 'Terverifikasi' : 'Perlu verifikasi' })] }), _jsxs("div", { className: "security-row", children: [_jsx("span", { className: "security-row__icon", "aria-hidden": "true", children: _jsx(ShieldCheck, { size: 17 }) }), _jsxs("div", { className: "security-row__copy", children: [_jsx("p", { children: "Autentikasi dua faktor" }), _jsx("span", { children: "MFA admin tersedia pada pengaturan admin. MFA seller belum termasuk prototype." })] }), _jsx(Badge, { tone: "neutral", children: "Backlog" })] })] }), _jsx(Callout, { tone: "warning", title: "Batasan keamanan prototype", children: "Tidak ada autentikasi nyata, penyimpanan kata sandi, atau sesi server. Jangan gunakan untuk data pengguna sebenarnya." })] }), _jsxs(Panel, { title: "Sesi perangkat", description: `${sessions.length} sesi tercatat pada data demo.`, action: _jsxs(Badge, { tone: "info", children: [sessions.filter((session) => session.current).length, " sesi ini"] }), children: [_jsx("div", { className: "session-list", children: sessions.map((session) => (_jsxs("div", { className: "session-row", children: [_jsx("span", { className: "session-row__icon", "aria-hidden": "true", children: session.device.toLowerCase().includes('iphone') || session.device.toLowerCase().includes('android') ? (_jsx(Smartphone, { size: 17 })) : session.device.toLowerCase().includes('ipad') ? (_jsx(MonitorSmartphone, { size: 17 })) : (_jsx(Laptop, { size: 17 })) }), _jsxs("div", { className: "session-row__copy", children: [_jsxs("p", { children: [session.device, " \u00B7 ", session.browser, session.current ? _jsx(Badge, { tone: "success", children: "Sesi ini" }) : null] }), _jsxs("span", { children: [_jsx(MapPin, { size: 11, "aria-hidden": "true" }), " ", session.location, " \u00B7 Terakhir aktif", ' ', relativeTime(session.lastActiveAt)] }), _jsx("small", { title: formatDateTime(session.lastActiveAt), children: session.id })] }), session.current ? (_jsx("span", { className: "session-row__current", children: "Aktif" })) : (_jsx(Button, { variant: "ghost", size: "sm", onClick: () => setRevokeId(session.id), children: "Cabut sesi" }))] }, session.id))) }), _jsx("p", { className: "detail-footnote", children: "Pencabutan sesi hanya menghapus baris pada state demo." })] })] }), _jsx(ConfirmDialog, { open: Boolean(revokeId), onClose: () => setRevokeId(null), onConfirm: confirmRevoke, title: "Cabut sesi perangkat?", description: sessionToRevoke
                    ? `${sessionToRevoke.device} · ${sessionToRevoke.browser} akan dihapus dari data sesi demo.`
                    : 'Sesi akan dihapus dari data demo.', confirmLabel: "Cabut sesi", tone: "danger", children: _jsx(Callout, { tone: "warning", title: "Simulasi", children: "Tidak ada sesi nyata yang dicabut dan tidak ada pengguna yang dikeluarkan dari perangkat." }) })] }));
}
