import { useState } from 'react'
import Icon from '@/components/ui/Icon'
import { useAppStore } from '@/store/app'

interface HeaderProps {
  title: string
  crumbs?: string
  onAdd?: () => void
  addLabel?: string
}

export default function Header({ title, crumbs, onAdd, addLabel }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { setRoute, setLogoutOpen } = useAppStore()

  const goRoute = (k: string) => { setMenuOpen(false); setRoute(k) }
  const logout = () => { setMenuOpen(false); setLogoutOpen(true) }

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
          <div className="av blue">RA</div>
          <div className="who">
            <div className="n">Reena Aggarwal</div>
            <div className="r">Reception · Admin</div>
          </div>
          <Icon name="chevD" size={14} />
        </button>
        {menuOpen && (
          <>
            <div className="hu-backdrop" onClick={() => setMenuOpen(false)} />
            <div className="hu-menu">
              <div className="hu-head">
                <div className="av blue">RA</div>
                <div>
                  <div className="hu-n">Reena Aggarwal</div>
                  <div className="hu-r">reena.a@noqclinic.in</div>
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
