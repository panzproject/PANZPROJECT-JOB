export type Role = 'seller' | 'admin'

export type JobStatus =
  | 'AVAILABLE'
  | 'CLAIMED'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REVISION'
  | 'REJECTED'
  | 'EXPIRED'
  | 'EXPIRY_REVIEW'
  | 'CANCELLED'

export type SellerStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED' | 'CLOSED'

export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'REJECTED' | 'CANCELLED'

export type TransactionType = 'COMMISSION' | 'WITHDRAWAL' | 'ADJUSTMENT' | 'REFUND'

export type TransactionStatus = 'SUCCESS' | 'PENDING' | 'FAILED'

export type AuditCategory = 'PEKERJAAN' | 'SELLER' | 'KEUANGAN' | 'KEAMANAN' | 'INTEGRASI'

export type NotificationKind = 'job' | 'finance' | 'account' | 'system'

export type DemoAttachment = {
  name: string
  size: number
  type: string
}

export type Submission = {
  id: string
  submittedAt: string
  note: string
  attachments: DemoAttachment[]
  adminNote?: string
  outcome?: 'APPROVED' | 'REVISION' | 'REJECTED'
}

export type JobHistoryEntry = {
  at: string
  by: string
  action: string
  detail?: string
}

export type Job = {
  id: string
  title: string
  category: string
  description: string
  instructions: string
  rate: number
  status: JobStatus
  paused?: boolean
  createdAt: string
  deadlineHours: number
  claimedAt?: string
  deadlineAt?: string
  sellerId?: string
  progress: number
  submittedAt?: string
  revisionCount: number
  commissionRecorded: boolean
  sellerNote?: string
  attachments: DemoAttachment[]
  submissions: Submission[]
  reviewNote?: string
  history: JobHistoryEntry[]
}

export type PaymentMethod = {
  type: 'bank' | 'ewallet'
  provider: string
  accountName: string
  accountNumber: string
}

export type Seller = {
  id: string
  name: string
  username: string
  email: string
  emailVerified: boolean
  joinedAt: string
  status: SellerStatus
  paymentMethod?: PaymentMethod
  note?: string
}

export type WithdrawalEvent = {
  at: string
  status: WithdrawalStatus
  by: string
  note?: string
}

export type Withdrawal = {
  id: string
  sellerId: string
  sellerName: string
  amount: number
  method: string
  accountName: string
  accountNumber: string
  status: WithdrawalStatus
  requestedAt: string
  updatedAt: string
  reason?: string
  paymentRef?: string
  timeline: WithdrawalEvent[]
}

export type Transaction = {
  id: string
  date: string
  type: TransactionType
  description: string
  amount: number
  status: TransactionStatus
  reference: string
}

export type AppNotification = {
  id: string
  kind: NotificationKind
  type: string
  title: string
  message: string
  at: string
  read: boolean
  href: string
}

export type EmailConnectionStatus = 'CONNECTED' | 'NEEDS_ATTENTION' | 'REVOKED'

export type EmailError = {
  at: string
  code: string
  message: string
}

export type EmailConnection = {
  id: string
  provider: string
  email: string
  label: string
  status: EmailConnectionStatus
  lastSync: string | null
  permissions: string[]
  errors: EmailError[]
}

export type AuditEntry = {
  id: string
  timestamp: string
  actor: string
  category: AuditCategory
  action: string
  objectType: string
  objectRef: string
  summary: string
  reason?: string
}

export type Session = {
  id: string
  device: string
  browser: string
  location: string
  lastActiveAt: string
  current: boolean
}

export type Settings = {
  deadlineHours: number
  revisionHours: number
  maxRevisions: number
  notifyNewJobs: boolean
  notifyReview: boolean
  notifyDeadline: boolean
  adminMfa: boolean
  sessionTimeoutMinutes: number
  uploadMaxMb: number
  allowedFileTypes: string[]
  retentionDays: number
  backupFrequency: string
  emailSyncEnabled: boolean
}

export type Wallet = {
  available: number
  held: number
  lifetimeEarnings: number
  paidOut: number
}

export type AppState = {
  version: number
  currentSellerId: string
  wallet: Wallet
  sellers: Seller[]
  jobs: Job[]
  withdrawals: Withdrawal[]
  transactions: Transaction[]
  notifications: AppNotification[]
  connections: EmailConnection[]
  audit: AuditEntry[]
  sessions: Session[]
  settings: Settings
}

export type ActionResult = {
  ok: boolean
  message: string
}

export type NewJobInput = {
  title: string
  category: string
  description: string
  instructions: string
  rate: number
  deadlineHours: number
}

export type WithdrawalInput = {
  amount: number
  method: string
  accountName: string
  accountNumber: string
}
