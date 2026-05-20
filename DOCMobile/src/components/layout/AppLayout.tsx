import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100dvh', background: '#F5F8FC', fontFamily: 'Roboto, system-ui, sans-serif' }}>
      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
