import { useState, useEffect, useRef } from 'react'
import Icon from '@/components/ui/Icon'
import Badge from '@/components/ui/Badge'
import { useAppStore } from '@/store/app'
import { useAuthStore } from '@/store/auth'
import { pharmacyService } from '@/services/pharmacy.service'
import { appointmentsService } from '@/services/appointments.service'
import { patientsService } from '@/services/patients.service'
import { masterdataService } from '@/services/masterdata.service'
import { toast } from '@/store/toast'

/* ── Types ───────────────────────────────────────────────────────────────── */
type PayMethod  = 'cash' | 'upi' | 'card' | 'insurance' | 'online'
type RxStatus   = 'pending' | 'dispensed' | 'partial' | 'paid' | 'cancelled'

interface Medicine {
  name:     string
  dosage:   string
  quantity: number
  unit:     string
  rate:     number
  amount:   number
  status:   'available' | 'partial' | 'out-of-stock'
}

interface PharmacyOrder {
  _id:            string
  orderId:        string
  patientId:      { _id: string; name: string; phone?: string; tag?: string; gender?: string }
  doctorId:       { _id: string; name: string; specialization?: string }
  clinicId:       { _id: string; name: string }
  appointmentId?: { _id: string; tokenNumber?: string; date?: string; time?: string }
  medicines:      Medicine[]
  subtotal:       number
  discount:       number
  gst:            number
  total:          number
  finalAmount:    number
  paidAmount:     number
  status:         RxStatus
  paymentMethod?: PayMethod
  paidAt?:        string
  notes?:         string
  createdAt:      string
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

const MED_UNITS = [
  'Tablet', 'Capsule', 'mL', 'mg', 'mcg',
  'Sachet', 'Drop', 'Patch', 'Cream', 'Ointment',
  'Syrup', 'Injection', 'Inhaler', 'Suppository',
]

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function statusVariant(s: RxStatus) {
  if (s === 'paid')      return 'success' as const
  if (s === 'dispensed') return 'success' as const
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

function emptyMed(): Medicine {
  return { name: '', dosage: '', quantity: 1, unit: 'tablet', rate: 0, amount: 0, status: 'available' }
}

/* ── Medicine combobox ───────────────────────────────────────────────────── */
interface MedResult { _id: string; label: string; value: string }

function MedicineCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query,   setQuery]   = useState(value)
  const [results, setResults] = useState<MedResult[]>([])
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const debRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const search = async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const res = await masterdataService.list({ category: 'medicine', search: q })
      setResults(res.data ?? [])
      setOpen(true)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleInput = (v: string) => {
    setQuery(v)
    onChange(v)
    if (debRef.current) clearTimeout(debRef.current)
    debRef.current = setTimeout(() => search(v), 250)
  }

  const select = (item: MedResult) => {
    setQuery(item.label)
    onChange(item.label)
    setOpen(false)
    setResults([])
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', minWidth: 160 }}>
      <input
        className="form-input"
        style={{ width: '100%' }}
        value={query}
        onChange={e => handleInput(e.target.value)}
        onFocus={() => { if (results.length) setOpen(true) }}
        placeholder="Search medicine…"
        autoComplete="off"
      />
      {loading && (
        <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--fg-muted)' }}>
          …
        </div>
      )}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--bg-surface)', border: '1px solid var(--border-soft)',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
          zIndex: 200, maxHeight: 220, overflowY: 'auto',
        }}>
          {results.map((r, i) => (
            <button
              key={r._id}
              type="button"
              onMouseDown={() => select(r)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '9px 14px', border: 'none', background: 'transparent',
                fontSize: 13, cursor: 'pointer', color: 'var(--fg-primary)',
                borderBottom: i < results.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-section)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
      {open && !loading && query.trim().length > 1 && results.length === 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--bg-surface)', border: '1px solid var(--border-soft)',
          borderRadius: 10, padding: '10px 14px',
          fontSize: 12.5, color: 'var(--fg-muted)',
          zIndex: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
        }}>
          No medicines found — you can still type a custom name
        </div>
      )}
    </div>
  )
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
export default function PharmacyDetail() {
  const { selectedId, setSelectedId, setRoute } = useAppStore()
  const { user } = useAuthStore()

  const [mode, setMode]       = useState<'create' | 'view' | 'edit'>(selectedId ? 'view' : 'create')
  const [order, setOrder]     = useState<PharmacyOrder | null>(null)
  const [appt, setAppt]       = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(!!selectedId)

  // Form fields
  const [medicines,   setMedicines]   = useState<Medicine[]>([emptyMed()])
  const [discountPct, setDiscountPct] = useState(0)
  const [gstPct,      setGstPct]      = useState(0)
  const [notes,       setNotes]       = useState('')
  const [saving,      setSaving]      = useState(false)

  // Payment
  const [payOpen,   setPayOpen]   = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState<PayMethod>('cash')
  const [paying,    setPaying]    = useState(false)

  // Dispensing
  const [dispensing, setDispensing] = useState(false)

  // Step 1 — patient selection (create mode)
  const [patientSearch,  setPatientSearch]  = useState('')
  const [patientResults, setPatientResults] = useState<any[]>([])
  const [patientLoading, setPatientLoading] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null)

  // Step 2 — appointment selection (create mode)
  const [apptSearch,  setApptSearch]  = useState('')
  const [apptResults, setApptResults] = useState<Appointment[]>([])
  const [apptLoading, setApptLoading] = useState(false)

  /* ── Load existing order ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    pharmacyService.get(selectedId)
      .then((o: PharmacyOrder) => {
        setOrder(o)
        setMedicines(o.medicines.length > 0 ? o.medicines : [emptyMed()])
        const sub = o.medicines.reduce((s, m) => s + m.amount, 0)
        setDiscountPct(sub > 0 ? Math.round((o.discount / sub) * 100) : 0)
        setGstPct(0)
        setNotes(o.notes ?? '')
        setMode('view')
      })
      .catch(() => toast.error('Failed to load pharmacy order'))
      .finally(() => setLoading(false))
  }, [selectedId])

  /* ── Step 1: load patients in create mode ───────────────────────────── */
  useEffect(() => {
    if (mode !== 'create' || selectedPatient) return
    setPatientLoading(true)
    patientsService.list({})
      .then(res => setPatientResults(res.data ?? []))
      .catch(() => toast.error('Failed to load patients'))
      .finally(() => setPatientLoading(false))
  }, [mode, selectedPatient])

  /* ── Step 2: load appointments for selected patient ─────────────────── */
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
    setMedicines([emptyMed()])
  }

  /* ── Medicine helpers ────────────────────────────────────────────────── */
  const addMed = () => setMedicines(prev => [...prev, emptyMed()])

  const updateMed = (i: number, patch: Partial<Medicine>) => {
    setMedicines(prev => prev.map((m, idx) => {
      if (idx !== i) return m
      const updated = { ...m, ...patch }
      updated.amount = updated.quantity * updated.rate
      return updated
    }))
  }

  const removeMed = (i: number) => {
    if (medicines.length === 1) return
    setMedicines(prev => prev.filter((_, idx) => idx !== i))
  }

  /* ── Calculated totals ───────────────────────────────────────────────── */
  const subtotal    = medicines.reduce((s, m) => s + m.amount, 0)
  const discountAmt = (subtotal * discountPct) / 100
  const gstAmt      = ((subtotal - discountAmt) * gstPct) / 100
  const grandTotal  = subtotal - discountAmt + gstAmt
  const paidAmt     = order?.paidAmount ?? 0
  const balance     = grandTotal - paidAmt

  /* ── Context ─────────────────────────────────────────────────────────── */
  const patient  = order?.patientId  ?? appt?.patientId  ?? null
  const doctor   = order?.doctorId   ?? appt?.doctorId   ?? null
  const apptClinicId = appt?.clinicId
    ? (typeof appt.clinicId === 'object' ? appt.clinicId._id : appt.clinicId)
    : undefined
  const clinicId = order?.clinicId?._id ?? apptClinicId ?? user?.clinicId ?? ''

  /* ── Save ────────────────────────────────────────────────────────────── */
  const handleSave = async () => {
    if (!patient || !doctor) {
      toast.error(mode === 'create' ? 'Select an appointment first' : 'Missing patient or doctor')
      return
    }
    const validMeds = medicines.filter(m => m.name.trim())
    if (validMeds.length === 0) {
      toast.error('Add at least one medicine')
      return
    }

    const payload: Record<string, unknown> = {
      patientId:  patient._id,
      doctorId:   doctor._id,
      medicines:  validMeds,
      discount:   discountAmt,
      gstPct,
      notes,
    }
    if (clinicId) payload.clinicId = clinicId
    const apptId = order?.appointmentId?._id ?? appt?._id
    if (apptId) payload.appointmentId = apptId

    setSaving(true)
    try {
      if (mode === 'create') {
        const created: PharmacyOrder = await pharmacyService.create(payload)
        toast.success(`Prescription created — ${created.orderId}`)
        setSelectedId(created._id)
        setRoute('pharmacy')
      } else {
        const updated: PharmacyOrder = await pharmacyService.update(order!._id, payload)
        setOrder(updated)
        setMode('view')
        toast.success('Prescription updated')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  /* ── Dispense ────────────────────────────────────────────────────────── */
  const handleDispense = async () => {
    if (!order) return
    setDispensing(true)
    try {
      const updated: PharmacyOrder = await pharmacyService.dispense(order._id)
      setOrder(updated)
      toast.success('Prescription dispensed')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Dispense failed')
    } finally {
      setDispensing(false)
    }
  }

  /* ── Record payment ──────────────────────────────────────────────────── */
  const handlePay = async () => {
    if (!order) return
    const amt = Number(payAmount)
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return }
    setPaying(true)
    try {
      const updated: PharmacyOrder = await pharmacyService.pay(order._id, amt, payMethod)
      setOrder(updated)
      setPayOpen(false)
      setPayAmount('')
      toast.success('Payment recorded')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment failed')
    } finally {
      setPaying(false)
    }
  }

  const goBack = () => {
    setSelectedId(null)
    setRoute('pharmacy')
  }

  const handlePrint = () => window.print()

  const handleDownloadPdf = async () => {
    if (!order) return
    const el = document.getElementById('rx-print-area')
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
      const ratio = canvas.width / canvas.height
      const imgW  = pageW - 20
      const imgH  = imgW / ratio
      let y = 10
      if (imgH <= pageH - 20) {
        pdf.addImage(imgData, 'PNG', 10, y, imgW, imgH)
      } else {
        let remaining = imgH
        let srcY = 0
        while (remaining > 0) {
          const sliceH = Math.min(remaining, pageH - 20)
          pdf.addImage(imgData, 'PNG', 10, y, imgW, imgH, undefined, 'FAST', 0)
          remaining -= sliceH
          srcY += sliceH
          if (remaining > 0) { pdf.addPage(); y = 10 }
        }
      }
      pdf.save(`${order.orderId}.pdf`)
      toast.success('PDF downloaded')
    } catch {
      toast.error('Failed to generate PDF')
    } finally {
      el.style.display = 'none'
    }
  }

  const isEditable = mode === 'create' || mode === 'edit'
  const title      = mode === 'create'
    ? (!selectedPatient ? 'New Prescription' : !appt ? selectedPatient.name : 'New Prescription')
    : (order?.orderId ?? 'Rx Detail')
  const crumb      = mode === 'create'
    ? (!selectedPatient ? 'Step 1 — Select patient' : !appt ? 'Step 2 — Select appointment' : 'Step 3 — Enter prescription details')
    : `Pharmacy · ${order?.orderId ?? ''}`
  const canAct     = order && order.status !== 'paid' && order.status !== 'cancelled'

  /* ── Loading ─────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="df-shell">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--fg-muted)', fontSize: 14 }}>
          Loading prescription…
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

        {mode === 'view' && order && (
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
            {(order.status === 'pending') && (
              <button className="btn btn-secondary btn-sm" disabled={dispensing} onClick={handleDispense}>
                <Icon name="check" size={13} /> {dispensing ? 'Dispensing…' : 'Dispense'}
              </button>
            )}
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
        {mode === 'create' && appt && (
          <button className="btn btn-primary btn-sm" disabled={saving || !patient} onClick={handleSave}>
            <Icon name="check" size={13} /> {saving ? 'Creating…' : 'Create Rx'}
          </button>
        )}
      </div>

      <div className="df-body" style={{ background: 'var(--bg-app)' }}>
        <div className="df-panel" style={{ maxWidth: '100%', paddingTop: 20 }}>

          {/* ── Step indicator (create mode) ── */}
          {mode === 'create' && !appt && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 20 }}>
              {[
                { n: 1, label: 'Select Patient',     done: !!selectedPatient },
                { n: 2, label: 'Select Appointment', done: false },
                { n: 3, label: 'Prescription',       done: false },
              ].map((s, i) => {
                const active = (i === 0 && !selectedPatient) || (i === 1 && !!selectedPatient)
                return (
                  <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 16px', borderRadius: 10,
                      background: active ? 'var(--brand-gradient)' : s.done ? 'var(--bg-section)' : 'transparent',
                    }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 800,
                        background: active ? 'rgba(255,255,255,0.25)' : s.done ? 'var(--teal-500)' : 'var(--border-soft)',
                        color: active ? 'white' : s.done ? 'white' : 'var(--fg-muted)',
                      }}>
                        {s.done ? <Icon name="check" size={11} /> : s.n}
                      </div>
                      <span style={{
                        fontSize: 13, fontWeight: 600,
                        color: active ? 'white' : s.done ? 'var(--fg-primary)' : 'var(--fg-muted)',
                      }}>
                        {s.label}
                      </span>
                    </div>
                    {i < 2 && (
                      <div style={{ width: 32, height: 1, background: 'var(--border-soft)', flexShrink: 0 }} />
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Step 1: Patient selection ── */}
          {mode === 'create' && !selectedPatient && (() => {
            const q = patientSearch.toLowerCase()
            const filtered = patientResults.filter(p =>
              !q ||
              (p.name ?? '').toLowerCase().includes(q) ||
              (p.phone ?? '').toLowerCase().includes(q) ||
              (p.tag ?? '').toLowerCase().includes(q)
            )
            return (
              <div className="table-card" style={{ marginBottom: 24 }}>
                <div className="table-toolbar">
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)' }}>
                    Select Patient
                  </div>
                  <div className="table-search" style={{ marginLeft: 'auto' }}>
                    <Icon name="search" size={15} />
                    <input
                      value={patientSearch}
                      onChange={e => setPatientSearch(e.target.value)}
                      placeholder="Search name, phone, ID…"
                      autoFocus
                    />
                  </div>
                </div>
                <table className="data">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Phone</th>
                      <th>Tag / ID</th>
                      <th>Gender</th>
                      <th style={{ width: 90 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {patientLoading ? (
                      [1,2,3,4,5].map(n => (
                        <tr key={n}>{[1,2,3,4,5].map(c => (
                          <td key={c}><div style={{ height: 14, borderRadius: 4, background: 'var(--bg-section)', width: '80%' }} /></td>
                        ))}</tr>
                      ))
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={5}>
                          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--fg-muted)' }}>
                            <Icon name="users" size={28} style={{ opacity: 0.3, marginBottom: 10 }} />
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{patientSearch ? `No patients match "${patientSearch}"` : 'No patients found'}</div>
                          </div>
                        </td>
                      </tr>
                    ) : filtered.map(p => (
                      <tr key={p._id} style={{ cursor: 'pointer' }} onClick={() => setSelectedPatient(p)}>
                        <td>
                          <div className="cell-person">
                            <div className="av teal" style={{ width: 32, height: 32, fontSize: 12 }}>
                              {getInitials(p.name ?? 'UN')}
                            </div>
                            <div className="info">
                              <div className="n">{p.name ?? '—'}</div>
                              <div className="s">{p.phone ?? ''}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>{p.phone ?? '—'}</td>
                        <td style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{p.tag ?? '—'}</td>
                        <td style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>{p.gender ?? '—'}</td>
                        <td>
                          <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); setSelectedPatient(p) }}>
                            Select
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })()}

          {/* ── Step 2: Appointment selection ── */}
          {mode === 'create' && selectedPatient && !appt && (() => {
            const q = apptSearch.toLowerCase()
            const filtered = apptResults.filter(a =>
              !q ||
              (a.doctorId?.name ?? '').toLowerCase().includes(q) ||
              (a.status ?? '').toLowerCase().includes(q) ||
              (a._id ?? '').toLowerCase().includes(q)
            )
            return (
              <div className="table-card" style={{ marginBottom: 24 }}>
                <div className="table-toolbar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => { setSelectedPatient(null); setApptResults([]); setApptSearch('') }}
                    >
                      <Icon name="chevL" size={13} /> Back
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="av teal" style={{ width: 28, height: 28, fontSize: 11 }}>
                        {getInitials(selectedPatient.name ?? 'UN')}
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-primary)' }}>{selectedPatient.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>{selectedPatient.phone ?? ''}</div>
                      </div>
                    </div>
                    <span style={{ color: 'var(--border-soft)', fontSize: 18 }}>›</span>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)' }}>
                      Select Appointment
                    </div>
                  </div>
                  <div className="table-search">
                    <Icon name="search" size={15} />
                    <input
                      value={apptSearch}
                      onChange={e => setApptSearch(e.target.value)}
                      placeholder="Search doctor, status…"
                      autoFocus
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
                      <th style={{ width: 90 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {apptLoading ? (
                      [1,2,3,4,5].map(n => (
                        <tr key={n}>{[1,2,3,4,5,6].map(c => (
                          <td key={c}><div style={{ height: 14, borderRadius: 4, background: 'var(--bg-section)', width: '80%' }} /></td>
                        ))}</tr>
                      ))
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6}>
                          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--fg-muted)' }}>
                            <Icon name="calendar" size={28} style={{ opacity: 0.3, marginBottom: 10 }} />
                            <div style={{ fontSize: 13, fontWeight: 600 }}>
                              {apptSearch ? `No appointments match "${apptSearch}"` : `No appointments found for ${selectedPatient.name}`}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : filtered.map(a => (
                      <tr key={a._id} style={{ cursor: 'pointer' }} onClick={() => selectAppt(a)}>
                        <td>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--fg-primary)' }}>
                            {a._id.slice(-8).toUpperCase()}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: 13.5, fontWeight: 600 }}>Dr. {a.doctorId?.name ?? '—'}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>{a.doctorId?.specialization ?? ''}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>
                            {a.date ? new Date(a.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </div>
                          {a.time && <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{a.time}</div>}
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--fg-secondary)', textTransform: 'capitalize' }}>{a.status ?? '—'}</td>
                        <td>
                          <Badge variant={
                            a.status === 'completed'   ? 'success' :
                            a.status === 'cancelled'   ? 'muted'   :
                            a.status === 'in-progress' ? 'warning' : 'info'
                          } dot>{a.status ?? '—'}</Badge>
                        </td>
                        <td>
                          <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); selectAppt(a) }}>
                            Select
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })()}

          {/* ── Patient / Doctor info card ── */}
          {patient && (
            <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 20, justifyContent: 'space-between' }}>
              {/* Patient */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="av teal" style={{ width: 44, height: 44, fontSize: 15, fontWeight: 700, flexShrink: 0, borderRadius: '50%' }}>
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
                <div className="av blue" style={{ width: 44, height: 44, fontSize: 15, fontWeight: 700, flexShrink: 0, borderRadius: '50%' }}>
                  {(doctor?.name ?? 'DR').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', fontWeight: 500 }}>Doctor</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)' }}>Dr. {doctor?.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>{doctor?.specialization ?? '—'}</div>
                </div>
              </div>

              {/* Rx Status */}
              <div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', fontWeight: 500, marginBottom: 4 }}>Rx Status</div>
                {order ? (
                  <>
                    <Badge variant={statusVariant(order.status)} dot>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                    {(order.appointmentId as any)?.tokenNumber && (
                      <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 4 }}>
                        Token {(order.appointmentId as any).tokenNumber}
                      </div>
                    )}
                  </>
                ) : (
                  <Badge variant="muted" dot>Draft</Badge>
                )}
              </div>

              {/* Order ID */}
              {order && (
                <div>
                  <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', fontWeight: 500 }}>Order ID</div>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--fg-primary)' }}>
                    {order.orderId}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Medicines + summary ── */}
          {(patient || mode !== 'create') && (
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

              {/* Medicines table */}
              <div className="table-card" style={{ flex: 1 }}>
                <div className="table-toolbar">
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)' }}>Medicines</div>
                  {isEditable && (
                    <button className="btn btn-secondary btn-sm" onClick={addMed}>
                      <Icon name="plus" size={13} /> Add medicine
                    </button>
                  )}
                </div>

                {medicines.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--fg-muted)' }}>
                    <Icon name="pill" size={28} />
                    <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600 }}>No medicines yet</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Click "Add medicine" to get started</div>
                  </div>
                ) : (
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Medicine</th>
                        <th>Dosage</th>
                        <th style={{ width: 72, textAlign: 'center' }}>Qty</th>
                        <th style={{ width: 100 }}>Unit</th>
                        <th style={{ width: 110 }}>Rate (₹)</th>
                        <th style={{ width: 110 }}>Amount (₹)</th>
                        {isEditable && <th style={{ width: 44 }} />}
                      </tr>
                    </thead>
                    <tbody>
                      {medicines.map((m, i) => (
                        <tr key={i}>
                          <td>
                            {isEditable ? (
                              <MedicineCombobox
                                value={m.name}
                                onChange={v => updateMed(i, { name: v })}
                              />
                            ) : (
                              <span style={{ fontWeight: 600, fontSize: 13.5 }}>{m.name || '—'}</span>
                            )}
                          </td>
                          <td>
                            {isEditable ? (
                              <div>
                                <input
                                  className="form-input"
                                  inputMode="numeric"
                                  style={{ width: '100%', minWidth: 110, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}
                                  value={m.dosage}
                                  onChange={e => {
                                    const digits = e.target.value.replace(/\D/g, '').slice(0, 4)
                                    updateMed(i, { dosage: digits.split('').join('-') })
                                  }}
                                  onBlur={() => {
                                    const segs = (m.dosage || '').split('-').map(s => s || '0')
                                    while (segs.length < 4) segs.push('0')
                                    updateMed(i, { dosage: segs.slice(0, 4).join('-') })
                                  }}
                                  placeholder="1-0-0-1"
                                  title="Morning-Afternoon-Evening-Night"
                                />
                                <div style={{ fontSize: 10, color: 'var(--fg-muted)', marginTop: 2 }}>M · A · E · N</div>
                              </div>
                            ) : (
                              <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>{m.dosage || '—'}</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {isEditable ? (
                              <input
                                className="form-input"
                                type="number"
                                min={1}
                                style={{ width: 60, textAlign: 'center' }}
                                value={m.quantity}
                                onChange={e => updateMed(i, { quantity: Math.max(1, Number(e.target.value)) })}
                              />
                            ) : (
                              <span>{m.quantity}</span>
                            )}
                          </td>
                          <td>
                            {isEditable ? (
                              <select
                                className="form-input"
                                style={{ width: '100%', padding: '6px 8px' }}
                                value={m.unit}
                                onChange={e => updateMed(i, { unit: e.target.value })}
                              >
                                {MED_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                              </select>
                            ) : (
                              <span style={{ fontSize: 13 }}>{m.unit}</span>
                            )}
                          </td>
                          <td>
                            {isEditable ? (
                              <input
                                className="form-input"
                                type="number"
                                min={0}
                                style={{ width: 98 }}
                                value={m.rate === 0 ? '' : m.rate}
                                placeholder="0.00"
                                onChange={e => updateMed(i, { rate: e.target.value === '' ? 0 : Number(e.target.value) })}
                              />
                            ) : (
                              <span>{m.rate > 0 ? fmt(m.rate) : '—'}</span>
                            )}
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--teal-800)' }}>
                            {fmt(m.amount)}
                          </td>
                          {isEditable && (
                            <td>
                              <button
                                className="act danger"
                                onClick={() => removeMed(i)}
                                disabled={medicines.length === 1}
                                title="Remove"
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
                      placeholder="Special instructions, allergies, remarks…"
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

                {/* GST */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
                  <span style={{ fontSize: 13.5, color: 'var(--fg-secondary)' }}>GST (%)</span>
                  {isEditable ? (
                    <input
                      type="number" className="form-input"
                      style={{ width: 72, padding: '4px 8px', fontSize: 13, textAlign: 'right' }}
                      value={gstPct} min={0} max={28}
                      onChange={e => setGstPct(Number(e.target.value))}
                    />
                  ) : (
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>{gstPct}%</span>
                  )}
                </div>
                {gstAmt > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 12.5, color: 'var(--fg-muted)' }}>
                    <span>  GST amount</span>
                    <span>+ {fmt(gstAmt)}</span>
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

                {order && (
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
                    {order.paymentMethod && (
                      <div style={{ marginTop: 8, fontSize: 12.5, color: 'var(--fg-secondary)' }}>
                        Method: <strong>{order.paymentMethod.toUpperCase()}</strong>
                        {order.paidAt && (
                          <> · {new Date(order.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* CTAs */}
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
                    {saving ? 'Creating…' : `Create Rx · ${fmt(grandTotal)}`}
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Payment modal ── */}
      {payOpen && order && (
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
                <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginBottom: 2 }}>Order ID</div>
                <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 13.5 }}>{order.orderId}</div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginBottom: 2 }}>Patient</div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{order.patientId?.name}</div>
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
                <div style={{ fontWeight: 700, fontSize: 15 }}>{fmt(order.total)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-secondary)' }}>Already paid</div>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--success-500)' }}>{fmt(order.paidAmount)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11.5, color: 'var(--fg-secondary)' }}>Balance</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--danger-500)' }}>
                  {fmt(Math.max(0, order.total - order.paidAmount))}
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Amount to collect (₹)</label>
              <input
                className="form-input"
                type="number"
                min={1}
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                placeholder={`Up to ₹${(order.total - order.paidAmount).toFixed(2)}`}
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
              <button className="btn btn-ghost btn-sm" onClick={() => setPayOpen(false)} disabled={paying}>
                Cancel
              </button>
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

      {/* ── Print area (hidden on screen, visible only when printing) ── */}
      {order && (
        <div id="rx-print-area" style={{ display: 'none', fontFamily: 'Arial, sans-serif', color: '#111', background: '#fff', padding: 24, maxWidth: 794 }}>
          <style>{`
            @media print {
              body > * { display: none !important; }
              #rx-print-area { display: block !important; }
              #rx-print-area * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              @page { margin: 16mm; size: A4; }
            }
          `}</style>

          {/* Header */}
          <div style={{ borderBottom: '2px solid #1a3c6e', paddingBottom: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#1a3c6e' }}>{(order.clinicId as any)?.name ?? 'Clinic'}</div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{(order.clinicId as any)?.address ?? ''}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a3c6e' }}>PRESCRIPTION</div>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#333', marginTop: 2 }}>{order.orderId}</div>
              <div style={{ fontSize: 11, color: '#555' }}>
                {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Patient & Doctor */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: '#f5f7fb', borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Patient</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{order.patientId?.name}</div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
                {order.patientId?.gender && `${order.patientId.gender} · `}{order.patientId?.phone ?? ''}
              </div>
              {order.patientId?.tag && <div style={{ fontSize: 11, color: '#555' }}>{order.patientId.tag}</div>}
            </div>
            <div style={{ background: '#f5f7fb', borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Prescribing Doctor</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Dr. {order.doctorId?.name}</div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{order.doctorId?.specialization ?? ''}</div>
            </div>
          </div>

          {/* Medicines table */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Medicines</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#1a3c6e', color: 'white' }}>
                  <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600 }}>#</th>
                  <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600 }}>Medicine</th>
                  <th style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 600 }}>Dosage (M-A-E-N)</th>
                  <th style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 600 }}>Qty</th>
                  <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600 }}>Unit</th>
                  <th style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>Rate</th>
                  <th style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.medicines.map((m, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e5e7eb', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={{ padding: '7px 10px', color: '#888' }}>{i + 1}</td>
                    <td style={{ padding: '7px 10px', fontWeight: 600 }}>{m.name}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'center', fontFamily: 'monospace' }}>{m.dosage || '—'}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'center' }}>{m.quantity}</td>
                    <td style={{ padding: '7px 10px' }}>{m.unit}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right' }}>₹{m.rate.toFixed(2)}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>₹{m.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bill summary */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <div style={{ width: 260 }}>
              {[
                { label: 'Subtotal', value: `₹${order.subtotal.toFixed(2)}` },
                order.discount > 0 ? { label: 'Discount', value: `− ₹${order.discount.toFixed(2)}` } : null,
                order.gst > 0     ? { label: 'GST',      value: `+ ₹${order.gst.toFixed(2)}` }      : null,
              ].filter(Boolean).map((r: any) => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', color: '#555' }}>
                  <span>{r.label}</span><span>{r.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, borderTop: '2px solid #1a3c6e', marginTop: 6, paddingTop: 6, color: '#1a3c6e' }}>
                <span>Total</span><span>₹{order.total.toFixed(2)}</span>
              </div>
              {order.paidAmount > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', color: '#16a34a' }}>
                    <span>Paid ({order.paymentMethod?.toUpperCase() ?? ''})</span>
                    <span>₹{order.paidAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: order.total - order.paidAmount > 0 ? '#dc2626' : '#16a34a' }}>
                    <span>Balance</span>
                    <span>₹{Math.max(0, order.total - order.paidAmount).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '10px 14px', marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Notes</div>
              <div style={{ fontSize: 12, color: '#333' }}>{order.notes}</div>
            </div>
          )}

          {/* Footer */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
            <div style={{ fontSize: 10, color: '#aaa' }}>
              Status: <strong style={{ textTransform: 'capitalize' }}>{order.status}</strong>
              {order.paidAt && ` · Paid on ${new Date(order.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 140, borderTop: '1px solid #333', paddingTop: 4, fontSize: 10, color: '#555' }}>Doctor Signature</div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
