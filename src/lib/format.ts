const idr = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const number = new Intl.NumberFormat('id-ID')

const dateMedium = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const dateShort = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
})

const dateTime = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const timeOnly = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
})

const monthYear = new Intl.DateTimeFormat('id-ID', {
  month: 'short',
  year: '2-digit',
})

const monthShort = new Intl.DateTimeFormat('id-ID', { month: 'short' })

export const formatIDR = (value: number) => idr.format(value)

export const formatNumber = (value: number) => number.format(value)

export const formatCompactIDR = (value: number) => {
  if (Math.abs(value) >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`
  }
  if (Math.abs(value) >= 1_000) {
    return `Rp ${(value / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 0 })} rb`
  }
  return `Rp ${value}`
}

export const formatDate = (iso: string) => dateMedium.format(new Date(iso))

export const formatDateShort = (iso: string) => dateShort.format(new Date(iso))

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso))

export const formatTime = (iso: string) => timeOnly.format(new Date(iso))

export const formatMonth = (date: Date) => monthYear.format(date)

export const formatMonthShort = (date: Date) => monthShort.format(date)

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Baru saja'
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} hari lalu`
  return formatDate(iso)
}

export type DeadlineTone = 'safe' | 'warn' | 'danger' | 'muted'

export const getDeadline = (iso?: string | null): { label: string; tone: DeadlineTone; expired: boolean } => {
  if (!iso) return { label: 'Belum ditentukan', tone: 'muted', expired: false }
  const diff = new Date(iso).getTime() - Date.now()
  const absolute = Math.abs(diff)
  const minutes = Math.floor(absolute / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  let value: string
  if (days > 0) value = `${days} hari ${hours % 24} jam`
  else if (hours > 0) value = `${hours} jam ${minutes % 60} mnt`
  else value = `${Math.max(minutes, 1)} mnt`

  if (diff < 0) return { label: `Lewat ${value}`, tone: 'danger', expired: true }
  if (hours < 6) return { label: `${value} lagi`, tone: 'danger', expired: false }
  if (hours < 18) return { label: `${value} lagi`, tone: 'warn', expired: false }
  return { label: `${value} lagi`, tone: 'safe', expired: false }
}

export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

export const titleCase = (value: string) =>
  value
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

export const maskAccount = (value: string) => {
  const clean = value.replace(/\s/g, '')
  if (clean.length <= 4) return value
  return `•••• •••• ${clean.slice(-4)}`
}
