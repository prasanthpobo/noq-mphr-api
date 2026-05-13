import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import Badge, { UserStatusBadge } from '@/components/ui/Badge'
import Icon from '@/components/ui/Icon'
import { useAppStore } from '@/store/app'
import { clinicsService } from '@/services/clinics.service'
import { toast } from '@/store/toast'

const STATUS_FILTERS = [
  { key:'all',      label:'All' },
  { key:'active',   label:'Active' },
  { key:'pending',  label:'Pending' },
  { key:'inactive', label:'Inactive' },
]

const TYPE_VARIANTS: Record<string,string> = {
  'Hospital':'indigo','Multi-specialty':'blue','Specialty':'pink','Polyclinic':'amber'
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

export default function ClinicList() {
  const { setRoute, setSelectedId } = useAppStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async (q?: string, status?: string) => {
    try {
      setLoading(true)
      setError(null)
      const params: Record<string, string> = {}
      if (q) params.search = q
      if (status && status !== 'all') params.status = status
      const data = await clinicsService.list(params)
      setItems(data.data || [])
    } catch {
      setError('Failed to load clinics')
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const timer = setTimeout(() => load(search, statusFilter), 300)
    return () => clearTimeout(timer)
  }, [search, statusFilter])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this clinic?')) return
    try {
      await clinicsService.remove(id)
      load(search, statusFilter)
      toast.success('Deleted successfully')
    } catch {
      setError('Failed to delete clinic')
      toast.error('Failed to delete')
    }
  }

  const filtered  = items
  const total     = items.length
  const active    = items.filter(c => c.status === 'active').length
  const pending   = items.filter(c => c.status === 'pending').length
  const enrolled  = items.reduce((sum: number, c: any) => sum + (c.doctors || 0), 0)
  const countOf   = (s: string) => items.filter(c => c.status === s).length

  return (
    <>
      <Header
        title="Clinic management"
        crumbs={`${active} active · ${total} total`}
        onAdd={() => setRoute('clinic-new')}
        addLabel="Add clinic"
      />

      <div className="main">
      <div className="stats-grid">
        <StatCard ic="building"    tone="blue"  label="Total clinics"     value={String(total)}    foot="All registered" />
        <StatCard ic="check"       tone="green" label="Active"            value={String(active)}   foot="Operational" accent />
        <StatCard ic="hourglass"   tone="amber" label="Pending"           value={String(pending)}  foot="Awaiting approval" />
        <StatCard ic="stethoscope" tone="indigo" label="Doctors enrolled" value={String(enrolled)} foot="Across all clinics" />
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div className="table-search">
            <Icon name="search" size={15}/>
            <input placeholder="Search clinics…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <div className="filters">
            {STATUS_FILTERS.map(f=>(
              <button key={f.key} className={`chip${statusFilter===f.key?' active':''}`} onClick={()=>setStatusFilter(f.key)}>
                {f.label}
                {f.key!=='all'&&<span style={{marginLeft:4,opacity:.7,fontSize:11}}>{countOf(f.key)}</span>}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', color: 'var(--danger)', fontSize: 13 }}>{error}</div>
        )}

        <table className="data">
          <thead>
            <tr>
              <th>Clinic</th>
              <th>ID</th>
              <th>Type</th>
              <th>Location</th>
              <th>Doctors</th>
              <th>Rooms</th>
              <th>Hours</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingSkeleton />
            ) : (
              filtered.map(c=>(
                <tr key={c._id || c.id}>
                  <td>
                    <div className="cell-person">
                      <div className={`av ${c.tone}`}>{c.logo}</div>
                      <div className="info">
                        <div className="n">{c.name}</div>
                        <div className="s">★ {c.rating} · Est. {c.established}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{fontFamily:'var(--font-mono)',fontSize:12}}>{c._id || c.id}</td>
                  <td><Badge variant={(TYPE_VARIANTS[c.type]??'muted') as any}>{c.type}</Badge></td>
                  <td style={{fontSize:12}}>{c.area}, {c.city}</td>
                  <td>{c.doctors}</td>
                  <td>{c.rooms}</td>
                  <td style={{fontSize:12,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.hours}</td>
                  <td><UserStatusBadge status={c.status}/></td>
                  <td>
                    <div className="row-actions">
                      <button className="act" title="View" onClick={()=>{ setSelectedId(c._id || c.id); setRoute('clinic-view') }}><Icon name="eye" size={14}/></button>
                      <button className="act" title="Edit" onClick={()=>{ setSelectedId(c._id || c.id); setRoute('clinic-edit') }}><Icon name="edit" size={14}/></button>
                      <button className="act danger" title="Delete" onClick={() => handleDelete(c._id || c.id)}><Icon name="trash" size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            {!loading && filtered.length===0 && (
              <tr><td colSpan={9} style={{textAlign:'center',padding:32,color:'var(--fg-muted)'}}>No clinics found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </>
  )
}
