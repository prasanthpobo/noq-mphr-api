import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import Badge, { UserStatusBadge } from '@/components/ui/Badge'
import Icon from '@/components/ui/Icon'
import { useAppStore } from '@/store/app'
import { adminusersService } from '@/services/adminusers.service'
import { toast } from '@/store/toast'

const ROLE_VARIANTS: Record<string,string> = {
  super_admin:  'danger',
  clinic_admin: 'blue',
  doctor:       'indigo',
  nurse:        'pink',
  frontdesk:    'amber',
  pharmacist:   'mint',
  lab_tech:     'plum',
  patient:      'gray',
  user:         'gray',
}
const ROLE_LABEL: Record<string,string> = {
  super_admin:  'Super admin',
  clinic_admin: 'Clinic admin',
  doctor:       'Doctor',
  nurse:        'Nurse',
  frontdesk:    'Front desk',
  pharmacist:   'Pharmacist',
  lab_tech:     'Lab tech',
  patient:      'Patient',
  user:         'User',
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
  const admins  = items.filter(u => u.role === 'super_admin' || u.role === 'clinic_admin').length
  const roles   = new Set(items.map(u => u.role).filter(Boolean)).size

  return (
    <>
      <Header
        title="User management"
        crumbs={`${active} active · ${total} total`}
      />

      <div className="main">
      <div className="stats-grid">
        <StatCard ic="shield"   tone="blue"   label="Total users"  value={String(total)}   foot="Admin accounts" />
        <StatCard ic="check"    tone="green"  label="Active"       value={String(active)}  foot="Currently active" accent />
        <StatCard ic="shield"   tone="indigo" label="Admins"       value={String(admins)}  foot="Super + clinic admins" />
        <StatCard ic="users"    tone="purple" label="Roles"        value={String(roles)}   foot="Distinct roles" />
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div className="table-search">
            <Icon name="search" size={15}/>
            <input placeholder="Search users…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <button
            className="btn btn-primary btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={() => setRoute('admin-new')}
          >
            <Icon name="plus" size={14}/> Add user
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', color: 'var(--danger)', fontSize: 13 }}>{error}</div>
        )}

        <table className="data">
          <thead>
            <tr>
              <th>User</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Clinic</th>
              <th>Joined</th>
              <th>Status</th>
              <th style={{textAlign:'right'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingSkeleton />
            ) : (
              filtered.map(u=>{
                const id       = u._id || u.id
                const initials = (u.name || '').split(/\s+/).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'
                const clinic   = u.clinicId?.name || '—'
                const joined   = u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
                const roleLabel = ROLE_LABEL[u.role] ?? u.role ?? '—'
                return (
                  <tr key={id}>
                    <td>
                      <div className="cell-person">
                        <div className={`av ${u.tone || 'blue'}`} style={{ borderRadius: '50%', flexShrink: 0 }}>{initials}</div>
                        <div className="info">
                          <div className="n">{u.name || '—'}</div>
                          <div className="s">{u.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{fontSize:12, fontFamily:'var(--font-mono)'}}>{u.phone || '—'}</td>
                    <td><Badge variant={(ROLE_VARIANTS[u.role]??'muted') as any}>{roleLabel}</Badge></td>
                    <td style={{fontSize:12}}>{clinic}</td>
                    <td style={{fontSize:12}}>{joined}</td>
                    <td><UserStatusBadge status={u.status || 'active'}/></td>
                    <td>
                      <div className="row-actions" style={{justifyContent:'flex-end'}}>
                        <button className="act" title="View" onClick={()=>{ setSelectedId(id); setRoute('admin-view') }}><Icon name="eye" size={14}/></button>
                        <button className="act" title="Edit" onClick={()=>{ setSelectedId(id); setRoute('admin-edit') }}><Icon name="edit" size={14}/></button>
                        <button className="act danger" title="Delete" onClick={() => handleDelete(id)}><Icon name="trash" size={14}/></button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
            {!loading && filtered.length===0 && (
              <tr><td colSpan={7} style={{textAlign:'center',padding:32,color:'var(--fg-muted)'}}>No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </>
  )
}
