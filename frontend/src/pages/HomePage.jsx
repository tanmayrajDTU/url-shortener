import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight, Check, ChevronDown, ChevronUp, Clock, Copy,
  ExternalLink, LayoutDashboard, Link2, Plus, Sparkles, Tag
} from 'lucide-react'
import { api } from '../api/client.js'
import { useToast } from '../components/Toast.jsx'

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

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
      setUrl('')
      setAlias('')
      setExpiry('')
      setShowAdvanced(false)
      toast.show('Short link created successfully.', 'success')
    } catch (err) {
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
    toast.show('Short URL copied to clipboard.', 'success', 2500)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleCreateAnother() {
    setShowSuccessModal(false)
    setResult(null)
    setCopied(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="home-page">
      <SuccessModal
        open={showSuccessModal}
        result={result}
        copied={copied}
        onClose={() => setShowSuccessModal(false)}
        onCopy={copyToClipboard}
        onCreateAnother={handleCreateAnother}
        onDashboard={() => { setShowSuccessModal(false); navigate('/dashboard') }}
      />

      <section className="hero home-hero">
        <motion.div className="hero-orb" animate={{ y: [0, -22, 0], scale: [1, 1.05, 1] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
        <div className="container hero-grid home-hero-grid">
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.span className="eyebrow" variants={fadeUp}>
              <Sparkles size={14} /> Premium URL infrastructure
            </motion.span>
            <motion.h1 variants={fadeUp}>
              Short links that feel <span className="gradient-text">production ready.</span>
            </motion.h1>
            <motion.p className="hero-copy" variants={fadeUp}>
              Create clean, branded URLs with custom aliases, expiry controls, and analytics in a polished dashboard.
            </motion.p>
            <motion.div className="hero-actions" variants={fadeUp}>
              <a href="#shorten" className="btn btn-primary">
                Create a link <ArrowRight size={17} />
              </a>
              <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                View dashboard <LayoutDashboard size={17} />
              </button>
            </motion.div>
            <motion.div className="hero-proof" variants={stagger}>
              {[
                ['Custom', 'aliases for campaigns'],
                ['Live', 'click analytics'],
                ['Private', 'browser-scoped dashboard'],
              ].map(([value, label]) => (
                <motion.div className="proof-tile" variants={fadeUp} key={label}>
                  <div className="proof-value">{value}</div>
                  <div className="proof-label">{label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="container home-shortener" id="shorten">
        <motion.div className="shortener-card panel" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }}>
          <form onSubmit={handleSubmit}>
            <div className="url-composer">
              <Link2 size={21} color="var(--muted)" />
              <input
                type="url"
                value={url}
                onChange={e => { setUrl(e.target.value); setError('') }}
                placeholder="Paste a long URL to shorten"
                required
                aria-label="Long URL"
              />
              <button type="submit" className="btn btn-primary" disabled={loading || !url}>
                {loading ? <span className="spinner" aria-label="Creating link" /> : <><span>Shorten</span><ArrowRight size={17} /></>}
              </button>
            </div>

            <button type="button" className="advanced-toggle btn" onClick={() => setShowAdvanced(v => !v)} aria-expanded={showAdvanced}>
              {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              Advanced options
            </button>

            <AnimatePresence initial={false}>
              {showAdvanced && (
                <motion.div
                  className="advanced-grid"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div>
                    <label className="field-label" htmlFor="alias"><Tag size={13} /> Custom alias</label>
                    <input
                      id="alias"
                      type="text"
                      value={alias}
                      onChange={e => { setAlias(e.target.value); setError('') }}
                      placeholder="my-brand"
                      maxLength={50}
                      pattern="[a-zA-Z0-9\-_]+"
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="expiry"><Clock size={13} /> Expiry date</label>
                    <input
                      id="expiry"
                      type="datetime-local"
                      value={expiry}
                      onChange={e => setExpiry(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <AnimatePresence>
            {error && (
              <motion.div className="error-banner" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <span>!</span>
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>
    </div>
  )
}

function SuccessModal({ open, result, copied, onClose, onCopy, onCreateAnother, onDashboard }) {
  return (
    <AnimatePresence>
      {open && result && (
        <motion.div className="modal-backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            className="modal-card panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="success-title"
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <span className="icon-badge" style={{ background: 'rgba(66,245,155,0.1)', color: 'var(--success)' }}>
              <Check size={20} />
            </span>
            <h2 id="success-title">Your short URL is ready.</h2>
            <p>Copy it, test the redirect, or jump into the dashboard to watch clicks roll in.</p>

            <div className="success-note">
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="field-label" style={{ marginBottom: 4 }}>Short URL</div>
                <strong className="short-link">{result.shortUrl}</strong>
              </div>
              <button className={`icon-btn ${copied ? 'success' : ''}`} onClick={() => onCopy(result.shortUrl)} title="Copy short URL">
                {copied ? <Check size={17} /> : <Copy size={17} />}
              </button>
            </div>

            <div className="long-link" style={{ marginTop: 12 }}>{result.originalUrl}</div>
            {result.expiresAt && (
              <div className="pill" style={{ marginTop: 12 }}>
                <Clock size={13} /> Expires {new Date(result.expiresAt).toLocaleString()}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={onCreateAnother}><Plus size={16} /> Create another</button>
              <button className="btn btn-secondary" onClick={onDashboard}><LayoutDashboard size={16} /> Dashboard</button>
            </div>
            <a className="btn btn-secondary" style={{ width: '100%', marginTop: 12 }} href={result.shortUrl} target="_blank" rel="noopener noreferrer">
              Test redirect <ExternalLink size={16} />
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
