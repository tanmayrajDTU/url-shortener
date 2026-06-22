import { Link, useLocation } from 'react-router-dom'
import { Scissors, LayoutDashboard } from 'lucide-react'

export default function Layout({ children }) {
  const { pathname } = useLocation()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 32px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(10,10,10,0.92)',
        backdropFilter: 'blur(12px)',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'var(--accent)', borderRadius: '4px',
            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Scissors size={15} color="#0a0a0a" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em' }}>snip</span>
        </Link>

        <div style={{ display: 'flex', gap: '8px' }}>
          <NavLink to="/" active={pathname === '/'}>Shorten</NavLink>
          <NavLink to="/dashboard" active={pathname === '/dashboard'}>
            <LayoutDashboard size={14} />
            Dashboard
          </NavLink>
        </div>
      </nav>

      <main style={{ flex: 1, padding: '40px 32px', maxWidth: '960px', margin: '0 auto', width: '100%' }}>
        {children}
      </main>

      <footer style={{
        borderTop: '1px solid var(--border)', padding: '20px 32px',
        textAlign: 'center', color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-mono)'
      }}>
        built with ASP.NET Core · Redis · PostgreSQL · React
      </footer>
    </div>
  )
}

function NavLink({ to, active, children }) {
  return (
    <Link to={to} style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '6px 14px', borderRadius: 'var(--radius)',
      fontSize: '14px', fontWeight: 600,
      background: active ? 'var(--surface2)' : 'transparent',
      color: active ? 'var(--text)' : 'var(--muted)',
      border: active ? '1px solid var(--border)' : '1px solid transparent',
      transition: 'all 0.15s',
    }}>
      {children}
    </Link>
  )
}
