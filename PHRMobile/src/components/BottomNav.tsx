import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiHome, HiOutlineHome,
  HiCalendar, HiOutlineCalendar,
  HiPlus,
  HiOfficeBuilding, HiOutlineOfficeBuilding,
  HiUser, HiOutlineUser,
} from 'react-icons/hi'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

interface NavItem {
  key: string
  label: string
  path: string
  center?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home',    label: 'Home',     path: '/app/dashboard' },
  { key: 'apts',    label: 'Bookings', path: '/app/appointments' },
  { key: 'book',    label: '',         path: '/app/book', center: true },
  { key: 'clinics', label: 'Clinics',  path: '/app/clinics' },
  { key: 'profile', label: 'Profile',  path: '/app/profile' },
]

const HIDE_NAV_PATHS = ['/app/booking', '/app/book', '/app/today-queue']

function NavIcon({ navKey, active }: { navKey: string; active: boolean }) {
  const size = 22
  const color = active ? '#2C6ED5' : '#94A3B8'
  if (navKey === 'home')    return active ? <HiHome size={size} color={color} /> : <HiOutlineHome size={size} color={color} />
  if (navKey === 'apts')    return active ? <HiCalendar size={size} color={color} /> : <HiOutlineCalendar size={size} color={color} />
  if (navKey === 'clinics') return active ? <HiOfficeBuilding size={size} color={color} /> : <HiOutlineOfficeBuilding size={size} color={color} />
  if (navKey === 'profile') return active ? <HiUser size={size} color={color} /> : <HiOutlineUser size={size} color={color} />
  return null
}

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  if (HIDE_NAV_PATHS.some((p) => location.pathname.startsWith(p))) return null

  const getActive = (item: NavItem) => {
    if (item.key === 'home')    return location.pathname === '/app/dashboard' || location.pathname === '/app'
    if (item.key === 'apts')    return location.pathname.startsWith('/app/appointments')
    if (item.key === 'book')    return location.pathname.startsWith('/app/book') || location.pathname.startsWith('/app/doctor')
    if (item.key === 'clinics') return location.pathname.startsWith('/app/clinics') || location.pathname.startsWith('/app/clinic')
    if (item.key === 'profile') return location.pathname.startsWith('/app/profile') || location.pathname.startsWith('/app/family') || location.pathname.startsWith('/app/settings')
    return false
  }

  return (
    <nav style={{
      background: '#FFFFFF',
      borderTop: '1px solid #EEF2F7',
      padding: '0 8px 20px',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      boxShadow: '0 -4px 24px rgba(30,79,163,0.10)',
      flexShrink: 0,
      position: 'relative',
    }}>
      {NAV_ITEMS.map((item) => {
        const isActive = getActive(item)
        const isCenter = !!item.center

        if (isCenter) {
          return (
            <div
              key={item.key}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* White ring lifts the FAB above the nav bar */}
              <div style={{
                width: 68, height: 68,
                borderRadius: '50%',
                background: '#F5F8FC',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: 'translateY(-20px)',
                flexShrink: 0,
              }}>
                <motion.button
                  onClick={() => navigate(item.path)}
                  whileTap={{ scale: 0.88 }}
                  style={{
                    width: 58, height: 58,
                    borderRadius: '50%',
                    background: BRAND_GRADIENT,
                    border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(44,110,213,0.45)',
                    flexShrink: 0,
                  }}
                  aria-label="Book"
                >
                  <HiPlus size={28} color="#FFFFFF" strokeWidth={2} />
                </motion.button>
              </div>
            </div>
          )
        }

        return (
          <motion.button
            key={item.key}
            onClick={() => navigate(item.path)}
            whileTap={{ scale: 0.88 }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              padding: '10px 4px 6px',
            }}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Icon pill */}
            <div style={{
              width: 44, height: 30,
              borderRadius: 10,
              background: isActive ? '#EBF2FF' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.18s',
            }}>
              <NavIcon navKey={item.key} active={isActive} />
            </div>

            {/* Label */}
            <span style={{
              fontSize: 10,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#2C6ED5' : '#94A3B8',
              transition: 'color 0.18s',
            }}>
              {item.label}
            </span>

            {/* Active dot */}
            <div style={{
              width: 4, height: 4, borderRadius: '50%',
              background: isActive ? '#2C6ED5' : 'transparent',
              transition: 'background 0.18s',
              marginTop: -2,
            }} />
          </motion.button>
        )
      })}
    </nav>
  )
}
