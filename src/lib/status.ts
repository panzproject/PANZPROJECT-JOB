import type {
  AuditCategory,
  Job,
  JobStatus,
  SellerStatus,
  TransactionStatus,
  TransactionType,
  WithdrawalStatus,
} from '../types'

export type Tone = 'info' | 'accent' | 'success' | 'warning' | 'danger' | 'purple' | 'neutral'

export type StatusMeta = {
  label: string
  tone: Tone
}

export const JOB_STATUS: Record<JobStatus, StatusMeta> = {
  AVAILABLE: { label: 'Tersedia', tone: 'info' },
  CLAIMED: { label: 'Dikerjakan', tone: 'accent' },
  SUBMITTED: { label: 'Menunggu review', tone: 'warning' },
  UNDER_REVIEW: { label: 'Sedang direview', tone: 'purple' },
  APPROVED: { label: 'Disetujui', tone: 'success' },
  REVISION: { label: 'Perlu revisi', tone: 'warning' },
  REJECTED: { label: 'Ditolak', tone: 'danger' },
  EXPIRED: { label: 'Kedaluwarsa', tone: 'danger' },
  EXPIRY_REVIEW: { label: 'Review kedaluwarsa', tone: 'purple' },
  CANCELLED: { label: 'Ditutup', tone: 'neutral' },
}

export const getJobStatus = (job: Pick<Job, 'status' | 'paused'>): StatusMeta => {
  if (job.paused && job.status === 'AVAILABLE') return { label: 'Dijeda', tone: 'neutral' }
  return JOB_STATUS[job.status]
}

export const SELLER_STATUS: Record<SellerStatus, StatusMeta> = {
  PENDING: { label: 'Menunggu persetujuan', tone: 'warning' },
  ACTIVE: { label: 'Aktif', tone: 'success' },
  REJECTED: { label: 'Ditolak', tone: 'danger' },
  SUSPENDED: { label: 'Ditangguhkan', tone: 'danger' },
  CLOSED: { label: 'Ditutup', tone: 'neutral' },
}

export const WITHDRAWAL_STATUS: Record<WithdrawalStatus, StatusMeta> = {
  PENDING: { label: 'Menunggu', tone: 'warning' },
  APPROVED: { label: 'Disetujui', tone: 'info' },
  PROCESSING: { label: 'Diproses', tone: 'purple' },
  PAID: { label: 'Dibayar', tone: 'success' },
  REJECTED: { label: 'Ditolak', tone: 'danger' },
  CANCELLED: { label: 'Dibatalkan', tone: 'neutral' },
}

export const TX_STATUS: Record<TransactionStatus, StatusMeta> = {
  SUCCESS: { label: 'Berhasil', tone: 'success' },
  PENDING: { label: 'Menunggu', tone: 'warning' },
  FAILED: { label: 'Gagal', tone: 'danger' },
}

export const TX_TYPE: Record<TransactionType, StatusMeta> = {
  COMMISSION: { label: 'Komisi', tone: 'success' },
  WITHDRAWAL: { label: 'Penarikan', tone: 'info' },
  ADJUSTMENT: { label: 'Koreksi', tone: 'warning' },
  REFUND: { label: 'Pengembalian', tone: 'purple' },
}

export const AUDIT_CATEGORY: Record<AuditCategory, StatusMeta> = {
  PEKERJAAN: { label: 'Pekerjaan', tone: 'accent' },
  SELLER: { label: 'Seller', tone: 'success' },
  KEUANGAN: { label: 'Keuangan', tone: 'warning' },
  KEAMANAN: { label: 'Keamanan', tone: 'purple' },
  INTEGRASI: { label: 'Integrasi', tone: 'info' },
}

export const JOB_CATEGORIES = [
  'Input Data',
  'Riset',
  'Verifikasi',
  'Konten',
  'Media',
  'Analisis',
  'Administrasi',
]

export const JOB_STATUS_OPTIONS = Object.entries(JOB_STATUS).map(([value, meta]) => ({
  value: value as JobStatus,
  label: meta.label,
}))

export const SELLER_STATUS_OPTIONS = Object.entries(SELLER_STATUS).map(([value, meta]) => ({
  value: value as SellerStatus,
  label: meta.label,
}))

export const WITHDRAWAL_STATUS_OPTIONS = Object.entries(WITHDRAWAL_STATUS).map(([value, meta]) => ({
  value: value as WithdrawalStatus,
  label: meta.label,
}))

export const ALLOWED_UPLOAD_TYPES = ['PDF', 'PNG', 'JPG', 'ZIP']

export const fileExtension = (name: string) => name.split('.').pop()?.toUpperCase() ?? ''

export const fileTypeAllowed = (name: string) => ALLOWED_UPLOAD_TYPES.includes(fileExtension(name))
