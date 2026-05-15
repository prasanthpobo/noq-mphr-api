import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import { useAppStore } from '@/store/app'
import { labService } from '@/services/lab.service'
import { toast } from '@/store/toast'

const FILTERS = ['All', 'pending', 'in-progress', 'completed', 'cancelled', 'paid']

function statusVariant(s: string) {
  if (s === 'completed')   return 'success'  as const
  if (s === 'paid')        return 'success'  as const
  if (s === 'in-progress') return 'blue'     as const
  if (s === 'cancelled')   return 'muted'    as const
  return 'warning' as const
}

function statusLabel(s: string) {
  if (s === 'in-progress') return 'In Progress'
  if (s === 'completed')   return 'Completed'
  if (s === 'paid')        return 'Paid'
  if (s === 'pending')     return 'Pending'
  if (s === 'cancelled')   return 'Cancelled'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function priorityVariant(p: string) {
  if (p === 'stat')   return 'danger'  as const
  if (p === 'urgent') return 'warning' as const
  return 'info' as const
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

export default function LabPage() {
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
      const res = await labService.list(params)
      setItems(res.data ?? [])
    } catch {
      toast.error('Failed to load lab orders')
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  useEffect(() => { load() }, [load])

  const handleCollect = async (id: string) => {
    try {
      await labService.collect(id)
      toast.success('Sample collected — order in progress')
      load()
    } catch {
      toast.error('Failed to collect sample')
    }
  }

  const pending    = items.filter(r => r.status === 'pending').length
  const inProgress = items.filter(r => r.status === 'in-progress').length
  const completed  = items.filter(r => r.status === 'completed').length
  const revenue    = items
    .filter(r => r.status === 'paid' || r.status === 'completed')
    .reduce((sum, r) => sum + (r.paidAmount ?? r.finalAmount ?? 0), 0)

  const filtered = items.filter(r => {
    const q = search.toLowerCase()
    return !q
      || (r.patientId?.name ?? '').toLowerCase().includes(q)
      || (r.orderId ?? '').toLowerCase().includes(q)
  })

  return (
    <>
      <Header title="Lab" crumbs="Diagnostic tests & results" />

      <div className="main">
        {/* KPI Stats */}
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <StatCard ic="flask"    tone="amber" label="Pending Tests" value={String(pending)}    foot="Awaiting collection" />
          <StatCard ic="activity" tone="blue"  label="In Progress"   value={String(inProgress)} foot="Being processed" />
          <StatCard ic="check"    tone="mint"  label="Results Ready"  value={String(completed)}  foot="Ready for review" />
          <StatCard ic="receipt"  tone="amber" label="Revenue"
            value={`₹${revenue.toLocaleString('en-IN')}`}
            delta="+6%" up foot="Today's lab revenue"
          />
        </div>

        {/* Table card */}
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
                  <span className="count">
                    {f === 'All' ? items.length : items.filter(r => r.status === f).length}
                  </span>
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
              onClick={() => { setSelectedId(null); setRoute('lab-detail') }}
            >
              <Icon name="plus" size={14} /> New Lab Order
            </button>
          </div>

          <table className="data">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Order ID</th>
                <th>Appointment</th>
                <th>Doctor</th>
                <th>Tests</th>
                <th>Priority</th>
                <th>Status</th>
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
                  <td colSpan={8}>
                    <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--fg-muted)' }}>
                      <Icon name="flask" size={32} />
                      <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600 }}>No lab orders found</div>
                      <div style={{ marginTop: 4, fontSize: 12 }}>Try adjusting your search or filter</div>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(r => (
                <tr key={r._id}>
                  {/* Patient */}
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

                  {/* Order ID + date */}
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

                  {/* Appointment */}
                  <td>
                    {r.appointmentId ? (
                      <>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--fg-primary)' }}>
                          {String(r.appointmentId._id ?? r.appointmentId).slice(-8).toUpperCase()}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2 }}>
                          {(() => {
                            const dt = new Date(r.appointmentId.date ?? '')
                            return isNaN(dt.getTime()) ? '—' :
                              `${dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} · ${r.appointmentId.time ?? ''}`
                          })()}
                        </div>
                      </>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>—</span>
                    )}
                  </td>

                  {/* Doctor */}
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

                  {/* Tests */}
                  <td style={{ fontSize: 12.5, color: 'var(--fg-secondary)', maxWidth: 180 }}>
                    {Array.isArray(r.tests) && r.tests.length > 0
                      ? r.tests.slice(0, 2).map((t: any) => t.name).join(', ') + (r.tests.length > 2 ? ` +${r.tests.length - 2}` : '')
                      : '—'}
                  </td>

                  {/* Priority */}
                  <td>
                    <Badge variant={priorityVariant(r.priority ?? 'routine')} dot>
                      {(r.priority ?? 'routine').charAt(0).toUpperCase() + (r.priority ?? 'routine').slice(1)}
                    </Badge>
                  </td>

                  {/* Status */}
                  <td>
                    <Badge variant={statusVariant(r.status)} dot>{statusLabel(r.status)}</Badge>
                  </td>

                  {/* Actions */}
                  <td>
                    <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                      {r.status === 'pending' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleCollect(r._id)}
                        >
                          Collect
                        </button>
                      )}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => { setSelectedId(r._id); setRoute('lab-detail') }}
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
