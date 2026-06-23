import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard } from 'lucide-react'

export default function Layout({ children }) {
  const { pathname } = useLocation()

  return (
    <div className="app-shell">
      <header className="app-nav">
        <div className="nav-inner">
          <Link to="/" className="brand" aria-label="Snip home">
            <motion.span
              className="brand-mark"
              whileHover={{ rotate: -8, scale: 1.04 }}
              transition={{ type: 'spring', stiffness: 420, damping: 20 }}
            >
              <img className="brand-icon" src="/favicon.svg?v=3" alt="" aria-hidden="true" />
            </motion.span>
            <span className="brand-name">Snip</span>
          </Link>

          <nav className="nav-links" aria-label="Primary navigation">
            <NavLink to="/" active={pathname === '/'}>
              Shorten
            </NavLink>
            <NavLink to="/dashboard" active={pathname === '/dashboard' || pathname.startsWith('/analytics')}>
              <LayoutDashboard size={15} />
              Dashboard
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="app-main">{children}</main>

      <footer className="app-footer">
        <div className="footer-inner">
          <span>URL management, analytics, and redirects.</span>
          <span className="mono">ASP.NET Core / Redis / PostgreSQL / React</span>
        </div>
      </footer>
    </div>
  )
}

function NavLink({ to, active, children }) {
  return (
    <Link to={to} className={`nav-link ${active ? 'active' : ''}`} style={{ position: 'relative' }}>
      {active && (
        <motion.span
          layoutId="active-nav-bg"
          className="active-nav-bg"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '999px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            zIndex: 0,
          }}
        />
      )}
      <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
        {children}
      </span>
    </Link>
  )
}
