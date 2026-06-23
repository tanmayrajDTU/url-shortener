import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ShieldCheck } from 'lucide-react'

export default function ConfirmModal({ open, title, body, confirmLabel = 'Confirm', onConfirm, onCancel, danger = false }) {
  const Icon = danger ? AlertTriangle : ShieldCheck

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          onClick={onCancel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="modal-card panel"
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <span className="icon-badge" style={danger ? { background: 'rgba(255,93,115,0.12)', color: 'var(--error)' } : undefined}>
              <Icon size={20} />
            </span>
            <h2 id="confirm-title">{title}</h2>
            <p>{body}</p>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
              <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
