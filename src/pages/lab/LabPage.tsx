import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import { useAppStore } from '@/store/app'
import { labService } from '@/services/lab.service'
import { toast } from '@/store/toast'

const FILTERS = ['All', 'pending', 'in-progress', 'completed', 'cancelled']

function statusVariant(s: string) {
  if (s === 'completed')  return 'success' as const
  if (s === 'in-progress') return 'blue' as const
  return 'warning' as const
}

function statusLabel(s: string) {
  if (s === 'in-progress') return 'In Progress'
  if (s === 'completed')   return 'Completed'
  if (s === 'pending')     return 'Pending'
  if (s === 'cancelled')   return 'Cancelled'
  return s
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
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
  const { setRoute } = useAppStore()
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

  const pending    = items.filter(r => r.status === 'pending').length
  const inProgress = items.filter(r => r.status === 'in-progress').length
  const completed  = items.filter(r => r.status === 'completed').length

  const filtered = items.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q || (r.patientId?.name ?? '').toLowerCase().includes(q) || (r.orderId ?? '').toLowerCase().includes(q)
    return matchSearch
  })

  return (
    <>
      <Header title="Lab" crumbs="Diagnostic tests & results" />

      <div className="main">
        {/* KPI Stats */}
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <StatCard ic="flask"    tone="amber" label="Pending Tests"  value={String(pending)}    foot="Awaiting collection" />
          <StatCard ic="activity" tone="blue"  label="In Progress"    value={String(inProgress)} foot="Being processed" />
          <StatCard ic="check"    tone="mint"  label="Results Ready"  value={String(completed)}  foot="Ready for review" />
        </div>

        {/* Hero search */}
        <div className="ops-hero" style={{ marginBottom: 20 }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Lab Test Management</div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>Search a patient to view and manage their lab tests</div>
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
              {f === 'All' ? 'All' : statusLabel(f)}
              <span className="count">{f === 'All' ? items.length : items.filter(r => r.status === f).length}</span>
            </button>
          ))}
        </div>

        {/* Results table */}
        <div className="table-card">
          <table className="data">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Order ID</th>
                <th>Doctor</th>
                <th>Tests</th>
                <th>Test Status</th>
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
                  <td colSpan={6}>
                    <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--fg-muted)' }}>
                      <Icon name="flask" size={32} />
                      <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600 }}>No lab orders found</div>
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
                        <div className="s">{r.patientId?._id ?? ''}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--fg-secondary)' }}>
                    {r.orderId ?? '-'}
                  </td>
                  <td style={{ fontSize: 13.5, color: 'var(--fg-secondary)' }}>
                    {r.doctorId?.name ?? '-'}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>
                    {Array.isArray(r.tests) ? r.tests.map((t: any) => t.name ?? t).join(', ') : '-'}
                  </td>
                  <td>
                    <Badge variant={statusVariant(r.status)} dot>{statusLabel(r.status)}</Badge>
                  </td>
                  <td>
                    <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setRoute('lab-detail')}
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
