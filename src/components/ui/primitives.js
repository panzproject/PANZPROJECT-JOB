import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, } from 'react';
import { ChevronLeft, ChevronRight, Info, Loader2, Search, X, } from 'lucide-react';
import { initials } from '../../lib/format';
export function Button({ variant = 'secondary', size = 'md', loading = false, iconLeft: IconLeft, iconRight: IconRight, block = false, className = '', children, disabled, type = 'button', ...props }) {
    return (_jsxs("button", { type: type, className: `btn btn--${variant} btn--${size}${block ? ' btn--block' : ''} ${className}`.trim(), disabled: disabled || loading, "aria-busy": loading || undefined, ...props, children: [loading ? _jsx(Loader2, { className: "btn__spinner", size: 16, "aria-hidden": "true" }) : IconLeft ? _jsx(IconLeft, { size: 16, "aria-hidden": "true" }) : null, _jsx("span", { children: children }), IconRight ? _jsx(IconRight, { size: 16, "aria-hidden": "true" }) : null] }));
}
export function IconButton({ label, variant = 'ghost', size = 'md', className = '', children, type = 'button', ...props }) {
    return (_jsx("button", { type: type, className: `icon-btn icon-btn--${variant} icon-btn--${size} ${className}`.trim(), "aria-label": label, title: label, ...props, children: children }));
}
export function Badge({ tone = 'neutral', children, dot = true, className = '', }) {
    return (_jsxs("span", { className: `badge badge--${tone} ${className}`.trim(), children: [dot ? _jsx("span", { className: "badge__dot", "aria-hidden": "true" }) : null, _jsx("span", { children: children })] }));
}
export function StatusBadge({ meta, className }) {
    return (_jsx(Badge, { tone: meta.tone, className: className, children: meta.label }));
}
export function Avatar({ name, size = 'md', status, }) {
    const hue = (name.charCodeAt(0) * 17 + name.length * 29) % 360;
    return (_jsxs("span", { className: `avatar avatar--${size}`, style: { '--avatar-hue': hue }, "aria-hidden": "true", children: [_jsx("span", { children: initials(name) }), status ? _jsx("span", { className: `avatar__status avatar__status--${status}` }) : null] }));
}
export function PageHeader({ eyebrow, title, description, actions, }) {
    return (_jsxs("header", { className: "page-header", children: [_jsxs("div", { className: "page-header__text", children: [eyebrow ? _jsx("p", { className: "eyebrow", children: eyebrow }) : null, _jsx("h1", { children: title }), description ? _jsx("p", { className: "page-header__description", children: description }) : null] }), actions ? _jsx("div", { className: "page-header__actions", children: actions }) : null] }));
}
export function Panel({ title, description, action, children, className = '', bodyClassName = '', }) {
    return (_jsxs("section", { className: `panel ${className}`.trim(), children: [title || action ? (_jsxs("div", { className: "panel__header", children: [_jsxs("div", { children: [title ? _jsx("h2", { className: "panel__title", children: title }) : null, description ? _jsx("p", { className: "panel__description", children: description }) : null] }), action ? _jsx("div", { className: "panel__action", children: action }) : null] })) : null, _jsx("div", { className: `panel__body ${bodyClassName}`.trim(), children: children })] }));
}
export function StatCard({ label, value, icon: Icon, footnote, tone = 'accent', simulated }) {
    return (_jsxs("article", { className: `stat-card stat-card--${tone}`, children: [_jsxs("div", { className: "stat-card__top", children: [_jsx("span", { className: "stat-card__icon", "aria-hidden": "true", children: _jsx(Icon, { size: 18 }) }), simulated ? _jsx("span", { className: "stat-card__sim", children: "Demo" }) : null] }), _jsx("p", { className: "stat-card__label", children: label }), _jsx("p", { className: "stat-card__value", children: value }), footnote ? _jsx("div", { className: "stat-card__footnote", children: footnote }) : null] }));
}
export function SearchField({ value, onChange, placeholder, label, className = '', }) {
    return (_jsxs("div", { className: `search-field ${className}`.trim(), children: [_jsx(Search, { size: 17, className: "search-field__icon", "aria-hidden": "true" }), _jsx("input", { type: "search", className: "search-field__input", value: value, onChange: (event) => onChange(event.target.value), placeholder: placeholder, "aria-label": label }), value ? (_jsx("button", { type: "button", className: "search-field__clear", onClick: () => onChange(''), "aria-label": "Hapus pencarian", children: _jsx(X, { size: 15 }) })) : null] }));
}
export function ProgressBar({ value, tone = 'accent', label, }) {
    const bounded = Math.min(100, Math.max(0, value));
    return (_jsx("div", { className: `progress progress--${tone}`, role: "progressbar", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": Math.round(bounded), "aria-label": label ?? 'Progres pekerjaan', children: _jsx("span", { className: "progress__track", children: _jsx("span", { className: "progress__fill", style: { width: `${bounded}%` } }) }) }));
}
export function Tabs({ items, value, onChange, label = 'Filter tab', }) {
    const refs = useRef([]);
    const handleKey = (event, index) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key))
            return;
        event.preventDefault();
        let nextIndex = index;
        if (event.key === 'ArrowRight')
            nextIndex = (index + 1) % items.length;
        if (event.key === 'ArrowLeft')
            nextIndex = (index - 1 + items.length) % items.length;
        if (event.key === 'Home')
            nextIndex = 0;
        if (event.key === 'End')
            nextIndex = items.length - 1;
        onChange(items[nextIndex].id);
        refs.current[nextIndex]?.focus();
    };
    return (_jsx("div", { className: "tabs", role: "tablist", "aria-label": label, children: items.map((item, index) => (_jsxs("button", { ref: (element) => {
                refs.current[index] = element;
            }, type: "button", role: "tab", "aria-selected": value === item.id, tabIndex: value === item.id ? 0 : -1, className: `tab${value === item.id ? ' is-active' : ''}`, onClick: () => onChange(item.id), onKeyDown: (event) => handleKey(event, index), children: [item.label, typeof item.count === 'number' ? _jsx("span", { className: "tab__count", children: item.count }) : null] }, item.id))) }));
}
export function Pagination({ page, pageSize, total, onChange, }) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (totalPages <= 1)
        return null;
    const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
    return (_jsxs("nav", { className: "pagination", "aria-label": "Navigasi halaman", children: [_jsx("button", { type: "button", className: "pagination__button", onClick: () => onChange(page - 1), disabled: page <= 1, "aria-label": "Halaman sebelumnya", children: _jsx(ChevronLeft, { size: 16 }) }), pages.map((item) => (_jsx("button", { type: "button", className: `pagination__button${item === page ? ' is-active' : ''}`, onClick: () => onChange(item), "aria-current": item === page ? 'page' : undefined, "aria-label": `Halaman ${item}`, children: item }, item))), _jsx("button", { type: "button", className: "pagination__button", onClick: () => onChange(page + 1), disabled: page >= totalPages, "aria-label": "Halaman berikutnya", children: _jsx(ChevronRight, { size: 16 }) })] }));
}
export function EmptyState({ icon: Icon, title, description, action, }) {
    return (_jsxs("div", { className: "empty-state", children: [_jsx("span", { className: "empty-state__icon", "aria-hidden": "true", children: _jsx(Icon, { size: 22 }) }), _jsx("h3", { children: title }), _jsx("p", { children: description }), action ? _jsx("div", { className: "empty-state__action", children: action }) : null] }));
}
export function Callout({ tone = 'info', title, children, icon: Icon = Info, }) {
    return (_jsxs("div", { className: `callout callout--${tone}`, role: "note", children: [_jsx(Icon, { size: 18, "aria-hidden": "true", className: "callout__icon" }), _jsxs("div", { children: [title ? _jsx("p", { className: "callout__title", children: title }) : null, _jsx("div", { className: "callout__text", children: children })] })] }));
}
export function Skeleton({ height = 14, width = '100%', className = '' }) {
    return (_jsx("span", { className: `skeleton ${className}`.trim(), style: { height, width }, "aria-hidden": "true" }));
}
export function PageSkeleton() {
    return (_jsxs("div", { className: "page-skeleton", "aria-busy": "true", "aria-label": "Memuat halaman demo", children: [_jsxs("div", { className: "page-skeleton__header", children: [_jsx(Skeleton, { width: 100, height: 10 }), _jsx(Skeleton, { width: "42%", height: 30 }), _jsx(Skeleton, { width: "60%", height: 14 })] }), _jsx("div", { className: "page-skeleton__stats", children: [0, 1, 2, 3].map((item) => (_jsxs("div", { className: "page-skeleton__card", children: [_jsx(Skeleton, { width: 32, height: 32 }), _jsx(Skeleton, { width: "55%", height: 10 }), _jsx(Skeleton, { width: "70%", height: 24 }), _jsx(Skeleton, { width: "45%", height: 10 })] }, item))) }), _jsxs("div", { className: "page-skeleton__card page-skeleton__table", children: [_jsx(Skeleton, { width: "25%", height: 16 }), [0, 1, 2, 3, 4].map((item) => (_jsxs("div", { className: "page-skeleton__row", children: [_jsx(Skeleton, { width: "20%", height: 12 }), _jsx(Skeleton, { width: "42%", height: 12 }), _jsx(Skeleton, { width: "18%", height: 12 }), _jsx(Skeleton, { width: "12%", height: 12 })] }, item)))] })] }));
}
export function SimulationTag({ children = 'Data simulasi' }) {
    return (_jsxs("span", { className: "simulation-tag", children: [_jsx("span", { className: "simulation-tag__dot", "aria-hidden": "true" }), children] }));
}
export function FilterBar({ children, className = '' }) {
    return _jsx("div", { className: `filter-bar ${className}`.trim(), children: children });
}
export function ResultCount({ shown, total, noun = 'data' }) {
    return (_jsxs("p", { className: "result-count", children: ["Menampilkan ", _jsx("strong", { children: shown }), " dari ", _jsx("strong", { children: total }), " ", noun] }));
}
export function InlineSearch(props) {
    return (_jsxs("div", { className: "inline-search", children: [_jsx(Search, { size: 15, "aria-hidden": "true" }), _jsx("input", { ...props, "aria-label": props.label })] }));
}
