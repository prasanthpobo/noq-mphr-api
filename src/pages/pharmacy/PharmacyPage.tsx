import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import { useAppStore } from '@/store/app'
import { pharmacyService } from '@/services/pharmacy.service'
import { toast } from '@/store/toast'

const FILTERS = ['All', 'pending', 'dispensed', 'partial', 'cancelled']

function rxBadgeVariant(s: string) {
  if (s === 'dispensed') return 'success' as const
  if (s === 'partial')   return 'warning' as const
  return 'info' as const
}

function statusLabel(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
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

export default function PharmacyPage() {
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
  const revenue   = items.filter(r => r.status === 'dispensed').reduce((sum, r) => sum + (r.finalAmount ?? 0), 0)

  const filtered = items.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q || (r.patientId?.name ?? '').toLowerCase().includes(q) || (r.orderId ?? '').toLowerCase().includes(q)
    return matchSearch
  })

  return (
    <>
      <Header title="Pharmacy" crumbs="Prescription dispensing & billing" />

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
                  <td colSpan={6}>
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
