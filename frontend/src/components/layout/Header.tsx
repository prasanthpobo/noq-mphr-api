import { useState } from 'react'
import Icon from '@/components/ui/Icon'
import { useAppStore } from '@/store/app'
import { useAuthStore } from '@/store/auth'

interface HeaderProps {
  title: string
  crumbs?: string
  onAdd?: () => void
  addLabel?: string
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const ROLE_LABELS: Record<string, string> = {
  super_admin:  'Super Admin',
  clinic_admin: 'Clinic Admin',
  doctor:       'Doctor',
  nurse:        'Nurse',
  frontdesk:    'Front Desk',
  pharmacist:   'Pharmacist',
  lab_tech:     'Lab Tech',
}

export default function Header({ title, crumbs, onAdd, addLabel }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { setRoute, setLogoutOpen } = useAppStore()
  const user = useAuthStore(s => s.user)

  const displayName = user?.name ?? 'User'
  const displayRole = user ? (ROLE_LABELS[user.role] ?? user.role) : ''
  const initials    = user ? getInitials(user.name) : '?'

  const goRoute = (k: string) => { setMenuOpen(false); setRoute(k) }
  const logout  = () => { setMenuOpen(false); setLogoutOpen(true) }

  return (
    <header className="header">
      <div>
        <h1>{title}</h1>
        {crumbs && <div className="crumbs">{crumbs}</div>}
      </div>
      <div className="header-spacer" />
      <div className="header-search">
        <Icon name="search" size={16} />
        <input placeholder="Search patients, tokens, doctors…" />
        <kbd>⌘K</kbd>
      </div>
      <button className="icon-btn" title="Notifications">
        <Icon name="bell" size={18} />
        <span className="dot" />
      </button>
      {onAdd && (
        <button className="btn btn-primary" onClick={onAdd}>
          <Icon name="plus" size={15} />
          {addLabel}
        </button>
      )}
      <div className="header-user-wrap">
        <button
          className={`header-user ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
        >
          <div className="av blue">{initials}</div>
          <div className="who">
            <div className="n">{displayName}</div>
            <div className="r">{displayRole}</div>
          </div>
          <Icon name="chevD" size={14} />
        </button>
        {menuOpen && (
          <>
            <div className="hu-backdrop" onClick={() => setMenuOpen(false)} />
            <div className="hu-menu">
              <div className="hu-head">
                <div className="av blue">{initials}</div>
                <div>
                  <div className="hu-n">{displayName}</div>
                  <div className="hu-r">{user?.email ?? ''}</div>
                </div>
              </div>
              <button className="hu-item" onClick={() => goRoute('profile')}>
                <Icon name="user" size={15} /> My profile
              </button>
              <button className="hu-item" onClick={() => goRoute('settings')}>
                <Icon name="settings" size={15} /> Settings
              </button>
              <button className="hu-item" onClick={() => goRoute('support')}>
                <Icon name="bell" size={15} /> Support tickets
              </button>
              <div className="hu-sep" />
              <button className="hu-item danger" onClick={logout}>
                <Icon name="log" size={15} /> Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
