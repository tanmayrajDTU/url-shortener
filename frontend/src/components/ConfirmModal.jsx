// Reusable confirmation dialog — replaces browser confirm()
// Usage: <ConfirmModal open={open} title="..." body="..." onConfirm={fn} onCancel={fn} danger />

export default function ConfirmModal({ open, title, body, confirmLabel = 'Confirm', onConfirm, onCancel, danger = false }) {
  if (!open) return null

  return (
    // Backdrop
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      {/* Dialog */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#111', border: '1px solid #222',
          borderRadius: '12px', padding: '28px',
          maxWidth: '400px', width: '100%',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          animation: 'modalIn 0.2s cubic-bezier(0.16,1,0.3,1)',
          fontFamily: 'Syne, sans-serif',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: '10px', marginBottom: '16px',
          background: danger ? 'rgba(255,71,87,0.12)' : 'rgba(232,255,71,0.1)',
          border: `1px solid ${danger ? 'rgba(255,71,87,0.3)' : 'rgba(232,255,71,0.2)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px',
        }}>
          {danger ? '🗑' : '⚡'}
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px', color: '#f0f0f0' }}>
          {title}
        </h2>
        <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.6, marginBottom: '24px' }}>
          {body}
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '9px 18px', borderRadius: '6px',
              background: '#181818', border: '1px solid #222',
              color: '#888', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Syne, sans-serif',
              transition: 'all 0.15s',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '9px 18px', borderRadius: '6px',
              background: danger ? 'rgba(255,71,87,0.15)' : 'var(--accent, #e8ff47)',
              border: `1px solid ${danger ? 'rgba(255,71,87,0.4)' : 'transparent'}`,
              color: danger ? '#ff4757' : '#0a0a0a',
              fontSize: '13px', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'Syne, sans-serif',
              transition: 'all 0.15s',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
