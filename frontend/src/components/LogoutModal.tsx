import { useEffect } from 'react'
import { useAppStore } from '@/store/app'
import Icon from '@/components/ui/Icon'

export default function LogoutModal() {
  const { confirmLogout, setLogoutOpen } = useAppStore()

  const cancel = () => setLogoutOpen(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') cancel() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="modal-backdrop" onClick={cancel}>
      <div
        className="modal"
        style={{ width: 400 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Icon + close */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 14px 0' }}>
          <button
            className="modal-close"
            onClick={cancel}
            aria-label="Close"
          >
            <Icon name="x" size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ paddingTop: 8, textAlign: 'center' }}>
          {/* Warning icon circle */}
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'var(--danger-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--danger-500)'
          }}>
            <Icon name="log" size={26} stroke={2} />
          </div>

          <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--fg-primary)', marginBottom: 8 }}>
            Log out of NoQ?
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--fg-secondary)', lineHeight: 1.6, marginBottom: 4 }}>
            Your session will end and you&apos;ll need to sign in again.
          </p>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ justifyContent: 'center', gap: 10, paddingBottom: 20 }}>
          <button className="btn btn-secondary" style={{ minWidth: 110 }} onClick={cancel}>
            Cancel
          </button>
          <button className="btn btn-danger" style={{ minWidth: 130 }} onClick={confirmLogout}>
            <Icon name="log" size={15} />
            Yes, log out
          </button>
        </div>
      </div>
    </div>
  )
}
