import { useState, useCallback, createContext, useContext, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'

const ToastContext = createContext(null)

const tone = {
  success: { icon: CheckCircle2, color: 'var(--success)', bg: 'rgba(66,245,155,0.1)' },
  error: { icon: XCircle, color: 'var(--error)', bg: 'rgba(255,93,115,0.11)' },
  info: { icon: Info, color: 'var(--accent-2)', bg: 'rgba(34,211,238,0.1)' },
  warn: { icon: AlertTriangle, color: 'var(--warning)', bg: 'rgba(246,196,83,0.1)' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const show = useCallback((message, type = 'success', duration = 3500) => {
    const id = ++idRef.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        <AnimatePresence>
          {toasts.map(toast => (
            <Toast key={toast.id} toast={toast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

function Toast({ toast }) {
  const c = tone[toast.type] || tone.success
  const Icon = c.icon

  return (
    <motion.div
      className="toast panel"
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
    >
      <span className="icon-badge" style={{ background: c.bg, color: c.color }}>
        <Icon size={18} />
      </span>
      <span style={{ color: 'var(--muted-strong)', fontSize: 14, lineHeight: 1.5 }}>
        {toast.message}
      </span>
    </motion.div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
