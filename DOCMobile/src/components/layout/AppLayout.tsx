import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  return (
    <div className="mobile-shell" style={{ fontFamily: 'Roboto, system-ui, sans-serif' }}>
      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
