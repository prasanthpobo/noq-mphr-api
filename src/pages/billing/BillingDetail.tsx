import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import Badge from '@/components/ui/Badge'
import { useAppStore } from '@/store/app'
import { useAuthStore } from '@/store/auth'
import { billingService } from '@/services/billing.service'
import { appointmentsService } from '@/services/appointments.service'
import { patientsService } from '@/services/patients.service'
import { toast } from '@/store/toast'

/* ── Types ───────────────────────────────────────────────────────────────── */
type PayMethod  = 'cash' | 'card' | 'upi' | 'insurance' | 'online'
type BillStatus = 'pending' | 'paid' | 'partial' | 'cancelled'

interface BillItem {
  description: string
  quantity:    number
  rate:        number
  amount:      number
}

interface Bill {
  _id:            string
  invoiceNumber:  string
  patientId:      { _id: string; name: string; phone?: string; tag?: string; gender?: string }
  doctorId:       { _id: string; name: string; specialization?: string }
  clinicId:       { _id: string; name: string; address?: string }
  appointmentId?: { _id: string; tokenNumber?: string; date?: string; time?: string }
  items:          BillItem[]
  subtotal:       number
  discount:       number
  tax:            number
  total:          number
  status:         BillStatus
  paymentMethod?: PayMethod
  paidAmount:     number
  paidAt?:        string
  notes?:         string
  createdAt:      string
  updatedAt:      string
}

interface Appointment {
  _id:          string
  patientId:    { _id: string; name: string; phone?: string; tag?: string; gender?: string }
  doctorId:     { _id: string; name: string; specialization?: string }
  clinicId?:    { _id: string; name: string } | string
  tokenNumber?: string
  date?:        string
  time?:        string
  status?:      string
}

/* ── Constants ───────────────────────────────────────────────────────────── */
const PAY_METHODS: { value: PayMethod; label: string }[] = [
  { value: 'cash',      label: 'Cash'      },
  { value: 'upi',       label: 'UPI'       },
  { value: 'card',      label: 'Card'      },
  { value: 'insurance', label: 'Insurance' },
  { value: 'online',    label: 'Online'    },
]

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function statusVariant(s: BillStatus) {
  if (s === 'paid')      return 'success' as const
  if (s === 'partial')   return 'warning' as const
  if (s === 'cancelled') return 'muted'   as const
  return 'danger' as const
}

function getInitials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function emptyItem(): BillItem {
  return { description: '', quantity: 1, rate: 0, amount: 0 }
}

/* ── Summary row ─────────────────────────────────────────────────────────── */
function SumRow({ label, value, highlight, danger }: { label: string; value: string; highlight?: boolean; danger?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13.5 }}>
      <span style={{ color: highlight ? 'var(--fg-primary)' : 'var(--fg-secondary)', fontWeight: highlight ? 700 : 400 }}>{label}</span>
      <span style={{ fontWeight: highlight ? 800 : 600, color: danger ? 'var(--danger-500)' : highlight ? undefined : 'var(--fg-primary)' }}>{value}</span>
    </div>
  )
}

/* ── Main Component ──────────────────────────────────────────────────────── */
export default function BillingDetail() {
  const { selectedId, setSelectedId, setRoute } = useAppStore()
  const { user } = useAuthStore()

  const [mode, setMode]       = useState<'create' | 'view' | 'edit'>(selectedId ? 'view' : 'create')
  const [bill, setBill]       = useState<Bill | null>(null)
  const [appt, setAppt]       = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(!!selectedId)

  // Form fields
  const [items,       setItems]       = useState<BillItem[]>([emptyItem()])
  const [discountPct, setDiscountPct] = useState(0)
  const [taxPct,      setTaxPct]      = useState(18)
  const [notes,       setNotes]       = useState('')
  const [saving,      setSaving]      = useState(false)

  // Payment
  const [payOpen,   setPayOpen]   = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState<PayMethod>('cash')
  const [paying,    setPaying]    = useState(false)

  // Patient list (create mode, step 1)
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null)
  const [patientSearch,   setPatientSearch]   = useState('')
  const [patientResults,  setPatientResults]  = useState<any[]>([])
  const [patientLoading,  setPatientLoading]  = useState(false)

  // Appointment list (create mode, step 2)
  const [apptSearch,  setApptSearch]  = useState('')
  const [apptResults, setApptResults] = useState<Appointment[]>([])
  const [apptLoading, setApptLoading] = useState(false)

  /* ── Load existing bill ──────────────────────────────────────────────── */
  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    billingService.get(selectedId)
      .then((b: Bill) => {
        setBill(b)
        setItems(b.items.length > 0 ? b.items : [emptyItem()])
        const sub = b.items.reduce((s, it) => s + it.amount, 0)
        setDiscountPct(sub > 0 ? Math.round((b.discount / sub) * 100) : 0)
        const afterDiscount = sub - b.discount
        setTaxPct(afterDiscount > 0 ? Math.round((b.tax / afterDiscount) * 100) : 0)
        setNotes(b.notes ?? '')
        setMode('view')
      })
      .catch(() => toast.error('Failed to load bill'))
      .finally(() => setLoading(false))
  }, [selectedId])

  /* ── Load patients in create mode (step 1) ──────────────────────────── */
  useEffect(() => {
    if (mode !== 'create' || selectedPatient) return
    setPatientLoading(true)
    patientsService.list({})
      .then(res => setPatientResults((res as any).data ?? []))
      .catch(() => toast.error('Failed to load patients'))
      .finally(() => setPatientLoading(false))
  }, [mode, selectedPatient])

  /* ── Load appointments in create mode (step 2) ───────────────────────── */
  useEffect(() => {
    if (mode !== 'create' || !selectedPatient || appt) return
    setApptLoading(true)
    appointmentsService.list({ patientId: selectedPatient._id })
      .then(res => setApptResults(res.data ?? []))
      .catch(() => toast.error('Failed to load appointments'))
      .finally(() => setApptLoading(false))
  }, [mode, selectedPatient, appt])

  const selectAppt = (a: Appointment) => {
    setAppt(a)
    setApptSearch('')
    setPatientSearch('')
    setItems([emptyItem()])
  }

  /* ── Item helpers ────────────────────────────────────────────────────── */
  const addItem = () => setItems(prev => [...prev, emptyItem()])

  const updateItem = (i: number, patch: Partial<BillItem>) => {
    setItems(prev => prev.map((it, idx) => {
      if (idx !== i) return it
      const updated = { ...it, ...patch }
      updated.amount = updated.quantity * updated.rate
      return updated
    }))
  }

  const removeItem = (i: number) => {
    if (items.length === 1) return
    setItems(prev => prev.filter((_, idx) => idx !== i))
  }

  /* ── Calculated totals ───────────────────────────────────────────────── */
  const subtotal    = items.reduce((s, it) => s + it.amount, 0)
  const discountAmt = (subtotal * discountPct) / 100
  const taxAmt      = ((subtotal - discountAmt) * taxPct) / 100
  const grandTotal  = subtotal - discountAmt + taxAmt
  const paidAmt     = bill?.paidAmount ?? 0
  const balance     = grandTotal - paidAmt

  /* ── Context ─────────────────────────────────────────────────────────── */
  const patient = bill?.patientId ?? appt?.patientId ?? null
  const doctor  = bill?.doctorId  ?? appt?.doctorId  ?? null
  const apptClinicId = appt?.clinicId
    ? (typeof appt.clinicId === 'object' ? appt.clinicId._id : appt.clinicId)
    : undefined
  const clinicId = bill?.clinicId?._id ?? apptClinicId ?? user?.clinicId ?? ''

  /* ── Save ────────────────────────────────────────────────────────────── */
  const handleSave = async () => {
    if (!patient || !doctor) {
      toast.error(mode === 'create' ? 'Select an appointment first' : 'Missing patient or doctor')
      return
    }
    const validItems = items.filter(it => it.description.trim())
    if (validItems.length === 0) {
      toast.error('Add at least one bill item')
      return
    }

    const payload: Record<string, unknown> = {
      patientId: patient._id,
      doctorId:  doctor._id,
      items:     validItems,
      discount:  discountAmt,
      tax:       taxAmt,
      notes,
    }
    if (clinicId) payload.clinicId = clinicId
    const apptId = bill?.appointmentId?._id ?? appt?._id
    if (apptId) payload.appointmentId = apptId

    setSaving(true)
    try {
      if (mode === 'create') {
        const created: Bill = await billingService.create(payload)
        toast.success(`Bill created — ${created.invoiceNumber}`)
        setSelectedId(created._id)
        setRoute('billing')
      } else {
        const updated: Bill = await billingService.update(bill!._id, payload)
        setBill(updated)
        setMode('view')
        toast.success('Bill updated')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  /* ── Record payment ──────────────────────────────────────────────────── */
  const handlePay = async () => {
    if (!bill) return
    const amt = Number(payAmount)
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return }
    setPaying(true)
    try {
      const updated: Bill = await billingService.pay(bill._id, amt, payMethod)
      setBill(updated)
      setPayOpen(false)
      setPayAmount('')
      toast.success('Payment recorded')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment failed')
    } finally {
      setPaying(false)
    }
  }

  /* ── Print / PDF ─────────────────────────────────────────────────────── */
  const handlePrint = () => window.print()

  const handleDownloadPdf = async () => {
    if (!bill) return
    const el = document.getElementById('bill-print-area')
    if (!el) return
    el.style.display = 'block'
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgW  = pageW - 20
      const imgH  = imgW / (canvas.width / canvas.height)
      if (imgH <= pageH - 20) {
        pdf.addImage(imgData, 'PNG', 10, 10, imgW, imgH)
      } else {
        let remaining = imgH; let y = 10
        while (remaining > 0) {
          const sliceH = Math.min(remaining, pageH - 20)
          pdf.addImage(imgData, 'PNG', 10, y, imgW, imgH, undefined, 'FAST', 0)
          remaining -= sliceH
          if (remaining > 0) { pdf.addPage(); y = 10 }
        }
      }
      pdf.save(`${bill.invoiceNumber}.pdf`)
      toast.success('PDF downloaded')
    } catch {
      toast.error('Failed to generate PDF')
    } finally {
      el.style.display = 'none'
    }
  }

  const goBack = () => {
    setSelectedId(null)
    setRoute('billing')
  }

  const isEditable = mode === 'create' || mode === 'edit'
  const title = mode === 'create'
    ? (!selectedPatient ? 'New Bill' : !appt ? selectedPatient.name : 'New Bill')
    : (bill?.invoiceNumber ?? 'Bill Detail')
  const crumb = mode === 'create'
    ? (!selectedPatient ? 'Step 1 — Select patient' : !appt ? 'Step 2 — Select appointment' : 'Step 3 — Enter bill details')
    : `Patient billing · ${bill?.invoiceNumber ?? ''}`
  const canAct = bill && bill.status !== 'paid' && bill.status !== 'cancelled'

  /* ── Patient table filter ────────────────────────────────────────────── */
  const filteredPatients = patientResults.filter(p => {
    const pq = patientSearch.toLowerCase()
    if (!pq) return true
    return (
      (p.name  ?? '').toLowerCase().includes(pq) ||
      (p.phone ?? '').toLowerCase().includes(pq) ||
      (p.tag   ?? '').toLowerCase().includes(pq)
    )
  })

  /* ── Appointment table filter ────────────────────────────────────────── */
  const q = apptSearch.toLowerCase()
  const filteredAppts = apptResults.filter(a =>
    !q ||
    (a.doctorId?.name  ?? '').toLowerCase().includes(q) ||
    (a.tokenNumber     ?? '').toLowerCase().includes(q) ||
    (a.status          ?? '').toLowerCase().includes(q)
  )

  /* ── Loading ─────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="df-shell">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--fg-muted)', fontSize: 14 }}>
          Loading bill…
        </div>
      </div>
    )
  }

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="df-shell">

      {/* ── Topbar ── */}
      <div className="df-topbar">
        <button className="btn btn-ghost btn-sm" style={{ gap: 4 }} onClick={goBack}>
          <Icon name="chevL" size={15} /> Back
        </button>

        <div style={{ flex: 1, marginLeft: 8 }}>
          <div className="df-topbar-title">{title}</div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 1, fontWeight: 500 }}>{crumb}</div>
        </div>

        {mode === 'view' && bill && (
          <>
            <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
              <Icon name="printer" size={13} /> Print
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleDownloadPdf}>
              <Icon name="download" size={13} /> Download PDF
            </button>
          </>
        )}
        {mode === 'view' && canAct && (
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setMode('edit')}>
              <Icon name="edit" size={13} /> Edit
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setPayOpen(true)}>
              <Icon name="check" size={13} /> Record Payment
            </button>
          </>
        )}
        {mode === 'edit' && (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setMode('view')}>Cancel</button>
            <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleSave}>
              <Icon name="check" size={13} /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </>
        )}
        {mode === 'create' && (
          <button className="btn btn-primary btn-sm" disabled={saving || !patient} onClick={handleSave}>
            <Icon name="check" size={13} /> {saving ? 'Creating…' : 'Create Bill'}
          </button>
        )}
      </div>

      <div className="df-body" style={{ background: 'var(--bg-app)' }}>
        <div className="df-panel" style={{ maxWidth: '100%', paddingTop: 20 }}>

          {/* ── Step indicator (steps 1 & 2) ── */}
          {mode === 'create' && !appt && (() => {
            const STEPS = ['Select Patient', 'Select Appointment', 'Enter Bill Details']
            const currentStepIdx = !selectedPatient ? 0 : 1
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
                {STEPS.map((label, idx) => {
                  const done   = idx < currentStepIdx
                  const active = idx === currentStepIdx
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', flex: idx < STEPS.length - 1 ? 1 : undefined }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0,
                          background: done ? '#0d9488' : active ? 'var(--brand-gradient)' : 'var(--bg-section)',
                          color: done || active ? 'white' : 'var(--fg-muted)',
                        }}>
                          {done ? '✓' : idx + 1}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? 'var(--fg-primary)' : done ? '#0d9488' : 'var(--fg-muted)', whiteSpace: 'nowrap' }}>
                          {label}
                        </span>
                      </div>
                      {idx < STEPS.length - 1 && (
                        <div style={{ flex: 1, height: 1, background: done ? '#0d9488' : 'var(--border-soft)', margin: '0 12px' }} />
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })()}

          {/* ── Step 1: Select Patient ── */}
          {mode === 'create' && !selectedPatient && (
            <div className="table-card" style={{ marginBottom: 24 }}>
              <div className="table-toolbar">
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)' }}>Select Patient</div>
                <div className="table-search" style={{ marginLeft: 'auto' }}>
                  <Icon name="search" size={15} />
                  <input
                    value={patientSearch}
                    onChange={e => setPatientSearch(e.target.value)}
                    placeholder="Search name, phone or tag…"
                  />
                </div>
              </div>
              <table className="data">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Phone</th>
                    <th>Tag</th>
                    <th>Gender</th>
                    <th style={{ textAlign: 'right' }}>Select</th>
                  </tr>
                </thead>
                <tbody>
                  {patientLoading ? (
                    [1, 2, 3, 4].map(n => (
                      <tr key={n}>
                        {[1, 2, 3, 4, 5].map(c => (
                          <td key={c}><div style={{ height: 14, borderRadius: 4, background: 'var(--bg-section)', width: '80%' }} /></td>
                        ))}
                      </tr>
                    ))
                  ) : filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--fg-muted)' }}>
                        {patientSearch ? `No patients match "${patientSearch}"` : 'No patients found'}
                      </td>
                    </tr>
                  ) : filteredPatients.map((p: any) => (
                    <tr key={p._id} style={{ cursor: 'pointer' }} onClick={() => setSelectedPatient(p)}>
                      <td>
                        <div className="cell-person">
                          <div className="av indigo" style={{ width: 32, height: 32, fontSize: 12 }}>
                            {getInitials(p.name ?? 'UN')}
                          </div>
                          <div className="info">
                            <div className="n">{p.name}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>{p.phone ?? '—'}</td>
                      <td>
                        {p.tag && (
                          <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 11.5, fontWeight: 600, background: 'var(--brand-gradient-soft)', color: 'var(--teal-800)' }}>
                            {p.tag}
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--fg-secondary)', textTransform: 'capitalize' }}>{p.gender ?? '—'}</td>
                      <td>
                        <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={e => { e.stopPropagation(); setSelectedPatient(p) }}
                          >
                            Select
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Step 2: Select Appointment ── */}
          {mode === 'create' && selectedPatient && !appt && (
            <div className="table-card" style={{ marginBottom: 24 }}>
              <div className="table-toolbar">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setSelectedPatient(null); setApptResults([]); setApptSearch('') }}
                >
                  <Icon name="chevL" size={13} /> Back
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
                  <div className="av indigo" style={{ width: 26, height: 26, fontSize: 11, fontWeight: 700 }}>
                    {getInitials(selectedPatient.name ?? 'UN')}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>{selectedPatient.name}</span>
                  {selectedPatient.phone && (
                    <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{selectedPatient.phone}</span>
                  )}
                </div>
                <div className="table-search" style={{ marginLeft: 'auto' }}>
                  <Icon name="search" size={15} />
                  <input
                    value={apptSearch}
                    onChange={e => setApptSearch(e.target.value)}
                    placeholder="Search doctor or status…"
                  />
                </div>
              </div>
              <table className="data">
                <thead>
                  <tr>
                    <th>Appointment ID</th>
                    <th>Doctor</th>
                    <th>Date &amp; Time</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th style={{ width: 90 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {apptLoading ? (
                    [1, 2, 3].map(n => (
                      <tr key={n}>
                        {[1, 2, 3, 4, 5, 6].map(c => (
                          <td key={c}><div style={{ height: 14, borderRadius: 4, background: 'var(--bg-section)', width: '80%' }} /></td>
                        ))}
                      </tr>
                    ))
                  ) : filteredAppts.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--fg-muted)' }}>
                        {apptSearch ? `No appointments match "${apptSearch}"` : 'No appointments found for this patient'}
                      </td>
                    </tr>
                  ) : filteredAppts.map(a => (
                    <tr key={a._id} style={{ cursor: 'pointer' }} onClick={() => selectAppt(a)}>
                      <td>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--fg-primary)' }}>
                          #{a._id.slice(-8).toUpperCase()}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Dr. {a.doctorId?.name ?? '—'}</div>
                        {a.doctorId?.specialization && (
                          <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2 }}>{a.doctorId.specialization}</div>
                        )}
                      </td>
                      <td>
                        {a.date && (
                          <div style={{ fontSize: 13 }}>
                            {new Date(a.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                        {a.time && <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2 }}>{a.time}</div>}
                      </td>
                      <td style={{ fontSize: 12.5, color: 'var(--fg-secondary)', textTransform: 'capitalize' }}>
                        {(a as any).type ?? '—'}
                      </td>
                      <td>
                        <Badge variant={
                          a.status === 'completed'   ? 'success' :
                          a.status === 'cancelled'   ? 'muted'   :
                          a.status === 'in-progress' ? 'warning' : 'info'
                        } dot>
                          {a.status ?? '—'}
                        </Badge>
                      </td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={e => { e.stopPropagation(); selectAppt(a) }}
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Patient / Doctor info card ── */}
          {patient && (
            <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 20, justifyContent: 'space-between' }}>
              {/* Patient */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="av indigo" style={{ width: 44, height: 44, fontSize: 15, fontWeight: 700, flexShrink: 0, borderRadius: '50%' }}>
                  {getInitials(patient.name ?? 'UN')}
                </div>
                <div>
                  <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', fontWeight: 500 }}>Patient</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)' }}>{patient.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>
                    {patient.tag && `${patient.tag} · `}{patient.phone ?? ''}
                  </div>
                </div>
              </div>

              {/* Doctor */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="av teal" style={{ width: 44, height: 44, fontSize: 15, fontWeight: 700, flexShrink: 0, borderRadius: '50%' }}>
                  {(doctor?.name ?? 'DR').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', fontWeight: 500 }}>Doctor</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)' }}>Dr. {doctor?.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>{doctor?.specialization ?? '—'}</div>
                </div>
              </div>

              {/* Status */}
              <div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', fontWeight: 500, marginBottom: 4 }}>Status</div>
                {bill ? (
                  <>
                    <Badge variant={statusVariant(bill.status)} dot>
                      {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                    </Badge>
                    {bill.appointmentId?.tokenNumber && (
                      <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 4 }}>
                        Token {bill.appointmentId.tokenNumber}
                      </div>
                    )}
                  </>
                ) : (
                  <Badge variant="muted" dot>Draft</Badge>
                )}
              </div>

              {/* Invoice info */}
              {bill && (
                <div>
                  <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', fontWeight: 500 }}>Invoice</div>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--fg-primary)' }}>
                    {bill.invoiceNumber}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>
                    {new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Bill items + summary ── */}
          {(patient || mode !== 'create') && (
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

              {/* Items table */}
              <div className="table-card" style={{ flex: 1 }}>
                <div className="table-toolbar">
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)' }}>Bill Items</div>
                  {isEditable && (
                    <button className="btn btn-secondary btn-sm" onClick={addItem}>
                      <Icon name="plus" size={13} /> Add item
                    </button>
                  )}
                </div>

                {items.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--fg-muted)' }}>
                    <Icon name="receipt" size={28} />
                    <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600 }}>No items yet</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Click "Add item" to get started</div>
                  </div>
                ) : (
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th style={{ width: 80, textAlign: 'center' }}>Qty</th>
                        <th style={{ width: 120 }}>Rate (₹)</th>
                        <th style={{ width: 120 }}>Amount (₹)</th>
                        {isEditable && <th style={{ width: 44 }} />}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, i) => (
                        <tr key={i}>
                          <td>
                            {isEditable ? (
                              <input
                                className="form-input"
                                style={{ width: '100%', minWidth: 180 }}
                                value={it.description}
                                onChange={e => updateItem(i, { description: e.target.value })}
                                placeholder="e.g. Consultation Fee"
                              />
                            ) : (
                              <span style={{ fontWeight: 600, fontSize: 13.5 }}>{it.description || '—'}</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {isEditable ? (
                              <input
                                className="form-input"
                                type="number" min={1}
                                style={{ width: 68, textAlign: 'center' }}
                                value={it.quantity}
                                onChange={e => updateItem(i, { quantity: Math.max(1, Number(e.target.value)) })}
                              />
                            ) : (
                              <span>{it.quantity}</span>
                            )}
                          </td>
                          <td>
                            {isEditable ? (
                              <input
                                className="form-input"
                                type="number" min={0}
                                style={{ width: 108 }}
                                value={it.rate === 0 ? '' : it.rate}
                                placeholder="0.00"
                                onChange={e => updateItem(i, { rate: e.target.value === '' ? 0 : Number(e.target.value) })}
                              />
                            ) : (
                              <span>{fmt(it.rate)}</span>
                            )}
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--teal-800)' }}>
                            {fmt(it.amount)}
                          </td>
                          {isEditable && (
                            <td>
                              <button
                                className="act danger"
                                onClick={() => removeItem(i)}
                                disabled={items.length === 1}
                                title="Remove item"
                              >
                                <Icon name="trash" size={13} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Notes */}
                <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-light)' }}>
                  <label style={{
                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.05em', color: 'var(--fg-muted)',
                    display: 'block', marginBottom: 7,
                  }}>
                    Notes
                  </label>
                  {isEditable ? (
                    <textarea
                      className="form-textarea"
                      rows={2}
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Any remarks or special instructions…"
                    />
                  ) : (
                    <div style={{ fontSize: 13.5, color: notes ? 'var(--fg-primary)' : 'var(--fg-muted)' }}>
                      {notes || '—'}
                    </div>
                  )}
                </div>
              </div>

              {/* Summary sidebar */}
              <div className="card" style={{ width: 300, flexShrink: 0, position: 'sticky', top: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 18, color: 'var(--fg-primary)' }}>
                  Bill Summary
                </div>

                <SumRow label="Subtotal" value={fmt(subtotal)} />

                {/* Discount */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
                  <span style={{ fontSize: 13.5, color: 'var(--fg-secondary)' }}>Discount (%)</span>
                  {isEditable ? (
                    <input
                      type="number" className="form-input"
                      style={{ width: 72, padding: '4px 8px', fontSize: 13, textAlign: 'right' }}
                      value={discountPct} min={0} max={100}
                      onChange={e => setDiscountPct(Number(e.target.value))}
                    />
                  ) : (
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>{discountPct}%</span>
                  )}
                </div>
                {discountAmt > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 12.5, color: 'var(--fg-muted)' }}>
                    <span>  Discount amount</span>
                    <span>− {fmt(discountAmt)}</span>
                  </div>
                )}

                {/* Tax */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
                  <span style={{ fontSize: 13.5, color: 'var(--fg-secondary)' }}>GST (%)</span>
                  {isEditable ? (
                    <input
                      type="number" className="form-input"
                      style={{ width: 72, padding: '4px 8px', fontSize: 13, textAlign: 'right' }}
                      value={taxPct} min={0} max={28}
                      onChange={e => setTaxPct(Number(e.target.value))}
                    />
                  ) : (
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>{taxPct}%</span>
                  )}
                </div>
                {taxAmt > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 12.5, color: 'var(--fg-muted)' }}>
                    <span>  Tax amount</span>
                    <span>+ {fmt(taxAmt)}</span>
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--border-soft)', margin: '12px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>Total</span>
                  <span style={{
                    fontSize: 18, fontWeight: 800,
                    background: 'var(--brand-gradient)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>
                    {fmt(grandTotal)}
                  </span>
                </div>

                {bill && (
                  <>
                    <SumRow label="Paid" value={fmt(paidAmt)} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: balance > 0 ? 'var(--danger-500)' : 'var(--success-500)' }}>
                        Balance due
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: balance > 0 ? 'var(--danger-500)' : 'var(--success-500)' }}>
                        {fmt(Math.max(0, balance))}
                      </span>
                    </div>
                    {bill.paymentMethod && (
                      <div style={{ marginTop: 8, fontSize: 12.5, color: 'var(--fg-secondary)' }}>
                        Method: <strong>{bill.paymentMethod.toUpperCase()}</strong>
                        {bill.paidAt && (
                          <> · {new Date(bill.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</>
                        )}
                      </div>
                    )}
                  </>
                )}

                {mode === 'view' && canAct && (
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}
                    onClick={() => setPayOpen(true)}
                  >
                    <Icon name="check" size={14} /> Record Payment
                  </button>
                )}
                {mode === 'create' && (
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}
                    disabled={saving || !patient}
                    onClick={handleSave}
                  >
                    <Icon name="check" size={14} />
                    {saving ? 'Creating…' : `Create Bill · ${fmt(grandTotal)}`}
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Payment modal ── */}
      {payOpen && bill && (
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
                <div style={{ fontWeight: 700, fontSize: 15 }}>{fmt(bill.total)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-secondary)' }}>Already paid</div>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--success-500)' }}>{fmt(bill.paidAmount)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11.5, color: 'var(--fg-secondary)' }}>Balance</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--danger-500)' }}>
                  {fmt(Math.max(0, bill.total - bill.paidAmount))}
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
                placeholder={`Up to ₹${(bill.total - bill.paidAmount).toFixed(2)}`}
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
              <button className="btn btn-ghost btn-sm" onClick={() => setPayOpen(false)} disabled={paying}>Cancel</button>
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
      )}

      {/* ── Print / PDF area (hidden on screen, visible when printing) ── */}
      {bill && (
        <div id="bill-print-area" style={{ display: 'none', fontFamily: 'Arial, sans-serif', color: '#111', background: '#fff', padding: 24, maxWidth: 794 }}>
          <style>{`
            @media print {
              body > * { display: none !important; }
              #bill-print-area { display: block !important; }
              #bill-print-area * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              @page { margin: 16mm; size: A4; }
            }
          `}</style>

          {/* Header */}
          <div style={{ borderBottom: '2px solid #1a3c6e', paddingBottom: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#1a3c6e' }}>{bill.clinicId?.name ?? 'Clinic'}</div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{bill.clinicId?.address ?? ''}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a3c6e' }}>INVOICE</div>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#333', marginTop: 2 }}>{bill.invoiceNumber}</div>
              <div style={{ fontSize: 11, color: '#555' }}>
                {new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Patient & Doctor */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: '#f5f7fb', borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Patient</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{bill.patientId?.name}</div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
                {bill.patientId?.gender && `${bill.patientId.gender} · `}{bill.patientId?.phone ?? ''}
              </div>
              {bill.patientId?.tag && <div style={{ fontSize: 11, color: '#555' }}>{bill.patientId.tag}</div>}
            </div>
            <div style={{ background: '#f5f7fb', borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Doctor</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Dr. {bill.doctorId?.name}</div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{bill.doctorId?.specialization ?? ''}</div>
            </div>
          </div>

          {/* Items table */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Bill Items</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#1a3c6e', color: 'white' }}>
                  <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600 }}>#</th>
                  <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600 }}>Description</th>
                  <th style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 600 }}>Qty</th>
                  <th style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>Rate</th>
                  <th style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((it, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e5e7eb', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={{ padding: '7px 10px', color: '#888' }}>{i + 1}</td>
                    <td style={{ padding: '7px 10px', fontWeight: 600 }}>{it.description}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'center' }}>{it.quantity}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right' }}>₹{it.rate.toFixed(2)}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>₹{it.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bill summary */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <div style={{ width: 260 }}>
              {[
                { label: 'Subtotal', value: `₹${bill.subtotal.toFixed(2)}` },
                bill.discount > 0 ? { label: 'Discount', value: `− ₹${bill.discount.toFixed(2)}` } : null,
                bill.tax > 0      ? { label: 'GST',      value: `+ ₹${bill.tax.toFixed(2)}` }      : null,
              ].filter(Boolean).map((r: any) => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', color: '#555' }}>
                  <span>{r.label}</span><span>{r.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, borderTop: '2px solid #1a3c6e', marginTop: 6, paddingTop: 6, color: '#1a3c6e' }}>
                <span>Total</span><span>₹{bill.total.toFixed(2)}</span>
              </div>
              {bill.paidAmount > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', color: '#16a34a' }}>
                    <span>Paid ({bill.paymentMethod?.toUpperCase() ?? ''})</span>
                    <span>₹{bill.paidAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: bill.total - bill.paidAmount > 0 ? '#dc2626' : '#16a34a' }}>
                    <span>Balance</span>
                    <span>₹{Math.max(0, bill.total - bill.paidAmount).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Notes */}
          {bill.notes && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '10px 14px', marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Notes</div>
              <div style={{ fontSize: 12, color: '#333' }}>{bill.notes}</div>
            </div>
          )}

          {/* Footer */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
            <div style={{ fontSize: 10, color: '#aaa' }}>
              Status: <strong style={{ textTransform: 'capitalize' }}>{bill.status}</strong>
              {bill.paidAt && ` · Paid on ${new Date(bill.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 140, borderTop: '1px solid #333', paddingTop: 4, fontSize: 10, color: '#555' }}>Authorised Signatory</div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
