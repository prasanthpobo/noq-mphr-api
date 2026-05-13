import { useState } from 'react'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import { useAppStore } from '@/store/app'
import { PATIENTS, DOCTORS } from '@/data'
import type { Patient } from '@/types'

type RxStatus = 'Pending' | 'Dispensed' | 'Partial'

const RX_STATUSES: RxStatus[] = ['Pending', 'Dispensed', 'Partial', 'Pending', 'Dispensed', 'Pending', 'Partial', 'Dispensed', 'Pending', 'Dispensed']
const FILTERS = ['All', 'Pending', 'Dispensed', 'Partial']

function rxBadgeVariant(s: RxStatus) {
  if (s === 'Dispensed') return 'success' as const
  if (s === 'Partial') return 'warning' as const
  return 'info' as const
}

function tokenFor(i: number): string {
  const letters = ['A', 'A', 'E', 'A', 'B', 'A', 'C', 'A', 'A', 'B']
  const nums = ['024', '025', '002', '026', '013', '027', '008', '022', '023', '011']
  return `${letters[i]}-${nums[i]}`
}

export default function PharmacyPage() {
  const { setRoute } = useAppStore()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  const doctorName = (idx: number) => DOCTORS[idx % DOCTORS.length].name

  const rows = PATIENTS.map((p, i) => ({
    patient: p,
    doctor: doctorName(i),
    token: tokenFor(i),
    status: RX_STATUSES[i],
  }))

  const filtered = rows.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      r.patient.name.toLowerCase().includes(q) ||
      r.patient.id.toLowerCase().includes(q) ||
      r.patient.phone.includes(q)
    const matchFilter = filter === 'All' || r.status === filter
    return matchSearch && matchFilter
  })

  const pending = rows.filter(r => r.status === 'Pending').length
  const dispensed = rows.filter(r => r.status === 'Dispensed').length

  return (
    <>
      <Header title="Pharmacy" crumbs="Prescription dispensing & billing" />

      <div className="main">
        {/* KPI Stats */}
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <StatCard ic="pill" tone="blue" label="Pending Rx" value={String(pending)} foot="Awaiting dispensing" />
          <StatCard ic="check" tone="mint" label="Dispensed today" value={String(dispensed)} foot="Successfully filled" />
          <StatCard ic="receipt" tone="amber" label="Revenue" value="₹12,480" delta="+8%" up foot="Today's pharmacy revenue" />
        </div>

        {/* Hero search */}
        <div className="ops-hero" style={{ marginBottom: 20 }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Pharmacy Dispensing</div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>Search a patient to view and dispense their prescription</div>
          </div>
          <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto' }}>
            <Icon
              name="search"
              size={18}
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.7)' }}
            />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search patient by name, ID or phone..."
              style={{
                width: '100%',
                padding: '12px 14px 12px 44px',
                borderRadius: 12,
                border: '1.5px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                fontSize: 15,
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Filter chips */}
        <div className="filters" style={{ marginBottom: 16 }}>
          {FILTERS.map(f => (
            <button
              key={f}
              className={`chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
              <span className="count">{f === 'All' ? rows.length : rows.filter(r => r.status === f).length}</span>
            </button>
          ))}
        </div>

        {/* Results table */}
        <div className="table-card">
          <table className="data">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Patient ID</th>
                <th>Doctor</th>
                <th>Token</th>
                <th>Rx Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--fg-muted)' }}>
                      <Icon name="pill" size={32} />
                      <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600 }}>No patients found</div>
                      <div style={{ marginTop: 4, fontSize: 12 }}>Try adjusting your search or filter</div>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((r, i) => (
                <tr key={r.patient.id}>
                  <td>
                    <div className="cell-person">
                      <div className={`av ${r.patient.tone}`}>
                        {r.patient.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                      <div className="info">
                        <div className="n">{r.patient.name}</div>
                        <div className="s">{r.patient.age} · {r.patient.gender}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--fg-secondary)' }}>
                    {r.patient.id}
                  </td>
                  <td style={{ fontSize: 13.5, color: 'var(--fg-secondary)' }}>{r.doctor}</td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, background: 'var(--bg-section)', padding: '2px 8px', borderRadius: 6, color: 'var(--fg-primary)', fontWeight: 600 }}>
                      {r.token}
                    </span>
                  </td>
                  <td>
                    <Badge variant={rxBadgeVariant(r.status)} dot>{r.status}</Badge>
                  </td>
                  <td>
                    <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setRoute('pharmacy-detail')}
                      >
                        Open
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
