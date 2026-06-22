import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import { ArrowLeft, MousePointer, Smartphone, Monitor, Globe } from 'lucide-react'
import { api } from '../api/client.js'

const COLORS = ['#e8ff47', '#ff6b35', '#4ecdc4', '#a855f7', '#f59e0b', '#3b82f6']

export default function AnalyticsPage() {
  const { code } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getAnalytics(code)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [code])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
      Loading analytics...
    </div>
  )

  if (error) return (
    <div style={{ padding: '20px', color: 'var(--error)', fontFamily: 'var(--font-mono)' }}>✗ {error}</div>
  )

  if (!data) return null

  const mobilePercent = data.totalClicks > 0
    ? Math.round((data.mobileClicks / data.totalClicks) * 100)
    : 0

  return (
    <div>
      {/* Back */}
      <Link to="/dashboard" style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        color: 'var(--muted)', fontSize: '13px', marginBottom: '28px',
        fontFamily: 'var(--font-mono)', transition: 'color 0.15s',
      }}>
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 500, color: 'var(--accent)'
          }}>
            /{data.shortCode}
          </span>
        </div>
        <p style={{
          color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-mono)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '600px'
        }}>
          {data.originalUrl}
        </p>
      </div>

      {/* Top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        <StatCard icon={<MousePointer size={16} />} label="Total Clicks" value={data.totalClicks} accent />
        <StatCard icon={<Smartphone size={16} />} label="Mobile" value={`${mobilePercent}%`} />
        <StatCard icon={<Monitor size={16} />} label="Desktop" value={`${100 - mobilePercent}%`} />
        <StatCard icon={<Globe size={16} />} label="Referers" value={data.topReferers.length} />
      </div>

      {/* Clicks over time */}
      <Section title="Clicks over time">
        {data.clicksByDay.length === 0 ? (
          <Empty text="No click data yet" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.clicksByDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e8ff47" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#e8ff47" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
              <YAxis tick={{ fill: '#666', fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 4, fontFamily: 'JetBrains Mono', fontSize: 12 }} />
              <Area type="monotone" dataKey="clicks" stroke="#e8ff47" strokeWidth={2} fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        {/* Browsers */}
        <Section title="Browsers">
          {data.clicksByBrowser.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data.clicksByBrowser} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="browser" tick={{ fill: '#666', fontSize: 11, fontFamily: 'JetBrains Mono' }} width={80} />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 4, fontFamily: 'JetBrains Mono', fontSize: 12 }} />
                <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                  {data.clicksByBrowser.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>

        {/* OS */}
        <Section title="Operating Systems">
          {data.clicksByOs.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={data.clicksByOs} dataKey="count" nameKey="os" cx="50%" cy="50%" outerRadius={60} label={({ os, percent }) => `${os} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {data.clicksByOs.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 4, fontFamily: 'JetBrains Mono', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Section>
      </div>

      {/* Top Referers */}
      {data.topReferers.length > 0 && (
        <Section title="Top Referers">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
            <thead>
              <tr style={{ color: 'var(--muted)', fontSize: '11px', letterSpacing: '0.05em' }}>
                <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 600 }}>REFERER</th>
                <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 600 }}>CLICKS</th>
              </tr>
            </thead>
            <tbody>
              {data.topReferers.map((r, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 0', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '400px' }}>
                    {r.referer || '(direct)'}
                  </td>
                  <td style={{ padding: '8px 0', textAlign: 'right', color: 'var(--accent)', fontWeight: 700 }}>
                    {r.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '16px 20px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', marginBottom: '10px' }}>
        {icon}
        <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{
        fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em',
        color: accent ? 'var(--accent)' : 'var(--text)', fontFamily: 'var(--font-mono)'
      }}>
        {value}
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '12px'
    }}>
      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '16px', textTransform: 'uppercase' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Empty({ text = 'No data yet' }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
      {text}
    </div>
  )
}
