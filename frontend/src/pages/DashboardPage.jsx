import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertCircle, ArrowUpRight, BarChart3, Check, Clock, Copy, ExternalLink,
  Link2, Plus, Search, Trash2
} from 'lucide-react'
import { api } from '../api/client.js'
import { useToast } from '../components/Toast.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
}

export default function DashboardPage() {
  const [urls, setUrls] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [confirmModal, setConfirmModal] = useState({ open: false, code: null, id: null, shortUrl: '' })

  const toast = useToast()
  const navigate = useNavigate()

  useEffect(() => { fetchUrls() }, [])

  async function fetchUrls() {
    try {
      setLoading(true)
      const data = await api.getAllUrls()
      setUrls(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy(url, id) {
    await navigator.clipboard.writeText(url.shortUrl)
    setCopiedId(id)
    toast.show('Short URL copied to clipboard.', 'success', 2500)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function requestDelete(code, id, shortUrl) {
    setConfirmModal({ open: true, code, id, shortUrl })
  }

  async function confirmDelete() {
    const { code, id } = confirmModal
    setConfirmModal({ open: false, code: null, id: null, shortUrl: '' })
    setDeletingId(id)
    try {
      await api.deleteUrl(code)
      setUrls(prev => prev.filter(u => u.id !== id))
      toast.show('Link deleted successfully.', 'success')
    } catch (err) {
      toast.show(err.message || 'Failed to delete link.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredUrls = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? urls.filter(url =>
          url.shortUrl.toLowerCase().includes(q) ||
          url.originalUrl.toLowerCase().includes(q) ||
          url.shortCode.toLowerCase().includes(q)
        )
      : [...urls]

    return list.sort((a, b) => {
      if (sortBy === 'clicks') return (b.totalClicks || 0) - (a.totalClicks || 0)
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt)
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
  }, [urls, query, sortBy])

  const activeCount = urls.filter(url => !isExpired(url)).length
  const totalClicks = urls.reduce((sum, url) => sum + (url.totalClicks || 0), 0)

  return (
    <div className="container">
      <ConfirmModal
        open={confirmModal.open}
        title="Delete this link?"
        body={`This will permanently delete "${confirmModal.shortUrl}" and all its click analytics. This cannot be undone.`}
        confirmLabel="Delete link"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setConfirmModal({ open: false, code: null, id: null, shortUrl: '' })}
      />

      <header className="page-header">
        <div className="page-title">
          <span className="eyebrow"><BarChart3 size={14} /> Link operations</span>
          <h1>Dashboard</h1>
          <p>{urls.length} total links, {activeCount} active, {totalClicks} tracked clicks.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          <Plus size={17} /> New link
        </button>
      </header>

      <div className="analytics-grid">
        <Metric label="Total links" value={urls.length} icon={<Link2 size={18} />} />
        <Metric label="Active links" value={activeCount} icon={<Check size={18} />} />
        <Metric label="Total clicks" value={totalClicks} icon={<ArrowUpRight size={18} />} />
        <Metric label="Expired" value={urls.length - activeCount} icon={<Clock size={18} />} />
      </div>

      <div className="toolbar panel">
        <label className="search-wrap">
          <Search size={16} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by short link, alias, or destination" />
        </label>
        <select className="select" value={sortBy} onChange={e => setSortBy(e.target.value)} aria-label="Sort links">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="clicks">Most clicks</option>
        </select>
      </div>

      {loading && (
        <div className="dashboard-grid">
          {[0, 1, 2].map(i => <div className="card skeleton" key={i} />)}
        </div>
      )}

      {error && (
        <div className="error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {!loading && urls.length === 0 && (
        <EmptyState
          title="No links yet"
          text="Create your first short URL and it will appear here with analytics, copy actions, and management controls."
          action={<Link to="/" className="btn btn-primary">Create your first link <ArrowUpRight size={16} /></Link>}
        />
      )}

      {!loading && urls.length > 0 && filteredUrls.length === 0 && (
        <EmptyState title="No matches found" text="Try a different destination, alias, or short code." />
      )}

      <motion.div
        className="dashboard-grid"
        variants={{ show: { transition: { staggerChildren: 0.055 } } }}
        initial="hidden"
        animate="show"
      >
        {!loading && filteredUrls.map(url => {
          const expired = isExpired(url)
          return (
            <motion.article
              key={url.id}
              className="url-card card"
              variants={itemVariants}
              transition={{ duration: 0.35 }}
              layout
              style={expired ? { opacity: 0.64 } : undefined}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span className="short-link">{url.shortUrl}</span>
                  <span className={`pill ${expired ? 'pill-danger' : 'pill-success'}`}>
                    {expired ? 'Expired' : 'Active'}
                  </span>
                </div>
                <div className="long-link">{url.originalUrl}</div>

                <div className="meta-row">
                  <span className="pill"><BarChart3 size={13} /> {url.totalClicks || 0} clicks</span>
                  <span className="pill"><Clock size={13} /> Created {formatDate(url.createdAt)}</span>
                  {url.expiresAt && <span className="pill">Expires {formatDate(url.expiresAt)}</span>}
                </div>
              </div>

              <div className="action-row" aria-label={`Actions for ${url.shortUrl}`}>
                <button className={`icon-btn ${copiedId === url.id ? 'success' : ''}`} title="Copy" onClick={() => handleCopy(url, url.id)}>
                  {copiedId === url.id ? <Check size={17} /> : <Copy size={17} />}
                </button>
                <Link className="icon-btn" to={`/analytics/${url.shortCode}`} title="Analytics">
                  <BarChart3 size={17} />
                </Link>
                <a className="icon-btn" href={url.shortUrl} target="_blank" rel="noopener noreferrer" title="Open link">
                  <ExternalLink size={17} />
                </a>
                <button
                  className="icon-btn danger"
                  title="Delete"
                  onClick={() => requestDelete(url.shortCode, url.id, url.shortUrl)}
                  disabled={deletingId === url.id}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </motion.article>
          )
        })}
      </motion.div>
    </div>
  )
}

function Metric({ label, value, icon }) {
  return (
    <motion.div className="metric-card card" whileHover={{ y: -3 }}>
      <div className="metric-icon">{icon}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
    </motion.div>
  )
}

function EmptyState({ title, text, action }) {
  return (
    <div className="empty-state">
      <span className="icon-badge" style={{ margin: '0 auto' }}><Link2 size={19} /></span>
      <h2>{title}</h2>
      <p>{text}</p>
      {action}
    </div>
  )
}

function isExpired(url) {
  return url.expiresAt && new Date(url.expiresAt) < new Date()
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
