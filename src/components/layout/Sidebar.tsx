import Icon from '@/components/ui/Icon'
import { useAppStore } from '@/store/app'
import { NAV } from '@/data'

export default function Sidebar() {
  const { route, setRoute, setLogoutOpen } = useAppStore()

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
          <div className="av blue">RA</div>
          <div className="who">
            <div className="n">Reena Aggarwal</div>
            <div className="r">Reception · Admin</div>
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
