import { useToastStore, type ToastType } from '@/store/toast'

const COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: '#f0fdf4', border: '#86efac', icon: '✓' },
  error:   { bg: '#fef2f2', border: '#fca5a5', icon: '✕' },
  warning: { bg: '#fffbeb', border: '#fcd34d', icon: '⚠' },
  info:    { bg: '#eff6ff', border: '#93c5fd', icon: 'ℹ' },
}
const TEXT: Record<ToastType, string> = {
  success: '#166534', error: '#991b1b', warning: '#92400e', info: '#1e40af',
}

export default function ToastContainer() {
  const { toasts, remove } = useToastStore()
  if (!toasts.length) return null
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none',
    }}>
      {toasts.map(t => {
        const c = COLORS[t.type]
        return (
          <div
            key={t.id}
            style={{
              pointerEvents: 'all',
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: c.bg, border: `1px solid ${c.border}`,
              borderRadius: 10, padding: '12px 16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              minWidth: 280, maxWidth: 380,
              animation: 'slideInRight 0.2s ease',
              color: TEXT[t.type], fontSize: 13.5, fontWeight: 500,
            }}
          >
            <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{c.icon}</span>
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.6, padding: 0, fontSize: 16, lineHeight: 1, flexShrink: 0 }}
            >×</button>
          </div>
        )
      })}
    </div>
  )
}
