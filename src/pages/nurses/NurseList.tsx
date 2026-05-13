import { useState } from 'react'
import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import Badge, { UserStatusBadge } from '@/components/ui/Badge'
import Icon from '@/components/ui/Icon'
import { useAppStore } from '@/store/app'
import { NURSES } from '@/data'

const ROLE_VARIANTS: Record<string,string> = {
  'Head nurse':'pink','Charge nurse':'plum','Senior nurse':'blue',
  'Staff nurse':'muted','Trainee nurse':'amber'
}

export default function NurseList() {
  const { setRoute } = useAppStore()
  const [search, setSearch] = useState('')

  const filtered = NURSES.filter(n=>{
    const q = search.toLowerCase()
    return !q||n.name.toLowerCase().includes(q)||n.id.toLowerCase().includes(q)||n.dept.toLowerCase().includes(q)
  })

  const total   = NURSES.length
  const active  = NURSES.filter(n=>n.status==='active').length
  const onLeave = NURSES.filter(n=>n.status==='on-leave').length
  const depts   = new Set(NURSES.map(n=>n.dept)).size

  return (
    <div className="main">
      <Header
        title="Nurse management"
        crumbs={`${active} active · ${total} total`}
        onAdd={() => setRoute('nurse-new')}
        addLabel="Add nurse"
      />

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
        </div>

        <table className="data">
          <thead>
            <tr>
              <th>Nurse</th>
              <th>ID</th>
              <th>Role</th>
              <th>Department</th>
              <th>Ward</th>
              <th>Clinic</th>
              <th>Shift</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(n=>(
              <tr key={n.id}>
                <td>
                  <div className="cell-person">
                    <div className={`av ${n.tone}`}>{n.av}</div>
                    <div className="info">
                      <div className="n">{n.name}</div>
                      <div className="s">{n.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{fontFamily:'var(--font-mono)',fontSize:12}}>{n.id}</td>
                <td><Badge variant={(ROLE_VARIANTS[n.role]??'muted') as any}>{n.role}</Badge></td>
                <td style={{fontSize:12}}>{n.dept}</td>
                <td style={{fontFamily:'var(--font-mono)',fontSize:12}}>{n.ward}</td>
                <td style={{fontSize:12}}>{n.clinic}</td>
                <td style={{fontSize:12}}>{n.shift}</td>
                <td><UserStatusBadge status={n.status}/></td>
                <td>
                  <div className="row-actions">
                    <button className="act" title="View" onClick={()=>setRoute('nurse-view')}><Icon name="eye" size={14}/></button>
                    <button className="act" title="Edit" onClick={()=>setRoute('nurse-edit')}><Icon name="edit" size={14}/></button>
                    <button className="act" title="More"><Icon name="more" size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length===0&&<tr><td colSpan={9} style={{textAlign:'center',padding:32,color:'var(--fg-muted)'}}>No nurses found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
