import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import { useAppStore } from '@/store/app'
import { usePermissions } from '@/hooks/usePermissions'
import { MENU_CONFIG } from '@/config/menuConfig'
import { ROLE_LABELS, ROLE_COLORS, type Role } from '@/config/rbac'

/* ── Role chip ──────────────────────────────────────────────────────────── */
function RoleChip({ role }: { role: Role }) {
  const { bg, fg } = ROLE_COLORS[role] ?? ROLE_COLORS.user
  return (
    <span style={{
      display:       'inline-block',
      padding:       '2px 8px',
      borderRadius:  20,
      fontSize:      10,
      fontWeight:    700,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      background:    bg,
      color:         fg,
      border:        `1px solid ${fg}22`,
    }}>
      {ROLE_LABELS[role] ?? role}
    </span>
  )
}

/* ── Sidebar ─────────────────────────────────────────────────────────────── */
export default function Sidebar() {
  const { route, setRoute, setLogoutOpen } = useAppStore()
  const { can, role } = usePermissions()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close sidebar on route change (mobile)
  useEffect(() => { setMobileOpen(false) }, [route])

  // Close sidebar on Escape key (mobile)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Filter menu to only items the current role can see
  const visibleGroups = MENU_CONFIG
    .map(g => ({ ...g, items: g.items.filter(item => can(item.permission)) }))
    .filter(g => g.items.length > 0)

  const handleNav = (key: string) => {
    setRoute(key)
    setMobileOpen(false)
  }

  return (
    <>
      {/* ── Mobile hamburger ─────────────────────────────────────────────── */}
      <button
        className="sidebar-hamburger"
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Toggle navigation"
        aria-expanded={mobileOpen}
      >
        <Icon name={mobileOpen ? 'x' : 'menu'} size={18} />
      </button>

      {/* ── Mobile overlay ───────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="sidebar-overlay open"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* ── Sidebar panel ────────────────────────────────────────────────── */}
      <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>

        {/* Brand */}
        <div className="sidebar-brand">
          <div className="logo">N</div>
          <div>
            <div className="name">NoQ</div>
            <div className="sub">Health Platform</div>
          </div>
          {/* Mobile close button inside sidebar */}
          <button
            className="sidebar-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Nav groups */}
        <nav className="sidebar-nav" role="navigation" aria-label="Main navigation">
          {visibleGroups.map(group => (
            <div key={group.group}>
              <div className="sidebar-section-title">{group.group}</div>
              {group.items.map(item => (
                <button
                  key={item.key}
                  className={`nav-item${route === item.key ? ' active' : ''}`}
                  onClick={() => handleNav(item.key)}
                  aria-current={route === item.key ? 'page' : undefined}
                >
                  <span className="nav-ic">
                    <Icon name={item.icon} size={17} />
                  </span>
                  <span>{item.label}</span>
                  {item.badge != null && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

      </aside>
    </>
  )
}
