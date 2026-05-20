import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div
      className="mobile-shell"
      style={{ display: 'flex', flexDirection: 'column', background: 'transparent' }}
    >
      <Outlet />
    </div>
  )
}
