import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { AlertCircle, ArrowLeft, Globe, Monitor, MousePointer, Smartphone, TrendingUp } from 'lucide-react'
import { api } from '../api/client.js'

const COLORS = ['#7c5cff', '#22d3ee', '#42f59b', '#f6c453', '#ff7a5c', '#c084fc']

export default function AnalyticsPage() {
  const { code } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    api.getAnalytics(code)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [code])

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 72 }}>
        <div className="dashboard-grid">
          <div className="card skeleton" />
          <div className="card skeleton" />
          <div className="card skeleton" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: 72 }}>
        <div className="error-banner"><AlertCircle size={18} /> {error}</div>
      </div>
    )
  }

  if (!data) return null

  const mobilePercent = data.totalClicks > 0
    ? Math.round((data.mobileClicks / data.totalClicks) * 100)
    : 0
  const desktopPercent = data.totalClicks > 0 ? 100 - mobilePercent : 0
  const bestDay = data.clicksByDay.reduce((best, day) => day.clicks > (best?.clicks || 0) ? day : best, null)

  return (
    <div className="container">
      <header className="page-header">
        <div className="page-title" style={{ minWidth: 0 }}>
          <Link to="/dashboard" className="nav-link" style={{ width: 'fit-content', marginBottom: 18 }}>
            <ArrowLeft size={15} /> Dashboard
          </Link>
          <span className="eyebrow"><TrendingUp size={14} /> Analytics report</span>
          <h1 className="gradient-text">/{data.shortCode}</h1>
          <p className="long-link" style={{ maxWidth: 760 }}>{data.originalUrl}</p>
        </div>
      </header>

      <div className="analytics-grid">
        <Metric icon={<MousePointer size={18} />} label="Total clicks" value={data.totalClicks} highlight />
        <Metric icon={<Smartphone size={18} />} label="Mobile" value={`${mobilePercent}%`} />
        <Metric icon={<Monitor size={18} />} label="Desktop" value={`${desktopPercent}%`} />
        <Metric icon={<Globe size={18} />} label="Referers" value={data.topReferers.length} />
      </div>

      <div className="analytics-layout">
        <section className="chart-card card">
          <div className="chart-title">
            <h2>Clicks over time</h2>
            {bestDay && <span className="pill pill-success">Peak: {bestDay.clicks} clicks</span>}
          </div>
          {data.clicksByDay.length === 0 ? (
            <Empty text="No click data has been collected yet." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.clicksByDay} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c5cff" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="clicks" stroke="#8ea2ff" strokeWidth={3} fill="url(#clickGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="chart-card card">
          <div className="chart-title">
            <h2>Operating systems</h2>
          </div>
          {data.clicksByOs.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.clicksByOs} dataKey="count" nameKey="os" cx="50%" cy="50%" innerRadius={54} outerRadius={88} paddingAngle={3}>
                  {data.clicksByOs.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="chart-card card">
          <div className="chart-title">
            <h2>Browsers</h2>
          </div>
          {data.clicksByBrowser.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.clicksByBrowser} layout="vertical" margin={{ left: 8, right: 20, top: 4, bottom: 4 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="browser" tick={axisTick} width={92} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {data.clicksByBrowser.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="chart-card card">
          <div className="chart-title">
            <h2>Top referers</h2>
            <span className="pill">{data.topReferers.length} sources</span>
          </div>
          {data.topReferers.length === 0 ? <Empty text="No referer data yet." /> : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Referer</th>
                  <th>Clicks</th>
                </tr>
              </thead>
              <tbody>
                {data.topReferers.map((r, i) => (
                  <tr key={i}>
                    <td className="mono" style={{ color: 'var(--muted-strong)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.referer || '(direct)'}
                    </td>
                    <td>{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  )
}

const axisTick = {
  fill: 'rgba(200,208,228,0.62)',
  fontSize: 12,
  fontFamily: 'var(--font-mono)',
}

function Metric({ icon, label, value, highlight }) {
  return (
    <motion.div className="metric-card card" whileHover={{ y: -3 }}>
      <div className="metric-icon">{icon}</div>
      <div className="metric-value" style={highlight ? { color: '#cfd8ff' } : undefined}>{value}</div>
      <div className="metric-label">{label}</div>
    </motion.div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="card" style={{ padding: '10px 12px', background: 'rgba(5,7,13,0.94)' }}>
      <div className="mono" style={{ color: 'var(--muted)', fontSize: 12 }}>{label || payload[0].name}</div>
      <strong style={{ color: 'var(--text)' }}>{payload[0].value} clicks</strong>
    </div>
  )
}

function Empty({ text = 'No data yet' }) {
  return (
    <div className="empty-state" style={{ padding: '46px 18px' }}>
      <span className="icon-badge" style={{ margin: '0 auto' }}><BarChartIcon /></span>
      <p style={{ marginTop: 14, marginBottom: 0 }}>{text}</p>
    </div>
  )
}

function BarChartIcon() {
  return <TrendingUp size={18} />
}
