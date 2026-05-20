import { Outlet } from 'react-router-dom'

export function AuthShell() {
  return (
    <div className="mobile-shell" style={{ background: 'transparent' }}>
      <Outlet />
    </div>
  )
}
