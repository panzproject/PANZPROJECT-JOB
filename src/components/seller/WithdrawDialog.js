import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Banknote, ShieldCheck, WalletCards } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { formatIDR, maskAccount } from '../../lib/format';
import { Button, Callout, ConfirmDialog, Modal, SelectField, SimulationTag, TextField } from '../ui';
import { useToast } from '../ui/Toast';
const methods = [
    'Bank BCA',
    'Bank Mandiri',
    'Bank BNI',
    'Bank BRI',
    'GoPay',
    'OVO',
    'DANA',
];
export function WithdrawDialog({ open, onClose }) {
    const { state, currentSeller, requestWithdrawal } = useApp();
    const toast = useToast();
    const wallet = state.wallet;
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('Bank BCA');
    const [accountName, setAccountName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [error, setError] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);
    useEffect(() => {
        if (!open)
            return;
        setAmount('');
        setMethod(currentSeller.paymentMethod?.provider ?? 'Bank BCA');
        setAccountName(currentSeller.paymentMethod?.accountName ?? currentSeller.name);
        setAccountNumber(currentSeller.paymentMethod?.accountNumber ?? '');
        setError('');
        setConfirmOpen(false);
    }, [open, currentSeller]);
    const numericAmount = Number(amount || 0);
    const methodOptions = Array.from(new Set([...methods, currentSeller.paymentMethod?.provider ?? '']))
        .filter(Boolean)
        .map((value) => ({ value, label: value }));
    const setQuickAmount = (percent) => {
        const value = Math.floor((wallet.available * percent) / 100);
        setAmount(String(value));
        setError('');
    };
    const proceed = () => {
        if (numericAmount <= 0) {
            setError('Nominal harus lebih besar dari nol.');
            return;
        }
        if (numericAmount > wallet.available) {
            setError('Nominal melebihi saldo tersedia.');
            return;
        }
        if (!method) {
            setError('Pilih metode pembayaran.');
            return;
        }
        if (accountName.trim().length < 3) {
            setError('Nama pemilik rekening atau akun wajib diisi.');
            return;
        }
        if (accountNumber.replace(/\D/g, '').length < 6) {
            setError('Nomor rekening atau akun demo minimal 6 digit.');
            return;
        }
        setError('');
        setConfirmOpen(true);
    };
    const confirm = () => {
        const result = requestWithdrawal({
            amount: numericAmount,
            method,
            accountName,
            accountNumber,
        });
        if (result.ok) {
            setConfirmOpen(false);
            onClose();
            toast.success(result.message, 'Pengajuan dibuat');
        }
        else {
            setConfirmOpen(false);
            setError(result.message);
            toast.error(result.message);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx(Modal, { open: open, onClose: onClose, title: "Ajukan penarikan saldo", description: `Saldo tersedia ${formatIDR(wallet.available)} · seluruh proses adalah simulasi.`, eyebrow: "Keuangan seller", size: "md", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", onClick: onClose, children: "Batal" }), _jsx(Button, { variant: "primary", iconLeft: Banknote, onClick: proceed, disabled: wallet.available <= 0, children: "Lanjutkan" })] }), children: _jsxs("div", { className: "withdraw-form", children: [_jsx(Callout, { tone: "warning", title: "Data pembayaran demo", children: "Jangan memasukkan nomor rekening, nama, atau data pribadi yang nyata. Pengajuan tidak mengirim uang dan tidak terhubung ke sistem pembayaran mana pun." }), _jsxs("div", { className: "withdraw-balance", children: [_jsxs("div", { children: [_jsx("span", { children: "Saldo tersedia" }), _jsx("strong", { children: formatIDR(wallet.available) })] }), _jsxs("div", { children: [_jsx("span", { children: "Saldo tertahan" }), _jsx("strong", { children: formatIDR(wallet.held) })] })] }), _jsxs("div", { children: [_jsx(TextField, { label: "Nominal penarikan", name: "withdraw-amount", value: amount ? Number(amount).toLocaleString('id-ID') : '', onChange: (event) => {
                                        setAmount(event.target.value.replace(/\D/g, '').slice(0, 12));
                                        setError('');
                                    }, placeholder: "0", inputMode: "numeric", prefix: "Rp", hint: `Tidak ada minimum penarikan. Maksimum ${formatIDR(wallet.available)}.`, error: error && (numericAmount <= 0 || numericAmount > wallet.available) ? error : undefined }), _jsx("div", { className: "quick-amounts", children: [25, 50, 100].map((percent) => (_jsx("button", { type: "button", className: "quick-amount", onClick: () => setQuickAmount(percent), disabled: wallet.available <= 0, children: percent === 100 ? 'Semua' : `${percent}%` }, percent))) })] }), _jsx(SelectField, { label: "Metode pembayaran", name: "withdraw-method", value: method, onChange: (event) => setMethod(event.target.value), options: methodOptions }), _jsxs("div", { className: "form-grid", children: [_jsx(TextField, { label: "Nama pemilik rekening / akun", name: "account-name", value: accountName, onChange: (event) => {
                                        setAccountName(event.target.value);
                                        setError('');
                                    }, placeholder: "Nama sesuai rekening demo", autoComplete: "off" }), _jsx(TextField, { label: "Nomor rekening / akun demo", name: "account-number", value: accountNumber, onChange: (event) => {
                                        setAccountNumber(event.target.value);
                                        setError('');
                                    }, placeholder: "Contoh: 1234567890", inputMode: "numeric", autoComplete: "off", hint: "Nomor akan disamarkan pada daftar dan audit demo." })] }), _jsxs("div", { className: "withdraw-summary", children: [_jsxs("div", { className: "withdraw-summary__head", children: [_jsx(WalletCards, { size: 16, "aria-hidden": "true" }), _jsx("span", { children: "Ringkasan pengajuan" }), _jsx(SimulationTag, { children: "Simulasi" })] }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "Nominal" }), _jsx("dd", { children: numericAmount > 0 ? formatIDR(numericAmount) : '—' })] }), _jsxs("div", { children: [_jsx("dt", { children: "Metode" }), _jsx("dd", { children: method || '—' })] }), _jsxs("div", { children: [_jsx("dt", { children: "Tujuan" }), _jsx("dd", { children: accountNumber ? maskAccount(accountNumber) : '—' })] }), _jsxs("div", { children: [_jsx("dt", { children: "Biaya" }), _jsx("dd", { children: "Rp 0 \u00B7 simulasi" })] })] })] }), _jsx(Callout, { tone: "info", icon: ShieldCheck, title: "Saldo akan ditahan", children: "Setelah diajukan, nominal tidak dapat digunakan untuk pengajuan lain sampai admin memproses atau menolak pengajuan. Prototype mencegah pengulangan pada state lokal." })] }) }), _jsxs(ConfirmDialog, { open: confirmOpen, onClose: () => setConfirmOpen(false), onConfirm: confirm, title: "Konfirmasi pengajuan penarikan", description: `${formatIDR(numericAmount)} akan ditahan dari saldo demo sampai diperiksa admin.`, confirmLabel: "Ajukan penarikan", children: [_jsxs("div", { className: "confirm-summary", children: [_jsxs("div", { children: [_jsx("span", { children: "Nominal" }), _jsx("strong", { children: formatIDR(numericAmount) })] }), _jsxs("div", { children: [_jsx("span", { children: "Metode" }), _jsx("strong", { children: method })] }), _jsxs("div", { children: [_jsx("span", { children: "Nama pemilik" }), _jsx("strong", { children: accountName || '—' })] }), _jsxs("div", { children: [_jsx("span", { children: "Nomor akun" }), _jsx("strong", { children: accountNumber ? maskAccount(accountNumber) : '—' })] })] }), _jsx(Callout, { tone: "warning", title: "Tidak ada transfer nyata", children: "Pengajuan hanya mengubah saldo dan status demo. Jangan gunakan data rekening nyata pada prototype." })] })] }));
}
