import { useState } from 'react'
import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import Badge, { UserStatusBadge } from '@/components/ui/Badge'
import Icon from '@/components/ui/Icon'
import { useAppStore } from '@/store/app'
import { ADMIN_USERS } from '@/data'

const ROLE_VARIANTS: Record<string,string> = {
  'Super admin':'danger','Clinic admin':'blue','Billing admin':'amber',
  Operations:'mint','Compliance':'indigo','Reports analyst':'plum',
  'Support admin':'brand','Read-only':'gray'
}

export default function AdminUserList() {
  const { setRoute } = useAppStore()
  const [search, setSearch] = useState('')

  const filtered = ADMIN_USERS.filter(u=>{
    const q = search.toLowerCase()
    return !q||u.name.toLowerCase().includes(q)||u.id.toLowerCase().includes(q)||u.role.toLowerCase().includes(q)
  })

  const total   = ADMIN_USERS.length
  const active  = ADMIN_USERS.filter(u=>u.status==='active').length
  const with2FA = ADMIN_USERS.filter(u=>u.twoFactor).length
  const roles   = new Set(ADMIN_USERS.map(u=>u.role)).size

  return (
    <div className="main">
      <Header
        title="User management"
        crumbs={`${active} active · ${total} total`}
        onAdd={() => setRoute('admin-new')}
        addLabel="Add user"
      />

      <div className="stats-grid">
        <StatCard ic="shield"   tone="blue"   label="Total users"  value={String(total)}   foot="Admin accounts" />
        <StatCard ic="check"    tone="green"  label="Active"       value={String(active)}  foot="Currently active" accent />
        <StatCard ic="lock"     tone="indigo" label="2FA enabled"  value={String(with2FA)} foot="Secured accounts" />
        <StatCard ic="users"    tone="purple" label="Roles"        value={String(roles)}   foot="Distinct roles" />
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div className="table-search">
            <Icon name="search" size={15}/>
            <input placeholder="Search users…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
        </div>

        <table className="data">
          <thead>
            <tr>
              <th>User</th>
              <th>ID</th>
              <th>Role</th>
              <th>Scope</th>
              <th>Last login</th>
              <th>2FA</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u=>(
              <tr key={u.id}>
                <td>
                  <div className="cell-person">
                    <div className={`av ${u.tone}`}>{u.av}</div>
                    <div className="info">
                      <div className="n">{u.name}</div>
                      <div className="s">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{fontFamily:'var(--font-mono)',fontSize:12}}>{u.id}</td>
                <td><Badge variant={(ROLE_VARIANTS[u.role]??'muted') as any}>{u.role}</Badge></td>
                <td style={{fontSize:12}}>{u.scope}</td>
                <td style={{fontSize:12}}>{u.lastLogin}</td>
                <td>
                  {u.twoFactor
                    ? <Badge variant="success" dot>On</Badge>
                    : <Badge variant="gray" dot>Off</Badge>
                  }
                </td>
                <td><UserStatusBadge status={u.status}/></td>
                <td>
                  <div className="row-actions">
                    <button className="act" title="View" onClick={()=>setRoute('admin-view')}><Icon name="eye" size={14}/></button>
                    <button className="act" title="Edit" onClick={()=>setRoute('admin-edit')}><Icon name="edit" size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length===0&&<tr><td colSpan={8} style={{textAlign:'center',padding:32,color:'var(--fg-muted)'}}>No users found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
