import {
  useRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
  Search,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { StatusMeta, Tone } from '../../lib/status'
import { initials } from '../../lib/format'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  iconLeft?: LucideIcon
  iconRight?: LucideIcon
  block?: boolean
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  iconLeft: IconLeft,
  iconRight: IconRight,
  block = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} btn--${size}${block ? ' btn--block' : ''} ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className="btn__spinner" size={16} aria-hidden="true" /> : IconLeft ? <IconLeft size={16} aria-hidden="true" /> : null}
      <span>{children}</span>
      {IconRight ? <IconRight size={16} aria-hidden="true" /> : null}
    </button>
  )
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  variant?: 'ghost' | 'subtle' | 'danger'
  size?: 'sm' | 'md'
}

export function IconButton({
  label,
  variant = 'ghost',
  size = 'md',
  className = '',
  children,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={`icon-btn icon-btn--${variant} icon-btn--${size} ${className}`.trim()}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  )
}

export function Badge({
  tone = 'neutral',
  children,
  dot = true,
  className = '',
}: {
  tone?: Tone
  children: ReactNode
  dot?: boolean
  className?: string
}) {
  return (
    <span className={`badge badge--${tone} ${className}`.trim()}>
      {dot ? <span className="badge__dot" aria-hidden="true" /> : null}
      <span>{children}</span>
    </span>
  )
}

export function StatusBadge({ meta, className }: { meta: StatusMeta; className?: string }) {
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  )
}

export function Avatar({
  name,
  size = 'md',
  status,
}: {
  name: string
  size?: 'sm' | 'md' | 'lg'
  status?: 'online' | 'pending' | 'offline'
}) {
  const hue = (name.charCodeAt(0) * 17 + name.length * 29) % 360
  return (
    <span
      className={`avatar avatar--${size}`}
      style={{ '--avatar-hue': hue } as CSSProperties}
      aria-hidden="true"
    >
      <span>{initials(name)}</span>
      {status ? <span className={`avatar__status avatar__status--${status}`} /> : null}
    </span>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <header className="page-header">
      <div className="page-header__text">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p className="page-header__description">{description}</p> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  )
}

export function Panel({
  title,
  description,
  action,
  children,
  className = '',
  bodyClassName = '',
}: {
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={`panel ${className}`.trim()}>
      {title || action ? (
        <div className="panel__header">
          <div>
            {title ? <h2 className="panel__title">{title}</h2> : null}
            {description ? <p className="panel__description">{description}</p> : null}
          </div>
          {action ? <div className="panel__action">{action}</div> : null}
        </div>
      ) : null}
      <div className={`panel__body ${bodyClassName}`.trim()}>{children}</div>
    </section>
  )
}

type StatCardProps = {
  label: string
  value: ReactNode
  icon: LucideIcon
  footnote?: ReactNode
  tone?: Tone
  simulated?: boolean
}

export function StatCard({ label, value, icon: Icon, footnote, tone = 'accent', simulated }: StatCardProps) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__top">
        <span className="stat-card__icon" aria-hidden="true">
          <Icon size={18} />
        </span>
        {simulated ? <span className="stat-card__sim">Demo</span> : null}
      </div>
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
      {footnote ? <div className="stat-card__footnote">{footnote}</div> : null}
    </article>
  )
}

export function SearchField({
  value,
  onChange,
  placeholder,
  label,
  className = '',
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  label: string
  className?: string
}) {
  return (
    <div className={`search-field ${className}`.trim()}>
      <Search size={17} className="search-field__icon" aria-hidden="true" />
      <input
        type="search"
        className="search-field__input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
      />
      {value ? (
        <button
          type="button"
          className="search-field__clear"
          onClick={() => onChange('')}
          aria-label="Hapus pencarian"
        >
          <X size={15} />
        </button>
      ) : null}
    </div>
  )
}

export function ProgressBar({
  value,
  tone = 'accent',
  label,
}: {
  value: number
  tone?: 'accent' | 'success' | 'warning' | 'danger'
  label?: string
}) {
  const bounded = Math.min(100, Math.max(0, value))
  return (
    <div
      className={`progress progress--${tone}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(bounded)}
      aria-label={label ?? 'Progres pekerjaan'}
    >
      <span className="progress__track">
        <span className="progress__fill" style={{ width: `${bounded}%` }} />
      </span>
    </div>
  )
}

type TabItem = {
  id: string
  label: string
  count?: number
}

export function Tabs({
  items,
  value,
  onChange,
  label = 'Filter tab',
}: {
  items: TabItem[]
  value: string
  onChange: (id: string) => void
  label?: string
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  const handleKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    let nextIndex = index
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % items.length
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + items.length) % items.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = items.length - 1
    onChange(items[nextIndex].id)
    refs.current[nextIndex]?.focus()
  }

  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {items.map((item, index) => (
        <button
          key={item.id}
          ref={(element) => {
            refs.current[index] = element
          }}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          tabIndex={value === item.id ? 0 : -1}
          className={`tab${value === item.id ? ' is-active' : ''}`}
          onClick={() => onChange(item.id)}
          onKeyDown={(event) => handleKey(event, index)}
        >
          {item.label}
          {typeof item.count === 'number' ? <span className="tab__count">{item.count}</span> : null}
        </button>
      ))}
    </div>
  )
}

export function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)
  return (
    <nav className="pagination" aria-label="Navigasi halaman">
      <button
        type="button"
        className="pagination__button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Halaman sebelumnya"
      >
        <ChevronLeft size={16} />
      </button>
      {pages.map((item) => (
        <button
          key={item}
          type="button"
          className={`pagination__button${item === page ? ' is-active' : ''}`}
          onClick={() => onChange(item)}
          aria-current={item === page ? 'page' : undefined}
          aria-label={`Halaman ${item}`}
        >
          {item}
        </button>
      ))}
      <button
        type="button"
        className="pagination__button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Halaman berikutnya"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon" aria-hidden="true">
        <Icon size={22} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  )
}

export function Callout({
  tone = 'info',
  title,
  children,
  icon: Icon = Info,
}: {
  tone?: 'info' | 'warning' | 'danger' | 'success' | 'purple'
  title?: string
  children: ReactNode
  icon?: LucideIcon
}) {
  return (
    <div className={`callout callout--${tone}`} role="note">
      <Icon size={18} aria-hidden="true" className="callout__icon" />
      <div>
        {title ? <p className="callout__title">{title}</p> : null}
        <div className="callout__text">{children}</div>
      </div>
    </div>
  )
}

export function Skeleton({ height = 14, width = '100%', className = '' }: { height?: number | string; width?: number | string; className?: string }) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={{ height, width }}
      aria-hidden="true"
    />
  )
}

export function PageSkeleton() {
  return (
    <div className="page-skeleton" aria-busy="true" aria-label="Memuat halaman demo">
      <div className="page-skeleton__header">
        <Skeleton width={100} height={10} />
        <Skeleton width="42%" height={30} />
        <Skeleton width="60%" height={14} />
      </div>
      <div className="page-skeleton__stats">
        {[0, 1, 2, 3].map((item) => (
          <div className="page-skeleton__card" key={item}>
            <Skeleton width={32} height={32} />
            <Skeleton width="55%" height={10} />
            <Skeleton width="70%" height={24} />
            <Skeleton width="45%" height={10} />
          </div>
        ))}
      </div>
      <div className="page-skeleton__card page-skeleton__table">
        <Skeleton width="25%" height={16} />
        {[0, 1, 2, 3, 4].map((item) => (
          <div className="page-skeleton__row" key={item}>
            <Skeleton width="20%" height={12} />
            <Skeleton width="42%" height={12} />
            <Skeleton width="18%" height={12} />
            <Skeleton width="12%" height={12} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SimulationTag({ children = 'Data simulasi' }: { children?: ReactNode }) {
  return (
    <span className="simulation-tag">
      <span className="simulation-tag__dot" aria-hidden="true" />
      {children}
    </span>
  )
}

export function FilterBar({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`filter-bar ${className}`.trim()}>{children}</div>
}

export function ResultCount({ shown, total, noun = 'data' }: { shown: number; total: number; noun?: string }) {
  return (
    <p className="result-count">
      Menampilkan <strong>{shown}</strong> dari <strong>{total}</strong> {noun}
    </p>
  )
}

export function InlineSearch(props: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className="inline-search">
      <Search size={15} aria-hidden="true" />
      <input {...props} aria-label={props.label} />
    </div>
  )
}
