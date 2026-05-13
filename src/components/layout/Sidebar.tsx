import Icon from '@/components/ui/Icon'
import { useAppStore } from '@/store/app'
import { useAuthStore } from '@/store/auth'

type NavItem = { k: string; l: string; ic: string; badge?: number }
type NavGroup = { g: string; items: NavItem[] }

const NAV: NavGroup[] = [
  { g: 'Workspace', items: [
    { k: 'dashboard',      l: 'Admin dashboard',      ic: 'dashboard' },
    { k: 'dash-clinic',    l: 'Clinic dashboard',     ic: 'building' },
    { k: 'dash-doctor',    l: 'Doctor dashboard',     ic: 'stethoscope' },
    { k: 'dash-nurse',     l: 'Nurse dashboard',      ic: 'heart' },
    { k: 'dash-frontdesk', l: 'Front desk dashboard', ic: 'user' },
  ]},
  { g: 'Clinic', items: [
    { k: 'appointments', l: 'Appointments',  ic: 'calendar', badge: 62 },
    { k: 'live-tokens',  l: 'Live tokens',   ic: 'ticket' },
    { k: 'tokens-mgr',   l: 'Tokens',        ic: 'ticket' },
    { k: 'tokens',       l: 'Token display', ic: 'dashboard' },
  ]},
  { g: 'Manage', items: [
    { k: 'clinics',     l: 'Clinics',    ic: 'building' },
    { k: 'doctors',     l: 'Doctors',    ic: 'stethoscope' },
    { k: 'nurses',      l: 'Nurses',     ic: 'heart' },
    { k: 'frontdesk',   l: 'Front desk', ic: 'user' },
    { k: 'patients',    l: 'Patients',   ic: 'users' },
    { k: 'admin-users', l: 'Users',      ic: 'shield' },
  ]},
  { g: 'Operations', items: [
    { k: 'pharmacy', l: 'Pharmacy', ic: 'pill' },
    { k: 'lab',      l: 'Lab',      ic: 'flask' },
    { k: 'billing',  l: 'Billing',  ic: 'receipt' },
    { k: 'reports',  l: 'Reports',  ic: 'chart' },
  ]},
  { g: 'System', items: [
    { k: 'master-data', l: 'Master data', ic: 'database' },
  ]},
  { g: 'Account', items: [
    { k: 'support',  l: 'Support tickets', ic: 'lifebuoy' },
    { k: 'settings', l: 'Settings',        ic: 'settings' },
  ]},
]

const ROLE_LABELS: Record<string, string> = {
  super_admin:  'Super Admin',
  clinic_admin: 'Clinic Admin',
  doctor:       'Doctor',
  nurse:        'Nurse',
  frontdesk:    'Front Desk',
  pharmacist:   'Pharmacist',
  lab_tech:     'Lab Tech',
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Sidebar() {
  const { route, setRoute, setLogoutOpen } = useAppStore()
  const user = useAuthStore(s => s.user)

  const displayName = user?.name ?? 'Unknown User'
  const displayRole = user ? (ROLE_LABELS[user.role] ?? user.role) : 'Guest'
  const initials    = user ? getInitials(user.name) : '??'

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="logo">N</div>
        <div>
          <div className="name">NoQ</div>
          <div className="sub">Clinic admin</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(group => (
          <div key={group.g}>
            <div className="sidebar-section-title">{group.g}</div>
            {group.items.map(item => (
              <button
                key={item.k}
                className={`nav-item ${route === item.k ? 'active' : ''}`}
                onClick={() => setRoute(item.k)}
              >
                <span className="nav-ic">
                  <Icon name={item.ic} size={17} />
                </span>
                <span>{item.l}</span>
                {item.badge != null && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={() => setRoute('profile')} style={{ cursor: 'pointer' }}>
          <div className="av blue">{initials}</div>
          <div className="who">
            <div className="n">{displayName}</div>
            <div className="r">{displayRole}</div>
          </div>
          <button
            style={{ marginLeft: 'auto', padding: 4, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--fg-secondary)', borderRadius: 6 }}
            onClick={e => { e.stopPropagation(); setLogoutOpen(true) }}
            title="Sign out"
          >
            <Icon name="log" size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
