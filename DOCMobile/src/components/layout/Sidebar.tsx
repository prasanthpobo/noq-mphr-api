import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

const NAV_ITEMS = [
  { to: '/',             label: 'Dashboard',   emoji: '📊' },
  { to: '/queue',        label: 'Live Queue',  emoji: '🔢' },
  { to: '/appointments', label: 'Appointments',emoji: '📅' },
  { to: '/consultation', label: 'Consultation',emoji: '🩺' },
  { to: '/history',      label: 'History',     emoji: '📋' },
  { to: '/patients',     label: 'My Patients', emoji: '👥' },
  { to: '/clinics',      label: 'Your Clinics',emoji: '🏥' },
  { to: '/profile',      label: 'Profile',     emoji: '👤' },
]

export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const clinic = useAuthStore((s) => s.selectedClinic)

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen bg-primary-dark text-white shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center font-bold text-white">
          N
        </div>
        <div>
          <p className="font-semibold text-sm leading-tight">NoQ · Doctor</p>
          <p className="text-xs text-light-blue truncate">{clinic?.name ?? '—'}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, emoji }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                isActive
                  ? 'bg-primary text-white font-medium'
                  : 'text-light-blue hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <span>{emoji}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Doctor info */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-sm font-medium truncate">{user?.name ?? 'Doctor'}</p>
        <p className="text-xs text-light-blue truncate">MCI {user?.mciNumber ?? '—'}</p>
      </div>
    </aside>
  )
}
