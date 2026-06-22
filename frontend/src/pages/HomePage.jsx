import { useState } from 'react'
import { Link2, Copy, Check, ArrowRight, Clock, Tag, ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '../api/client.js'

export default function HomePage() {
  const [url, setUrl] = useState('')
  const [alias, setAlias] = useState('')
  const [expiry, setExpiry] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!url) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await api.createUrl({
        originalUrl: url,
        customAlias: alias || null,
        expiresAt: expiry || null,
      })
      setResult(data)
      setUrl('')
      setAlias('')
      setExpiry('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function copyToClipboard(text) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      {/* Hero */}
      <div style={{ marginBottom: '48px', paddingTop: '24px' }}>
        <div style={{
          display: 'inline-block', background: 'var(--accent)', color: '#0a0a0a',
          padding: '3px 10px', borderRadius: '2px', fontSize: '11px',
          fontWeight: 700, letterSpacing: '0.08em', marginBottom: '16px',
          fontFamily: 'var(--font-mono)', textTransform: 'uppercase'
        }}>
          Distributed URL Shortener
        </div>
        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 56px)', fontWeight: 800,
          lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: '14px'
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
          borderRadius: 'var(--radius-lg)', overflow: 'hidden'
        }}>
          {/* URL input row */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '4px 4px 4px 16px', gap: '8px' }}>
            <Link2 size={18} color="var(--muted)" style={{ flexShrink: 0 }} />
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://your-very-long-url.com/goes/here"
              required
              style={{
                border: 'none', background: 'transparent', padding: '16px 8px',
                fontSize: '15px', flex: 1, color: 'var(--text)'
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
                fontFamily: 'var(--font-sans)',
              }}
            >
              {loading ? <Spinner /> : <><span>Shorten</span><ArrowRight size={15} /></>}
            </button>
          </div>

          {/* Advanced toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(v => !v)}
            style={{
              width: '100%', padding: '10px 16px', background: 'var(--surface2)',
              borderTop: '1px solid var(--border)', color: 'var(--muted)',
              fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
              fontFamily: 'var(--font-sans)', letterSpacing: '0.05em', textTransform: 'uppercase',
            }}
          >
            {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            Advanced options
          </button>

          {showAdvanced && (
            <div style={{
              padding: '16px', borderTop: '1px solid var(--border)',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'
            }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.05em', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                  <Tag size={11} /> CUSTOM ALIAS
                </label>
                <input
                  type="text"
                  value={alias}
                  onChange={e => setAlias(e.target.value)}
                  placeholder="my-brand"
                  maxLength={50}
                  pattern="[a-zA-Z0-9\-_]+"
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

      {/* Error */}
      {error && (
        <div className="animate-fadeup" style={{
          marginTop: '16px', padding: '12px 16px', borderRadius: 'var(--radius)',
          background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)',
          color: 'var(--error)', fontSize: '14px', fontFamily: 'var(--font-mono)'
        }}>
          ✗ {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="animate-fadeup" style={{
          marginTop: '20px', padding: '20px', borderRadius: 'var(--radius-lg)',
          background: 'var(--surface)', border: '1px solid var(--accent)',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '10px' }}>
            ✓ SHORTENED SUCCESSFULLY
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 500,
              color: 'var(--accent)', flex: 1, wordBreak: 'break-all'
            }}>
              {result.shortUrl}
            </span>
            <button
              onClick={() => copyToClipboard(result.shortUrl)}
              style={{
                padding: '8px 14px', borderRadius: 'var(--radius)',
                background: copied ? 'rgba(46,213,115,0.15)' : 'var(--surface2)',
                border: `1px solid ${copied ? 'var(--success)' : 'var(--border)'}`,
                color: copied ? 'var(--success)' : 'var(--text)',
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '13px', fontWeight: 600, transition: 'all 0.15s',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
            </button>
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
            → {result.originalUrl}
          </div>
          {result.expiresAt && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--muted)' }}>
              <Clock size={11} style={{ display: 'inline', marginRight: '4px' }} />
              Expires {new Date(result.expiresAt).toLocaleString()}
            </div>
          )}
          <Link
            to={`/analytics/${result.shortCode}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              marginTop: '14px', fontSize: '13px', color: 'var(--accent)',
              fontWeight: 600, fontFamily: 'var(--font-mono)',
            }}
          >
            View analytics →
          </Link>
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
      animation: 'spin 0.6s linear infinite'
    }} />
  )
}
