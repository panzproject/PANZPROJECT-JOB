import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Eye, Link2, Mail, Plus, RefreshCw, ShieldAlert, ShieldCheck, Unplug, } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { formatDateTime, relativeTime } from '../../lib/format';
import { Badge, Button, Callout, ConfirmDialog, EmptyState, Modal, PageHeader, Panel, SelectField, SimulationTag, TextField, } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
const statusMeta = {
    CONNECTED: { label: 'Terhubung', tone: 'success' },
    NEEDS_ATTENTION: { label: 'Perlu perhatian', tone: 'warning' },
    REVOKED: { label: 'Akses dicabut', tone: 'neutral' },
};
const providers = ['Microsoft 365', 'Microsoft Outlook', 'Google Workspace'];
export default function EmailIntegration() {
    const { state, addEmailConnection, markConnectionChecked, reconnectConnection, revokeConnection } = useApp();
    const toast = useToast();
    const [addOpen, setAddOpen] = useState(false);
    const [provider, setProvider] = useState(providers[0]);
    const [email, setEmail] = useState('');
    const [label, setLabel] = useState('');
    const [formError, setFormError] = useState('');
    const [detailId, setDetailId] = useState(null);
    const [revokeId, setRevokeId] = useState(null);
    const summary = useMemo(() => ({
        connected: state.connections.filter((item) => item.status === 'CONNECTED').length,
        attention: state.connections.filter((item) => item.status === 'NEEDS_ATTENTION').length,
        revoked: state.connections.filter((item) => item.status === 'REVOKED').length,
    }), [state.connections]);
    const detail = state.connections.find((connection) => connection.id === detailId) ?? null;
    const revokeTarget = state.connections.find((connection) => connection.id === revokeId) ?? null;
    useEffect(() => {
        if (!addOpen)
            return;
        setProvider(providers[0]);
        setEmail('');
        setLabel('');
        setFormError('');
    }, [addOpen]);
    const submitConnection = (event) => {
        event.preventDefault();
        if (!email.includes('@')) {
            setFormError('Masukkan alamat email demo yang valid.');
            return;
        }
        if (label.trim().length < 2) {
            setFormError('Label koneksi minimal 2 karakter.');
            return;
        }
        const result = addEmailConnection({ provider, email: email.trim(), label: label.trim() });
        if (result.ok) {
            toast.success(result.message, 'Koneksi demo ditambahkan');
            setAddOpen(false);
        }
        else {
            setFormError(result.message);
        }
    };
    const checkConnection = (connection) => {
        const result = markConnectionChecked(connection.id);
        if (result.ok)
            toast.success(result.message, 'Pemeriksaan selesai');
        else
            toast.warning(result.message, 'Koneksi masih bermasalah');
    };
    const reconnect = (connection) => {
        const result = reconnectConnection(connection.id);
        if (result.ok)
            toast.success(result.message, 'Koneksi dipulihkan');
        else
            toast.error(result.message);
    };
    const confirmRevoke = () => {
        if (!revokeId)
            return;
        const result = revokeConnection(revokeId);
        if (result.ok)
            toast.success(result.message, 'Akses dicabut');
        else
            toast.error(result.message);
        setRevokeId(null);
        setDetailId(null);
    };
    return (_jsxs("div", { className: "page page-enter", children: [_jsx(PageHeader, { eyebrow: "Panel admin", title: "Integrasi email", description: "Kelola koneksi email operasional demo, izin minimal, dan error yang sudah disanitasi.", actions: _jsx(Button, { variant: "primary", iconLeft: Plus, onClick: () => setAddOpen(true), children: "Tambah koneksi" }) }), _jsx(Callout, { tone: "warning", icon: ShieldAlert, title: "Tidak ada OAuth atau token nyata", children: "Penambahan koneksi pada prototype hanya membuat metadata demo. Jangan memasukkan email atau kredensial nyata; tidak ada autentikasi Microsoft/Google yang dijalankan dan tidak ada email yang dibaca." }), _jsxs("div", { className: "email-health", children: [_jsxs("div", { children: [_jsx("span", { className: "email-health__icon is-connected", "aria-hidden": "true", children: _jsx(ShieldCheck, { size: 18 }) }), _jsxs("div", { children: [_jsx("strong", { children: summary.connected }), _jsx("span", { children: "koneksi terhubung" })] })] }), _jsxs("div", { children: [_jsx("span", { className: "email-health__icon is-attention", "aria-hidden": "true", children: _jsx(AlertTriangle, { size: 18 }) }), _jsxs("div", { children: [_jsx("strong", { children: summary.attention }), _jsx("span", { children: "perlu perhatian" })] })] }), _jsxs("div", { children: [_jsx("span", { className: "email-health__icon is-revoked", "aria-hidden": "true", children: _jsx(Unplug, { size: 18 }) }), _jsxs("div", { children: [_jsx("strong", { children: summary.revoked }), _jsx("span", { children: "akses dicabut" })] })] }), _jsxs("div", { className: "email-health__note", children: [_jsx(Clock3, { size: 13, "aria-hidden": "true" }), _jsx("span", { children: "Sinkronisasi terakhir diperbarui pada data demo." })] })] }), _jsx(Panel, { title: "Koneksi email", description: "Izin hanya metadata demo; isi email tidak pernah diambil.", action: _jsx(SimulationTag, { children: "Tanpa OAuth" }), children: state.connections.length > 0 ? (_jsx("div", { className: "connection-grid", children: state.connections.map((connection) => {
                        const meta = statusMeta[connection.status];
                        return (_jsxs("article", { className: `connection-card connection-card--${connection.status.toLowerCase()}`, children: [_jsxs("div", { className: "connection-card__head", children: [_jsx("span", { className: "connection-card__icon", "aria-hidden": "true", children: _jsx(Mail, { size: 19 }) }), _jsxs("div", { className: "connection-card__identity", children: [_jsxs("div", { children: [_jsx("h3", { children: connection.label }), _jsx(Badge, { tone: meta.tone, children: meta.label })] }), _jsx("p", { children: connection.email }), _jsxs("span", { children: [connection.provider, " \u00B7 ", _jsx("span", { className: "mono", children: connection.id })] })] })] }), _jsxs("div", { className: "connection-card__sync", children: [_jsxs("div", { children: [_jsx("span", { children: "Terakhir sinkron" }), _jsx("strong", { children: connection.lastSync ? relativeTime(connection.lastSync) : 'Belum pernah' })] }), _jsxs("div", { children: [_jsx("span", { children: "Izin" }), _jsxs("strong", { children: [connection.permissions.length, " izin demo"] })] })] }), connection.permissions.length > 0 ? (_jsx("div", { className: "permission-chips", children: connection.permissions.map((permission) => (_jsx("span", { className: "permission-chip", children: permission }, permission))) })) : (_jsx("p", { className: "detail-empty", children: "Tidak ada izin aktif pada koneksi ini." })), connection.errors.length > 0 ? (_jsxs("div", { className: "connection-error", children: [_jsx(AlertTriangle, { size: 14, "aria-hidden": "true" }), _jsxs("div", { children: [_jsx("strong", { children: connection.errors[0].code }), _jsx("p", { children: connection.errors[0].message }), _jsx("span", { children: formatDateTime(connection.errors[0].at) })] })] })) : (_jsxs("div", { className: "connection-ok", children: [_jsx(CheckCircle2, { size: 14, "aria-hidden": "true" }), _jsx("span", { children: "Tidak ada error tercatat." })] })), _jsxs("div", { className: "connection-card__actions", children: [_jsx(Button, { variant: "ghost", size: "sm", iconLeft: Eye, onClick: () => setDetailId(connection.id), children: "Detail" }), connection.status !== 'REVOKED' ? (_jsx(Button, { variant: "secondary", size: "sm", iconLeft: RefreshCw, onClick: () => checkConnection(connection), children: "Periksa" })) : null, connection.status === 'NEEDS_ATTENTION' || connection.status === 'REVOKED' ? (_jsx(Button, { variant: "primary", size: "sm", iconLeft: Link2, onClick: () => reconnect(connection), children: "Sambungkan kembali" })) : (_jsx(Button, { variant: "danger", size: "sm", iconLeft: Unplug, onClick: () => setRevokeId(connection.id), children: "Cabut akses" }))] })] }, connection.id));
                    }) })) : (_jsx(EmptyState, { icon: Mail, title: "Belum ada koneksi email", description: "Tambahkan koneksi demo untuk menampilkan status integrasi. Tidak ada OAuth yang dijalankan.", action: _jsx(Button, { variant: "primary", size: "sm", iconLeft: Plus, onClick: () => setAddOpen(true), children: "Tambah koneksi" }) })) }), _jsx(Modal, { open: addOpen, onClose: () => setAddOpen(false), title: "Tambah koneksi email", description: "Metadata demo saja. Tidak ada OAuth atau kredensial yang diminta.", eyebrow: "Integrasi simulasi", size: "sm", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", onClick: () => setAddOpen(false), children: "Batal" }), _jsx(Button, { variant: "primary", iconLeft: Plus, type: "submit", form: "add-email-form", children: "Tambah koneksi" })] }), children: _jsxs("form", { id: "add-email-form", className: "form-stack", onSubmit: submitConnection, noValidate: true, children: [formError ? (_jsx(Callout, { tone: "danger", title: "Koneksi belum ditambahkan", children: formError })) : null, _jsx(SelectField, { label: "Penyedia", value: provider, onChange: (event) => setProvider(event.target.value), options: providers.map((item) => ({ value: item, label: item })) }), _jsx(TextField, { label: "Email demo", name: "email", type: "email", value: email, onChange: (event) => {
                                setEmail(event.target.value);
                                setFormError('');
                            }, placeholder: "operasional@panzproject.demo", hint: "Gunakan domain demo, bukan email pribadi.", autoComplete: "off", required: true }), _jsx(TextField, { label: "Label koneksi", name: "label", value: label, onChange: (event) => {
                                setLabel(event.target.value);
                                setFormError('');
                            }, placeholder: "Contoh: Operasional", hint: "Minimal 2 karakter.", required: true }), _jsx(Callout, { tone: "warning", title: "Tanpa autentikasi", children: "Tombol tambah hanya membuat metadata pada state lokal. Tidak ada halaman login penyedia email dan tidak ada token akses." })] }) }), detail ? (_jsx(Modal, { open: Boolean(detail), onClose: () => setDetailId(null), title: detail.label, description: `${detail.email} · ${detail.provider}`, eyebrow: "Detail koneksi", size: "md", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", onClick: () => setDetailId(null), children: "Tutup" }), detail.status === 'NEEDS_ATTENTION' || detail.status === 'REVOKED' ? (_jsx(Button, { variant: "primary", iconLeft: Link2, onClick: () => {
                                reconnect(detail);
                                setDetailId(null);
                            }, children: "Sambungkan kembali" })) : (_jsx(Button, { variant: "danger", iconLeft: Unplug, onClick: () => setRevokeId(detail.id), children: "Cabut akses" }))] }), children: _jsxs("div", { className: "connection-detail", children: [_jsxs("div", { className: "connection-detail__top", children: [_jsx(Badge, { tone: statusMeta[detail.status].tone, children: statusMeta[detail.status].label }), _jsx("span", { className: "mono", children: detail.id })] }), _jsxs("div", { className: "confirm-summary", children: [_jsxs("div", { children: [_jsx("span", { children: "Penyedia" }), _jsx("strong", { children: detail.provider })] }), _jsxs("div", { children: [_jsx("span", { children: "Email demo" }), _jsx("strong", { children: detail.email })] }), _jsxs("div", { children: [_jsx("span", { children: "Terakhir sinkron" }), _jsx("strong", { children: detail.lastSync ? formatDateTime(detail.lastSync) : 'Belum pernah' })] }), _jsxs("div", { children: [_jsx("span", { children: "Status" }), _jsx("strong", { children: statusMeta[detail.status].label })] })] }), _jsxs("section", { className: "detail-section", children: [_jsx("h3", { children: "Izin akses demo" }), detail.permissions.length > 0 ? (_jsx("div", { className: "permission-chips", children: detail.permissions.map((permission) => (_jsx("span", { className: "permission-chip", children: permission }, permission))) })) : (_jsx("p", { className: "detail-empty", children: "Tidak ada izin aktif." })), _jsx("p", { className: "detail-footnote", children: "Daftar izin hanya teks demo. Prototype tidak pernah meminta atau menyimpan token OAuth." })] }), _jsxs("section", { className: "detail-section", children: [_jsx("h3", { children: "Riwayat error tersanitasi" }), detail.errors.length > 0 ? (_jsx("div", { className: "connection-error-list", children: detail.errors.map((error, index) => (_jsxs("div", { className: "connection-error", children: [_jsx(AlertTriangle, { size: 14, "aria-hidden": "true" }), _jsxs("div", { children: [_jsx("strong", { children: error.code }), _jsx("p", { children: error.message }), _jsx("span", { children: formatDateTime(error.at) })] })] }, `${error.at}-${error.code}-${index}`))) })) : (_jsxs("div", { className: "connection-ok", children: [_jsx(CheckCircle2, { size: 14, "aria-hidden": "true" }), _jsx("span", { children: "Tidak ada error yang tercatat." })] }))] }), _jsx("p", { className: "detail-footnote", children: "Error pada prototype sudah disanitasi. Sistem produksi tidak boleh menampilkan token, header otorisasi, atau isi email pada pesan error." })] }) })) : null, _jsx(ConfirmDialog, { open: Boolean(revokeId), onClose: () => setRevokeId(null), onConfirm: confirmRevoke, title: "Cabut akses email?", description: revokeTarget ? `${revokeTarget.email} tidak akan memiliki izin aktif pada data demo.` : 'Akses akan dicabut.', confirmLabel: "Cabut akses", tone: "danger", children: _jsx(Callout, { tone: "warning", title: "Simulasi pencabutan", children: "Izin akan dikosongkan dan status menjadi REVOKED. Tidak ada token nyata yang dicabut dan tidak ada penyedia email yang dihubungi." }) })] }));
}
