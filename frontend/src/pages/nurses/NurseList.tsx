import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import Badge, { UserStatusBadge } from '@/components/ui/Badge'
import Icon from '@/components/ui/Icon'
import { useAppStore } from '@/store/app'
import { nursesService } from '@/services/nurses.service'
import { toast } from '@/store/toast'

const ROLE_VARIANTS: Record<string,string> = {
  'Head nurse':'pink','Charge nurse':'plum','Senior nurse':'blue',
  'Staff nurse':'muted','Trainee nurse':'amber'
}

function LoadingSkeleton() {
  return (
    <>
      {[1, 2, 3].map(i => (
        <tr key={i}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(j => (
            <td key={j}>
              <div style={{ height: 16, background: 'var(--bg-section)', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export default function NurseList() {
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
      const data = await nursesService.list(params)
      setItems(data.data || [])
    } catch {
      setError('Failed to load nurses')
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
    if (!confirm('Delete this nurse?')) return
    try {
      await nursesService.remove(id)
      load(search)
      toast.success('Deleted successfully')
    } catch {
      setError('Failed to delete nurse')
      toast.error('Failed to delete')
    }
  }

  const filtered = items
  const total   = items.length
  const active  = items.filter(n => n.status === 'active').length
  const onLeave = items.filter(n => n.status === 'on-leave').length
  const depts   = new Set(items.flatMap(n => n.departments ?? []).filter(Boolean)).size

  return (
    <>
      <Header
        title="Nurse management"
        crumbs={`${active} active · ${total} total`}
      />

      <div className="main">
      <div className="stats-grid">
        <StatCard ic="heart"    tone="pink"  label="Total nurses"  value={String(total)}   foot="All nursing staff" />
        <StatCard ic="check"    tone="green" label="Active"        value={String(active)}  foot="On duty" accent />
        <StatCard ic="hourglass"tone="amber" label="On leave"      value={String(onLeave)} foot="Unavailable today" />
        <StatCard ic="activity" tone="plum"  label="Departments"   value={String(depts)}   foot="Departments covered" />
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div className="table-search">
            <Icon name="search" size={15}/>
            <input placeholder="Search nurses…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <button
            className="btn btn-primary btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={() => setRoute('nurse-new')}
          >
            <Icon name="plus" size={14}/> Add nurse
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', color: 'var(--danger-500)', fontSize: 13 }}>{error}</div>
        )}

        <table className="data">
          <thead>
            <tr>
              <th>Nurse</th>
              <th>Employee ID</th>
              <th>Role</th>
              <th>Department</th>
              <th>Ward</th>
              <th>Clinic</th>
              <th>Shift</th>
              <th>Status</th>
              <th style={{textAlign:'right'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingSkeleton />
            ) : (
              filtered.map(n=>{
                const id       = n._id || n.id
                const initials = (n.name || '').split(/\s+/).map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() || 'NR'
                const role     = n.role || 'Staff nurse'
                const depts    = Array.isArray(n.departments) ? n.departments.join(', ') : '—'
                const clinic   = n.clinicId?.name || '—'
                const empId    = n.employeeId || String(id).slice(-6).toUpperCase()
                return (
                  <tr key={id}>
                    <td>
                      <div className="cell-person">
                        <div className={`av ${n.tone || 'pink'}`} style={{ borderRadius: '50%', flexShrink: 0 }}>{initials}</div>
                        <div className="info">
                          <div className="n">{n.name || '—'}</div>
                          <div className="s">{n.email || n.phone || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{fontFamily:'var(--font-mono)',fontSize:12}}>{empId}</td>
                    <td><Badge variant={(ROLE_VARIANTS[role]??'muted') as any}>{role}</Badge></td>
                    <td style={{fontSize:12}}>{depts}</td>
                    <td style={{fontFamily:'var(--font-mono)',fontSize:12}}>{n.ward || '—'}</td>
                    <td style={{fontSize:12}}>{clinic}</td>
                    <td style={{fontSize:12, textTransform:'capitalize'}}>{n.shift || '—'}</td>
                    <td><UserStatusBadge status={n.status || 'active'}/></td>
                    <td>
                      <div className="row-actions" style={{justifyContent:'flex-end'}}>
                        <button className="act" title="View" onClick={()=>{ setSelectedId(id); setRoute('nurse-view') }}><Icon name="eye" size={14}/></button>
                        <button className="act" title="Edit" onClick={()=>{ setSelectedId(id); setRoute('nurse-edit') }}><Icon name="edit" size={14}/></button>
                        <button className="act danger" title="Delete" onClick={() => handleDelete(id)}><Icon name="trash" size={14}/></button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
            {!loading && filtered.length===0 && (
              <tr><td colSpan={9} style={{textAlign:'center',padding:32,color:'var(--fg-muted)'}}>No nurses found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </>
  )
}
