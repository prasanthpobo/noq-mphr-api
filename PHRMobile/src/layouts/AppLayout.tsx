import { Outlet } from 'react-router-dom'
import BottomNav from '../components/BottomNav'

export default function AppLayout() {
  return (
    <div
      className="mobile-shell"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        background: 'var(--bg-app)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Scrollable content area */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Outlet />
      </main>

      {/* Bottom navigation — flex child, not fixed */}
      <BottomNav />

      {/* Portal root — modals render here so they stay inside the shell */}
      <div id="modal-portal" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 200 }} />
    </div>
  )
}
