import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
const ToastContext = createContext(null);
const icons = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
    warning: AlertTriangle,
};
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const counter = useRef(0);
    const dismiss = useCallback((id) => {
        setToasts((current) => current.filter((item) => item.id !== id));
    }, []);
    const push = useCallback((kind, message, title) => {
        counter.current += 1;
        const id = counter.current;
        setToasts((current) => [...current.slice(-3), { id, kind, message, title }]);
        window.setTimeout(() => dismiss(id), 5200);
    }, [dismiss]);
    const api = {
        success: (message, title) => push('success', message, title),
        error: (message, title) => push('error', message, title),
        info: (message, title) => push('info', message, title),
        warning: (message, title) => push('warning', message, title),
    };
    return (_jsxs(ToastContext.Provider, { value: api, children: [children, _jsx("div", { className: "toast-viewport", role: "region", "aria-label": "Notifikasi sistem", "aria-live": "polite", children: toasts.map((toast) => {
                    const Icon = icons[toast.kind];
                    return (_jsxs("div", { className: `toast toast--${toast.kind}`, role: "status", children: [_jsx("span", { className: "toast__icon", "aria-hidden": "true", children: _jsx(Icon, { size: 18 }) }), _jsxs("div", { className: "toast__content", children: [toast.title ? _jsx("p", { className: "toast__title", children: toast.title }) : null, _jsx("p", { className: "toast__message", children: toast.message })] }), _jsx("button", { type: "button", className: "toast__close", onClick: () => dismiss(toast.id), "aria-label": "Tutup notifikasi", children: _jsx(X, { size: 15 }) })] }, toast.id));
                }) })] }));
}
export function useToast() {
    const context = useContext(ToastContext);
    if (!context)
        throw new Error('useToast harus digunakan di dalam ToastProvider');
    return context;
}
