import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatCompactIDR, formatIDR, formatMonthShort } from '../../lib/format';
import { EmptyState } from '../ui';
import { BarChart3 } from 'lucide-react';
const buildBuckets = (transactions, months) => {
    const now = new Date();
    return Array.from({ length: months }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (months - 1 - index), 1);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        const value = transactions
            .filter((transaction) => {
            if (transaction.type !== 'COMMISSION' || transaction.status !== 'SUCCESS')
                return false;
            const txDate = new Date(transaction.date);
            return txDate.getFullYear() === date.getFullYear() && txDate.getMonth() === date.getMonth();
        })
            .reduce((sum, transaction) => sum + transaction.amount, 0);
        return {
            key,
            label: formatMonthShort(date),
            fullLabel: new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date),
            value,
        };
    });
};
export function EarningsChart({ transactions, months }) {
    const buckets = buildBuckets(transactions, months);
    const total = buckets.reduce((sum, bucket) => sum + bucket.value, 0);
    const max = Math.max(...buckets.map((bucket) => bucket.value), 1);
    const nonEmpty = buckets.some((bucket) => bucket.value > 0);
    if (!nonEmpty) {
        return (_jsx(EmptyState, { icon: BarChart3, title: "Belum ada komisi pada periode ini", description: "Komisi yang disetujui akan muncul pada grafik ini. Data keuangan saat ini adalah simulasi." }));
    }
    return (_jsxs("figure", { className: "earnings-chart", children: [_jsxs("figcaption", { className: "earnings-chart__summary", children: [_jsxs("div", { children: [_jsxs("span", { children: ["Total komisi \u00B7 ", months, " bulan"] }), _jsx("strong", { children: formatIDR(total) })] }), _jsx("span", { className: "earnings-chart__note", children: "Komisi bruto disetujui \u00B7 simulasi" })] }), _jsxs("div", { className: "earnings-chart__plot", role: "img", "aria-label": `Grafik komisi ${months} bulan terakhir. Total ${formatIDR(total)}.`, children: [_jsxs("div", { className: "earnings-chart__grid", "aria-hidden": "true", children: [_jsx("span", {}), _jsx("span", {}), _jsx("span", {}), _jsx("span", {})] }), _jsx("div", { className: "earnings-chart__bars", children: buckets.map((bucket) => {
                            const height = Math.max((bucket.value / max) * 100, bucket.value > 0 ? 6 : 1.5);
                            return (_jsxs("div", { className: "earnings-chart__column", children: [_jsx("span", { className: "earnings-chart__value", children: bucket.value > 0 ? formatCompactIDR(bucket.value) : '—' }), _jsx("span", { className: `earnings-chart__bar${bucket.value === 0 ? ' is-empty' : ''}`, style: { height: `${height}%` }, title: `${bucket.fullLabel}: ${formatIDR(bucket.value)}` }), _jsx("span", { className: "earnings-chart__label", children: bucket.label })] }, bucket.key));
                        }) })] }), _jsxs("table", { className: "sr-only", children: [_jsxs("caption", { children: ["Komisi bruto ", months, " bulan terakhir (simulasi)"] }), _jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Bulan" }), _jsx("th", { scope: "col", children: "Nilai" })] }) }), _jsx("tbody", { children: buckets.map((bucket) => (_jsxs("tr", { children: [_jsx("th", { scope: "row", children: bucket.fullLabel }), _jsx("td", { children: formatIDR(bucket.value) })] }, bucket.key))) })] })] }));
}
