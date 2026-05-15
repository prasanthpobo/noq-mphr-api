import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import Badge, { PatientTagBadge } from '@/components/ui/Badge'
import Icon from '@/components/ui/Icon'
import Pagination from '@/components/ui/Pagination'
import { useAppStore } from '@/store/app'
import { patientsService } from '@/services/patients.service'

const PAGE_SIZE = 12

const TAG_FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'active',    label: 'Active' },
  { key: 'follow-up', label: 'Follow-up' },
  { key: 'critical',  label: 'Critical' },
  { key: 'new',       label: 'New' },
]

const BG_VARIANTS: Record<string, string> = {
  'O+':'success','O-':'green','A+':'blue','A-':'blue','B+':'amber','B-':'amber','AB+':'brand','AB-':'brand'
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

export default function PatientList() {
  const { setRoute, setSelectedId } = useAppStore()
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('all')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const load = async (q?: string, tag?: string) => {
    try {
      setLoading(true)
      setError(null)
      const params: Record<string, string> = {}
      if (q) params.search = q
      if (tag && tag !== 'all') params.tag = tag
      const data = await patientsService.list(params)
      setItems(data.data || [])
    } catch {
      setError('Failed to load patients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    setPage(1)
    const timer = setTimeout(() => load(search, tagFilter), 300)
    return () => clearTimeout(timer)
  }, [search, tagFilter])

  const countOf = (t: string) => items.filter(p => p.tag === t).length
  const filtered  = items
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <>
      <Header
        title="Patient management"
        crumbs={`${items.length} total`}
      />

      <div className="main">
      <div className="stats-grid">
        <StatCard ic="users"    tone="blue"  label="Total patients"       value={String(items.length)} foot="All registered patients" />
        <StatCard ic="activity" tone="green" label="Active this month"    value={String(items.filter(p => p.tag === 'active').length)}   foot="Had visits in 30 days" accent />
        <StatCard ic="calendar" tone="amber" label="Follow-ups due"       value={String(countOf('follow-up'))}    foot="Pending this week" />
        <StatCard ic="alert"    tone="red"   label="Critical watch"       value={String(countOf('critical'))}     foot="Needs monitoring" />
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div className="table-search">
            <Icon name="search" size={15}/>
            <input
              placeholder="Search patients…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="filters">
            {TAG_FILTERS.map(f => (
              <button
                key={f.key}
                className={`chip${tagFilter === f.key ? ' active' : ''}`}
                onClick={() => setTagFilter(f.key)}
              >
                {f.label}
                {f.key !== 'all' && (
                  <span style={{marginLeft:4,opacity:.7,fontSize:11}}>
                    {countOf(f.key)}
                  </span>
                )}
              </button>
            ))}
          </div>
          <button
            className="btn btn-primary btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={() => setRoute('patient-new')}
          >
            <Icon name="plus" size={14}/> Add patient
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', color: 'var(--danger-500)', fontSize: 13 }}>{error}</div>
        )}

        <table className="data">
          <thead>
            <tr>
              <th>Patient</th>
              <th>ID</th>
              <th>Age / Sex</th>
              <th>Blood group</th>
              <th>Phone</th>
              <th>Last visit</th>
              <th>Visits</th>
              <th>Tag</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingSkeleton />
            ) : (
              paginated.map(p => (
                <tr key={p._id || p.id}>
                  <td>
                    <div className="cell-person">
                      <div className={`av ${p.tone}`}>{p.name.split(' ').map((w: string) => w[0]).join('').slice(0,2)}</div>
                      <div className="info">
                        <div className="n">{p.name}</div>
                        <div className="s">{p.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{fontFamily:'var(--font-mono)',fontSize:12}}>{p._id || p.id}</td>
                  <td>{p.age} · {p.gender}</td>
                  <td><Badge variant={(BG_VARIANTS[p.bg]??'muted') as any}>{p.bg}</Badge></td>
                  <td style={{fontSize:12}}>{p.phone}</td>
                  <td style={{fontSize:12}}>{p.last}</td>
                  <td>{p.visits}</td>
                  <td><PatientTagBadge tag={p.tag}/></td>
                  <td>
                    <div className="row-actions">
                      <button className="act" title="View" onClick={() => { setSelectedId(p._id || p.id); setRoute('patient-view') }}><Icon name="eye" size={14}/></button>
                      <button className="act" title="Edit" onClick={() => { setSelectedId(p._id || p.id); setRoute('patient-edit') }}><Icon name="edit" size={14}/></button>
                      <button className="act" title="More"><Icon name="more" size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={9} style={{textAlign:'center',padding:32,color:'var(--fg-muted)'}}>No patients found</td></tr>
            )}
          </tbody>
        </table>
        <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>
      </div>
    </>
  )
}
