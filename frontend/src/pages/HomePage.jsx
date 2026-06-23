import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link2, Copy, Check, ArrowRight, Clock, Tag, ChevronDown, ChevronUp,
         ExternalLink, LayoutDashboard, Plus } from 'lucide-react'
import { api } from '../api/client.js'
import { useToast } from '../components/Toast.jsx'

export default function HomePage() {
  const [url, setUrl] = useState('')
  const [alias, setAlias] = useState('')
  const [expiry, setExpiry] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!url) return
    setLoading(true)
    setError('')
    try {
      const data = await api.createUrl({
        originalUrl: url,
        customAlias: alias || null,
        expiresAt: expiry || null,
      })
      setResult(data)
      setShowSuccessModal(true)
      // Reset form
      setUrl('')
      setAlias('')
      setExpiry('')
      setShowAdvanced(false)
    } catch (err) {
      // Issue #4: surface alias-conflict error clearly
      if (err.message.toLowerCase().includes('already taken') || err.message.includes('409') || err.message.includes('Conflict')) {
        setError(`The alias "${alias}" is already taken. Please choose a different one.`)
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function copyToClipboard(text) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.show('Short URL copied to clipboard!', 'success', 2500)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleCreateAnother() {
    setShowSuccessModal(false)
    setResult(null)
    setCopied(false)
    // Scroll to top / focus
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>

      {/* ── Success Modal (Issue #2) ── */}
      {showSuccessModal && result && (
        <div
          onClick={() => setShowSuccessModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', animation: 'fadeIn 0.15s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#111', border: '1px solid #222',
              borderRadius: '12px', padding: '32px',
              maxWidth: '420px', width: '100%',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
              animation: 'modalIn 0.2s cubic-bezier(0.16,1,0.3,1)',
              fontFamily: 'Syne, sans-serif',
            }}
          >
            {/* Success icon */}
            <div style={{
              width: 48, height: 48, borderRadius: '12px', marginBottom: '20px',
              background: 'rgba(46,213,115,0.12)', border: '1px solid rgba(46,213,115,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
            }}>✓</div>

            <div style={{ fontSize: '11px', color: 'var(--success,#2ed573)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace' }}>
              LINK CREATED
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '20px', color: '#f0f0f0' }}>
              Your short URL is ready!
            </h2>

            {/* Short URL + copy */}
            <div style={{
              background: '#0a0a0a', border: '1px solid rgba(232,255,71,0.2)',
              borderRadius: '8px', padding: '14px 16px', marginBottom: '12px',
            }}>
              <div style={{ fontSize: '11px', color: '#555', fontFamily: 'JetBrains Mono, monospace', marginBottom: '6px', letterSpacing: '0.06em' }}>
                SHORT URL
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '16px', fontWeight: 600,
                  color: '#e8ff47', flex: 1, wordBreak: 'break-all',
                }}>
                  {result.shortUrl}
                </span>
                <button
                  onClick={() => copyToClipboard(result.shortUrl)}
                  style={{
                    padding: '7px 12px', borderRadius: '6px', flexShrink: 0,
                    background: copied ? 'rgba(46,213,115,0.12)' : '#181818',
                    border: `1px solid ${copied ? 'rgba(46,213,115,0.35)' : '#222'}`,
                    color: copied ? '#2ed573' : '#888',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '5px',
                    fontFamily: 'Syne, sans-serif', transition: 'all 0.15s',
                  }}
                >
                  {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
                </button>
              </div>
            </div>

            {/* Original URL */}
            <div style={{ fontSize: '12px', color: '#444', fontFamily: 'JetBrains Mono, monospace', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              → {result.originalUrl}
            </div>

            {result.expiresAt && (
              <div style={{ fontSize: '12px', color: '#555', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={11} /> Expires {new Date(result.expiresAt).toLocaleString()}
              </div>
            )}

            {/* Info note */}
            <div style={{
              background: 'rgba(84,160,255,0.06)', border: '1px solid rgba(84,160,255,0.15)',
              borderRadius: '6px', padding: '10px 14px', marginBottom: '20px',
              fontSize: '12px', color: '#7ab3ff', lineHeight: 1.5,
            }}>
              ℹ You can track clicks and manage this link from your <strong>Dashboard</strong>.
            </div>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleCreateAnother}
                style={{
                  flex: 1, padding: '10px', borderRadius: '6px',
                  background: '#e8ff47', border: 'none', color: '#0a0a0a',
                  fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  fontFamily: 'Syne, sans-serif',
                }}
              >
                <Plus size={14} /> Create Another
              </button>
              <button
                onClick={() => { setShowSuccessModal(false); navigate('/dashboard') }}
                style={{
                  flex: 1, padding: '10px', borderRadius: '6px',
                  background: '#181818', border: '1px solid #222',
                  color: '#f0f0f0', fontSize: '13px', fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '6px',
                  fontFamily: 'Syne, sans-serif',
                }}
              >
                <LayoutDashboard size={14} /> Go to Dashboard
              </button>
            </div>

            {/* Open in new tab */}
            <a
              href={result.shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                marginTop: '12px', fontSize: '12px', color: '#555',
                fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none',
                transition: 'color 0.15s',
              }}
            >
              <ExternalLink size={12} /> Test the redirect
            </a>
          </div>
        </div>
      )}

      {/* Hero */}
      <div style={{ marginBottom: '48px', paddingTop: '24px' }}>
        <div style={{
          display: 'inline-block', background: 'var(--accent)', color: '#0a0a0a',
          padding: '3px 10px', borderRadius: '2px', fontSize: '11px',
          fontWeight: 700, letterSpacing: '0.08em', marginBottom: '16px',
          fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
        }}>
          Distributed URL Shortener
        </div>
        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 56px)', fontWeight: 800,
          lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: '14px',
        }}>
          Long URLs,<br />
          <span style={{ color: 'var(--accent)' }}>cut short.</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '16px', lineHeight: 1.6 }}>
          Custom aliases · Click analytics · Expiry dates
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '4px 4px 4px 16px', gap: '8px' }}>
            <Link2 size={18} color="var(--muted)" style={{ flexShrink: 0 }} />
            <input
              type="url"
              value={url}
              onChange={e => { setUrl(e.target.value); setError('') }}
              placeholder="https://your-very-long-url.com/goes/here"
              required
              style={{
                border: 'none', background: 'transparent', padding: '16px 8px',
                fontSize: '15px', flex: 1, color: 'var(--text)',
              }}
            />
            <button
              type="submit"
              disabled={loading || !url}
              style={{
                background: loading ? 'var(--surface2)' : 'var(--accent)',
                color: '#0a0a0a', padding: '12px 20px', borderRadius: '6px',
                fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.15s', opacity: !url ? 0.5 : 1, flexShrink: 0,
                fontFamily: 'var(--font-sans)', border: 'none', cursor: url ? 'pointer' : 'not-allowed',
              }}
            >
              {loading ? <Spinner /> : <><span>Shorten</span><ArrowRight size={15} /></>}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(v => !v)}
            style={{
              width: '100%', padding: '10px 16px', background: 'var(--surface2)',
              borderTop: '1px solid var(--border)', color: 'var(--muted)', border: 'none',
              fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
              fontFamily: 'var(--font-sans)', letterSpacing: '0.05em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            Advanced options
          </button>

          {showAdvanced && (
            <div style={{
              padding: '16px', borderTop: '1px solid var(--border)',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
            }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.05em', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                  <Tag size={11} /> CUSTOM ALIAS
                </label>
                <input
                  type="text"
                  value={alias}
                  onChange={e => { setAlias(e.target.value); setError('') }}
                  placeholder="my-brand"
                  maxLength={50}
                  pattern="[a-zA-Z0-9\-_]+"
                  style={{ border: error && alias ? '1px solid rgba(255,71,87,0.5)' : undefined }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.05em', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                  <Clock size={11} /> EXPIRY DATE
                </label>
                <input
                  type="datetime-local"
                  value={expiry}
                  onChange={e => setExpiry(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Issue #4: Alias conflict / generic error */}
      {error && (
        <div className="animate-fadeup" style={{
          marginTop: '14px', padding: '12px 16px', borderRadius: 'var(--radius)',
          background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.28)',
          color: 'var(--error)', fontSize: '13px', fontFamily: 'var(--font-mono)',
          display: 'flex', alignItems: 'flex-start', gap: '8px',
        }}>
          <span style={{ flexShrink: 0 }}>✗</span>
          <span>{error}</span>
        </div>
      )}

      {/* Tech stack badges */}
      <div style={{ marginTop: '64px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {['ASP.NET Core', 'Redis Cache', 'PostgreSQL', 'EF Core', 'Railway', 'Supabase'].map(t => (
          <span key={t} style={{
            padding: '4px 10px', borderRadius: '2px',
            border: '1px solid var(--border)', fontSize: '11px',
            color: 'var(--muted)', fontFamily: 'var(--font-mono)',
          }}>{t}</span>
        ))}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{
      width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)',
      borderTopColor: '#0a0a0a', borderRadius: '50%',
      animation: 'spin 0.6s linear infinite',
    }} />
  )
}
