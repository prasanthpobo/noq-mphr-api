import { useState } from 'react'
import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import Badge, { PatientTagBadge } from '@/components/ui/Badge'
import Icon from '@/components/ui/Icon'
import { useAppStore } from '@/store/app'
import { PATIENTS } from '@/data'

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

export default function PatientList() {
  const { setRoute } = useAppStore()
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('all')

  const filtered = PATIENTS.filter(p => {
    const q = search.toLowerCase()
    const matchQ = !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
    const matchT = tagFilter === 'all' || p.tag === tagFilter
    return matchQ && matchT
  })

  const countOf = (t: string) => PATIENTS.filter(p => p.tag === t).length

  return (
    <div className="main">
      <Header
        title="Patient management"
        crumbs="1,284 total · 7 visited today"
        onAdd={() => setRoute('patient-new')}
        addLabel="Add patient"
      />

      <div className="stats-grid">
        <StatCard ic="users"    tone="blue"  label="Total patients"       value="1,284" foot="All registered patients" />
        <StatCard ic="activity" tone="green" label="Active this month"    value="412"   foot="Had visits in 30 days" accent />
        <StatCard ic="calendar" tone="amber" label="Follow-ups due"       value="38"    foot="Pending this week" />
        <StatCard ic="alert"    tone="red"   label="Critical watch"       value="7"     foot="Needs monitoring" />
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
        </div>

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
            {filtered.map(p => (
              <tr key={p.id}>
                <td>
                  <div className="cell-person">
                    <div className={`av ${p.tone}`}>{p.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
                    <div className="info">
                      <div className="n">{p.name}</div>
                      <div className="s">{p.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{fontFamily:'var(--font-mono)',fontSize:12}}>{p.id}</td>
                <td>{p.age} · {p.gender}</td>
                <td><Badge variant={(BG_VARIANTS[p.bg]??'muted') as any}>{p.bg}</Badge></td>
                <td style={{fontSize:12}}>{p.phone}</td>
                <td style={{fontSize:12}}>{p.last}</td>
                <td>{p.visits}</td>
                <td><PatientTagBadge tag={p.tag}/></td>
                <td>
                  <div className="row-actions">
                    <button className="act" title="View" onClick={()=>setRoute('patient-view')}><Icon name="eye" size={14}/></button>
                    <button className="act" title="Edit" onClick={()=>setRoute('patient-edit')}><Icon name="edit" size={14}/></button>
                    <button className="act" title="More"><Icon name="more" size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{textAlign:'center',padding:32,color:'var(--fg-muted)'}}>No patients found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
