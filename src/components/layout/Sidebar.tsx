import { NavLink } from 'react-router-dom'
import { FlaskConical, ShieldCheck } from 'lucide-react'
import type { Role } from '../../types'
import { getNav, roleLabel } from '../../lib/navigation'
import { useBadgeCounts } from './useBadgeCounts'
import { Avatar } from '../ui/primitives'
import { useApp } from '../../store/AppContext'

export function Sidebar({ role }: { role: Role }) {
  const badges = useBadgeCounts()
  const { currentSeller } = useApp()
  const groups = getNav(role)

  return (
    <aside className="sidebar">
      <NavLink to={role === 'seller' ? '/seller/dashboard' : '/admin/overview'} className="brand" aria-label="PANZ PROJECT — kembali ke beranda">
        <span className="brand__mark" aria-hidden="true">
          <span>P</span>
        </span>
        <span className="brand__text">
          <span className="brand__name">PANZ</span>
          <span className="brand__sub">PROJECT</span>
        </span>
      </NavLink>

      <div className="workspace-pill">
        <span className="workspace-pill__icon" aria-hidden="true">
          {role === 'seller' ? <FlaskConical size={14} /> : <ShieldCheck size={14} />}
        </span>
        <span>{roleLabel(role)}</span>
        <span className="workspace-pill__demo">DEMO</span>
      </div>

      <nav className="sidebar__nav" aria-label={`Navigasi ${roleLabel(role)}`}>
        {groups.map((group) => (
          <div className="sidebar__group" key={group.label}>
            <p className="sidebar__group-label">{group.label}</p>
            {group.items.map((item) => {
              const Icon = item.icon
              const count = item.badge ? badges[item.badge] : 0
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `sidebar__link${isActive ? ' is-active' : ''}`}
                >
                  <Icon size={18} className="sidebar__icon" aria-hidden="true" />
                  <span className="sidebar__label">{item.label}</span>
                  {count > 0 ? <span className="sidebar__count">{count > 99 ? '99+' : count}</span> : null}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__seller">
          <Avatar name={role === 'seller' ? currentSeller.name : 'Admin PANZ'} size="sm" />
          <div>
            <p className="sidebar__seller-name">{role === 'seller' ? currentSeller.name : 'Admin PANZ'}</p>
            <p className="sidebar__seller-role">{role === 'seller' ? 'Seller workspace' : 'Administrator'}</p>
          </div>
        </div>
        <div className="sidebar__demo-note">
          <span className="sidebar__demo-dot" aria-hidden="true" />
          <p>Prototype · data demo lokal. Tidak ada uang atau email yang diproses.</p>
        </div>
      </div>
    </aside>
  )
}
