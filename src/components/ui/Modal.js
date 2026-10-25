import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef, } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
const openStack = [];
const focusableSelector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
export function Modal({ open, onClose, title, description, children, footer, size = 'md', dismissible = true, eyebrow, }) {
    const id = useId();
    const titleId = `${id}-title`;
    const descriptionId = `${id}-description`;
    const dialogRef = useRef(null);
    const previousFocus = useRef(null);
    const onCloseRef = useRef(onClose);
    const dismissibleRef = useRef(dismissible);
    onCloseRef.current = onClose;
    dismissibleRef.current = dismissible;
    useEffect(() => {
        if (!open)
            return;
        const stackId = `${id}-${Date.now()}`;
        openStack.push(stackId);
        previousFocus.current = document.activeElement;
        document.body.classList.add('modal-open');
        const timer = window.setTimeout(() => {
            const dialog = dialogRef.current;
            if (!dialog)
                return;
            const first = dialog.querySelector(focusableSelector);
            (first ?? dialog).focus();
        }, 20);
        const handleKeyDown = (event) => {
            if (openStack[openStack.length - 1] !== stackId)
                return;
            if (event.key === 'Escape' && dismissibleRef.current) {
                event.preventDefault();
                onCloseRef.current();
                return;
            }
            if (event.key !== 'Tab')
                return;
            const dialog = dialogRef.current;
            if (!dialog)
                return;
            const elements = Array.from(dialog.querySelectorAll(focusableSelector)).filter((element) => element.offsetParent !== null);
            if (elements.length === 0) {
                event.preventDefault();
                dialog.focus();
                return;
            }
            const first = elements[0];
            const last = elements[elements.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            }
            else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            window.clearTimeout(timer);
            document.removeEventListener('keydown', handleKeyDown);
            const index = openStack.indexOf(stackId);
            if (index >= 0)
                openStack.splice(index, 1);
            if (openStack.length === 0)
                document.body.classList.remove('modal-open');
            if (previousFocus.current && document.contains(previousFocus.current)) {
                window.setTimeout(() => previousFocus.current?.focus(), 10);
            }
        };
    }, [open, id]);
    if (!open)
        return null;
    const handleOverlayClick = (event) => {
        if (event.target !== event.currentTarget)
            return;
        if (!dismissible)
            return;
        onClose();
    };
    return createPortal(_jsx("div", { className: "modal-overlay", onMouseDown: handleOverlayClick, children: _jsxs("div", { ref: dialogRef, className: `modal modal--${size}`, role: "dialog", "aria-modal": "true", "aria-labelledby": titleId, "aria-describedby": description ? descriptionId : undefined, tabIndex: -1, children: [_jsxs("div", { className: "modal__header", children: [_jsxs("div", { className: "modal__heading", children: [eyebrow ? _jsx("p", { className: "eyebrow", children: eyebrow }) : null, _jsx("h2", { id: titleId, children: title }), description ? (_jsx("p", { id: descriptionId, className: "modal__description", children: description })) : null] }), _jsx("button", { type: "button", className: "icon-btn icon-btn--ghost modal__close", onClick: onClose, "aria-label": "Tutup dialog", children: _jsx(X, { size: 18 }) })] }), _jsx("div", { className: "modal__body", children: children }), footer ? _jsx("div", { className: "modal__footer", children: footer }) : null] }) }), document.body);
}
export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Lanjutkan', cancelLabel = 'Batal', tone = 'primary', children, busy = false, }) {
    return (_jsxs(Modal, { open: open, onClose: onClose, title: title, description: description, size: "sm", dismissible: !busy, footer: _jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "btn btn--secondary", onClick: onClose, disabled: busy, children: cancelLabel }), _jsx("button", { type: "button", className: `btn ${tone === 'danger' ? 'btn--danger' : 'btn--primary'}`, onClick: onConfirm, disabled: busy, children: busy ? 'Memproses…' : confirmLabel })] }), children: [tone === 'danger' ? (_jsxs("div", { className: "callout callout--danger", children: [_jsx(AlertTriangle, { size: 18, "aria-hidden": "true" }), _jsx("p", { children: "Tindakan ini mengubah data demo. Pada sistem nyata, tindakan akan dicatat pada audit log." })] })) : null, children] }));
}
