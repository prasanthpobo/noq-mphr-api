import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import Badge, { UserStatusBadge } from '@/components/ui/Badge'
import Icon from '@/components/ui/Icon'
import { useAppStore } from '@/store/app'
import { adminusersService } from '@/services/adminusers.service'
import { toast } from '@/store/toast'

const ROLE_VARIANTS: Record<string,string> = {
  'Super admin':'danger','Clinic admin':'blue','Billing admin':'amber',
  Operations:'mint','Compliance':'indigo','Reports analyst':'plum',
  'Support admin':'brand','Read-only':'gray'
}

function LoadingSkeleton() {
  return (
    <>
      {[1, 2, 3].map(i => (
        <tr key={i}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(j => (
            <td key={j}>
              <div style={{ height: 16, background: 'var(--bg-section)', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export default function AdminUserList() {
  const { setRoute, setSelectedId } = useAppStore()
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async (q?: string) => {
    try {
      setLoading(true)
      setError(null)
      const params: Record<string, string> = {}
      if (q) params.search = q
      const data = await adminusersService.list(params)
      setItems(data.data || [])
    } catch {
      setError('Failed to load admin users')
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const timer = setTimeout(() => load(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return
    try {
      await adminusersService.remove(id)
      load(search)
      toast.success('Deleted successfully')
    } catch {
      setError('Failed to delete user')
      toast.error('Failed to delete')
    }
  }

  const filtered = items
  const total   = items.length
  const active  = items.filter(u => u.status === 'active').length
  const with2FA = items.filter(u => u.twoFactor).length
  const roles   = new Set(items.map(u => u.role)).size

  return (
    <>
      <Header
        title="User management"
        crumbs={`${active} active · ${total} total`}
        onAdd={() => setRoute('admin-new')}
        addLabel="Add user"
      />

      <div className="main">
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

        {error && (
          <div style={{ padding: '12px 16px', color: 'var(--danger)', fontSize: 13 }}>{error}</div>
        )}

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
            {loading ? (
              <LoadingSkeleton />
            ) : (
              filtered.map(u=>(
                <tr key={u._id || u.id}>
                  <td>
                    <div className="cell-person">
                      <div className={`av ${u.tone}`}>{u.av}</div>
                      <div className="info">
                        <div className="n">{u.name}</div>
                        <div className="s">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{fontFamily:'var(--font-mono)',fontSize:12}}>{u._id || u.id}</td>
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
                      <button className="act" title="View" onClick={()=>{ setSelectedId(u._id || u.id); setRoute('admin-view') }}><Icon name="eye" size={14}/></button>
                      <button className="act" title="Edit" onClick={()=>{ setSelectedId(u._id || u.id); setRoute('admin-edit') }}><Icon name="edit" size={14}/></button>
                      <button className="act danger" title="Delete" onClick={() => handleDelete(u._id || u.id)}><Icon name="trash" size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            {!loading && filtered.length===0 && (
              <tr><td colSpan={8} style={{textAlign:'center',padding:32,color:'var(--fg-muted)'}}>No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </>
  )
}
