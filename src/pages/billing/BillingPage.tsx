import { useState } from 'react'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import { useAppStore } from '@/store/app'
import { PATIENTS, DOCTORS } from '@/data'

type BillStatus = 'Pending' | 'Paid' | 'Partial'

const BILL_STATUSES: BillStatus[] = ['Pending', 'Paid', 'Partial', 'Paid', 'Pending', 'Partial', 'Paid', 'Pending', 'Paid', 'Partial']
const FILTERS = ['All', 'Pending', 'Paid', 'Partial']

function statusVariant(s: BillStatus) {
  if (s === 'Paid') return 'success' as const
  if (s === 'Partial') return 'warning' as const
  return 'danger' as const
}

function tokenFor(i: number): string {
  const letters = ['A', 'A', 'E', 'A', 'B', 'A', 'C', 'A', 'A', 'B']
  const nums = ['024', '025', '002', '026', '013', '027', '008', '022', '023', '011']
  return `${letters[i]}-${nums[i]}`
}

const AMOUNTS = ['₹1,200', '₹800', '₹3,400', '₹600', '₹2,100', '₹950', '₹1,600', '₹700', '₹1,800', '₹4,200']

export default function BillingPage() {
  const { setRoute } = useAppStore()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  const doctorName = (idx: number) => DOCTORS[idx % DOCTORS.length].name

  const rows = PATIENTS.map((p, i) => ({
    patient: p,
    doctor: doctorName(i),
    token: tokenFor(i),
    status: BILL_STATUSES[i],
    amount: AMOUNTS[i],
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
  const paid = rows.filter(r => r.status === 'Paid').length
  const partial = rows.filter(r => r.status === 'Partial').length

  return (
    <>
      <Header title="Billing" crumbs="Patient billing & invoices" />

      <div className="main">
        {/* KPI Stats */}
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <StatCard ic="receipt" tone="amber" label="Pending Bills" value={String(pending)} foot="Awaiting payment" />
          <StatCard ic="check" tone="mint" label="Paid Today" value={String(paid)} foot="Successfully collected" />
          <StatCard ic="activity" tone="blue" label="Partial Payments" value={String(partial)} foot="Partially settled" />
          <StatCard ic="receipt" tone="plum" label="Revenue" value="₹24,600" delta="+15%" up foot="Today's collections" />
        </div>

        {/* Hero search */}
        <div className="ops-hero" style={{ marginBottom: 20 }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Billing Management</div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>Search a patient to view and manage their bill</div>
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
                <th>Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--fg-muted)' }}>
                      <Icon name="receipt" size={32} />
                      <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600 }}>No patients found</div>
                      <div style={{ marginTop: 4, fontSize: 12 }}>Try adjusting your search or filter</div>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(r => (
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
                  <td style={{ fontWeight: 700, color: 'var(--teal-800)', fontSize: 13.5 }}>{r.amount}</td>
                  <td>
                    <Badge variant={statusVariant(r.status)} dot>{r.status}</Badge>
                  </td>
                  <td>
                    <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setRoute('billing-detail')}
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
