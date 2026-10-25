import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button, Callout, Modal, TextAreaField } from '../ui';
export function ReasonDialog({ open, onClose, onConfirm, title, description, label, placeholder, confirmLabel, tone = 'primary', children, minLength = 5, }) {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    useEffect(() => {
        if (!open)
            return;
        setReason('');
        setError('');
    }, [open]);
    const submit = () => {
        if (reason.trim().length < minLength) {
            setError(`Alasan wajib diisi minimal ${minLength} karakter.`);
            return;
        }
        const result = onConfirm(reason.trim());
        if (result.ok) {
            onClose();
        }
        else {
            setError(result.message ?? 'Tindakan tidak dapat diproses. Periksa kembali data demo.');
        }
    };
    return (_jsx(Modal, { open: open, onClose: onClose, title: title, description: description, size: "sm", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", onClick: onClose, children: "Batal" }), _jsx(Button, { variant: tone === 'danger' ? 'danger' : 'primary', onClick: submit, children: confirmLabel })] }), children: _jsxs("div", { className: "form-stack", children: [tone === 'danger' ? (_jsx(Callout, { tone: "danger", icon: AlertTriangle, title: "Tindakan sensitif", children: "Alasan akan dicatat pada audit log demo. Perubahan hanya berlaku pada state lokal." })) : null, children, _jsx(TextAreaField, { label: label, name: "reason", value: reason, onChange: (event) => {
                        setReason(event.target.value);
                        setError('');
                    }, placeholder: placeholder, rows: 4, required: true, error: error || undefined, hint: "Jangan menulis token, password, atau data sensitif pada alasan.", autoFocus: true })] }) }));
}
