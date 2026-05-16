import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import Badge, { UserStatusBadge } from '@/components/ui/Badge'
import Icon from '@/components/ui/Icon'
import { useAppStore } from '@/store/app'
import { frontdeskService } from '@/services/frontdesk.service'
import { toast } from '@/store/toast'

const ROLE_VARIANTS: Record<string,string> = {
  'Lead receptionist':'indigo','Front desk admin':'brand','Senior receptionist':'blue',
  Receptionist:'muted',Trainee:'amber'
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

export default function FrontDeskList() {
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
      const data = await frontdeskService.list(params)
      setItems(data.data || [])
    } catch {
      setError('Failed to load front desk staff')
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
    if (!confirm('Delete this staff member?')) return
    try {
      await frontdeskService.remove(id)
      load(search)
      toast.success('Deleted successfully')
    } catch {
      setError('Failed to delete staff member')
      toast.error('Failed to delete')
    }
  }

  const filtered = items
  const total   = items.length
  const active  = items.filter(fd => fd.status === 'active').length
  const onLeave = items.filter(fd => fd.status === 'on-leave').length
  const clinics = new Set(items.map(fd => fd.clinic)).size

  return (
    <>
      <Header
        title="Front desk management"
        crumbs={`${active} active · ${total} total`}
      />

      <div className="main">
      <div className="stats-grid">
        <StatCard ic="user"     tone="blue"  label="Total staff"   value={String(total)}   foot="All front desk" />
        <StatCard ic="check"    tone="green" label="Active"        value={String(active)}  foot="On duty" accent />
        <StatCard ic="hourglass"tone="amber" label="On leave"      value={String(onLeave)} foot="Unavailable" />
        <StatCard ic="building" tone="indigo" label="Clinics"      value={String(clinics)} foot="Assigned clinics" />
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div className="table-search">
            <Icon name="search" size={15}/>
            <input placeholder="Search staff…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <button
            className="btn btn-primary btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={() => setRoute('fd-new')}
          >
            <Icon name="plus" size={14}/> Add staff
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', color: 'var(--danger-500)', fontSize: 13 }}>{error}</div>
        )}

        <table className="data">
          <thead>
            <tr>
              <th>Staff</th>
              <th>ID</th>
              <th>Role</th>
              <th>Clinic</th>
              <th>Shift</th>
              <th>Phone</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingSkeleton />
            ) : (
              filtered.map(fd=>(
                <tr key={fd._id || fd.id}>
                  <td>
                    <div className="cell-person">
                      <div
                        className={`av ${fd.tone || 'blue'}`}
                        style={{ borderRadius: '50%', flexShrink: 0 }}
                      >
                        {fd.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'FD'}
                      </div>
                      <div className="info">
                        <div className="n">{fd.name?.split(' ')[0] || '—'}</div>
                        <div className="s">{fd.name?.split(' ').slice(1).join(' ') || fd.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{fontFamily:'var(--font-mono)',fontSize:12}}>{fd._id || fd.id}</td>
                  <td><Badge variant={(ROLE_VARIANTS[fd.role]??'muted') as any}>{fd.role}</Badge></td>
                  <td style={{fontSize:12}}>{fd.clinic}</td>
                  <td style={{fontSize:12}}>{fd.shift}</td>
                  <td style={{fontSize:12}}>{fd.phone}</td>
                  <td><UserStatusBadge status={fd.status}/></td>
                  <td>
                    <div className="row-actions">
                      <button className="act" title="View" onClick={()=>{ setSelectedId(fd._id || fd.id); setRoute('fd-view') }}><Icon name="eye" size={14}/></button>
                      <button className="act" title="Edit" onClick={()=>{ setSelectedId(fd._id || fd.id); setRoute('fd-edit') }}><Icon name="edit" size={14}/></button>
                      <button className="act danger" title="Delete" onClick={() => handleDelete(fd._id || fd.id)}><Icon name="trash" size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            {!loading && filtered.length===0 && (
              <tr><td colSpan={8} style={{textAlign:'center',padding:32,color:'var(--fg-muted)'}}>No staff found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </>
  )
}
