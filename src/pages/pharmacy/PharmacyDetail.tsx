import { useState } from 'react'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import Badge from '@/components/ui/Badge'
import { useAppStore } from '@/store/app'

interface Medicine {
  id: number
  name: string
  type: string
  morning: boolean
  afternoon: boolean
  night: boolean
  duration: string
  stock: 'In Stock' | 'Low Stock' | 'Out of Stock'
}

interface BillItem {
  id: number
  name: string
  qty: number
  unitPrice: number
}

const MEDICINES: Medicine[] = [
  { id: 1, name: 'Amoxicillin 500mg', type: 'Antibiotic',    morning: true,  afternoon: false, night: true,  duration: '7 days',  stock: 'In Stock'     },
  { id: 2, name: 'Paracetamol 650mg', type: 'Analgesic',     morning: true,  afternoon: true,  night: true,  duration: '3 days',  stock: 'In Stock'     },
  { id: 3, name: 'Omeprazole 20mg',   type: 'Antacid',       morning: true,  afternoon: false, night: false, duration: '14 days', stock: 'Low Stock'    },
  { id: 4, name: 'Cetirizine 10mg',   type: 'Antihistamine', morning: false, afternoon: false, night: true,  duration: '5 days',  stock: 'In Stock'     },
  { id: 5, name: 'Metformin 500mg',   type: 'Antidiabetic',  morning: true,  afternoon: false, night: true,  duration: '30 days', stock: 'Out of Stock' },
]

function stockVariant(s: Medicine['stock']) {
  if (s === 'In Stock') return 'success' as const
  if (s === 'Low Stock') return 'warning' as const
  return 'danger' as const
}

function Pip({ on }: { on: boolean }) {
  return (
    <span style={{
      display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
      background: on ? '#1FA3A8' : 'var(--border-soft)',
      marginRight: 3,
    }} />
  )
}

export default function PharmacyDetail() {
  const { setRoute } = useAppStore()
  const [tab, setTab] = useState<'prescription' | 'bill'>('prescription')
  const [billItems, setBillItems] = useState<BillItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [gst, setGst] = useState(18)
  const [payMethod, setPayMethod] = useState<'UPI' | 'Card' | 'Cash' | 'Insurance'>('UPI')

  const addToBill = (med: Medicine) => {
    setBillItems(prev => {
      const existing = prev.find(b => b.id === med.id)
      if (existing) return prev
      return [...prev, { id: med.id, name: med.name, qty: 1, unitPrice: 25 + med.id * 10 }]
    })
  }

  const addAllToBill = () => {
    setBillItems(
      MEDICINES.filter(m => m.stock !== 'Out of Stock').map(m => ({
        id: m.id, name: m.name, qty: 1, unitPrice: 25 + m.id * 10,
      }))
    )
  }

  const updateQty = (id: number, delta: number) => {
    setBillItems(prev => prev.map(b => b.id === id ? { ...b, qty: Math.max(1, b.qty + delta) } : b))
  }

  const updatePrice = (id: number, val: number) => {
    setBillItems(prev => prev.map(b => b.id === id ? { ...b, unitPrice: val } : b))
  }

  const removeItem = (id: number) => setBillItems(prev => prev.filter(b => b.id !== id))

  const subtotal = billItems.reduce((s, b) => s + b.qty * b.unitPrice, 0)
  const discountAmt = (subtotal * discount) / 100
  const gstAmt = ((subtotal - discountAmt) * gst) / 100
  const grand = subtotal - discountAmt + gstAmt

  const PAY_METHODS = ['UPI', 'Card', 'Cash', 'Insurance'] as const

  return (
    <>
      <Header
        title="Pharmacy — Patient Detail"
        crumbs="Prescription & billing"
      />

      <div className="main">
        {/* Teal hero */}
        <div className="ops-hero" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <button
            onClick={() => setRoute('pharmacy')}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '6px 12px', color: 'white', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', marginBottom: 'auto' }}
          >
            <Icon name="chevL" size={14} /> Back
          </button>

          <div style={{ display: 'flex', gap: 32, flex: 1, flexWrap: 'wrap', justifyContent: 'space-around' }}>
            {/* Patient block */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="av blue" style={{ width: 44, height: 44, fontSize: 16, fontWeight: 700 }}>AS</div>
              <div>
                <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 500 }}>Patient</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Aarav Sharma</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>P-1042 · 34 yrs · M</div>
              </div>
            </div>

            {/* Doctor block */}
            <div>
              <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 500 }}>Doctor</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Dr. Ananya Rao</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>General Medicine</div>
            </div>

            {/* Status block */}
            <div>
              <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 500, marginBottom: 4 }}>Rx Status</div>
              <Badge variant="warning" dot>Pending</Badge>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Token A-024</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {(['prescription', 'bill'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 20px',
                borderRadius: 10,
                border: 'none',
                background: tab === t ? 'var(--brand-gradient)' : 'var(--bg-surface)',
                color: tab === t ? 'white' : 'var(--fg-secondary)',
                fontWeight: 600,
                fontSize: 13.5,
                cursor: 'pointer',
                boxShadow: tab === t ? 'var(--sh-brand)' : 'var(--sh-light)',
                textTransform: 'capitalize',
              }}
            >
              {t === 'prescription' ? 'Prescription' : `Bill (${billItems.length})`}
            </button>
          ))}
        </div>

        {tab === 'prescription' && (
          <div className="table-card">
            <div className="table-toolbar">
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)' }}>
                Prescribed Medicines
              </div>
              <button className="btn btn-primary btn-sm" onClick={addAllToBill}>
                <Icon name="plus" size={14} /> Add all to bill
              </button>
            </div>
            <table className="data">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Dosage</th>
                  <th>Duration</th>
                  <th>Stock</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {MEDICINES.map(med => (
                  <tr key={med.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{med.name}</div>
                      <span style={{ display: 'inline-block', marginTop: 3, padding: '1px 7px', background: 'var(--brand-gradient-soft)', color: 'var(--teal-800)', borderRadius: 5, fontSize: 11, fontWeight: 600 }}>
                        {med.type}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>M</span>
                        <Pip on={med.morning} />
                        <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>A</span>
                        <Pip on={med.afternoon} />
                        <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>N</span>
                        <Pip on={med.night} />
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>{med.duration}</td>
                    <td>
                      <Badge variant={stockVariant(med.stock)}>{med.stock}</Badge>
                    </td>
                    <td>
                      <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => addToBill(med)}
                          disabled={med.stock === 'Out of Stock'}
                        >
                          <Icon name="plus" size={13} /> Add
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'bill' && (
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            {/* Items table */}
            <div className="table-card" style={{ flex: 1 }}>
              <div className="table-toolbar">
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)' }}>Bill Items</div>
                <button className="btn btn-secondary btn-sm" onClick={() => setTab('prescription')}>
                  <Icon name="plus" size={13} /> Add medicines
                </button>
              </div>
              {billItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--fg-muted)' }}>
                  <Icon name="receipt" size={32} />
                  <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600 }}>No items added</div>
                  <div style={{ marginTop: 4, fontSize: 12 }}>Go to Prescription tab and add medicines</div>
                </div>
              ) : (
                <table className="data">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Unit Price (₹)</th>
                      <th>Total (₹)</th>
                      <th style={{ textAlign: 'right' }}>Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billItems.map(b => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 600, fontSize: 13.5 }}>{b.name}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', minWidth: 28 }} onClick={() => updateQty(b.id, -1)}>−</button>
                            <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>{b.qty}</span>
                            <button className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', minWidth: 28 }} onClick={() => updateQty(b.id, +1)}>+</button>
                          </div>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-input"
                            style={{ width: 90, padding: '4px 8px', fontSize: 13 }}
                            value={b.unitPrice}
                            onChange={e => updatePrice(b.id, Number(e.target.value))}
                          />
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--teal-800)' }}>
                          ₹{(b.qty * b.unitPrice).toFixed(2)}
                        </td>
                        <td>
                          <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                            <button className="act danger" onClick={() => removeItem(b.id)}>
                              <Icon name="trash" size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Summary card */}
            <div className="card" style={{ width: 300, flexShrink: 0, position: 'sticky', top: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Bill Summary</div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13.5 }}>
                <span style={{ color: 'var(--fg-secondary)' }}>Subtotal</span>
                <span style={{ fontWeight: 600 }}>₹{subtotal.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13.5, color: 'var(--fg-secondary)' }}>Discount (%)</span>
                <input
                  type="number"
                  className="form-input"
                  style={{ width: 70, padding: '4px 8px', fontSize: 13, textAlign: 'right' }}
                  value={discount}
                  min={0} max={100}
                  onChange={e => setDiscount(Number(e.target.value))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13.5, color: 'var(--fg-secondary)' }}>GST (%)</span>
                <input
                  type="number"
                  className="form-input"
                  style={{ width: 70, padding: '4px 8px', fontSize: 13, textAlign: 'right' }}
                  value={gst}
                  min={0} max={28}
                  onChange={e => setGst(Number(e.target.value))}
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border-soft)', margin: '12px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Grand Total</span>
                <span style={{ fontSize: 18, fontWeight: 800, background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  ₹{grand.toFixed(2)}
                </span>
              </div>

              {/* Payment method */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-secondary)', marginBottom: 6 }}>Payment Method</div>
                <div className="seg-ctrl" style={{ display: 'flex', gap: 4 }}>
                  {PAY_METHODS.map(m => (
                    <button
                      key={m}
                      onClick={() => setPayMethod(m)}
                      style={{
                        flex: 1, padding: '5px 0', fontSize: 11.5, fontWeight: 600,
                        borderRadius: 7, border: 'none', cursor: 'pointer',
                        background: payMethod === m ? 'var(--brand-gradient)' : 'var(--bg-section)',
                        color: payMethod === m ? 'white' : 'var(--fg-secondary)',
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px 0', fontSize: 14 }}>
                Charge ₹{grand.toFixed(2)}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
