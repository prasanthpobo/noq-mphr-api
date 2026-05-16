import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiCog,
  HiChevronRight,
  HiDocumentText,
  HiClipboard,
  HiHeart,
  HiUserGroup,
  HiBell,
  HiShieldCheck,
  HiQuestionMarkCircle,
  HiStar,
  HiInformationCircle,
  HiLogout,
} from 'react-icons/hi'
import { useAuthStore } from '../../store/authStore'
import { getMe } from '../../services/authService'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

// ── Types ─────────────────────────────────────────────────────────────────────

interface MenuItemDef {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number; color?: string }>
  iconColor: string
  iconBg: string
  path?: string
  action?: () => void
}

interface MenuSection {
  title: string
  items: MenuItemDef[]
}

// ── MenuItem Sub-component ────────────────────────────────────────────────────

interface MenuItemProps {
  item: MenuItemDef
}

function MenuItem({ item }: MenuItemProps) {
  const navigate = useNavigate()

  const handleTap = () => {
    if (item.action) {
      item.action()
    } else if (item.path) {
      navigate(item.path)
    }
  }

  const Icon = item.icon

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={handleTap}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: '#FFFFFF',
        border: 'none',
        borderRadius: '14px',
        padding: '14px 16px',
        cursor: 'pointer',
        textAlign: 'left',
        boxShadow: '0 2px 6px rgba(30,79,163,0.05)',
        marginBottom: '8px',
      }}
    >
      {/* Icon circle */}
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: item.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} color={item.iconColor} />
      </div>

      {/* Label */}
      <span
        style={{
          flex: 1,
          fontSize: '15px',
          fontWeight: 600,
          color: item.id === 'logout' ? '#E53E3E' : '#1A1A1A',
        }}
      >
        {item.label}
      </span>

      {/* Chevron */}
      <HiChevronRight size={18} color={item.id === 'logout' ? '#E53E3E' : '#A0AEC0'} />
    </motion.button>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)

  useEffect(() => {
    getMe().then((res) => { if (res.success) setUser(res.data) }).catch(() => {})
  }, [setUser])

  const userName = user?.name ?? 'User'
  const userPhone = user?.phone ?? user?.email ?? ''

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const menuSections: MenuSection[] = [
    {
      title: 'My Health',
      items: [
        {
          id: 'medical-history',
          label: 'Medical History',
          icon: HiDocumentText,
          iconColor: '#2C6ED5',
          iconBg: '#EBF2FF',
          path: '/app/records',
        },
        {
          id: 'prescriptions',
          label: 'Prescriptions',
          icon: HiClipboard,
          iconColor: '#1FA3A8',
          iconBg: '#E6F6F6',
          path: '/app/records',
        },
        {
          id: 'lab-reports',
          label: 'Lab Reports',
          icon: HiDocumentText,
          iconColor: '#7C3AED',
          iconBg: '#F3EEFF',
          path: '/app/records',
        },
        {
          id: 'vitals',
          label: 'Vitals',
          icon: HiHeart,
          iconColor: '#E53E3E',
          iconBg: '#FFF5F5',
          path: '/app/records',
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          id: 'family-members',
          label: 'Family Members',
          icon: HiUserGroup,
          iconColor: '#2C6ED5',
          iconBg: '#EBF2FF',
          path: '/app/family',
        },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: HiBell,
          iconColor: '#D97706',
          iconBg: '#FFFBEB',
          path: '/app/settings',
        },
        {
          id: 'privacy-security',
          label: 'Privacy & Security',
          icon: HiShieldCheck,
          iconColor: '#16A34A',
          iconBg: '#ECFDF5',
          path: '/app/settings',
        },
        {
          id: 'help-support',
          label: 'Help & Support',
          icon: HiQuestionMarkCircle,
          iconColor: '#6B7C93',
          iconBg: '#F5F8FC',
          path: '/app/settings',
        },
      ],
    },
    {
      title: 'App',
      items: [
        {
          id: 'settings',
          label: 'Settings',
          icon: HiCog,
          iconColor: '#6B7C93',
          iconBg: '#F5F8FC',
          path: '/app/settings',
        },
        {
          id: 'rate-app',
          label: 'Rate App',
          icon: HiStar,
          iconColor: '#D97706',
          iconBg: '#FFFBEB',
        },
        {
          id: 'about',
          label: 'About',
          icon: HiInformationCircle,
          iconColor: '#6B7C93',
          iconBg: '#F5F8FC',
          path: '/app/settings',
        },
        {
          id: 'logout',
          label: 'Logout',
          icon: HiLogout,
          iconColor: '#E53E3E',
          iconBg: '#FFF5F5',
          action: () => {
            logout()
            navigate('/login')
          },
        },
      ],
    },
  ]

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#F5F8FC',
        fontFamily: 'Roboto, system-ui, sans-serif',
        overflowX: 'hidden',
      }}
    >
      {/* ── Gradient Header ──────────────────────────────────────────────────── */}
      <div
        style={{
          background: BRAND_GRADIENT,
          borderRadius: '0 0 32px 32px',
          padding: '20px 20px 48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-30px',
            left: '-30px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }}
        />

        {/* Top row: title + settings icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 1,
            marginBottom: '20px',
          }}
        >
          <div style={{ width: '40px' }} />
          <h1
            style={{
              color: '#FFFFFF',
              fontSize: '18px',
              fontWeight: 700,
              margin: 0,
              textAlign: 'center',
            }}
          >
            Profile
          </h1>
          <button
            onClick={() => navigate('/app/settings')}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Settings"
          >
            <HiCog size={20} color="#FFFFFF" />
          </button>
        </div>

        {/* Avatar + name + phone + edit */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              border: '4px solid #FFFFFF',
              background: 'linear-gradient(135deg, #2C6ED5 0%, #1FA3A8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }}
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={userName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: '28px', fontWeight: 700, color: '#FFFFFF' }}>
                {initials}
              </span>
            )}
          </div>

          <h2
            style={{
              color: '#FFFFFF',
              fontSize: '22px',
              fontWeight: 700,
              margin: '12px 0 4px',
            }}
          >
            {userName}
          </h2>

          <p
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '14px',
              margin: '0 0 14px',
            }}
          >
            {userPhone}
          </p>

          <button
            onClick={() => {}}
            style={{
              border: '1.5px solid rgba(255,255,255,0.7)',
              background: 'transparent',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '24px',
              padding: '7px 22px',
              cursor: 'pointer',
            }}
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* ── Stats Row ────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          margin: '-24px 16px 0',
          padding: '18px 8px',
          boxShadow: '0 4px 16px rgba(30,79,163,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {[
          { value: '12', label: 'Appointments' },
          { value: '3', label: 'Family Members' },
          { value: '8', label: 'Records' },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
              borderRight: i < 2 ? '1px solid #EEF2F7' : 'none',
              padding: '0 4px',
            }}
          >
            <span
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#2C6ED5',
                lineHeight: 1,
                marginBottom: '4px',
              }}
            >
              {stat.value}
            </span>
            <span style={{ fontSize: '11px', color: '#6B7C93', textAlign: 'center' }}>
              {stat.label}
            </span>
          </div>
        ))}
      </motion.div>

      {/* ── Menu Sections ────────────────────────────────────────────────────── */}
      <div style={{ marginTop: '20px', padding: '0 16px', paddingBottom: '96px' }}>
        {menuSections.map((section, sIdx) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + sIdx * 0.08, duration: 0.4 }}
            style={{ marginBottom: '4px' }}
          >
            <p
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#A0AEC0',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                margin: '0 0 8px 4px',
              }}
            >
              {section.title}
            </p>

            {section.items.map((item) => (
              <MenuItem key={item.id} item={item} />
            ))}

            <div style={{ height: '8px' }} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
