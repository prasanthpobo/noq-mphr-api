import { useState } from 'react'
import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import Badge, { UserStatusBadge } from '@/components/ui/Badge'
import Icon from '@/components/ui/Icon'
import { useAppStore } from '@/store/app'
import { CLINICS } from '@/data'

const STATUS_FILTERS = [
  { key:'all',      label:'All' },
  { key:'active',   label:'Active' },
  { key:'pending',  label:'Pending' },
  { key:'inactive', label:'Inactive' },
]

const TYPE_VARIANTS: Record<string,string> = {
  'Hospital':'indigo','Multi-specialty':'blue','Specialty':'pink','Polyclinic':'amber'
}

export default function ClinicList() {
  const { setRoute } = useAppStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = CLINICS.filter(c => {
    const q = search.toLowerCase()
    const matchQ = !q || c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)
    const matchS = statusFilter==='all' || c.status===statusFilter
    return matchQ && matchS
  })

  const total    = CLINICS.length
  const active   = CLINICS.filter(c=>c.status==='active').length
  const pending  = CLINICS.filter(c=>c.status==='pending').length
  const enrolled = CLINICS.reduce((sum,c)=>sum+c.doctors,0)
  const countOf  = (s:string) => CLINICS.filter(c=>c.status===s).length

  return (
    <div className="main">
      <Header
        title="Clinic management"
        crumbs={`${active} active · ${total} total`}
        onAdd={() => setRoute('clinic-new')}
        addLabel="Add clinic"
      />

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
            {filtered.map(c=>(
              <tr key={c.id}>
                <td>
                  <div className="cell-person">
                    <div className={`av ${c.tone}`}>{c.logo}</div>
                    <div className="info">
                      <div className="n">{c.name}</div>
                      <div className="s">★ {c.rating} · Est. {c.established}</div>
                    </div>
                  </div>
                </td>
                <td style={{fontFamily:'var(--font-mono)',fontSize:12}}>{c.id}</td>
                <td><Badge variant={(TYPE_VARIANTS[c.type]??'muted') as any}>{c.type}</Badge></td>
                <td style={{fontSize:12}}>{c.area}, {c.city}</td>
                <td>{c.doctors}</td>
                <td>{c.rooms}</td>
                <td style={{fontSize:12,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.hours}</td>
                <td><UserStatusBadge status={c.status}/></td>
                <td>
                  <div className="row-actions">
                    <button className="act" title="View" onClick={()=>setRoute('clinic-view')}><Icon name="eye" size={14}/></button>
                    <button className="act" title="Edit" onClick={()=>setRoute('clinic-edit')}><Icon name="edit" size={14}/></button>
                    <button className="act" title="More"><Icon name="more" size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length===0&&<tr><td colSpan={9} style={{textAlign:'center',padding:32,color:'var(--fg-muted)'}}>No clinics found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
