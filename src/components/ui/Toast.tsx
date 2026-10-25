import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info' | 'warning'

type ToastItem = {
  id: number
  kind: ToastKind
  title?: string
  message: string
}

type ToastApi = {
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
  warning: (message: string, title?: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  const push = useCallback(
    (kind: ToastKind, message: string, title?: string) => {
      counter.current += 1
      const id = counter.current
      setToasts((current) => [...current.slice(-3), { id, kind, message, title }])
      window.setTimeout(() => dismiss(id), 5200)
    },
    [dismiss],
  )

  const api: ToastApi = {
    success: (message, title) => push('success', message, title),
    error: (message, title) => push('error', message, title),
    info: (message, title) => push('info', message, title),
    warning: (message, title) => push('warning', message, title),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-viewport" role="region" aria-label="Notifikasi sistem" aria-live="polite">
        {toasts.map((toast) => {
          const Icon = icons[toast.kind]
          return (
            <div key={toast.id} className={`toast toast--${toast.kind}`} role="status">
              <span className="toast__icon" aria-hidden="true">
                <Icon size={18} />
              </span>
              <div className="toast__content">
                {toast.title ? <p className="toast__title">{toast.title}</p> : null}
                <p className="toast__message">{toast.message}</p>
              </div>
              <button
                type="button"
                className="toast__close"
                onClick={() => dismiss(toast.id)}
                aria-label="Tutup notifikasi"
              >
                <X size={15} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast harus digunakan di dalam ToastProvider')
  return context
}
