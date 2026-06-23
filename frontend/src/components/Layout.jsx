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
    <Link to={to} className={`nav-link ${active ? 'active' : ''}`}>
      {children}
    </Link>
  )
}
