import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import { useAppStore } from '@/store/app'
import { labService } from '@/services/lab.service'
import { toast } from '@/store/toast'

// ─── Types ────────────────────────────────────────────────────────────────────

type PayStatus = 'unpaid' | 'partial' | 'paid' | 'cancelled'
type PayMethod = 'Cash' | 'UPI' | 'Card' | 'Insurance'

const PAY_METHODS: PayMethod[] = ['Cash', 'UPI', 'Card', 'Insurance']
const FILTERS = ['All', 'unpaid', 'partial', 'paid', 'cancelled'] as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPayStatus(r: any): PayStatus {
  if (r.status === 'cancelled') return 'cancelled'
  const paid  = r.paidAmount ?? 0
  const total = r.total      ?? 0
  if (total > 0 && paid >= total) return 'paid'
  if (paid > 0)                   return 'partial'
  return 'unpaid'
}

function payStatusVariant(s: PayStatus) {
  if (s === 'paid')      return 'success'  as const
  if (s === 'partial')   return 'warning'  as const
  if (s === 'cancelled') return 'muted'    as const
  return 'danger' as const
}

function payStatusLabel(s: PayStatus | string) {
  const m: Record<string, string> = {
    paid: 'Paid', partial: 'Partial', unpaid: 'Unpaid', cancelled: 'Cancelled',
  }
  return m[s] ?? s.charAt(0).toUpperCase() + s.slice(1)
}

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getInitials(name: string) {
  return (name ?? 'UN').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i}>
          <div style={{
            height: 14, borderRadius: 6, width: '80%',
            background: 'linear-gradient(90deg, var(--bg-section) 25%, var(--border-light) 50%, var(--bg-section) 75%)',
            backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
          }} />
        </td>
      ))}
    </tr>
  )
}

// ─── Payment Modal ────────────────────────────────────────────────────────────

function PaymentModal({
  order, onClose, onSuccess,
}: { order: any; onClose: () => void; onSuccess: () => void }) {
  const [payAmount, setPayAmount]   = useState('')
  const [payMethod, setPayMethod]   = useState<PayMethod>('Cash')
  const [paying,    setPaying]      = useState(false)

  const total   = order.total      ?? 0
  const paid    = order.paidAmount ?? 0
  const balance = Math.max(0, total - paid)

  const handlePay = async () => {
    const amt = parseFloat(payAmount)
    if (isNaN(amt) || amt <= 0) { toast.error('Enter a valid amount'); return }
    setPaying(true)
    try {
      await labService.pay(order._id, amt, payMethod)
      toast.success('Payment recorded')
      onSuccess()
      onClose()
    } catch {
      toast.error('Failed to record payment')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      background: 'var(--overlay-bg, rgba(0,0,0,0.45))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="card" style={{ width: 400, padding: 28 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)' }}>Record Payment</div>
          <button className="act" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>

        {/* Order info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginBottom: 2 }}>Order ID</div>
            <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 13 }}>{order.orderId}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginBottom: 2 }}>Patient</div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{order.patientId?.name}</div>
          </div>
        </div>

        {/* Amount summary */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          padding: '12px 14px', borderRadius: 10, marginBottom: 20,
          background: 'var(--bg-section)', border: '1px solid var(--border-soft)',
        }}>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-secondary)' }}>Total</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{fmt(total)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-secondary)' }}>Already paid</div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--teal-800)' }}>{fmt(paid)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11.5, color: 'var(--fg-secondary)' }}>Balance</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: balance > 0 ? 'var(--danger-500)' : 'var(--teal-800)' }}>
              {fmt(balance)}
            </div>
          </div>
        </div>

        {/* Tests summary */}
        {Array.isArray(order.tests) && order.tests.length > 0 && (
          <div style={{ marginBottom: 18, padding: '10px 14px', borderRadius: 8, background: 'var(--bg-section)', fontSize: 12.5, color: 'var(--fg-secondary)' }}>
            <span style={{ fontWeight: 600, color: 'var(--fg-primary)' }}>Tests: </span>
            {order.tests.map((t: any) => t.name).join(', ')}
          </div>
        )}

        {/* Amount input */}
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Amount to collect (₹)</label>
          <input
            className="form-input"
            type="number"
            min={1}
            value={payAmount}
            onChange={e => setPayAmount(e.target.value)}
            placeholder={`Up to ${fmt(balance)}`}
            autoFocus
          />
        </div>

        {/* Payment method */}
        <div className="form-group" style={{ marginBottom: 22 }}>
          <label className="form-label">Payment method</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PAY_METHODS.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setPayMethod(m)}
                style={{
                  padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600,
                  background: payMethod === m ? 'var(--brand-gradient)' : 'var(--bg-section)',
                  color: payMethod === m ? 'white' : 'var(--fg-secondary)',
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={paying}>
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handlePay}
            disabled={paying || !payAmount || Number(payAmount) <= 0}
          >
            <Icon name="check" size={13} />
            {paying ? 'Processing…' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LabBillingPage() {
  const { setRoute, setSelectedId } = useAppStore()
  const [items,   setItems]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState<typeof FILTERS[number]>('All')
  const [search,  setSearch]  = useState('')
  const [payingOrder, setPayingOrder] = useState<any | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await labService.list({})
      setItems(res.data ?? [])
    } catch {
      toast.error('Failed to load lab billing records')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Derived stats ──────────────────────────────────────────────────────────
  const unpaidCount    = items.filter(r => getPayStatus(r) === 'unpaid').length
  const partialCount   = items.filter(r => getPayStatus(r) === 'partial').length
  const paidCount      = items.filter(r => getPayStatus(r) === 'paid').length
  const totalRevenue   = items.reduce((sum, r) => sum + (r.paidAmount ?? 0), 0)
  const pendingRevenue = items
    .filter(r => getPayStatus(r) !== 'paid' && getPayStatus(r) !== 'cancelled')
    .reduce((sum, r) => sum + Math.max(0, (r.total ?? 0) - (r.paidAmount ?? 0)), 0)

  // ── Filtered rows ──────────────────────────────────────────────────────────
  const filtered = items.filter(r => {
    const ps = getPayStatus(r)
    const matchFilter = filter === 'All' || ps === filter
    const q = search.toLowerCase()
    const matchSearch = !q
      || (r.patientId?.name  ?? '').toLowerCase().includes(q)
      || (r.orderId          ?? '').toLowerCase().includes(q)
      || (r.patientId?.phone ?? '').toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  return (
    <>
      <Header title="Lab Billing" crumbs="Diagnostic test billing & payment collection" />

      <div className="main">
        {/* ── KPI Stats ───────────────────────────────────────────────────── */}
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <StatCard
            ic="receipt" tone="amber"
            label="Unpaid Bills"
            value={String(unpaidCount)}
            foot="Awaiting first payment"
          />
          <StatCard
            ic="activity" tone="blue"
            label="Partial Payments"
            value={String(partialCount)}
            foot="Partially settled"
          />
          <StatCard
            ic="check" tone="mint"
            label="Fully Paid"
            value={String(paidCount)}
            foot="Completely settled"
          />
          <StatCard
            ic="receipt" tone="plum"
            label="Revenue Collected"
            value={`₹${totalRevenue.toLocaleString('en-IN')}`}
            foot={`₹${pendingRevenue.toLocaleString('en-IN')} pending`}
          />
        </div>

        {/* ── Table card ──────────────────────────────────────────────────── */}
        <div className="table-card">
          <div className="table-toolbar">
            {/* Filter chips */}
            <div className="filters" style={{ flex: 1, flexWrap: 'wrap' }}>
              {FILTERS.map(f => {
                const count = f === 'All'
                  ? items.length
                  : items.filter(r => getPayStatus(r) === f).length
                return (
                  <button
                    key={f}
                    className={`chip ${filter === f ? 'active' : ''}`}
                    onClick={() => setFilter(f)}
                  >
                    {payStatusLabel(f)}
                    <span className="count">{count}</span>
                  </button>
                )
              })}
            </div>

            {/* Search */}
            <div className="table-search" style={{ flexShrink: 0 }}>
              <Icon name="search" size={15} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search patient or order…"
              />
            </div>

            {/* New Lab Order */}
            <button
              className="btn btn-primary btn-sm"
              style={{ flexShrink: 0 }}
              onClick={() => { setSelectedId(null); setRoute('lab-detail') }}
            >
              <Icon name="plus" size={14} /> New Lab Order
            </button>
          </div>

          {/* ── Data table ───────────────────────────────────────────────── */}
          <table className="data">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Order ID</th>
                <th>Tests</th>
                <th>Total (₹)</th>
                <th>Paid (₹)</th>
                <th>Balance (₹)</th>
                <th>Payment Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--fg-muted)' }}>
                      <Icon name="receipt" size={32} />
                      <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600 }}>No billing records found</div>
                      <div style={{ marginTop: 4, fontSize: 12 }}>Try adjusting your search or filter</div>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(r => {
                const ps      = getPayStatus(r)
                const total   = r.total      ?? 0
                const paid    = r.paidAmount ?? 0
                const balance = Math.max(0, total - paid)
                return (
                  <tr key={r._id}>
                    {/* Patient */}
                    <td>
                      <div className="cell-person">
                        <div className="av blue">
                          {getInitials(r.patientId?.name ?? 'UN')}
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

                    {/* Tests */}
                    <td style={{ maxWidth: 180 }}>
                      {Array.isArray(r.tests) && r.tests.length > 0 ? (
                        <>
                          <div style={{ fontSize: 13, color: 'var(--fg-primary)', fontWeight: 500 }}>
                            {r.tests.slice(0, 2).map((t: any) => t.name).join(', ')}
                            {r.tests.length > 2 && (
                              <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}> +{r.tests.length - 2} more</span>
                            )}
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2 }}>
                            {r.tests.length} test{r.tests.length !== 1 ? 's' : ''}
                          </div>
                        </>
                      ) : (
                        <span style={{ color: 'var(--fg-muted)', fontSize: 13 }}>—</span>
                      )}
                    </td>

                    {/* Total */}
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--fg-primary)' }}>
                        {fmt(total)}
                      </div>
                      {(r.discount ?? 0) > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--teal-800)', marginTop: 2 }}>
                          -{r.discount}% disc.
                        </div>
                      )}
                    </td>

                    {/* Paid */}
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: paid > 0 ? 'var(--teal-800)' : 'var(--fg-muted)' }}>
                        {fmt(paid)}
                      </div>
                      {r.paymentMethod && (
                        <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>
                          via {r.paymentMethod}
                        </div>
                      )}
                    </td>

                    {/* Balance */}
                    <td>
                      <div style={{
                        fontWeight: 700, fontSize: 13.5,
                        color: balance > 0 ? 'var(--danger-500)' : 'var(--teal-800)',
                      }}>
                        {fmt(balance)}
                      </div>
                      {r.paidAt && balance === 0 && (
                        <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>
                          {new Date(r.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </div>
                      )}
                    </td>

                    {/* Payment Status */}
                    <td>
                      <Badge variant={payStatusVariant(ps)} dot>{payStatusLabel(ps)}</Badge>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                        {(ps === 'unpaid' || ps === 'partial') && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setPayingOrder(r)}
                          >
                            <Icon name="check" size={13} /> Pay
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
                )
              })}
            </tbody>
          </table>

          {/* ── Revenue summary footer ───────────────────────────────────── */}
          {!loading && filtered.length > 0 && (
            <div style={{
              display: 'flex', gap: 32, padding: '12px 20px',
              borderTop: '1px solid var(--border-soft)',
              background: 'var(--bg-section)',
              fontSize: 13, flexWrap: 'wrap',
            }}>
              <div>
                <span style={{ color: 'var(--fg-muted)' }}>Showing </span>
                <span style={{ fontWeight: 700 }}>{filtered.length}</span>
                <span style={{ color: 'var(--fg-muted)' }}> of {items.length} records</span>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 24 }}>
                <div>
                  <span style={{ color: 'var(--fg-muted)' }}>Total billed: </span>
                  <span style={{ fontWeight: 700 }}>
                    {fmt(filtered.reduce((s, r) => s + (r.total ?? 0), 0))}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--fg-muted)' }}>Collected: </span>
                  <span style={{ fontWeight: 700, color: 'var(--teal-800)' }}>
                    {fmt(filtered.reduce((s, r) => s + (r.paidAmount ?? 0), 0))}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--fg-muted)' }}>Pending: </span>
                  <span style={{ fontWeight: 700, color: 'var(--danger-500)' }}>
                    {fmt(filtered.reduce((s, r) => s + Math.max(0, (r.total ?? 0) - (r.paidAmount ?? 0)), 0))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Payment modal ─────────────────────────────────────────────────── */}
      {payingOrder && (
        <PaymentModal
          order={payingOrder}
          onClose={() => setPayingOrder(null)}
          onSuccess={load}
        />
      )}
    </>
  )
}
