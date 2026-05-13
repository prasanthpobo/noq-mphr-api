import { useState } from 'react'
import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import Badge, { UserStatusBadge } from '@/components/ui/Badge'
import Icon from '@/components/ui/Icon'
import { useAppStore } from '@/store/app'
import { FRONT_DESK } from '@/data'

const ROLE_VARIANTS: Record<string,string> = {
  'Lead receptionist':'indigo','Front desk admin':'brand','Senior receptionist':'blue',
  Receptionist:'muted',Trainee:'amber'
}

export default function FrontDeskList() {
  const { setRoute } = useAppStore()
  const [search, setSearch] = useState('')

  const filtered = FRONT_DESK.filter(fd=>{
    const q = search.toLowerCase()
    return !q || fd.name.toLowerCase().includes(q) || fd.id.toLowerCase().includes(q) || fd.role.toLowerCase().includes(q)
  })

  const total   = FRONT_DESK.length
  const active  = FRONT_DESK.filter(fd=>fd.status==='active').length
  const onLeave = FRONT_DESK.filter(fd=>fd.status==='on-leave').length
  const clinics = new Set(FRONT_DESK.map(fd=>fd.clinic)).size

  return (
    <div className="main">
      <Header
        title="Front desk management"
        crumbs={`${active} active · ${total} total`}
        onAdd={() => setRoute('fd-new')}
        addLabel="Add staff"
      />

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
        </div>

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
            {filtered.map(fd=>(
              <tr key={fd.id}>
                <td>
                  <div className="cell-person">
                    <div className={`av ${fd.tone}`}>{fd.av}</div>
                    <div className="info">
                      <div className="n">{fd.name}</div>
                      <div className="s">{fd.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{fontFamily:'var(--font-mono)',fontSize:12}}>{fd.id}</td>
                <td><Badge variant={(ROLE_VARIANTS[fd.role]??'muted') as any}>{fd.role}</Badge></td>
                <td style={{fontSize:12}}>{fd.clinic}</td>
                <td style={{fontSize:12}}>{fd.shift}</td>
                <td style={{fontSize:12}}>{fd.phone}</td>
                <td><UserStatusBadge status={fd.status}/></td>
                <td>
                  <div className="row-actions">
                    <button className="act" title="View" onClick={()=>setRoute('fd-view')}><Icon name="eye" size={14}/></button>
                    <button className="act" title="Edit" onClick={()=>setRoute('fd-edit')}><Icon name="edit" size={14}/></button>
                    <button className="act" title="More"><Icon name="more" size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length===0&&<tr><td colSpan={8} style={{textAlign:'center',padding:32,color:'var(--fg-muted)'}}>No staff found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
