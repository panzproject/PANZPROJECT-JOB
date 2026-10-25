import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CheckCheck,
  Check,
  Circle,
  Info,
  Settings2,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import { useApp } from '../../store/AppContext'
import type { AppNotification, NotificationKind } from '../../types'
import { formatDateTime, relativeTime } from '../../lib/format'
import {
  Badge,
  Button,
  Callout,
  EmptyState,
  Modal,
  PageHeader,
  Panel,
  SimulationTag,
  Tabs,
} from '../../components/ui'
import { useToast } from '../../components/ui/Toast'

const KIND_META: Record<NotificationKind, { label: string; icon: typeof Bell }> = {
  job: { label: 'Pekerjaan', icon: BriefcaseBusiness },
  finance: { label: 'Keuangan', icon: Wallet },
  account: { label: 'Akun', icon: ShieldCheck },
  system: { label: 'Sistem', icon: Settings2 },
}

export default function Notifications() {
  const { state, markNotificationRead, markAllNotificationsRead } = useApp()
  const toast = useToast()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const notifications = [...state.notifications].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  )
  const unreadCount = notifications.filter((item) => !item.read).length
  const visible = filter === 'UNREAD' ? notifications.filter((item) => !item.read) : notifications
  const selected = notifications.find((item) => item.id === selectedId) ?? null

  const openNotification = (notification: AppNotification) => {
    setSelectedId(notification.id)
    if (!notification.read) markNotificationRead(notification.id)
  }

  const markAll = () => {
    markAllNotificationsRead()
    toast.success('Semua notifikasi ditandai sudah dibaca.', 'Notifikasi diperbarui')
  }

  return (
    <div className="page page-enter">
      <PageHeader
        eyebrow="Kotak masuk seller"
        title="Notifikasi"
        description="Pantau kabar revisi, komisi, deadline, dan keamanan akun pada data simulasi."
        actions={
          <Button
            variant="secondary"
            iconLeft={CheckCheck}
            onClick={markAll}
            disabled={unreadCount === 0}
          >
            Tandai semua dibaca
          </Button>
        }
      />

      <Callout tone="warning" title="Notifikasi simulasi">
        Tidak ada email atau push notification nyata yang dikirim. Semua item di halaman ini dibuat dari data demo
        lokal dan akan kembali setelah reset data.
      </Callout>

      <div className="notification-overview">
        <div className="notification-overview__count">
          <span className={`notification-overview__icon${unreadCount > 0 ? ' has-unread' : ''}`} aria-hidden="true">
            <Bell size={18} />
          </span>
          <div>
            <strong>{unreadCount}</strong>
            <span>belum dibaca dari {notifications.length} notifikasi</span>
          </div>
        </div>
        <SimulationTag />
      </div>

      <Panel bodyClassName="notification-panel__body">
        <Tabs
          label="Filter notifikasi"
          value={filter}
          onChange={(value) => setFilter(value as 'ALL' | 'UNREAD')}
          items={[
            { id: 'ALL', label: 'Semua', count: notifications.length },
            { id: 'UNREAD', label: 'Belum dibaca', count: unreadCount },
          ]}
        />

        {visible.length > 0 ? (
          <div className="notification-list">
            {visible.map((notification) => {
              const meta = KIND_META[notification.kind]
              const KindIcon = meta.icon
              return (
                <div
                  className={`notification-row${notification.read ? '' : ' is-unread'}`}
                  key={notification.id}
                >
                  <button
                    type="button"
                    className="notification-row__main"
                    onClick={() => openNotification(notification)}
                    aria-label={`Buka notifikasi ${notification.title}${notification.read ? '' : ', belum dibaca'}`}
                  >
                    <span className={`notification-row__icon notification-row__icon--${notification.kind}`} aria-hidden="true">
                      <KindIcon size={17} />
                    </span>
                    <span className="notification-row__copy">
                      <span className="notification-row__topline">
                        <span className="notification-row__title">{notification.title}</span>
                        {!notification.read ? (
                          <span className="notification-row__unread">
                            <Circle size={6} fill="currentColor" aria-hidden="true" />
                            Baru
                          </span>
                        ) : null}
                      </span>
                      <span className="notification-row__message">{notification.message}</span>
                      <span className="notification-row__meta">
                        <Badge tone="neutral">{meta.label}</Badge>
                        <span title={formatDateTime(notification.at)}>{relativeTime(notification.at)}</span>
                        <span className="mono">{notification.id}</span>
                      </span>
                    </span>
                  </button>
                  <div className="notification-row__actions">
                    {!notification.read ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        iconLeft={Check}
                        onClick={() => markNotificationRead(notification.id)}
                        aria-label={`Tandai ${notification.title} sudah dibaca`}
                      >
                        Tandai
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      iconRight={ArrowRight}
                      onClick={() => openNotification(notification)}
                      aria-label={`Lihat detail ${notification.title}`}
                    >
                      Detail
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyState
            icon={filter === 'UNREAD' ? CheckCheck : Bell}
            title={filter === 'UNREAD' ? 'Semua sudah dibaca' : 'Belum ada notifikasi'}
            description={
              filter === 'UNREAD'
                ? 'Tidak ada notifikasi baru pada data demo. Anda dapat melihat seluruh riwayat notifikasi.'
                : 'Kabar pekerjaan dan keuangan akan muncul di sini setelah aktivitas demo berjalan.'
            }
            action={
              filter === 'UNREAD' ? (
                <Button variant="secondary" size="sm" onClick={() => setFilter('ALL')}>
                  Lihat semua notifikasi
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={() => navigate('/seller/dashboard')}>
                  Kembali ke dashboard
                </Button>
              )
            }
          />
        )}
      </Panel>

      {selected ? (
        <Modal
          open={Boolean(selected)}
          onClose={() => setSelectedId(null)}
          title={selected.title}
          description={`${KIND_META[selected.kind].label} · ${formatDateTime(selected.at)}`}
          eyebrow="Detail notifikasi"
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setSelectedId(null)}>
                Tutup
              </Button>
              <Button
                variant="primary"
                iconRight={ArrowRight}
                onClick={() => {
                  markNotificationRead(selected.id)
                  setSelectedId(null)
                  navigate(selected.href)
                }}
              >
                Buka halaman terkait
              </Button>
            </>
          }
        >
          <div className="notification-detail">
            <div className="notification-detail__meta">
              <Badge tone="neutral">{KIND_META[selected.kind].label}</Badge>
              <Badge tone="success">
                <Check size={10} aria-hidden="true" /> Dibaca
              </Badge>
              <span className="mono">{selected.id}</span>
            </div>
            <p className="notification-detail__message">{selected.message}</p>
            <div className="notification-detail__when">
              <Info size={13} aria-hidden="true" />
              <span>{formatDateTime(selected.at)} · {relativeTime(selected.at)}</span>
            </div>
            <Callout tone="info" title="Tautan tujuan simulasi">
              Tombol di bawah membuka halaman terkait pada prototype. Tidak ada data yang dikirim keluar peramban.
            </Callout>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
