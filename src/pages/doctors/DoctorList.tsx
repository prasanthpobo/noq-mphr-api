import { useState } from 'react'
import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import Icon from '@/components/ui/Icon'
import { useAppStore } from '@/store/app'
import { DOCTORS } from '@/data'
import type { Doctor } from '@/types'

type DocStatus = 'on' | 'busy' | 'leave'

function DocStatusBadge({ status }: { status: DocStatus }) {
  if (status === 'on')    return <Badge variant="success" dot>On duty</Badge>
  if (status === 'busy')  return <Badge variant="warning" dot>In room</Badge>
  return <Badge variant="gray" dot>On leave</Badge>
}

const DEPTS = ['All', 'OPD', 'Cardio', 'Derm', 'Peds', 'Gyn', 'Ortho']

export default function DoctorList() {
  const { setRoute } = useAppStore()
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'card' | 'table'>('card')
  const [dept, setDept] = useState('All')

  const filtered = DOCTORS.filter(d => {
    const q = search.toLowerCase()
    const matchQ = !q || d.name.toLowerCase().includes(q) || d.spec.toLowerCase().includes(q)
    const matchD = dept === 'All' || d.dept === dept
    return matchQ && matchD
  })

  const total   = DOCTORS.length
  const active  = DOCTORS.filter(d => d.status === 'on').length
  const onLeave = DOCTORS.filter(d => d.status === 'leave').length
  const specs   = new Set(DOCTORS.map(d => d.spec)).size

  return (
    <div className="main">
      <Header
        title="Doctor management"
        crumbs={`${active} active · ${total} total · ${onLeave} on leave`}
        onAdd={() => setRoute('doctor-new')}
        addLabel="Add doctor"
      />

      <div className="stats-grid">
        <StatCard ic="stethoscope" tone="blue"  label="Total doctors"   value={String(total)}  foot="Registered doctors" />
        <StatCard ic="check"       tone="green" label="Active"          value={String(active)} foot="Currently on duty" accent />
        <StatCard ic="hourglass"   tone="amber" label="On leave"        value={String(onLeave)} foot="Unavailable today" />
        <StatCard ic="activity"    tone="pink"  label="Specialties"     value={String(specs)}  foot="Unique specializations" />
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div className="table-search">
            <Icon name="search" size={15} />
            <input
              placeholder="Search by name or specialty…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="seg-ctrl" style={{ marginLeft: 'auto' }}>
            <button className={view === 'card' ? 'active' : ''} onClick={() => setView('card')}>
              <Icon name="dashboard" size={13} />
            </button>
            <button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}>
              <Icon name="sheet" size={13} />
            </button>
          </div>
          <div className="filters">
            {DEPTS.map(d => (
              <button key={d} className={`chip ${dept === d ? 'active' : ''}`} onClick={() => setDept(d)}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {view === 'card' ? (
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {filtered.map(doc => <DoctorCard key={doc.id} doc={doc} onView={() => setRoute('doctor-view')} onEdit={() => setRoute('doctor-edit')} />)}
            {filtered.length === 0 && <div style={{ gridColumn: '1/-1', padding: 32, textAlign: 'center', color: 'var(--fg-muted)' }}>No doctors found</div>}
          </div>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Specialty</th>
                <th>Room</th>
                <th>Today</th>
                <th>Fee</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => (
                <tr key={doc.id}>
                  <td>
                    <div className="cell-person">
                      <div className={`av ${doc.tone}`}>{doc.av}</div>
                      <div className="info">
                        <div className="n">{doc.name}</div>
                        <div className="s">{doc.exp} · {doc.dept}</div>
                      </div>
                    </div>
                  </td>
                  <td>{doc.spec}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{doc.room}</td>
                  <td>{doc.today}</td>
                  <td>₹{doc.fee}</td>
                  <td><DocStatusBadge status={doc.status} /></td>
                  <td>
                    <div className="row-actions">
                      <button className="act" title="View" onClick={() => setRoute('doctor-view')}><Icon name="eye" size={14} /></button>
                      <button className="act" title="Edit" onClick={() => setRoute('doctor-edit')}><Icon name="edit" size={14} /></button>
                      <button className="act danger" title="Delete"><Icon name="trash" size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function DoctorCard({ doc, onView, onEdit }: { doc: Doctor; onView: () => void; onEdit: () => void }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div className={`av xl ${doc.tone}`}>{doc.av}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{doc.name}</div>
          <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 2 }}>{doc.spec}</div>
          <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>{doc.exp} · {doc.room}</div>
        </div>
        <DocStatusBadge status={doc.status} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Today', value: doc.today },
          { label: 'Week', value: doc.week },
          { label: 'Rating', value: `★ ${doc.rating}` },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: 'var(--bg-section)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{kpi.value}</div>
            <div style={{ fontSize: 10, color: 'var(--fg-secondary)', marginTop: 2 }}>{kpi.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-secondary)' }}>₹{doc.fee} / consult</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-secondary btn-sm" onClick={onView}>View</button>
          <button className="btn btn-primary btn-sm" onClick={onEdit}>Edit</button>
        </div>
      </div>
    </div>
  )
}
