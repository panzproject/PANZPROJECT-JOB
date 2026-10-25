import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Clock3 } from 'lucide-react';
import { getDeadline } from '../../lib/format';
export function DeadlineLabel({ deadlineAt, showClock = true, className = '', }) {
    const deadline = getDeadline(deadlineAt);
    return (_jsxs("span", { className: `deadline deadline--${deadline.tone} ${className}`.trim(), title: "Deadline dihitung dari data demo lokal, bukan batas waktu produksi.", children: [showClock ? _jsx(Clock3, { size: 13, "aria-hidden": "true" }) : null, _jsx("span", { children: deadline.label })] }));
}
