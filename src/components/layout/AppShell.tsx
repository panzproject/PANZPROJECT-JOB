import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import type { Role } from '../../types'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileNav } from './MobileNav'
import { PageSkeleton } from '../ui'

export function AppShell() {
  const location = useLocation()
  const role: Role = location.pathname.startsWith('/admin') ? 'admin' : 'seller'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Lewati ke konten utama
      </a>
      <Sidebar role={role} />
      <div className="app-frame">
        <Topbar role={role} />
        <main id="main-content" className="app-content" tabIndex={-1}>
          <div className="content-inner">
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </div>
          <footer className="app-footer">
            <span>PANZ PROJECT · Prototype 0.1</span>
            <span>Data simulasi lokal · tidak ada uang, email, atau data nyata yang diproses</span>
          </footer>
        </main>
      </div>
      <MobileNav role={role} />
    </div>
  )
}
