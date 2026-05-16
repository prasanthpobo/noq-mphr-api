import { useState, useEffect, useRef } from 'react'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import Badge from '@/components/ui/Badge'
import { useAppStore } from '@/store/app'
import { useAuthStore } from '@/store/auth'
import { labService } from '@/services/lab.service'
import { masterdataService } from '@/services/masterdata.service'
import { appointmentsService } from '@/services/appointments.service'
import { patientsService } from '@/services/patients.service'
import { toast } from '@/store/toast'

// ─── Interfaces ──────────────────────────────────────────────────────────────

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

interface LabTestItem {
  name:        string
  code?:       string
  category?:   string
  sampleType?: string
  tat?:        string
  priority:    'routine' | 'urgent' | 'stat'
  rate:        number
  amount:      number
  status:      'pending' | 'in-progress' | 'completed'
  result?:     string
  unit?:       string
  normalRange?:string
  notes?:      string
}

interface LabOrder {
  _id:           string
  orderId:       string
  patientId:     { _id: string; name: string; phone?: string; tag?: string; gender?: string }
  doctorId:      { _id: string; name: string; specialization?: string }
  clinicId:      { _id: string; name: string }
  appointmentId?:{ _id: string; date?: string; time?: string }
  tests:         LabTestItem[]
  status:        string
  priority:      string
  subtotal:      number
  discount:      number
  gst:           number
  total:         number
  finalAmount:   number
  paidAmount?:   number
  paymentMethod?:string
  paidAt?:       string
  notes?:        string
  collectedAt?:  string
  reportedAt?:   string
  createdAt:     string
}

// ─── TestCombobox ─────────────────────────────────────────────────────────────

function TestCombobox({ onSelect, selectedNames }: { onSelect: (item: any) => void; selectedNames: string[] }) {
  const [q, setQ]             = useState('')
  const [allTests, setAllTests] = useState<any[]>([])
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapRef               = useRef<HTMLDivElement>(null)

  // Load all lab tests from masterdata once on mount
  useEffect(() => {
    setLoading(true)
    masterdataService.list({ category: 'test' })
      .then(res => setAllTests(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Client-side filter by label, excluding already-selected tests
  const filtered = allTests.filter(t => {
    if (selectedNames.includes(t.label)) return false
    if (!q.trim()) return true
    return t.label.toLowerCase().includes(q.toLowerCase())
  })

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
      <div className="table-search" style={{ width: '100%' }}>
        <Icon name="search" size={15} />
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={loading ? 'Loading tests…' : 'Search and add test…'}
          disabled={loading}
        />
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          background: 'var(--bg-surface)', border: '1px solid var(--border-soft)',
          borderRadius: 10, boxShadow: 'var(--sh-popup)', marginTop: 4,
          maxHeight: 280, overflowY: 'auto',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '16px 14px', fontSize: 13, color: 'var(--fg-muted)', textAlign: 'center' }}>
              {q.trim() ? `No tests matching "${q}"` : 'All available tests already added'}
            </div>
          ) : filtered.map((r: any) => (
            <div
              key={r._id}
              onMouseDown={() => { onSelect(r); setQ(''); setOpen(false) }}
              style={{
                padding: '9px 14px', cursor: 'pointer',
                borderBottom: '1px solid var(--border-light)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-section)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-primary)' }}>{r.label}</div>
              <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{r.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PRIORITY_OPTIONS = ['routine', 'urgent', 'stat'] as const

function priorityVariant(p: string) {
  if (p === 'stat')   return 'danger'  as const
  if (p === 'urgent') return 'warning' as const
  return 'info' as const
}

function statusVariant(s: string) {
  if (s === 'completed')   return 'success'  as const
  if (s === 'paid')        return 'success'  as const
  if (s === 'in-progress') return 'blue'     as const
  if (s === 'cancelled')   return 'muted'    as const
  return 'warning' as const
}

function statusLabel(s: string) {
  const m: Record<string, string> = {
    'pending': 'Pending', 'in-progress': 'In Progress',
    'completed': 'Completed', 'cancelled': 'Cancelled', 'paid': 'Paid',
  }
  return m[s] ?? s
}

const PAY_METHODS = ['UPI', 'Card', 'Cash', 'Insurance'] as const

// ─── Main component ───────────────────────────────────────────────────────────

export default function LabDetail() {
  const { setRoute, setSelectedId, selectedId } = useAppStore()
  const user = useAuthStore(s => s.user)

  const mode = selectedId ? 'view' : 'create'

  // Create-mode state
  const [step, setStep]           = useState<'patient' | 'appointment' | 'tests'>('patient')
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null)
  const [patientSearch, setPatientSearch]     = useState('')
  const [patientResults, setPatientResults]   = useState<any[]>([])
  const [patientLoading, setPatientLoading]   = useState(false)
  const [appt, setAppt]           = useState<Appointment | null>(null)
  const [appts, setAppts]         = useState<Appointment[]>([])
  const [apptLoading, setApptLoading] = useState(false)
  const [apptSearch, setApptSearch]   = useState('')
  const [tests, setTests]         = useState<LabTestItem[]>([])
  const [priority, setPriority]   = useState<'routine' | 'urgent' | 'stat'>('routine')
  const [discount, setDiscount]   = useState(0)
  const [gstPct, setGstPct]       = useState(0)
  const [payMethod, setPayMethod] = useState<typeof PAY_METHODS[number]>('Cash')
  const [orderNotes, setOrderNotes] = useState('')
  const [saving, setSaving]       = useState(false)

  // View-mode state
  const [order, setOrder]         = useState<LabOrder | null>(null)
  const [loadingOrder, setLoadingOrder] = useState(false)
  const [activeTab, setActiveTab] = useState<'tests' | 'bill'>('tests')

  // Pay-modal state
  const [paying, setPaying]       = useState(false)
  const [payAmount, setPayAmount] = useState('')

  // Result entry state: testIndex → { result, unit, normalRange }
  const [resultDrafts, setResultDrafts] = useState<Record<number, { result: string; unit: string; normalRange: string }>>({})

  const printRef = useRef<HTMLDivElement>(null)

  // ── Load patients (create mode, step 1) ───────────────────────────────────
  useEffect(() => {
    if (mode !== 'create' || selectedPatient) return
    setPatientLoading(true)
    patientsService.list({})
      .then(res => setPatientResults((res as any).data ?? []))
      .catch(() => toast.error('Failed to load patients'))
      .finally(() => setPatientLoading(false))
  }, [mode, selectedPatient])

  // ── Load appointments (create mode, step 2) ────────────────────────────────
  useEffect(() => {
    if (mode !== 'create' || !selectedPatient || appt) return
    setApptLoading(true)
    appointmentsService.list({ patientId: selectedPatient._id })
      .then(res => setAppts((res as any).data ?? []))
      .catch(() => toast.error('Failed to load appointments'))
      .finally(() => setApptLoading(false))
  }, [mode, selectedPatient, appt])

  // ── Load order (view mode) ─────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'view' || !selectedId) return
    setLoadingOrder(true)
    labService.get(selectedId)
      .then(data => setOrder(data as LabOrder))
      .catch(() => toast.error('Failed to load lab order'))
      .finally(() => setLoadingOrder(false))
  }, [mode, selectedId])

  // ── Filtered patients ──────────────────────────────────────────────────────
  const filteredPatients = patientResults.filter(p => {
    const q = patientSearch.toLowerCase()
    if (!q) return true
    return (
      (p.name ?? '').toLowerCase().includes(q) ||
      (p.phone ?? '').toLowerCase().includes(q) ||
      (p.tag ?? '').toLowerCase().includes(q)
    )
  })

  // ── Filtered appointments ──────────────────────────────────────────────────
  const filteredAppts = appts.filter(a => {
    const q = apptSearch.toLowerCase()
    if (!q) return true
    return (
      ((a.doctorId as any)?.name ?? '').toLowerCase().includes(q) ||
      (a.tokenNumber ?? '').toLowerCase().includes(q) ||
      (a.status ?? '').toLowerCase().includes(q)
    )
  })

  // ── Test helpers (create mode) ────────────────────────────────────────────
  const addTest = (item: any) => {
    setTests(prev => {
      if (prev.find(t => t.name === item.label)) return prev
      return [...prev, {
        name:     item.label,
        code:     item.value,
        category: '',
        sampleType: '',
        tat:      '',
        priority: 'routine',
        rate:     0,
        amount:   0,
        status:   'pending',
      }]
    })
  }

  const updateTest = (i: number, patch: Partial<LabTestItem>) => {
    setTests(prev => prev.map((t, idx) => {
      if (idx !== i) return t
      const updated = { ...t, ...patch }
      updated.amount = (updated.rate ?? 0)
      return updated
    }))
  }

  const removeTest = (i: number) => setTests(prev => prev.filter((_, idx) => idx !== i))

  // ── Bill computation ──────────────────────────────────────────────────────
  const computedSubtotal = tests.reduce((sum, t) => sum + (t.amount ?? 0), 0)
  const discountAmt      = (computedSubtotal * discount) / 100
  const gstAmt           = ((computedSubtotal - discountAmt) * gstPct) / 100
  const grandTotal       = computedSubtotal - discountAmt + gstAmt

  const viewSubtotal  = order?.subtotal  ?? 0
  const viewDiscount  = order ? (order.subtotal * (order.discount / 100)) : 0
  const viewGstAmt    = order ? ((order.subtotal - viewDiscount) * (order.gst / 100)) : 0
  const viewTotal     = order?.total     ?? 0
  const viewPaid      = order?.paidAmount ?? 0
  const viewBalance   = viewTotal - viewPaid

  // ── Save (create mode) ───────────────────────────────────────────────────
  const handleSave = async () => {
    if (!appt) { toast.error('Select an appointment first'); return }
    if (tests.length === 0) { toast.error('Add at least one test'); return }

    const apptClinicId = appt.clinicId
      ? (typeof appt.clinicId === 'object' ? appt.clinicId._id : appt.clinicId)
      : undefined
    const clinicId = apptClinicId ?? user?.clinicId ?? ''

    const payload: Record<string, unknown> = {
      patientId:    appt.patientId._id,
      doctorId:     appt.doctorId._id,
      appointmentId:appt._id,
      tests:        tests.map(t => ({ ...t, amount: t.rate })),
      priority,
      discount,
      gstPct,
      notes:        orderNotes || undefined,
    }
    if (clinicId) payload.clinicId = clinicId

    setSaving(true)
    try {
      const created = await labService.create(payload) as LabOrder
      toast.success('Lab order created')
      setSelectedId(created._id)
      setRoute('lab')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to create lab order')
    } finally {
      setSaving(false)
    }
  }

  // ── Collect sample (view mode) ────────────────────────────────────────────
  const handleCollect = async () => {
    if (!order) return
    try {
      const updated = await labService.collect(order._id) as LabOrder
      setOrder(updated)
      toast.success('Sample collected')
    } catch {
      toast.error('Failed to collect sample')
    }
  }

  // ── Enter result (view mode) ──────────────────────────────────────────────
  const handleSaveResult = async (testIndex: number) => {
    if (!order) return
    const draft = resultDrafts[testIndex]
    if (!draft?.result?.trim()) { toast.error('Enter a result value'); return }
    try {
      const updated = await labService.updateResult(
        order._id, testIndex, draft.result, draft.unit, draft.normalRange,
      ) as LabOrder
      setOrder(updated)
      setResultDrafts(prev => { const n = { ...prev }; delete n[testIndex]; return n })
      toast.success('Result saved')
    } catch {
      toast.error('Failed to save result')
    }
  }

  // ── Pay (view mode) ───────────────────────────────────────────────────────
  const handlePay = async () => {
    if (!order) return
    const amt = parseFloat(payAmount)
    if (isNaN(amt) || amt <= 0) { toast.error('Enter a valid amount'); return }
    try {
      const updated = await labService.pay(order._id, amt, payMethod) as LabOrder
      setOrder(updated)
      setPaying(false)
      setPayAmount('')
      toast.success('Payment recorded')
    } catch {
      toast.error('Failed to record payment')
    }
  }

  // ── Print ─────────────────────────────────────────────────────────────────
  const handlePrint = () => window.print()

  // ── Download PDF ─────────────────────────────────────────────────────────
  const handleDownloadPdf = async () => {
    if (!order || !printRef.current) return
    try {
      printRef.current.style.display = 'block'
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const img    = canvas.toDataURL('image/png')
      const pdf    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfW   = pdf.internal.pageSize.getWidth()
      const pdfH   = (canvas.height * pdfW) / canvas.width
      pdf.addImage(img, 'PNG', 0, 0, pdfW, pdfH)
      pdf.save(`${order.orderId}.pdf`)
    } catch {
      toast.error('Failed to generate PDF')
    } finally {
      if (printRef.current) printRef.current.style.display = 'none'
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CREATE MODE
  // ─────────────────────────────────────────────────────────────────────────
  if (mode === 'create') {
    const crumbTitle = !selectedPatient
      ? 'New Lab Order'
      : !appt
        ? selectedPatient.name
        : 'New Lab Order'
    const crumbSub = !selectedPatient
      ? 'Step 1 — Select patient'
      : !appt
        ? 'Step 2 — Select appointment'
        : 'Step 3 — Add tests & bill'

    const STEPS = ['Select Patient', 'Select Appointment', 'Add Tests & Bill']
    const currentStepIdx = !selectedPatient ? 0 : !appt ? 1 : 2

    return (
      <>
        <Header title={crumbTitle} crumbs={`Lab · ${crumbSub}`} />
        <div className="main">

          {/* Step indicator */}
          {(!appt) && (
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
          )}

          {/* ── Step 1: Select Patient ────────────────────────────────────────── */}
          {!selectedPatient && (
            <div className="table-card">
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
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>{Array.from({ length: 5 }).map((_, j) => (
                        <td key={j}><div style={{ height: 14, borderRadius: 6, background: 'var(--bg-section)', width: '75%' }} /></td>
                      ))}</tr>
                    ))
                  ) : filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--fg-muted)', fontSize: 13 }}>
                          No patients found
                        </div>
                      </td>
                    </tr>
                  ) : filteredPatients.map((p: any) => (
                    <tr key={p._id}>
                      <td>
                        <div className="cell-person">
                          <div className="av blue">
                            {(p.name ?? 'UN').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
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
                            onClick={() => { setSelectedPatient(p); setStep('appointment') }}
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

          {/* ── Step 2: Select Appointment ────────────────────────────────────── */}
          {selectedPatient && !appt && (
            <div className="table-card">
              <div className="table-toolbar">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setSelectedPatient(null); setAppts([]); setApptSearch(''); setStep('patient') }}
                >
                  <Icon name="chevL" size={13} /> Back
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
                  <div className="av blue" style={{ width: 26, height: 26, fontSize: 11, fontWeight: 700 }}>
                    {(selectedPatient.name ?? 'UN').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
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
                    <th style={{ textAlign: 'right' }}>Select</th>
                  </tr>
                </thead>
                <tbody>
                  {apptLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                        <td key={j}><div style={{ height: 14, borderRadius: 6, background: 'var(--bg-section)', width: '80%' }} /></td>
                      ))}</tr>
                    ))
                  ) : filteredAppts.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--fg-muted)', fontSize: 13 }}>
                          No appointments found for this patient
                        </div>
                      </td>
                    </tr>
                  ) : filteredAppts.map(a => (
                    <tr key={a._id}>
                      <td>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--fg-primary)' }}>
                          #{a._id.slice(-8).toUpperCase()}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Dr. {(a.doctorId as any)?.name ?? '—'}</div>
                        {(a.doctorId as any)?.specialization && (
                          <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2 }}>{(a.doctorId as any).specialization}</div>
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
                        <Badge
                          variant={a.status === 'completed' ? 'success' : a.status === 'cancelled' ? 'muted' : 'blue'}
                          dot
                        >
                          {a.status ? a.status.charAt(0).toUpperCase() + a.status.slice(1) : '—'}
                        </Badge>
                      </td>
                      <td>
                        <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => { setAppt(a); setStep('tests') }}
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

          {/* ── Step 3: Add Tests & Bill ──────────────────────────────────────── */}
          {step === 'tests' && appt && (
            <>
              {/* Patient / Doctor info card */}
              <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 16, justifyContent: 'space-between' }}>
                {/* Patient */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="av blue" style={{ width: 44, height: 44, fontSize: 15, fontWeight: 700, flexShrink: 0, borderRadius: '50%' }}>
                    {(appt.patientId?.name ?? 'UN').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', fontWeight: 500 }}>Patient</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)' }}>{appt.patientId?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>
                      {appt.patientId?.tag && `${appt.patientId.tag} · `}{appt.patientId?.phone ?? '—'}
                    </div>
                  </div>
                </div>

                {/* Doctor */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="av teal" style={{ width: 44, height: 44, fontSize: 15, fontWeight: 700, flexShrink: 0, borderRadius: '50%' }}>
                    {(appt.doctorId?.name ?? 'DR').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', fontWeight: 500 }}>Doctor</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)' }}>Dr. {appt.doctorId?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>{appt.doctorId?.specialization ?? '—'}</div>
                  </div>
                </div>

                {/* Appointment */}
                <div>
                  <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', fontWeight: 500 }}>Appointment</div>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--fg-primary)' }}>
                    #{appt._id.slice(-8).toUpperCase()}
                  </div>
                  {appt.date && (
                    <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>
                      {new Date(appt.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {appt.time && ` · ${appt.time}`}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                {/* Tests table */}
                <div className="table-card" style={{ flex: 1 }}>
                  <div className="table-toolbar">
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)' }}>Tests</div>
                    <TestCombobox onSelect={addTest} selectedNames={tests.map(t => t.name)} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                      <span style={{ fontSize: 12, color: 'var(--fg-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>Priority</span>
                      {PRIORITY_OPTIONS.map(p => (
                        <button
                          key={p}
                          onClick={() => setPriority(p)}
                          style={{
                            padding: '4px 10px', fontSize: 12, fontWeight: 600,
                            borderRadius: 7, border: 'none', cursor: 'pointer',
                            background: priority === p ? 'var(--brand-gradient)' : 'var(--bg-section)',
                            color: priority === p ? 'white' : 'var(--fg-secondary)',
                          }}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {tests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--fg-muted)' }}>
                      <Icon name="flask" size={28} />
                      <div style={{ marginTop: 8, fontSize: 13.5, fontWeight: 600 }}>No tests added</div>
                      <div style={{ marginTop: 4, fontSize: 12 }}>Search and add tests above</div>
                    </div>
                  ) : (
                    <table className="data">
                      <thead>
                        <tr>
                          <th>Test Name</th>
                          <th>Priority</th>
                          <th>Rate (₹)</th>
                          <th style={{ textAlign: 'right' }}>Remove</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tests.map((t, i) => (
                          <tr key={i}>
                            <td>
                              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t.name}</div>
                              {t.code && <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2 }}>{t.code}</div>}
                            </td>
                            <td>
                              <select
                                className="form-input"
                                style={{ padding: '4px 8px', fontSize: 12.5, width: 100 }}
                                value={t.priority}
                                onChange={e => updateTest(i, { priority: e.target.value as any })}
                              >
                                {PRIORITY_OPTIONS.map(p => (
                                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-input"
                                style={{ width: 90, padding: '4px 8px', fontSize: 13 }}
                                value={t.rate === 0 ? '' : t.rate}
                                placeholder="0.00"
                                min={0}
                                onChange={e => updateTest(i, { rate: Number(e.target.value) || 0 })}
                              />
                            </td>
                            <td>
                              <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                                <button className="act danger" onClick={() => removeTest(i)}>
                                  <Icon name="trash" size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Notes */}
                  <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-soft)' }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-secondary)', display: 'block', marginBottom: 6 }}>
                      Notes (optional)
                    </label>
                    <textarea
                      className="form-input"
                      rows={2}
                      style={{ width: '100%', fontSize: 13, resize: 'vertical' }}
                      value={orderNotes}
                      onChange={e => setOrderNotes(e.target.value)}
                      placeholder="Special instructions, fasting requirements…"
                    />
                  </div>
                </div>

                {/* Bill summary */}
                <div className="card" style={{ width: 300, flexShrink: 0, position: 'sticky', top: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Bill Summary</div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13.5 }}>
                    <span style={{ color: 'var(--fg-secondary)' }}>Subtotal</span>
                    <span style={{ fontWeight: 600 }}>₹{computedSubtotal.toFixed(2)}</span>
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
                      value={gstPct}
                      min={0} max={28}
                      onChange={e => setGstPct(Number(e.target.value))}
                    />
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-soft)', margin: '12px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>Grand Total</span>
                    <span style={{ fontSize: 18, fontWeight: 800, background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      ₹{grandTotal.toFixed(2)}
                    </span>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-secondary)', marginBottom: 6 }}>Payment Method</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {PAY_METHODS.map(m => (
                        <button
                          key={m}
                          onClick={() => setPayMethod(m)}
                          style={{
                            flex: 1, padding: '5px 0', fontSize: 11.5, fontWeight: 600,
                            borderRadius: 7, border: 'none', cursor: 'pointer', minWidth: 50,
                            background: payMethod === m ? 'var(--brand-gradient)' : 'var(--bg-section)',
                            color: payMethod === m ? 'white' : 'var(--fg-secondary)',
                          }}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '10px 0', fontSize: 14 }}
                    onClick={handleSave}
                    disabled={saving || tests.length === 0}
                  >
                    {saving ? 'Saving…' : 'Save Lab Order'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW MODE
  // ─────────────────────────────────────────────────────────────────────────

  if (loadingOrder || !order) {
    return (
      <>
        <Header title="Lab Order" crumbs="Diagnostic tests & results" />
        <div className="main" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80, color: 'var(--fg-muted)', fontSize: 14 }}>
          {loadingOrder ? 'Loading…' : 'Order not found'}
        </div>
      </>
    )
  }

  const patientInitials = (order.patientId?.name ?? 'UN')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      <Header
        title={`Lab · ${order.orderId}`}
        crumbs="Diagnostic tests & results"
      />

      {/* Hidden print area */}
      <div ref={printRef} id="lab-print-area" style={{ display: 'none' }}>
        <div style={{ fontFamily: 'Arial, sans-serif', padding: 32, maxWidth: 780, margin: '0 auto', color: '#111' }}>
          {/* Clinic header */}
          <div style={{ textAlign: 'center', marginBottom: 24, borderBottom: '2px solid #0d9488', paddingBottom: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0d9488' }}>{order.clinicId?.name ?? 'Clinic'}</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Lab Report · {order.orderId}</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>
          {/* Patient / Doctor */}
          <div style={{ display: 'flex', gap: 32, marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', marginBottom: 6 }}>Patient</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{order.patientId?.name}</div>
              <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>{order.patientId?.phone}</div>
              <div style={{ fontSize: 13, color: '#555' }}>{order.patientId?.gender}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', marginBottom: 6 }}>Ordered By</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Dr. {order.doctorId?.name}</div>
              <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>{order.doctorId?.specialization}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', marginBottom: 6 }}>Priority</div>
              <div style={{ fontWeight: 700, fontSize: 14, textTransform: 'capitalize' }}>{order.priority}</div>
            </div>
          </div>
          {/* Tests table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f0fdfa' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #ccc', fontWeight: 700 }}>Test</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #ccc', fontWeight: 700 }}>Result</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #ccc', fontWeight: 700 }}>Unit</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #ccc', fontWeight: 700 }}>Normal Range</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #ccc', fontWeight: 700 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {order.tests.map((t, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '7px 10px', fontWeight: 600 }}>{t.name}</td>
                  <td style={{ padding: '7px 10px' }}>{t.result ?? '—'}</td>
                  <td style={{ padding: '7px 10px', color: '#666' }}>{t.unit ?? '—'}</td>
                  <td style={{ padding: '7px 10px', color: '#666' }}>{t.normalRange ?? '—'}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', textTransform: 'capitalize' }}>{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Bill summary */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
            <div style={{ width: 260 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: '#666' }}>Subtotal</span><span>₹{viewSubtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: '#666' }}>Discount ({order.discount}%)</span>
                  <span style={{ color: '#16a34a' }}>-₹{viewDiscount.toFixed(2)}</span>
                </div>
              )}
              {order.gst > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: '#666' }}>GST ({order.gst}%)</span>
                  <span>₹{viewGstAmt.toFixed(2)}</span>
                </div>
              )}
              <div style={{ borderTop: '2px solid #0d9488', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15 }}>
                <span>Total</span><span>₹{viewTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
          {order.notes && (
            <div style={{ marginBottom: 24, padding: '12px', background: '#f9fafb', borderRadius: 8, fontSize: 13 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Notes</div>
              <div style={{ color: '#555' }}>{order.notes}</div>
            </div>
          )}
          <div style={{ borderTop: '1px solid #ccc', paddingTop: 16, textAlign: 'right', fontSize: 12, color: '#666' }}>
            Lab Technician Signature: ____________________________
          </div>
        </div>
      </div>

      <div className="main">
        {/* Header bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setSelectedId(null); setRoute('lab') }}
          >
            <Icon name="chevL" size={13} /> Back
          </button>
          <div style={{ flex: 1 }} />
          {order.status === 'pending' && (
            <button className="btn btn-primary btn-sm" onClick={handleCollect}>
              <Icon name="flask" size={13} /> Collect Sample
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
            <Icon name="printer" size={13} /> Print
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleDownloadPdf}>
            <Icon name="download" size={13} /> Download PDF
          </button>
        </div>

        {/* Patient / Doctor / Status info */}
        <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 20, justifyContent: 'space-between' }}>
          {/* Patient */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="av blue" style={{ width: 44, height: 44, fontSize: 15, fontWeight: 700, flexShrink: 0, borderRadius: '50%' }}>
              {patientInitials}
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', fontWeight: 500 }}>Patient</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)' }}>{order.patientId?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>
                {order.patientId?.phone ?? '—'}{order.patientId?.gender ? ` · ${order.patientId.gender}` : ''}
              </div>
            </div>
          </div>
          {/* Doctor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="av teal" style={{ width: 44, height: 44, fontSize: 15, fontWeight: 700, flexShrink: 0, borderRadius: '50%' }}>
              {(order.doctorId?.name ?? 'DR').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', fontWeight: 500 }}>Doctor</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)' }}>Dr. {order.doctorId?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>{order.doctorId?.specialization ?? '—'}</div>
            </div>
          </div>
          {/* Order ID */}
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', fontWeight: 500 }}>Order ID</div>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--fg-primary)' }}>{order.orderId}</div>
            <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>
              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
          {/* Status */}
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', fontWeight: 500, marginBottom: 4 }}>Status</div>
            <Badge variant={statusVariant(order.status)} dot>{statusLabel(order.status)}</Badge>
            <div style={{ marginTop: 6 }}>
              <Badge variant={priorityVariant(order.priority)} dot>
                {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Tabs */}
        {(() => {
          const TABS = [
            { key: 'tests' as const, label: `Lab Tests (${order.tests.length})`, sub: 'Ordered tests & results', icon: 'flask'    },
            { key: 'bill'  as const, label: 'Bill',                               sub: 'Charges & payment',       icon: 'billing'  },
          ]
          return (
            <div style={{
              display: 'flex', gap: 0, marginBottom: 0,
              borderBottom: '1px solid var(--border-soft)',
              background: 'var(--bg-surface)',
              borderRadius: '12px 12px 0 0',
              padding: '0 4px',
            }}>
              {TABS.map(t => {
                const active = activeTab === t.key
                return (
                  <button key={t.key} type="button" onClick={() => setActiveTab(t.key)} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer',
                    borderBottom: active ? '2px solid var(--brand-500, #3b82f6)' : '2px solid transparent',
                    marginBottom: -1,
                  }}>
                    <Icon name={t.icon as any} size={16} style={{ color: active ? 'var(--brand-500, #3b82f6)' : 'var(--fg-muted)' }} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: active ? 'var(--brand-500, #3b82f6)' : 'var(--fg-secondary)', lineHeight: 1.2 }}>{t.label}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', fontWeight: 400, marginTop: 1 }}>{t.sub}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          )
        })()}

        {/* ── Tests tab ────────────────────────────────────────────────────────── */}
        {activeTab === 'tests' && (
          <div className="table-card">
            <div className="table-toolbar">
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)' }}>Ordered Tests</div>
              {order.collectedAt && (
                <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                  Sample collected: {new Date(order.collectedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>
              )}
            </div>
            <table className="data">
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Priority</th>
                  <th>Result</th>
                  <th>Unit</th>
                  <th>Normal Range</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {order.tests.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--fg-muted)', fontSize: 13 }}>
                        No tests in this order
                      </div>
                    </td>
                  </tr>
                ) : order.tests.map((t, i) => {
                  const draft   = resultDrafts[i]
                  const editing = !!draft
                  const canEdit = order.status === 'in-progress' || order.status === 'pending'
                  return (
                    <tr key={i}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t.name}</div>
                        {t.category && (
                          <span style={{ display: 'inline-block', marginTop: 3, padding: '1px 7px', background: 'var(--brand-gradient-soft)', color: 'var(--teal-800)', borderRadius: 5, fontSize: 11, fontWeight: 600 }}>
                            {t.category}
                          </span>
                        )}
                      </td>
                      <td>
                        <Badge variant={priorityVariant(t.priority ?? 'routine')} dot>
                          {(t.priority ?? 'routine').charAt(0).toUpperCase() + (t.priority ?? 'routine').slice(1)}
                        </Badge>
                      </td>
                      <td style={{ minWidth: 120 }}>
                        {editing ? (
                          <input
                            className="form-input"
                            style={{ padding: '4px 8px', fontSize: 13, width: 120 }}
                            value={draft.result}
                            onChange={e => setResultDrafts(prev => ({ ...prev, [i]: { ...prev[i], result: e.target.value } }))}
                            placeholder="Enter result"
                            autoFocus
                          />
                        ) : (
                          <span style={{ fontSize: 13.5, fontWeight: t.result ? 600 : 400, color: t.result ? 'var(--fg-primary)' : 'var(--fg-muted)' }}>
                            {t.result ?? '—'}
                          </span>
                        )}
                      </td>
                      <td style={{ minWidth: 90 }}>
                        {editing ? (
                          <input
                            className="form-input"
                            style={{ padding: '4px 8px', fontSize: 13, width: 80 }}
                            value={draft.unit}
                            onChange={e => setResultDrafts(prev => ({ ...prev, [i]: { ...prev[i], unit: e.target.value } }))}
                            placeholder="Unit"
                          />
                        ) : (
                          <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>{t.unit ?? '—'}</span>
                        )}
                      </td>
                      <td style={{ minWidth: 120 }}>
                        {editing ? (
                          <input
                            className="form-input"
                            style={{ padding: '4px 8px', fontSize: 13, width: 110 }}
                            value={draft.normalRange}
                            onChange={e => setResultDrafts(prev => ({ ...prev, [i]: { ...prev[i], normalRange: e.target.value } }))}
                            placeholder="e.g. 4.5–11.0"
                          />
                        ) : (
                          <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>{t.normalRange ?? '—'}</span>
                        )}
                      </td>
                      <td>
                        <Badge
                          variant={t.status === 'completed' ? 'success' : t.status === 'in-progress' ? 'blue' : 'warning'}
                          dot
                        >
                          {t.status === 'in-progress' ? 'In Progress' : t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Bill tab ─────────────────────────────────────────────────────────── */}
        {activeTab === 'bill' && (
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            {/* Items */}
            <div className="table-card" style={{ flex: 1 }}>
              <div className="table-toolbar">
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)' }}>Bill Items</div>
              </div>
              {order.tests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--fg-muted)' }}>
                  <Icon name="flask" size={32} />
                  <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600 }}>No tests billed</div>
                </div>
              ) : (
                <table className="data">
                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.tests.map((t, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, fontSize: 13.5 }}>{t.name}</td>
                        <td>
                          <Badge
                            variant={t.status === 'completed' ? 'success' : t.status === 'in-progress' ? 'blue' : 'warning'}
                            dot
                          >
                            {t.status === 'in-progress' ? 'In Progress' : t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                          </Badge>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--teal-800)' }}>
                          ₹{(t.rate ?? 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Summary + Pay */}
            <div className="card" style={{ width: 300, flexShrink: 0, position: 'sticky', top: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Bill Summary</div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13.5 }}>
                <span style={{ color: 'var(--fg-secondary)' }}>Subtotal</span>
                <span style={{ fontWeight: 600 }}>₹{viewSubtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13.5 }}>
                  <span style={{ color: 'var(--fg-secondary)' }}>Discount ({order.discount}%)</span>
                  <span style={{ color: 'var(--teal-800)', fontWeight: 600 }}>-₹{viewDiscount.toFixed(2)}</span>
                </div>
              )}
              {order.gst > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13.5 }}>
                  <span style={{ color: 'var(--fg-secondary)' }}>GST ({order.gst}%)</span>
                  <span style={{ fontWeight: 600 }}>₹{viewGstAmt.toFixed(2)}</span>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border-soft)', margin: '12px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Grand Total</span>
                <span style={{ fontSize: 18, fontWeight: 800, background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  ₹{viewTotal.toFixed(2)}
                </span>
              </div>

              {viewPaid > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13.5 }}>
                    <span style={{ color: 'var(--fg-secondary)' }}>Paid</span>
                    <span style={{ fontWeight: 600, color: 'var(--teal-800)' }}>₹{viewPaid.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13.5 }}>
                    <span style={{ color: 'var(--fg-secondary)' }}>Balance</span>
                    <span style={{ fontWeight: 700, color: viewBalance > 0 ? '#ef4444' : 'var(--teal-800)' }}>
                      ₹{viewBalance.toFixed(2)}
                    </span>
                  </div>
                </>
              )}

              {order.paymentMethod && (
                <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 12 }}>
                  Payment via: <strong>{order.paymentMethod}</strong>
                </div>
              )}

              {order.status !== 'paid' && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-secondary)', marginBottom: 6 }}>Payment Method</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {PAY_METHODS.map(m => (
                        <button
                          key={m}
                          onClick={() => setPayMethod(m)}
                          style={{
                            flex: 1, padding: '5px 0', fontSize: 11.5, fontWeight: 600,
                            borderRadius: 7, border: 'none', cursor: 'pointer', minWidth: 50,
                            background: payMethod === m ? 'var(--brand-gradient)' : 'var(--bg-section)',
                            color: payMethod === m ? 'white' : 'var(--fg-secondary)',
                          }}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {paying ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input
                        type="number"
                        className="form-input"
                        value={payAmount}
                        onChange={e => setPayAmount(e.target.value)}
                        placeholder={`Amount (max ₹${viewBalance.toFixed(2)})`}
                        style={{ fontSize: 14, padding: '8px 10px' }}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handlePay}>Confirm</button>
                        <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setPaying(false); setPayAmount('') }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', padding: '10px 0', fontSize: 14 }}
                      onClick={() => { setPaying(true); setPayAmount(String(viewBalance > 0 ? viewBalance.toFixed(2) : viewTotal.toFixed(2))) }}
                    >
                      Collect Payment ₹{(viewBalance > 0 ? viewBalance : viewTotal).toFixed(2)}
                    </button>
                  )}
                </>
              )}

              {order.status === 'paid' && (
                <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--teal-800)', fontWeight: 700, fontSize: 14 }}>
                  ✓ Fully Paid
                  {order.paidAt && (
                    <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', fontWeight: 400, marginTop: 4 }}>
                      {new Date(order.paidAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
