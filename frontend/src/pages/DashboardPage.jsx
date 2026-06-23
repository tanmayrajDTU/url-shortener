import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BarChart2, Copy, Trash2, Check, ExternalLink, Clock, AlertCircle } from 'lucide-react'
import { api } from '../api/client.js'
import { useToast } from '../components/Toast.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'

export default function DashboardPage() {
  const [urls, setUrls] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  // Issue #3: custom confirm modal state
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
    toast.show('Short URL copied to clipboard!', 'success', 2500)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Issue #3: open the custom confirm modal instead of browser confirm()
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

  const isExpired = (url) => url.expiresAt && new Date(url.expiresAt) < new Date()

  return (
    <div>
      {/* Issue #3: Custom delete confirmation modal */}
      <ConfirmModal
        open={confirmModal.open}
        title="Delete this link?"
        body={`This will permanently delete "${confirmModal.shortUrl}" and all its click analytics. This cannot be undone.`}
        confirmLabel="Yes, delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setConfirmModal({ open: false, code: null, id: null, shortUrl: '' })}
      />

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
          {urls.length} link{urls.length !== 1 ? 's' : ''} total
        </p>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          Loading...
        </div>
      )}

      {error && (
        <div style={{
          padding: '16px', borderRadius: 'var(--radius)',
          background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.25)',
          color: 'var(--error)', display: 'flex', gap: '10px', alignItems: 'center',
        }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {!loading && urls.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '80px 20px',
          border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>✂️</div>
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>No links yet.</p>
          <Link to="/" style={{
            display: 'inline-block', marginTop: '16px', padding: '8px 18px',
            background: 'var(--accent)', color: '#0a0a0a', borderRadius: 'var(--radius)',
            fontWeight: 700, fontSize: '13px',
          }}>
            Create your first link →
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {urls.map((url, i) => (
          <div
            key={url.id}
            className="animate-fadeup"
            style={{
              animationDelay: `${i * 40}ms`,
              background: 'var(--surface)',
              border: `1px solid ${isExpired(url) ? 'rgba(255,71,87,0.2)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '12px',
              alignItems: 'center',
              opacity: isExpired(url) ? 0.6 : 1,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: '15px',
                  color: isExpired(url) ? 'var(--muted)' : 'var(--accent)',
                }}>
                  {url.shortUrl}
                </span>
                {isExpired(url) && (
                  <span style={{
                    fontSize: '10px', padding: '2px 6px', borderRadius: '2px',
                    background: 'rgba(255,71,87,0.1)', color: 'var(--error)',
                    fontWeight: 700, letterSpacing: '0.05em',
                  }}>EXPIRED</span>
                )}
              </div>

              <div style={{
                fontSize: '13px', color: 'var(--muted)', fontFamily: 'var(--font-mono)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {url.originalUrl}
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                <Stat label="Clicks" value={url.totalClicks} accent />
                <Stat label="Created" value={formatDate(url.createdAt)} />
                {url.expiresAt && (
                  <Stat label="Expires" value={formatDate(url.expiresAt)} icon={<Clock size={10} />} />
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <IconBtn title="Copy" onClick={() => handleCopy(url, url.id)} active={copiedId === url.id}>
                {copiedId === url.id ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
              </IconBtn>

              <Link to={`/analytics/${url.shortCode}`} title="Analytics">
                <IconBtn as="div"><BarChart2 size={14} /></IconBtn>
              </Link>

              <a href={url.shortUrl} target="_blank" rel="noopener noreferrer" title="Open link">
                <IconBtn as="div"><ExternalLink size={14} /></IconBtn>
              </a>

              {/* Issue #3: use requestDelete instead of window.confirm */}
              <IconBtn
                title="Delete"
                onClick={() => requestDelete(url.shortCode, url.id, url.shortUrl)}
                danger
                disabled={deletingId === url.id}
              >
                <Trash2 size={14} />
              </IconBtn>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value, accent, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {icon}
      <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.04em' }}>{label}:</span>
      <span style={{
        fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)',
        color: accent ? 'var(--accent)' : 'var(--text)',
      }}>{value}</span>
    </div>
  )
}

function IconBtn({ children, onClick, active, danger, disabled, as: Tag = 'button', title }) {
  return (
    <Tag
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 'var(--radius)', border: '1px solid var(--border)',
        background: active ? 'rgba(46,213,115,0.08)' : 'var(--surface2)',
        color: danger ? 'var(--error)' : active ? 'var(--success)' : 'var(--muted)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
        opacity: disabled ? 0.4 : 1,
        textDecoration: 'none',
      }}
    >
      {children}
    </Tag>
  )
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
