import { useLocation, useNavigate } from 'react-router-dom'

// Inline SVG icons matching the reference design
const HomeIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10l9-7 9 7v10a2 2 0 01-2 2h-4v-7h-6v7H5a2 2 0 01-2-2z"/>
  </svg>
)

const CalendarIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
)

const PlusIcon = ({ size = 26 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
)

const ClinicIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7l9-4 9 4M5 7v13h14V7M9 20v-7h6v7"/>
    <path d="M12 10v4M10 12h4"/>
  </svg>
)

const UserIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 21v-1a7 7 0 0114 0v1"/>
  </svg>
)

interface NavItem {
  key: string
  label: string
  path: string
  center?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home',     label: 'Home',     path: '/app/dashboard' },
  { key: 'apts',     label: 'Bookings', path: '/app/appointments' },
  { key: 'book',     label: '',         path: '/app/book', center: true },
  { key: 'clinics',  label: 'Clinics',  path: '/app/clinics' },
  { key: 'profile',  label: 'Profile',  path: '/app/profile' },
]

function renderIcon(key: string, isCenter: boolean) {
  if (key === 'home')    return <HomeIcon size={isCenter ? 26 : 22} />
  if (key === 'apts')    return <CalendarIcon size={isCenter ? 26 : 22} />
  if (key === 'book')    return <PlusIcon size={26} />
  if (key === 'clinics') return <ClinicIcon size={isCenter ? 26 : 22} />
  if (key === 'profile') return <UserIcon size={isCenter ? 26 : 22} />
  return null
}

const HIDE_NAV_PATHS = ['/app/booking', '/app/today-queue']

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  if (HIDE_NAV_PATHS.some((p) => location.pathname.startsWith(p))) return null

  const getActive = (item: NavItem) => {
    if (item.key === 'home') return location.pathname === '/app/dashboard' || location.pathname === '/app'
    if (item.key === 'apts') return location.pathname.startsWith('/app/appointments')
    if (item.key === 'book') return location.pathname.startsWith('/app/book') || location.pathname.startsWith('/app/doctor')
    if (item.key === 'clinics') return location.pathname.startsWith('/app/clinics') || location.pathname.startsWith('/app/clinic')
    if (item.key === 'profile') return location.pathname.startsWith('/app/profile') || location.pathname.startsWith('/app/family') || location.pathname.startsWith('/app/settings')
    return false
  }

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => {
        const isActive = getActive(item)
        const isCenter = !!item.center

        return (
          <button
            key={item.key}
            onClick={() => navigate(item.path)}
            className={`nav-item${isCenter ? ' center' : ''}${isActive && !isCenter ? ' active' : ''}`}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              ...(isCenter ? {
                background: 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)',
                width: 52,
                height: 52,
                borderRadius: 16,
                marginTop: -24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(44,110,213,0.32)',
                flexShrink: 0,
              } : {}),
            }}
            aria-label={item.label || 'Book'}
            aria-current={isActive ? 'page' : undefined}
          >
            {renderIcon(item.key, isCenter)}
            {!isCenter && <span>{item.label}</span>}
          </button>
        )
      })}
    </nav>
  )
}
