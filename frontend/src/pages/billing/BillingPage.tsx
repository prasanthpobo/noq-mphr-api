import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import { useAppStore } from '@/store/app'
import { billingService } from '@/services/billing.service'
import { toast } from '@/store/toast'

type PayMethod = 'cash' | 'card' | 'upi' | 'insurance' | 'online'

const FILTERS = ['All', 'pending', 'partial', 'paid', 'cancelled']

const PAY_METHODS: { value: PayMethod; label: string }[] = [
  { value: 'cash',      label: 'Cash'      },
  { value: 'upi',       label: 'UPI'       },
  { value: 'card',      label: 'Card'      },
  { value: 'insurance', label: 'Insurance' },
  { value: 'online',    label: 'Online'    },
]

function statusVariant(s: string) {
  if (s === 'paid')      return 'success' as const
  if (s === 'partial')   return 'warning' as const
  if (s === 'cancelled') return 'muted'   as const
  return 'danger' as const
}

function statusLabel(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i}>
          <div style={{
            height: 14, borderRadius: 6, width: '85%',
            background: 'linear-gradient(90deg, var(--bg-section) 25%, var(--border-light) 50%, var(--bg-section) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
          }} />
        </td>
      ))}
    </tr>
  )
}

/* ── Inline payment modal ──────────────────────────────────────────────────── */
function PaymentModal({ bill, onClose, onDone }: { bill: any; onClose: () => void; onDone: () => void }) {
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState<PayMethod>('cash')
  const [paying,    setPaying]    = useState(false)

  const balance = (bill.total ?? 0) - (bill.paidAmount ?? 0)

  const handlePay = async () => {
    const amt = Number(payAmount)
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return }
    setPaying(true)
    try {
      await billingService.pay(bill._id, amt, payMethod)
      toast.success('Payment recorded')
      onDone()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment failed')
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
      <div className="card" style={{ width: 380, padding: 28 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: 'var(--fg-primary)' }}>
          Record Payment
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginBottom: 2 }}>Invoice</div>
            <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 13.5 }}>{bill.invoiceNumber}</div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginBottom: 2 }}>Patient</div>
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>{bill.patientId?.name}</div>
          </div>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between',
          padding: '12px 14px', borderRadius: 10,
          background: 'var(--bg-section)', border: '1px solid var(--border-soft)',
          marginBottom: 18,
        }}>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-secondary)' }}>Total</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{fmt(bill.total ?? 0)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-secondary)' }}>Already paid</div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--success-500)' }}>{fmt(bill.paidAmount ?? 0)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11.5, color: 'var(--fg-secondary)' }}>Balance</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--danger-500)' }}>
              {fmt(Math.max(0, balance))}
            </div>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Amount to collect (₹)</label>
          <input
            className="form-input"
            type="number" min={1}
            value={payAmount}
            onChange={e => setPayAmount(e.target.value)}
            placeholder={`Up to ₹${balance.toFixed(2)}`}
            autoFocus
          />
        </div>

        <div className="form-group" style={{ marginBottom: 22 }}>
          <label className="form-label">Payment method</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PAY_METHODS.map(m => (
              <button
                key={m.value}
                type="button"
                onClick={() => setPayMethod(m.value)}
                style={{
                  padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600,
                  background: payMethod === m.value ? 'var(--brand-gradient)' : 'var(--bg-section)',
                  color: payMethod === m.value ? 'white' : 'var(--fg-secondary)',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={paying}>Cancel</button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handlePay}
            disabled={paying || !payAmount || Number(payAmount) <= 0}
          >
            <Icon name="check" size={13} /> {paying ? 'Processing…' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main page ─────────────────────────────────────────────────────────────── */
export default function BillingPage() {
  const { setRoute, setSelectedId } = useAppStore()
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('All')
  const [items, setItems]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [payBill, setPayBill] = useState<any | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (filter !== 'All') params.status = filter
      if (search.trim())    params.search  = search.trim()
      const res = await billingService.list(params)
      setItems(res.data ?? [])
    } catch {
      toast.error('Failed to load billing records')
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  useEffect(() => { load() }, [load])

  const pending  = items.filter(r => r.status === 'pending').length
  const partial  = items.filter(r => r.status === 'partial').length
  const paid     = items.filter(r => r.status === 'paid').length
  const revenue  = items.filter(r => r.status === 'paid').reduce((sum, r) => sum + (r.total ?? 0), 0)

  return (
    <>
      <Header
        title="Clinic Billing"
        crumbs="Patient billing & invoices"
      />

      <div className="main">
        {/* KPI Stats */}
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <StatCard ic="receipt"  tone="amber" label="Pending Bills"    value={String(pending)} foot="Awaiting payment" />
          <StatCard ic="activity" tone="blue"  label="Partial Payments" value={String(partial)} foot="Partially settled" />
          <StatCard ic="check"    tone="mint"  label="Paid Today"       value={String(paid)}    foot="Successfully collected" />
          <StatCard ic="receipt"  tone="plum"  label="Revenue"
            value={`₹${revenue.toLocaleString('en-IN')}`}
            delta="+15%" up foot="Today's collections"
          />
        </div>

        {/* Bills table */}
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
                placeholder="Search patient, invoice…"
              />
            </div>
            <button
              className="btn btn-primary btn-sm"
              style={{ flexShrink: 0 }}
              onClick={() => { setSelectedId(null); setRoute('billing-detail') }}
            >
              <Icon name="plus" size={14} /> New Bill
            </button>
          </div>

          <table className="data">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Invoice #</th>
                <th>Appointment</th>
                <th>Doctor</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--fg-muted)' }}>
                      <Icon name="receipt" size={32} />
                      <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600 }}>No billing records found</div>
                      <div style={{ marginTop: 4, fontSize: 12 }}>Try adjusting your search or filter</div>
                    </div>
                  </td>
                </tr>
              ) : items.map(r => (
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
                      {r.invoiceNumber ?? '—'}
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
                        {r.appointmentId.date && (
                          <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2 }}>
                            {new Date(r.appointmentId.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            {r.appointmentId.time && ` · ${r.appointmentId.time}`}
                          </div>
                        )}
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
                  <td style={{ fontWeight: 700, color: 'var(--teal-800)', fontSize: 13.5 }}>
                    {fmt(r.total ?? 0)}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>
                    {fmt(r.paidAmount ?? 0)}
                  </td>
                  <td>
                    <Badge variant={statusVariant(r.status)} dot>{statusLabel(r.status)}</Badge>
                  </td>
                  <td>
                    <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                      {(r.status === 'pending' || r.status === 'partial') && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setPayBill(r)}
                        >
                          Pay
                        </button>
                      )}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => { setSelectedId(r._id); setRoute('billing-detail') }}
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

      {payBill && (
        <PaymentModal
          bill={payBill}
          onClose={() => setPayBill(null)}
          onDone={() => { setPayBill(null); load() }}
        />
      )}
    </>
  )
}
