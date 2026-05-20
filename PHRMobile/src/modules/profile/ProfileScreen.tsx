import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiArrowLeft, HiChevronRight, HiUserCircle, HiUserGroup,
  HiHeart, HiBell, HiPhone,
} from 'react-icons/hi'
import { MdPowerSettingsNew } from 'react-icons/md'
import { useAuthStore } from '../../store/authStore'
import { getMe } from '../../services/authService'
import { getMyAppointments } from '../../services/bookingService'
import dayjs from 'dayjs'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

const MENU_ITEMS = [
  {
    id: 'personal-info', label: 'Personal info', sub: 'Name, DOB, blood group',
    path: '/app/personal-info',
    iconBg: '#EBF2FF', iconColor: '#2C6ED5',
    icon: HiUserCircle,
  },
  {
    id: 'family', label: 'Family members', sub: null,
    path: '/app/family',
    iconBg: '#E6F6F6', iconColor: '#1FA3A8',
    icon: HiUserGroup,
  },
  {
    id: 'medical', label: 'Medical history', sub: 'Conditions, allergies, vitals',
    path: '/app/medical-history',
    iconBg: '#FFF0F0', iconColor: '#E05B5B',
    icon: HiHeart,
  },
  {
    id: 'my-doctors', label: 'My Doctors', sub: 'Your favourite doctors',
    path: '/app/my-doctors',
    iconBg: '#FFF0F0', iconColor: '#E05B5B',
    icon: HiHeart,
  },
  {
    id: 'notifications', label: 'Notifications', sub: 'Push, SMS, email',
    path: '/app/settings',
    iconBg: '#FFFBEB', iconColor: '#D97706',
    icon: HiBell,
  },
  {
    id: 'support', label: 'Support', sub: 'Chat with NoQ care',
    path: '/app/support',
    iconBg: '#ECFDF5', iconColor: '#059669',
    icon: HiPhone,
  },
]

export default function ProfileScreen() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)
  const [stats, setStats] = useState({ visits: 0, upcoming: 0, reports: 0 })
  const [familyCount, setFamilyCount] = useState(0)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    getMe().then((r) => { if (r.success) setUser(r.data) }).catch(() => {})
    Promise.all([
      getMyAppointments('past'),
      getMyAppointments('upcoming'),
    ]).then(([past, upcoming]) => {
      setStats({ visits: past.count, upcoming: upcoming.count, reports: 0 })
    }).catch(() => {})
  }, [setUser])

  useEffect(() => {
    import('../../services/familyService').then(({ getFamilyMembers }) => {
      getFamilyMembers().then((r) => setFamilyCount(r.count)).catch(() => {})
    })
  }, [])

  const name = user?.name ?? 'User'
  const phone = user?.phone ?? user?.email ?? ''
  const age = user?.dob ? dayjs().diff(dayjs(user.dob), 'year') : null
  const bloodGroup = user?.bloodGroup

  const menuWithSub = MENU_ITEMS.map((item) => ({
    ...item,
    sub: item.id === 'family'
      ? familyCount > 0 ? `${familyCount} member${familyCount !== 1 ? 's' : ''} added` : 'No members added'
      : item.sub,
  }))

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const getPortal = () => document.getElementById('modal-portal') || document.body

  return (
    <div style={{ minHeight: '100dvh', background: '#F5F8FC', fontFamily: 'Roboto, system-ui, sans-serif' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 0', background: '#F5F8FC' }}>
        <button onClick={() => navigate('/app/dashboard')} style={{ width: 36, height: 36, borderRadius: 10, background: '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(30,79,163,0.10)' }}>
          <HiArrowLeft size={18} color="#1A1A1A" />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>Profile</span>
        <button onClick={() => setShowLogoutConfirm(true)} style={{ width: 36, height: 36, borderRadius: 10, background: '#FEE2E2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MdPowerSettingsNew size={18} color="#DC2626" />
        </button>
      </div>

      {/* Gradient hero card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        style={{ margin: '14px 16px 0', borderRadius: 24, background: BRAND_GRADIENT, padding: '24px 20px 64px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', border: '2.5px solid rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#FFFFFF', flexShrink: 0 }}>
            {getInitials(name)}
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', margin: '0 0 4px' }}>{name}</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: '0 0 10px' }}>{phone}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.18)', color: '#FFFFFF', borderRadius: 20, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                ✓ Verified
              </span>
              {(bloodGroup || age !== null) && (
                <span style={{ fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.18)', color: '#FFFFFF', borderRadius: 20, padding: '4px 10px' }}>
                  {[bloodGroup, age !== null ? `${age} yrs` : null].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats card floating over gradient */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.35 }}
        style={{ margin: '-40px 24px 0', background: '#FFFFFF', borderRadius: 20, padding: '18px 8px', boxShadow: '0 4px 20px rgba(30,79,163,0.13)', display: 'flex', position: 'relative', zIndex: 10 }}>
        {[
          { value: stats.visits, label: 'Visits' },
          { value: stats.upcoming, label: 'Upcoming' },
          { value: stats.reports, label: 'Reports' },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRight: i < 2 ? '1px solid #EEF2F7' : 'none', padding: '0 4px' }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: '#2C6ED5', lineHeight: 1 }}>{s.value}</span>
            <span style={{ fontSize: 11, color: '#6B7C93', marginTop: 4 }}>{s.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Menu */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.35 }}
        style={{ margin: '20px 16px 0', background: '#FFFFFF', borderRadius: 20, boxShadow: '0 2px 12px rgba(30,79,163,0.07)', overflow: 'hidden' }}>
        {menuWithSub.map((item, idx) => {
          const Icon = item.icon
          return (
            <div key={item.id}>
              <button onClick={() => item.path ? navigate(item.path) : undefined} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: item.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} color={item.iconColor} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A', marginBottom: 2 }}>{item.label}</div>
                  {item.sub && <div style={{ fontSize: 12, color: '#A0AEC0' }}>{item.sub}</div>}
                </div>
                <HiChevronRight size={18} color="#C8D4E3" />
              </button>
              {idx < menuWithSub.length - 1 && (
                <div style={{ height: 1, background: '#F0F4F8', marginLeft: 70 }} />
              )}
            </div>
          )
        })}
      </motion.div>

      {/* Log out button */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
        style={{ margin: '20px 16px 0', paddingBottom: 96 }}>
        <button onClick={() => setShowLogoutConfirm(true)} style={{
          width: '100%', height: 52, borderRadius: 16, border: 'none',
          background: '#FEE2E2', color: '#DC2626', fontSize: 15, fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <MdPowerSettingsNew size={18} /> Log out
        </button>
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#6B7C93', margin: '0 0 4px' }}>NoQ v2.4</p>
          <p style={{ fontSize: 12, color: '#A0AEC0', margin: 0 }}>Skip the queue. Get care faster.</p>
        </div>
      </motion.div>
      {/* Logout confirmation — bottom sheet */}
      {showLogoutConfirm && createPortal(
        <div
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.50)', zIndex: 950, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pointerEvents: 'all' }}
          onClick={() => setShowLogoutConfirm(false)}
        >
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#FFFFFF', borderRadius: '24px 24px 0 0', padding: '12px 24px 32px', width: '100%', maxWidth: 430, textAlign: 'center' }}
          >
            {/* Drag handle */}
            <div style={{ width: 40, height: 4, borderRadius: 2, background: '#D1D9E0', margin: '0 auto 24px' }} />

            {/* Icon */}
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>!</span>
              </div>
            </div>

            <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', marginBottom: 8 }}>Log out?</div>
            <div style={{ fontSize: 13, color: '#6B7C93', lineHeight: 1.6, marginBottom: 28 }}>
              Are you sure you want to log out of your NoQ account?
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{ flex: 1, height: 52, borderRadius: 14, border: '1.5px solid #E8EDF2', background: '#F5F8FC', color: '#374151', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
              >
                No, Keep
              </button>
              <button
                onClick={handleLogout}
                style={{ flex: 1, height: 52, borderRadius: 14, border: 'none', background: '#DC2626', color: '#FFFFFF', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(220,38,38,0.30)' }}
              >
                Yes, Log out
              </button>
            </div>
          </motion.div>
        </div>,
        getPortal()
      )}
    </div>
  )
}
