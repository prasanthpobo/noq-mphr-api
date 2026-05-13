import { useState } from 'react'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import Badge from '@/components/ui/Badge'
import { useAppStore } from '@/store/app'

interface ClinicService {
  id: number
  name: string
  category: string
  code: string
  qty: number
  notes: string
  unitPrice: number
}

interface BillItem {
  id: number
  name: string
  qty: number
  unitPrice: number
}

const SERVICES: ClinicService[] = [
  { id: 1, name: 'Consultation Fee',          category: 'Consultation', code: 'CONS-001', qty: 1, notes: 'General OPD',            unitPrice: 400  },
  { id: 2, name: 'ECG',                        category: 'Diagnostics',  code: 'DIAG-012', qty: 1, notes: 'Resting 12-lead',        unitPrice: 350  },
  { id: 3, name: 'Nebulization',               category: 'Procedures',   code: 'PROC-008', qty: 2, notes: '',                       unitPrice: 150  },
  { id: 4, name: 'Dressing & Wound Care',      category: 'Procedures',   code: 'PROC-015', qty: 1, notes: 'Post-surgical dressing', unitPrice: 200  },
  { id: 5, name: 'Physiotherapy Session',      category: 'Therapy',      code: 'THER-003', qty: 3, notes: 'Lower back rehab',       unitPrice: 600  },
  { id: 6, name: 'IV Fluid Administration',    category: 'Procedures',   code: 'PROC-022', qty: 1, notes: 'NS 500ml',               unitPrice: 180  },
  { id: 7, name: 'Specialist Referral',        category: 'Consultation', code: 'CONS-005', qty: 1, notes: 'Cardiology',             unitPrice: 250  },
]

const PAY_METHODS = ['UPI', 'Card', 'Cash', 'Insurance'] as const

export default function BillingDetail() {
  const { setRoute } = useAppStore()
  const [tab, setTab] = useState<'services' | 'bill'>('services')
  const [billItems, setBillItems] = useState<BillItem[]>([])
  const [serviceList, setServiceList] = useState<ClinicService[]>(SERVICES)
  const [discount, setDiscount] = useState(0)
  const [gst, setGst] = useState(18)
  const [payMethod, setPayMethod] = useState<'UPI' | 'Card' | 'Cash' | 'Insurance'>('UPI')

  const addToBill = (svc: ClinicService) => {
    setBillItems(prev => {
      if (prev.find(b => b.id === svc.id)) return prev
      return [...prev, { id: svc.id, name: svc.name, qty: svc.qty, unitPrice: svc.unitPrice }]
    })
  }

  const addAllToBill = () => {
    setBillItems(
      serviceList.map(s => ({ id: s.id, name: s.name, qty: s.qty, unitPrice: s.unitPrice }))
    )
  }

  const updateSvcQty = (id: number, delta: number) => {
    setServiceList(prev => prev.map(s => s.id === id ? { ...s, qty: Math.max(1, s.qty + delta) } : s))
  }

  const updateBillQty = (id: number, delta: number) => {
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

  return (
    <>
      <Header title="Billing — Patient Detail" crumbs="General clinic bill & payment" />

      <div className="main">
        {/* Teal hero */}
        <div className="ops-hero" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <button
            onClick={() => setRoute('billing')}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '6px 12px', color: 'white', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', marginBottom: 'auto' }}
          >
            <Icon name="chevL" size={14} /> Back
          </button>

          <div style={{ display: 'flex', gap: 32, flex: 1, flexWrap: 'wrap', justifyContent: 'space-around' }}>
            {/* Patient block */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="av indigo" style={{ width: 44, height: 44, fontSize: 16, fontWeight: 700 }}>KN</div>
              <div>
                <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 500 }}>Patient</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Karthik Nair</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>P-1046 · 45 yrs · M</div>
              </div>
            </div>

            {/* Doctor block */}
            <div>
              <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 500 }}>Doctor</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Dr. Vikram Mehta</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Cardiology</div>
            </div>

            {/* Status block */}
            <div>
              <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 500, marginBottom: 4 }}>Bill Status</div>
              <Badge variant="warning" dot>Partial</Badge>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Token B-013</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {(['services', 'bill'] as const).map(t => (
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
              }}
            >
              {t === 'services' ? 'General Clinic Bill List' : `Bill (${billItems.length})`}
            </button>
          ))}
        </div>

        {tab === 'services' && (
          <div className="table-card">
            <div className="table-toolbar">
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)' }}>
                Clinic Services
              </div>
              <button className="btn btn-primary btn-sm" onClick={addAllToBill}>
                <Icon name="plus" size={14} /> Add all to bill
              </button>
            </div>
            <table className="data">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Code</th>
                  <th>Qty</th>
                  <th>Notes</th>
                  <th>Unit Price (₹)</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {serviceList.map(svc => (
                  <tr key={svc.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{svc.name}</div>
                      <span style={{ display: 'inline-block', marginTop: 3, padding: '1px 7px', background: 'var(--brand-gradient-soft)', color: 'var(--teal-800)', borderRadius: 5, fontSize: 11, fontWeight: 600 }}>
                        {svc.category}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--bg-section)', padding: '2px 8px', borderRadius: 5, color: 'var(--fg-secondary)' }}>
                        {svc.code}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', minWidth: 28 }} onClick={() => updateSvcQty(svc.id, -1)}>−</button>
                        <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>{svc.qty}</span>
                        <button className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', minWidth: 28 }} onClick={() => updateSvcQty(svc.id, +1)}>+</button>
                      </div>
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--fg-muted)', maxWidth: 180 }}>
                      {svc.notes || '—'}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--teal-800)' }}>₹{svc.unitPrice}</td>
                    <td>
                      <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => addToBill(svc)}
                          disabled={billItems.some(b => b.id === svc.id)}
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
                <button className="btn btn-secondary btn-sm" onClick={() => setTab('services')}>
                  <Icon name="plus" size={13} /> Add services
                </button>
              </div>
              {billItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--fg-muted)' }}>
                  <Icon name="receipt" size={32} />
                  <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600 }}>No items added</div>
                  <div style={{ marginTop: 4, fontSize: 12 }}>Go to Clinic Bill List and add services</div>
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
                            <button className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', minWidth: 28 }} onClick={() => updateBillQty(b.id, -1)}>−</button>
                            <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>{b.qty}</span>
                            <button className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', minWidth: 28 }} onClick={() => updateBillQty(b.id, +1)}>+</button>
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
