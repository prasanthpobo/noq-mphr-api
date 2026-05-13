import { useState, useEffect, useCallback, useRef } from 'react'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import { useAppStore } from '@/store/app'
import { billingService } from '@/services/billing.service'
import { toast } from '@/store/toast'

const FILTERS = ['All', 'pending', 'paid', 'partial', 'cancelled']

function statusVariant(s: string) {
  if (s === 'paid')    return 'success' as const
  if (s === 'partial') return 'warning' as const
  return 'danger' as const
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

export default function BillingPage() {
  const { setRoute } = useAppStore()
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('All')
  const [items, setItems]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const debounceRef           = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async (searchVal: string, filterVal: string) => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (searchVal.trim()) params.search = searchVal.trim()
      if (filterVal !== 'All') params.status = filterVal
      const res = await billingService.list(params)
      setItems(res.data ?? [])
    } catch {
      toast.error('Failed to load billing records')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(search, filter) }, [filter, load])

  const handleSearch = (v: string) => {
    setSearch(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => load(v, filter), 300)
  }

  const pending  = items.filter(r => r.status === 'pending').length
  const paid     = items.filter(r => r.status === 'paid').length
  const partial  = items.filter(r => r.status === 'partial').length
  const revenue  = items.filter(r => r.status === 'paid').reduce((sum, r) => sum + (r.total ?? 0), 0)

  const filtered = items.filter(r => {
    return filter === 'All' || r.status === filter
  })

  return (
    <>
      <Header title="Billing" crumbs="Patient billing & invoices" />

      <div className="main">
        {/* KPI Stats */}
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <StatCard ic="receipt"  tone="amber" label="Pending Bills"      value={String(pending)} foot="Awaiting payment" />
          <StatCard ic="check"    tone="mint"  label="Paid Today"         value={String(paid)}    foot="Successfully collected" />
          <StatCard ic="activity" tone="blue"  label="Partial Payments"   value={String(partial)} foot="Partially settled" />
          <StatCard ic="receipt"  tone="plum"  label="Revenue"
            value={`₹${revenue.toLocaleString('en-IN')}`}
            delta="+15%" up foot="Today's collections"
          />
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
              onChange={e => handleSearch(e.target.value)}
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
                <th>Invoice #</th>
                <th>Doctor</th>
                <th>Amount</th>
                <th>Paid</th>
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
                  <td colSpan={7}>
                    <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--fg-muted)' }}>
                      <Icon name="receipt" size={32} />
                      <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600 }}>No billing records found</div>
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
                    {r.invoiceNumber ?? '-'}
                  </td>
                  <td style={{ fontSize: 13.5, color: 'var(--fg-secondary)' }}>
                    {r.doctorId?.name ?? '-'}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--teal-800)', fontSize: 13.5 }}>
                    ₹{(r.total ?? 0).toLocaleString('en-IN')}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>
                    ₹{(r.paidAmount ?? 0).toLocaleString('en-IN')}
                  </td>
                  <td>
                    <Badge variant={statusVariant(r.status)} dot>{statusLabel(r.status)}</Badge>
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
