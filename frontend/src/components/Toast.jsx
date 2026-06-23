// Global toast notification system
// Usage: import { useToast, ToastContainer } from './Toast.jsx'
// Place <ToastContainer /> once in Layout, use toast.show() anywhere

import { useState, useCallback, createContext, useContext, useRef } from 'react'

const ToastContext = createContext(null)

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
      <div style={{
        position: 'fixed', bottom: '28px', right: '28px',
        display: 'flex', flexDirection: 'column', gap: '10px',
        zIndex: 10000, pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <Toast key={t.id} toast={t} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function Toast({ toast }) {
  const colors = {
    success: { bg: 'rgba(46,213,115,0.12)', border: 'rgba(46,213,115,0.35)', color: '#2ed573', icon: '✓' },
    error:   { bg: 'rgba(255,71,87,0.12)',  border: 'rgba(255,71,87,0.35)',  color: '#ff4757', icon: '✗' },
    info:    { bg: 'rgba(84,160,255,0.12)', border: 'rgba(84,160,255,0.35)', color: '#54a0ff', icon: 'ℹ' },
    warn:    { bg: 'rgba(255,165,2,0.12)',  border: 'rgba(255,165,2,0.35)',  color: '#ffa502', icon: '⚠' },
  }
  const c = colors[toast.type] || colors.success

  return (
    <div style={{
      pointerEvents: 'auto',
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      padding: '12px 16px', borderRadius: '8px',
      background: '#111', border: `1px solid ${c.border}`,
      boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${c.border}`,
      maxWidth: '340px', minWidth: '240px',
      animation: 'toastIn 0.25s cubic-bezier(0.16,1,0.3,1)',
      fontFamily: 'Syne, sans-serif',
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: '50%',
        background: c.bg, border: `1px solid ${c.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', fontWeight: 700, color: c.color, flexShrink: 0,
      }}>{c.icon}</span>
      <span style={{ fontSize: '13px', color: '#f0f0f0', lineHeight: 1.5, fontWeight: 500 }}>
        {toast.message}
      </span>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
