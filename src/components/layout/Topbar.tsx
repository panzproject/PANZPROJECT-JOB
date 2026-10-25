import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCheck,
  ChevronDown,
  CircleAlert,
  Info,
  RotateCcw,
  Settings,
  ShieldCheck,
  Store,
  UserRound,
} from 'lucide-react'
import type { Role } from '../../types'
import { findNavItem, getRoleHome, roleLabel } from '../../lib/navigation'
import { useApp } from '../../store/AppContext'
import { useClickOutside } from '../../lib/useClickOutside'
import { relativeTime } from '../../lib/format'
import { Avatar, Button, ConfirmDialog, IconButton, Modal } from '../ui'
import { useToast } from '../ui/Toast'

type MenuState = 'notif' | 'avatar' | null

export function Topbar({ role }: { role: Role }) {
  const { state, currentSeller, markNotificationRead, markAllNotificationsRead, resetDemo } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const [menu, setMenu] = useState<MenuState>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLDivElement>(null)
  const closeMenu = useCallback(() => setMenu(null), [])

  useClickOutside(notifRef, menu === 'notif', closeMenu)
  useClickOutside(avatarRef, menu === 'avatar', closeMenu)

  useEffect(() => {
    setMenu(null)
  }, [location.pathname])

  const navItem = findNavItem(role, location.pathname)
  const unread = state.notifications.filter((item) => !item.read).length
  const reviewCount = state.jobs.filter((job) =>
    ['SUBMITTED', 'UNDER_REVIEW', 'EXPIRY_REVIEW'].includes(job.status),
  ).length
  const withdrawalCount = state.withdrawals.filter((item) => item.status === 'PENDING').length
  const sellerPending = state.sellers.filter((item) => item.status === 'PENDING').length
  const adminActionCount = reviewCount + withdrawalCount + sellerPending
  const latestNotifications = state.notifications.slice(0, 4)

  const switchRole = () => {
    const nextRole: Role = role === 'seller' ? 'admin' : 'seller'
    navigate(getRoleHome(nextRole))
    setMenu(null)
  }

  const openNotification = (id: string, href: string) => {
    markNotificationRead(id)
    setMenu(null)
    navigate(href)
  }

  const confirmReset = () => {
    resetDemo()
    setResetOpen(false)
    toast.success('Data demo dikembalikan ke kondisi awal. Tidak ada data nyata yang tersentuh.', 'Demo direset')
  }

  return (
    <header className="topbar">
      <div className="topbar__left">
        <div className="topbar__title">
          <p className="topbar__crumb">
            {roleLabel(role)} <span aria-hidden="true">/</span> <span className="topbar__demo">prototype</span>
          </p>
          <h2>{navItem?.label ?? 'PANZ PROJECT'}</h2>
        </div>
      </div>

      <div className="topbar__actions">
        <span className="prototype-pill">
          <span className="prototype-pill__dot" aria-hidden="true" />
          Data simulasi
        </span>

        <div
          className="role-switch"
          role="group"
          aria-label="Pilih mode tampilan. Ini hanya simulasi UI, bukan kontrol keamanan."
        >
          <button
            type="button"
            className={`role-switch__btn${role === 'seller' ? ' is-active' : ''}`}
            aria-pressed={role === 'seller'}
            onClick={() => {
              if (role !== 'seller') navigate(getRoleHome('seller'))
            }}
          >
            <Store size={15} aria-hidden="true" />
            <span className="role-switch__label">Seller</span>
          </button>
          <button
            type="button"
            className={`role-switch__btn${role === 'admin' ? ' is-active' : ''}`}
            aria-pressed={role === 'admin'}
            onClick={() => {
              if (role !== 'admin') navigate(getRoleHome('admin'))
            }}
          >
            <ShieldCheck size={15} aria-hidden="true" />
            <span className="role-switch__label">Admin</span>
          </button>
        </div>

        <div className="topbar__popover-wrap" ref={notifRef}>
          <IconButton
            label={role === 'seller' ? `Notifikasi, ${unread} belum dibaca` : `Tindakan admin, ${adminActionCount} item`}
            className={`topbar__icon-btn${menu === 'notif' ? ' is-active' : ''}`}
            aria-haspopup="menu"
            aria-expanded={menu === 'notif'}
            onClick={() => setMenu(menu === 'notif' ? null : 'notif')}
          >
            <Bell size={18} />
            {(role === 'seller' ? unread : adminActionCount) > 0 ? (
              <span className="notification-dot" aria-hidden="true">
                {(role === 'seller' ? unread : adminActionCount) > 9 ? '9+' : role === 'seller' ? unread : adminActionCount}
              </span>
            ) : null}
          </IconButton>

          {menu === 'notif' ? (
            <div className="menu-popover notification-menu" role="menu" aria-label={role === 'seller' ? 'Notifikasi terbaru' : 'Tindakan admin'}>
              <div className="menu-popover__header">
                <div>
                  <p className="menu-popover__eyebrow">{role === 'seller' ? 'Notifikasi' : 'Tindakan admin'}</p>
                  <h3>{role === 'seller' ? (unread > 0 ? `${unread} belum dibaca` : 'Semua sudah dibaca') : `${adminActionCount} item menunggu`}</h3>
                </div>
                {role === 'seller' && unread > 0 ? (
                  <button type="button" className="menu-popover__text-btn" onClick={markAllNotificationsRead}>
                    <CheckCheck size={14} aria-hidden="true" />
                    Tandai semua
                  </button>
                ) : null}
              </div>

              {role === 'seller' ? (
                latestNotifications.length > 0 ? (
                  <div className="notification-menu__list">
                    {latestNotifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        role="menuitem"
                        className={`notification-menu__item${item.read ? '' : ' is-unread'}`}
                        onClick={() => openNotification(item.id, item.href)}
                      >
                        <span className={`notification-menu__marker notification-menu__marker--${item.kind}`} aria-hidden="true" />
                        <span className="notification-menu__copy">
                          <span className="notification-menu__title">{item.title}</span>
                          <span className="notification-menu__message">{item.message}</span>
                          <span className="notification-menu__time">{relativeTime(item.at)}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="menu-popover__empty">Belum ada notifikasi pada data demo.</p>
                )
              ) : (
                <div className="notification-menu__list">
                  <button
                    type="button"
                    role="menuitem"
                    className="notification-menu__item"
                    onClick={() => {
                      setMenu(null)
                      navigate('/admin/reviews')
                    }}
                  >
                    <span className="notification-menu__icon"><CircleAlert size={16} /></span>
                    <span className="notification-menu__copy">
                      <span className="notification-menu__title">Review hasil</span>
                      <span className="notification-menu__message">{reviewCount} pengiriman menunggu keputusan</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="notification-menu__item"
                    onClick={() => {
                      setMenu(null)
                      navigate('/admin/withdrawals')
                    }}
                  >
                    <span className="notification-menu__icon"><CircleAlert size={16} /></span>
                    <span className="notification-menu__copy">
                      <span className="notification-menu__title">Penarikan saldo</span>
                      <span className="notification-menu__message">{withdrawalCount} pengajuan berstatus PENDING</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="notification-menu__item"
                    onClick={() => {
                      setMenu(null)
                      navigate('/admin/sellers')
                    }}
                  >
                    <span className="notification-menu__icon"><CircleAlert size={16} /></span>
                    <span className="notification-menu__copy">
                      <span className="notification-menu__title">Pendaftaran seller</span>
                      <span className="notification-menu__message">{sellerPending} seller menunggu persetujuan</span>
                    </span>
                  </button>
                </div>
              )}

              <div className="menu-popover__footer">
                <button
                  type="button"
                  className="menu-popover__footer-link"
                  onClick={() => {
                    setMenu(null)
                    navigate(role === 'seller' ? '/seller/notifications' : '/admin/audit')
                  }}
                >
                  {role === 'seller' ? 'Buka semua notifikasi' : 'Buka audit log'}
                  <ChevronDown size={14} className="rotate--90" aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="topbar__popover-wrap" ref={avatarRef}>
          <button
            type="button"
            className={`topbar__avatar-btn${menu === 'avatar' ? ' is-active' : ''}`}
            onClick={() => setMenu(menu === 'avatar' ? null : 'avatar')}
            aria-haspopup="menu"
            aria-expanded={menu === 'avatar'}
            aria-label="Buka menu akun"
          >
            <Avatar name={role === 'seller' ? currentSeller.name : 'Admin PANZ'} size="sm" />
            <ChevronDown size={14} className="topbar__avatar-chevron" aria-hidden="true" />
          </button>

          {menu === 'avatar' ? (
            <div className="menu-popover account-menu" role="menu" aria-label="Menu akun">
              <div className="account-menu__identity">
                <Avatar name={role === 'seller' ? currentSeller.name : 'Admin PANZ'} size="md" />
                <div>
                  <p className="account-menu__name">{role === 'seller' ? currentSeller.name : 'Admin PANZ'}</p>
                  <p className="account-menu__email">
                    {role === 'seller' ? currentSeller.email : 'admin@panzproject.demo'}
                  </p>
                </div>
              </div>
              <div className="account-menu__role">
                <span>Mode aktif</span>
                <strong>{roleLabel(role)}</strong>
              </div>
              <div className="menu-popover__divider" />
              <button
                type="button"
                role="menuitem"
                className="menu-item"
                onClick={() => {
                  setMenu(null)
                  navigate(role === 'seller' ? '/seller/profile' : '/admin/settings')
                }}
              >
                {role === 'seller' ? <UserRound size={16} /> : <Settings size={16} />}
                {role === 'seller' ? 'Profil & Keamanan' : 'Pengaturan admin'}
              </button>
              <button
                type="button"
                role="menuitem"
                className="menu-item"
                onClick={switchRole}
              >
                {role === 'seller' ? <ShieldCheck size={16} /> : <Store size={16} />}
                Beralih ke {role === 'seller' ? 'Admin Panel' : 'Seller Panel'}
              </button>
              <button
                type="button"
                role="menuitem"
                className="menu-item"
                onClick={() => {
                  setAboutOpen(true)
                  setMenu(null)
                }}
              >
                <Info size={16} />
                Tentang prototype
              </button>
              <button
                type="button"
                role="menuitem"
                className="menu-item menu-item--danger"
                onClick={() => {
                  setResetOpen(true)
                  setMenu(null)
                }}
              >
                <RotateCcw size={16} />
                Reset data demo
              </button>
              <p className="account-menu__note">
                Role selector hanya simulasi UI dan bukan sistem keamanan. Data tersimpan lokal di peramban ini.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={confirmReset}
        title="Reset seluruh data demo?"
        description="Semua perubahan lokal pada prototype akan dikembalikan ke data seed awal."
        confirmLabel="Reset data demo"
        tone="danger"
      >
        <p className="modal-copy">
          Tidak ada data produksi yang tersentuh. Tindakan ini juga menghapus notifikasi, pengajuan, dan perubahan
          status yang dibuat selama sesi demo.
        </p>
      </ConfirmDialog>

      <Modal
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        title="Tentang prototype PANZ PROJECT"
        description="Prototype visual interaktif tahap pertama. Bukan sistem produksi."
        eyebrow="Versi 0.1"
        size="lg"
        footer={<Button variant="secondary" onClick={() => setAboutOpen(false)}>Tutup</Button>}
      >
        <div className="about-grid">
          <div>
            <h3>Yang bisa dicoba</h3>
            <ul className="check-list">
              <li>Navigasi seller dan admin dengan role selector simulasi.</li>
              <li>Pencarian, filter, klaim pekerjaan, pengiriman hasil demo.</li>
              <li>Review hasil dan pencatatan komisi satu kali pada state lokal.</li>
              <li>Pengajuan penarikan, alur status, dan audit log demo.</li>
              <li>Manajemen pekerjaan, seller, email, serta pengaturan.</li>
            </ul>
          </div>
          <div>
            <h3>Batasan tahap ini</h3>
            <ul className="check-list check-list--muted">
              <li>Tidak ada backend, database, autentikasi, OAuth, atau transaksi nyata.</li>
              <li>Seluruh saldo, komisi, transfer, dan email adalah data simulasi.</li>
              <li>File yang dipilih hanya dicatat metadatanya di peramban.</li>
              <li>Data tersimpan di localStorage, bukan database produksi.</li>
              <li>Role selector tidak memisahkan hak akses secara nyata.</li>
            </ul>
          </div>
        </div>
      </Modal>
    </header>
  )
}
