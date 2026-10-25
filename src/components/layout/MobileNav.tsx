import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import type { Role } from '../../types'
import { getNav, getNavItems, roleLabel } from '../../lib/navigation'
import { useBadgeCounts } from './useBadgeCounts'
import { Modal, SimulationTag } from '../ui'
import { useApp } from '../../store/AppContext'

export function MobileNav({ role }: { role: Role }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const badges = useBadgeCounts()
  const { currentSeller } = useApp()
  const items = getNavItems(role)
  const primary = items.filter((item) => item.primary)
  const secondary = items.filter((item) => !item.primary)
  const secondaryActive = secondary.some((item) => location.pathname === item.path)
  const groups = getNav(role)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  return (
    <>
      <nav className="mobile-nav" aria-label="Navigasi utama seluler">
        {primary.map((item) => {
          const Icon = item.icon
          const count = item.badge ? badges[item.badge] : 0
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `mobile-nav__item${isActive ? ' is-active' : ''}`}
            >
              <span className="mobile-nav__icon">
                <Icon size={19} aria-hidden="true" />
                {count > 0 ? <span className="mobile-nav__badge">{count > 9 ? '9+' : count}</span> : null}
              </span>
              <span>{item.shortLabel}</span>
            </NavLink>
          )
        })}
        <button
          type="button"
          className={`mobile-nav__item mobile-nav__menu${secondaryActive ? ' is-active' : ''}`}
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className="mobile-nav__icon">
            <Menu size={19} aria-hidden="true" />
          </span>
          <span>Menu</span>
        </button>
      </nav>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Menu navigasi"
        description={`${roleLabel(role)} · seluruh data adalah simulasi lokal.`}
        eyebrow="PANZ PROJECT"
        size="md"
        footer={
          <button type="button" className="btn btn--secondary btn--block" onClick={() => setOpen(false)}>
            Tutup menu
          </button>
        }
      >
        <div className="mobile-menu__identity">
          <div>
            <p className="mobile-menu__name">{role === 'seller' ? currentSeller.name : 'Admin PANZ'}</p>
            <p className="mobile-menu__role">{roleLabel(role)}</p>
          </div>
          <SimulationTag />
        </div>
        <div className="mobile-menu__groups">
          {groups.map((group) => (
            <div key={group.label} className="mobile-menu__group">
              <p className="sidebar__group-label">{group.label}</p>
              {group.items.map((item) => {
                const Icon = item.icon
                const count = item.badge ? badges[item.badge] : 0
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `mobile-menu__link${isActive ? ' is-active' : ''}`}
                    onClick={() => setOpen(false)}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span>{item.label}</span>
                    {count > 0 ? <span className="sidebar__count">{count}</span> : null}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </div>
        <button type="button" className="mobile-menu__close-row" onClick={() => setOpen(false)}>
          <X size={16} />
          Tutup
        </button>
      </Modal>
    </>
  )
}
