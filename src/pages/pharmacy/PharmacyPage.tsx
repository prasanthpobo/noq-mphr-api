import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import { useAppStore } from '@/store/app'
import { pharmacyService } from '@/services/pharmacy.service'
import { toast } from '@/store/toast'

const FILTERS = ['All', 'pending', 'dispensed', 'partial', 'paid', 'cancelled']

function rxBadgeVariant(s: string) {
  if (s === 'dispensed') return 'success' as const
  if (s === 'paid')      return 'success' as const
  if (s === 'partial')   return 'warning' as const
  if (s === 'cancelled') return 'muted'   as const
  return 'info' as const
}

function statusLabel(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i}>
          <div style={{
            height: 14,
            borderRadius: 6,
            background: 'linear-gradient(90deg, var(--bg-section) 25%, var(--border-light) 50%, var(--bg-section) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
            width: '85%',
          }} />
        </td>
      ))}
    </tr>
  )
}

export default function PharmacyPage() {
  const { setRoute, setSelectedId } = useAppStore()
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('All')
  const [items, setItems]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (filter !== 'All') params.status = filter
      if (search.trim())    params.search  = search.trim()
      const res = await pharmacyService.list(params)
      setItems(res.data ?? [])
    } catch {
      toast.error('Failed to load pharmacy orders')
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  useEffect(() => { load() }, [load])

  const handleDispense = async (id: string) => {
    try {
      await pharmacyService.dispense(id)
      toast.success('Prescription dispensed')
      load()
    } catch {
      toast.error('Failed to dispense prescription')
    }
  }

  const pending   = items.filter(r => r.status === 'pending').length
  const dispensed = items.filter(r => r.status === 'dispensed').length
  const revenue   = items.filter(r => r.status === 'paid' || r.status === 'dispensed').reduce((sum, r) => sum + (r.paidAmount ?? r.finalAmount ?? 0), 0)

  const filtered = items.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q || (r.patientId?.name ?? '').toLowerCase().includes(q) || (r.orderId ?? '').toLowerCase().includes(q)
    return matchSearch
  })

  return (
    <>
      <Header
        title="Pharmacy"
        crumbs="Prescription dispensing & billing"
      />

      <div className="main">
        {/* KPI Stats */}
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <StatCard ic="pill"    tone="blue"  label="Pending Rx"       value={String(pending)}   foot="Awaiting dispensing" />
          <StatCard ic="check"   tone="mint"  label="Dispensed today"  value={String(dispensed)} foot="Successfully filled" />
          <StatCard ic="receipt" tone="amber" label="Revenue"
            value={`₹${revenue.toLocaleString('en-IN')}`}
            delta="+8%" up foot="Today's pharmacy revenue"
          />
        </div>

        {/* Results table */}
        <div className="table-card">
          <div className="table-toolbar">
            <div className="filters" style={{ flex: 1, flexWrap: 'wrap' }}>
              {FILTERS.map(f => (
                <button
                  key={f}
                  className={`chip ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'All' ? 'All' : statusLabel(f)}
                  <span className="count">{f === 'All' ? items.length : items.filter(r => r.status === f).length}</span>
                </button>
              ))}
            </div>
            <div className="table-search" style={{ flexShrink: 0 }}>
              <Icon name="search" size={15} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search patient…"
              />
            </div>
            <button
              className="btn btn-primary btn-sm"
              style={{ flexShrink: 0 }}
              onClick={() => { setSelectedId(null); setRoute('pharmacy-detail') }}
            >
              <Icon name="plus" size={14} /> New Rx
            </button>
          </div>
          <table className="data">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Order ID</th>
                <th>Appointment</th>
                <th>Doctor</th>
                <th>Medicines</th>
                <th>Rx Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--fg-muted)' }}>
                      <Icon name="pill" size={32} />
                      <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600 }}>No pharmacy orders found</div>
                      <div style={{ marginTop: 4, fontSize: 12 }}>Try adjusting your search or filter</div>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(r => (
                <tr key={r._id}>
                  <td>
                    <div className="cell-person">
                      <div className="av blue">
                        {(r.patientId?.name ?? 'UN').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="info">
                        <div className="n">{r.patientId?.name ?? 'Unknown'}</div>
                        <div className="s">{r.patientId?.phone ?? '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 600, color: 'var(--fg-primary)' }}>
                      {r.orderId ?? '—'}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2 }}>
                      {r.createdAt
                        ? `${new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · ${new Date(r.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`
                        : '—'}
                    </div>
                  </td>
                  <td>
                    {r.appointmentId ? (
                      <>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--fg-primary)' }}>
                          {String(r.appointmentId._id ?? r.appointmentId).slice(-8).toUpperCase()}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2 }}>
                          {(() => {
                            const dt = new Date(r.appointmentId.scheduledAt ?? r.appointmentId.date)
                            return isNaN(dt.getTime()) ? '—' :
                              `${dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} · ${dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`
                          })()}
                        </div>
                      </>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <div className="cell-person">
                      <div
                        className="av teal"
                        style={{ borderRadius: '50%', flexShrink: 0 }}
                      >
                        {(r.doctorId?.name ?? '').split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() || 'DR'}
                      </div>
                      <div className="info">
                        <div className="n">{r.doctorId?.name ?? '—'}</div>
                        <div className="s" style={{ fontFamily: 'var(--font-mono)' }}>
                          {r.doctorId?._id ? String(r.doctorId._id).slice(-8).toUpperCase() : '—'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>
                    {Array.isArray(r.medicines) ? r.medicines.map((m: any) => m.name ?? m).join(', ') : '-'}
                  </td>
                  <td>
                    <Badge variant={rxBadgeVariant(r.status)} dot>{statusLabel(r.status)}</Badge>
                  </td>
                  <td>
                    <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                      {r.status === 'pending' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleDispense(r._id)}
                        >
                          Dispense
                        </button>
                      )}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => { setSelectedId(r._id); setRoute('pharmacy-detail') }}
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
