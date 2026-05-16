import { useState, useEffect, useRef } from 'react'
import dayjs from 'dayjs'
import Icon from '@/components/ui/Icon'
import Badge from '@/components/ui/Badge'
import { useAppStore } from '@/store/app'
import { useAuthStore } from '@/store/auth'
import { appointmentsService } from '@/services/appointments.service'
import { masterdataService } from '@/services/masterdata.service'
import { labService } from '@/services/lab.service'
import { tokensService } from '@/services/tokens.service'
import { toast } from '@/store/toast'

interface Props {
  mode: 'view' | 'edit'
}

const TABS         = ['Appointment info', 'Consultation info', 'Rx info', 'Medical documents', 'Reports', 'Follow-up']
const MED_UNITS    = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Cream', 'Inhaler', 'Sachet', 'Patch', 'Ointment']
const STATUS_OPTIONS = ['scheduled','in-progress','completed','cancelled','no-show']

/* ── Document types ──────────────────────────────────────────────────────── */
const DOC_TYPES = [
  'Lab Report', 'Radiology Scan', 'Prescription', 'Discharge Summary',
  'Medical Certificate', 'Insurance Document', 'Referral Letter', 'Other',
]

interface DocItem {
  id:        string
  name:      string
  docType:   string
  fileType:  string
  size:      number
  date:      string
  objectUrl: string
}

function fileTypeLabel(mime: string): string {
  if (mime.includes('pdf'))   return 'PDF'
  if (mime.includes('image')) return mime.split('/')[1].toUpperCase()
  if (mime.includes('word') || mime.includes('document')) return 'DOC'
  if (mime.includes('sheet') || mime.includes('excel'))   return 'XLS'
  return mime.split('/').pop()?.toUpperCase() ?? 'FILE'
}

function fileTypeVariant(mime: string): 'danger' | 'blue' | 'success' | 'muted' {
  if (mime.includes('pdf'))   return 'danger'
  if (mime.includes('image')) return 'blue'
  if (mime.includes('word') || mime.includes('document')) return 'muted'
  return 'success'
}

function fmtSize(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const APPT_STATUS_VARIANT: Record<string, string> = {
  'scheduled':   'info',
  'in-progress': 'warning',
  'completed':   'success',
  'cancelled':   'danger',
  'no-show':     'muted',
}
function ApptStatusBadge({ status }: { status: string }) {
  const variant = (APPT_STATUS_VARIANT[status] ?? 'muted') as any
  return <Badge variant={variant}><span className="d" />{status}</Badge>
}

interface RxItem {
  id:       number
  name:     string
  dosage:   string
  quantity: number
  unit:     string
  rate:     number
  amount:   number
}

function emptyRx(): RxItem {
  return { id: Date.now(), name: '', dosage: '', quantity: 0, unit: 'Tablet', rate: 0, amount: 0 }
}

function rxFromApi(p: any, idx: number): RxItem {
  return {
    id:       idx,
    name:     p.medicine ?? '',
    dosage:   p.dosage   ?? '0-0-0-0',
    quantity: p.quantity ?? 0,
    unit:     p.unit     ?? 'Tablet',
    rate:     p.rate     ?? 0,
    amount:   p.amount   ?? 0,
  }
}

function rxToApi(r: RxItem) {
  return {
    medicine: r.name,
    dosage:   r.dosage,
    quantity: r.quantity,
    unit:     r.unit,
    rate:     r.rate,
    amount:   r.amount,
    instructions: '',
  }
}

/* ── Medicine combobox ───────────────────────────────────────────────────── */
function MedicineCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query,   setQuery]   = useState(value)
  const [results, setResults] = useState<any[]>([])
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
    setQuery(v); onChange(v)
    if (debRef.current) clearTimeout(debRef.current)
    debRef.current = setTimeout(() => search(v), 250)
  }

  const select = (item: any) => {
    setQuery(item.label); onChange(item.label); setOpen(false); setResults([])
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
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
        <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--fg-muted)' }}>…</div>
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
          borderRadius: 10, padding: '10px 14px', fontSize: 12.5, color: 'var(--fg-muted)',
          zIndex: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
        }}>
          No medicines found — type a custom name
        </div>
      )}
    </div>
  )
}

/* ── Lab test types ──────────────────────────────────────────────────────── */
interface LabTestItem {
  name:     string
  code?:    string
  category?: string
  rate:     number
  amount:   number
  priority: 'routine' | 'urgent' | 'stat'
  status:   'pending'
}

function emptyTest(name = '', code = '', category = '', rate = 0): LabTestItem {
  return { name, code, category, rate, amount: rate, priority: 'routine', status: 'pending' }
}

/* ── Test combobox ───────────────────────────────────────────────────────── */
function TestCombobox({ onSelect, selectedNames }: { onSelect: (t: any) => void; selectedNames: string[] }) {
  const [q,        setQ]        = useState('')
  const [allTests, setAllTests] = useState<any[]>([])
  const [open,     setOpen]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    masterdataService.list({ category: 'test' })
      .then(res => setAllTests(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const filtered = allTests.filter(t => {
    if (selectedNames.includes(t.label)) return false
    if (!q.trim()) return true
    return t.label.toLowerCase().includes(q.toLowerCase())
  })

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--bg-section)', borderRadius: 10,
        padding: '9px 14px', border: '1.5px solid var(--border-soft)',
      }}>
        <Icon name="search" size={15} style={{ color: 'var(--fg-muted)', flexShrink: 0 }} />
        <input
          style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, flex: 1, color: 'var(--fg-primary)' }}
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={loading ? 'Loading tests…' : 'Search and add test...'}
          autoComplete="off"
        />
      </div>
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--bg-surface)', border: '1px solid var(--border-soft)',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
          zIndex: 200, maxHeight: 220, overflowY: 'auto',
        }}>
          {filtered.map((t, i) => (
            <button
              key={t._id}
              type="button"
              onMouseDown={() => { onSelect(t); setQ(''); setOpen(false) }}
              style={{
                display: 'flex', justifyContent: 'space-between', width: '100%',
                padding: '9px 14px', border: 'none', background: 'transparent',
                fontSize: 13, cursor: 'pointer', color: 'var(--fg-primary)', textAlign: 'left',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-section)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontWeight: 600 }}>{t.label}</span>
              {t.metadata?.category && (
                <span style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>{t.metadata.category}</span>
              )}
            </button>
          ))}
        </div>
      )}
      {open && !loading && q.trim().length > 0 && filtered.length === 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--bg-surface)', border: '1px solid var(--border-soft)',
          borderRadius: 10, padding: '10px 14px', fontSize: 12.5, color: 'var(--fg-muted)',
          zIndex: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
        }}>
          No tests found for "{q}"
        </div>
      )}
    </div>
  )
}

/* ── Follow-up reason options ────────────────────────────────────────────── */
const FOLLOWUP_REASONS = [
  'Review & monitoring',
  'Medication follow-up',
  'Lab results review',
  'Wound dressing / post-op',
  'Physiotherapy',
  'Vaccination / injection',
  'Chronic disease management',
  'Post-discharge review',
  'Mental health check',
  'Other',
]

/* ── FollowUpTab ─────────────────────────────────────────────────────────── */
function FollowUpTab({ appt, selectedId, editMode }: { appt: any; selectedId: string | null; editMode: boolean }) {
  const { setRoute, setSelectedId } = useAppStore()

  // shared list state (both modes)
  const [followUps,     setFollowUps]     = useState<any[]>([])
  const [loadFollowUps, setLoadFollowUps] = useState(false)

  // edit mode — create form toggle + fields
  const [showForm, setShowForm]   = useState(false)
  const [fuDate,    setFuDate]    = useState('')
  const [fuTime,    setFuTime]    = useState('')
  const [fuReason,  setFuReason]  = useState(FOLLOWUP_REASONS[0])
  const [fuNotes,   setFuNotes]   = useState('')
  const [slots,     setSlots]     = useState<{ time: string; available: boolean }[]>([])
  const [loadSlots, setLoadSlots] = useState(false)
  const [creating,  setCreating]  = useState(false)

  const doctorId = appt?.doctorId?._id

  const loadList = () => {
    if (!selectedId) return
    setLoadFollowUps(true)
    appointmentsService.list({ followUpOf: selectedId } as any)
      .then(res => setFollowUps(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoadFollowUps(false))
  }

  useEffect(() => { loadList() }, [selectedId])

  // Load slots when date changes
  useEffect(() => {
    if (!fuDate || !doctorId) { setSlots([]); return }
    setLoadSlots(true)
    setFuTime('')
    appointmentsService.slots(doctorId, fuDate)
      .then(res => setSlots(res.data ?? []))
      .catch(() => toast.error('Failed to load slots'))
      .finally(() => setLoadSlots(false))
  }, [fuDate, doctorId])

  const resetForm = () => {
    setFuDate(''); setFuTime(''); setFuReason(FOLLOWUP_REASONS[0])
    setFuNotes(''); setSlots([])
  }

  const handleCreate = async () => {
    if (!fuDate)   { toast.error('Select a follow-up date'); return }
    if (!fuTime)   { toast.error('Select a time slot'); return }
    if (!fuReason) { toast.error('Select a reason'); return }
    if (!appt)     return

    setCreating(true)
    try {
      const clinicId = appt.clinicId?._id ?? appt.clinicId
      await appointmentsService.create({
        patientId:      appt.patientId?._id,
        doctorId:       appt.doctorId?._id,
        clinicId,
        date:           fuDate,
        time:           fuTime,
        type:           'follow-up',
        status:         'scheduled',
        notes:          fuNotes,
        followUpOf:     selectedId,
        followUpReason: fuReason,
      })
      toast.success('Follow-up appointment created')
      resetForm()
      setShowForm(false)
      loadList()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create follow-up')
    } finally {
      setCreating(false)
    }
  }

  const today = dayjs().format('YYYY-MM-DD')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Create form (edit mode only, toggled) ── */}
      {editMode && showForm && (
        <div className="card" style={{ border: '1.5px solid var(--teal-200, #99f6e4)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 20,
          }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)' }}>New follow-up appointment</span>
            <button
              className="act"
              onClick={() => { setShowForm(false); resetForm() }}
              title="Close"
            >
              <Icon name="x" size={14} />
            </button>
          </div>

          {/* Date + Slots side-by-side */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 20 }}>

            {/* Date picker */}
            <div style={{ minWidth: 200 }}>
              <div className="form-group">
                <label className="form-label">Follow-up date</label>
                <input
                  type="date"
                  className="form-input"
                  min={today}
                  value={fuDate}
                  onChange={e => setFuDate(e.target.value)}
                />
              </div>
            </div>

            {/* Slot picker */}
            <div style={{ flex: 1 }}>
              <label className="form-label">
                Time slot
                {fuDate && <span style={{ marginLeft: 8, fontWeight: 400, color: 'var(--fg-muted)' }}>{dayjs(fuDate).format('dddd, DD MMM YYYY')}</span>}
              </label>
              {!fuDate ? (
                <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', padding: '10px 0' }}>Select a date to see available slots</div>
              ) : loadSlots ? (
                <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', padding: '10px 0' }}>Loading slots…</div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {slots.map(s => (
                      <button
                        key={s.time}
                        type="button"
                        disabled={!s.available}
                        onClick={() => s.available && setFuTime(s.time)}
                        style={{
                          padding: '6px 12px', borderRadius: 8, border: '1.5px solid',
                          fontSize: 12.5, fontWeight: 600, cursor: s.available ? 'pointer' : 'not-allowed',
                          fontFamily: 'var(--font-mono)', transition: 'all 100ms',
                          borderColor: !s.available ? 'var(--border-light)' : fuTime === s.time ? 'transparent' : 'var(--border-soft)',
                          background: !s.available ? 'var(--bg-section)' : fuTime === s.time ? 'var(--brand-gradient)' : 'var(--bg-surface)',
                          color: !s.available ? 'var(--fg-muted)' : fuTime === s.time ? 'white' : 'var(--fg-primary)',
                          textDecoration: !s.available ? 'line-through' : 'none',
                          opacity: !s.available ? 0.45 : 1,
                        }}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 11.5, color: 'var(--fg-muted)' }}>
                    <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'var(--brand-gradient)', marginRight: 4 }} />Selected</span>
                    <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, border: '1.5px solid var(--border-soft)', marginRight: 4 }} />Available</span>
                    <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'var(--bg-section)', marginRight: 4 }} />Booked</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Reason */}
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Follow-up reason</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {FOLLOWUP_REASONS.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setFuReason(r)}
                  style={{
                    padding: '6px 13px', borderRadius: 20, border: '1.5px solid',
                    fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'all 100ms',
                    borderColor: fuReason === r ? 'transparent' : 'var(--border-soft)',
                    background: fuReason === r ? 'var(--brand-gradient)' : 'var(--bg-surface)',
                    color: fuReason === r ? 'white' : 'var(--fg-secondary)',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Notes <span style={{ fontWeight: 400, color: 'var(--fg-muted)' }}>(optional)</span></label>
            <textarea
              className="form-textarea"
              rows={2}
              value={fuNotes}
              onChange={e => setFuNotes(e.target.value)}
              placeholder="Special instructions or context…"
              style={{ width: '100%' }}
            />
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4, borderTop: '1px solid var(--border-light)' }}>
            <div style={{ flex: 1, display: 'flex', gap: 20, fontSize: 13 }}>
              <span style={{ color: fuDate ? 'var(--fg-primary)' : 'var(--fg-muted)', fontWeight: 600 }}>
                {fuDate ? dayjs(fuDate).format('DD MMM YYYY') : 'No date'}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', color: fuTime ? 'var(--fg-primary)' : 'var(--fg-muted)', fontWeight: 600 }}>
                {fuTime || 'No slot'}
              </span>
              <span style={{ color: 'var(--fg-secondary)' }}>{fuReason}</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); resetForm() }}>Cancel</button>
            <button
              className="btn btn-primary btn-sm"
              disabled={creating || !fuDate || !fuTime}
              onClick={handleCreate}
            >
              <Icon name="calendar" size={13} />
              {creating ? 'Creating…' : 'Create follow-up'}
            </button>
          </div>
        </div>
      )}

      {/* ── Follow-up list ── */}
      <div className="table-card">
        <div className="table-toolbar">
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)', flex: 1 }}>
            Follow-up appointments
          </span>
          {!loadFollowUps && (
            <span style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>
              {followUps.length} record{followUps.length !== 1 ? 's' : ''}
            </span>
          )}
          {editMode && !showForm && (
            <button
              className="btn btn-primary btn-sm"
              style={{ flexShrink: 0 }}
              onClick={() => setShowForm(true)}
            >
              <Icon name="plus" size={14} /> Add follow-up
            </button>
          )}
        </div>

        <table className="data">
          <thead>
            <tr>
              <th>Date &amp; Time</th>
              <th>Doctor</th>
              <th>Reason</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadFollowUps ? (
              <tr><td colSpan={5}><div style={{ textAlign: 'center', padding: '32px', color: 'var(--fg-muted)', fontSize: 13 }}>Loading…</div></td></tr>
            ) : followUps.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--fg-muted)' }}>
                    <Icon name="calendar" size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-secondary)' }}>No follow-ups yet</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      {editMode ? 'Click "Add follow-up" to schedule one' : 'No follow-up appointments have been scheduled'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : followUps.map(fu => (
              <tr key={fu._id}>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{fu.date ? dayjs(fu.date).format('DD MMM YYYY') : '—'}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{fu.time || '—'}</div>
                </td>
                <td style={{ fontSize: 13.5, color: 'var(--fg-secondary)' }}>{fu.doctorId?.name ?? '—'}</td>
                <td style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>{fu.followUpReason || '—'}</td>
                <td><ApptStatusBadge status={fu.status ?? 'scheduled'} /></td>
                <td>
                  <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setSelectedId(fu._id); setRoute('appt-view') }}
                    >
                      <Icon name="eye" size={13} /> View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}

export default function AppointmentDetail({ mode }: Props) {
  const { setRoute, setSelectedId, selectedId } = useAppStore()
  const { user } = useAuthStore()

  const [tab,       setTab]       = useState(0)
  const [editMode,  setEditMode]  = useState(mode === 'edit')
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [appt,      setAppt]      = useState<any>(null)

  // Editable appointment fields
  const [status,    setStatus]    = useState('scheduled')
  const [apptDate,  setApptDate]  = useState('')
  const [apptTime,  setApptTime]  = useState('')

  // Vitals
  const [vitals, setVitals] = useState({ temp: '', bp: '', weight: '', pulse: '' })

  // Doctor notes
  const [notes,     setNotes]     = useState({ symptoms: '', diagnosis: '', notes: '' })
  // Rx state
  const [rxList,  setRxList]  = useState<RxItem[]>([emptyRx()])
  const [rxNotes, setRxNotes] = useState('')

  // Documents / reports state
  const [docs,        setDocs]        = useState<DocItem[]>([])
  const [uploadType,  setUploadType]  = useState('Lab Report')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Lab tests state
  const [labTests,       setLabTests]       = useState<LabTestItem[]>([])
  const [labNotes,       setLabNotes]       = useState('')
  const [existingLabId,  setExistingLabId]  = useState<string | null>(null)
  const [creatingOrder,  setCreatingOrder]  = useState(false)

  // Token state
  const [token, setToken] = useState<any | null>(null)

  // ── Load appointment from API ────────────────────────────────────────────
  useEffect(() => {
    if (!selectedId) { setLoading(false); return }
    setLoading(true)
    appointmentsService.get(selectedId)
      .then(data => {
        setAppt(data)
        setStatus(data.status ?? 'scheduled')
        setApptDate(data.date ? dayjs(data.date).format('YYYY-MM-DD') : '')
        setApptTime(data.time ?? '')
        setVitals({
          temp:   String(data.vitals?.temp   ?? ''),
          bp:     String(data.vitals?.bp     ?? ''),
          weight: String(data.vitals?.weight ?? ''),
          pulse:  String(data.vitals?.pulse  ?? ''),
        })
        setNotes({
          symptoms:  (data.symptoms ?? []).join(', '),
          diagnosis: '',
          notes:     data.notes ?? '',
        })
        const rx = data.prescription ?? []
        setRxList(rx.length > 0 ? rx.map(rxFromApi) : [emptyRx()])
        setRxNotes(data.rxNotes ?? '')
      })
      .catch(() => toast.error('Failed to load appointment'))
      .finally(() => setLoading(false))
  }, [selectedId])

  // ── Load token for this appointment ─────────────────────────────────────
  useEffect(() => {
    if (!selectedId) return
    tokensService.list({ appointmentId: selectedId })
      .then(res => {
        const list = res.data ?? []
        if (list.length > 0) setToken(list[0])
      })
      .catch(() => {})
  }, [selectedId])

  // ── Load existing lab order for this appointment ────────────────────────
  useEffect(() => {
    if (!selectedId) return
    labService.list({ appointmentId: selectedId! })
      .then(res => {
        const orders = res.data ?? []
        if (orders.length > 0) {
          const o = orders[0]
          setExistingLabId(o._id)
          setLabTests((o.tests ?? []).map((t: any) => ({
            name:     t.name,
            code:     t.code,
            category: t.category,
            rate:     t.rate ?? 0,
            amount:   t.amount ?? t.rate ?? 0,
            priority: t.priority ?? 'routine',
            status:   t.status ?? 'pending',
          })))
          setLabNotes(o.notes ?? '')
        }
      })
      .catch(() => {})
  }, [selectedId])

  // ── Save handlers ────────────────────────────────────────────────────────
  const saveAll = async () => {
    if (!selectedId) return
    setSaving(true)
    try {
      await appointmentsService.update(selectedId, {
        status,
        date:     apptDate,
        time:     apptTime,
        symptoms: notes.symptoms ? notes.symptoms.split(',').map(s => s.trim()).filter(Boolean) : [],
        notes:    notes.notes,
      })
      await appointmentsService.updateVitals(selectedId, {
        bp:     vitals.bp     || undefined,
        pulse:  vitals.pulse  ? Number(vitals.pulse)  : undefined,
        temp:   vitals.temp   ? Number(vitals.temp)   : undefined,
        weight: vitals.weight ? Number(vitals.weight) : undefined,
      })
      await appointmentsService.updatePrescription(selectedId, rxList.filter(r => r.name.trim()).map(rxToApi))
      toast.success('Appointment updated')
      setEditMode(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleMarkCompleted = async () => {
    if (!selectedId) return
    setSaving(true)
    try {
      await appointmentsService.update(selectedId, { status: 'completed' })
      setStatus('completed')
      toast.success('Marked as completed')
      setEditMode(false)
    } catch {
      toast.error('Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelAppt = async () => {
    if (!selectedId) return
    setSaving(true)
    try {
      await appointmentsService.update(selectedId, { status: 'cancelled' })
      setStatus('cancelled')
      toast.success('Appointment cancelled')
      setEditMode(false)
    } catch {
      toast.error('Failed to cancel')
    } finally {
      setSaving(false)
    }
  }

  // ── Rx helpers ───────────────────────────────────────────────────────────
  const addRx = () => setRxList(l => [...l, emptyRx()])

  const updateRx = (id: number, patch: Partial<RxItem>) => {
    setRxList(l => l.map(r => {
      if (r.id !== id) return r
      const updated = { ...r, ...patch }
      updated.amount = updated.quantity * updated.rate
      return updated
    }))
  }

  const deleteRx = (id: number) => {
    setRxList(l => l.length === 1 ? [emptyRx()] : l.filter(r => r.id !== id))
  }

  // ── Document helpers ─────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const newDocs: DocItem[] = files.map(f => ({
      id:        `${Date.now()}-${Math.random()}`,
      name:      f.name,
      docType:   uploadType,
      fileType:  f.type || 'application/octet-stream',
      size:      f.size,
      date:      new Date().toISOString(),
      objectUrl: URL.createObjectURL(f),
    }))
    setDocs(prev => [...prev, ...newDocs])
    toast.success(`${newDocs.length} file${newDocs.length > 1 ? 's' : ''} uploaded`)
    e.target.value = ''
  }

  const handleViewDoc = (doc: DocItem) => {
    window.open(doc.objectUrl, '_blank', 'noopener,noreferrer')
  }

  const handleDeleteDoc = (id: string) => {
    setDocs(prev => {
      const doc = prev.find(d => d.id === id)
      if (doc) URL.revokeObjectURL(doc.objectUrl)
      return prev.filter(d => d.id !== id)
    })
    toast.success('Document removed')
  }

  // ── Lab test helpers ─────────────────────────────────────────────────────
  const addTest = (t: any) => {
    setLabTests(prev => [...prev, emptyTest(t.label, t.value, t.metadata?.category, t.metadata?.price ?? 0)])
  }

  const updateTest = (i: number, patch: Partial<LabTestItem>) => {
    setLabTests(prev => prev.map((t, idx) => idx !== i ? t : { ...t, ...patch, amount: patch.rate ?? t.rate }))
  }

  const removeTest = (i: number) => {
    setLabTests(prev => prev.filter((_, idx) => idx !== i))
  }

  const handleCreateLabOrder = async () => {
    if (labTests.length === 0) { toast.error('Add at least one test'); return }
    if (!appt) return
    setCreatingOrder(true)
    try {
      const payload: Record<string, unknown> = {
        patientId:     appt.patientId?._id,
        doctorId:      appt.doctorId?._id,
        appointmentId: selectedId,
        tests:         labTests,
        notes:         labNotes,
      }
      const clinicId = appt.clinicId?._id ?? user?.clinicId
      if (clinicId) payload.clinicId = clinicId

      if (existingLabId) {
        await labService.update(existingLabId, { tests: labTests, notes: labNotes })
        toast.success('Lab order updated')
      } else {
        const created = await labService.create(payload)
        setExistingLabId(created._id)
        toast.success(`Lab order created — ${created.orderId}`)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save lab order')
    } finally {
      setCreatingOrder(false)
    }
  }

  const labSubtotal = labTests.reduce((s, t) => s + (t.amount ?? 0), 0)

  // ── Derived display values ───────────────────────────────────────────────
  const patientName  = appt?.patientId?.name  ?? '—'
  const doctorName   = appt?.doctorId?.name   ?? '—'
  const clinicName   = appt?.clinicId?.name   ?? '—'
  const tokenDisplay = selectedId ? selectedId.slice(-6).toUpperCase() : '——'

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--fg-muted)', fontSize: 14 }}>
        Loading appointment…
      </div>
    )
  }

  if (!appt && !loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: 'var(--fg-muted)' }}>
        <Icon name="ticket" size={40} />
        <div style={{ fontSize: 15, fontWeight: 600 }}>Appointment not found</div>
        <button className="btn btn-secondary btn-sm" onClick={() => setRoute('appointments')}>Back to list</button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Top Strip */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px',
        background: 'var(--brand-gradient)', flexShrink: 0,
      }}>
        <button
          onClick={() => setRoute('appointments')}
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}
        >
          <Icon name="chevL" size={16} />
        </button>
        <div style={{
          background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '6px 14px',
          fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: 2,
        }}>
          {tokenDisplay}
        </div>
        <ApptStatusBadge status={status} />
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
          {patientName} · {doctorName}
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', gap: 6 }}>
          <Icon name="printer" size={14} /> Print Rx
        </button>
        <button
          className="btn btn-sm"
          onClick={() => setEditMode(e => !e)}
          style={{ background: editMode ? 'white' : 'rgba(255,255,255,0.15)', color: editMode ? 'var(--teal-800)' : 'white', border: 'none' }}
        >
          <Icon name="edit" size={14} /> {editMode ? 'Editing' : 'Edit'}
        </button>
      </div>

      {/* Tab Strip */}
      <div style={{
        display: 'flex', gap: 0, background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-soft)', flexShrink: 0, padding: '0 24px',
      }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '12px 18px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13.5, fontWeight: tab === i ? 700 : 500,
            color: tab === i ? 'var(--teal-600)' : 'var(--fg-secondary)',
            borderBottom: tab === i ? '2px solid var(--teal-600)' : '2px solid transparent',
            transition: 'all 140ms', whiteSpace: 'nowrap',
          }}>{t}</button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', paddingBottom: 80 }}>

        {/* Tab 1: Appointment Info */}
        {tab === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
              <div className="card-h"><h2>Basic details</h2></div>
              <div className="grid-4" style={{ gap: 12 }}>
                {[
                  { label: 'Appointment ID', value: selectedId ?? '—', editable: false },
                  { label: 'Patient',        value: patientName,        editable: false },
                  { label: 'Doctor',         value: doctorName,         editable: false },
                  { label: 'Clinic',         value: clinicName,         editable: false },
                  { label: 'Type',           value: appt?.type ?? '—',  editable: false },
                ].map(f => (
                  <div key={f.label} className="form-group">
                    <label className="form-label">{f.label}</label>
                    <div style={{ padding: '9px 12px', background: 'var(--bg-section)', borderRadius: 10, fontSize: f.label === 'Appointment ID' ? 11 : 13.5, fontWeight: 500, fontFamily: f.label === 'Appointment ID' ? 'var(--font-mono)' : undefined }}>{f.value}</div>
                  </div>
                ))}
                <div className="form-group">
                  <label className="form-label">Date</label>
                  {editMode
                    ? <input type="date" className="form-input" value={apptDate} onChange={e => setApptDate(e.target.value)} />
                    : <div style={{ padding: '9px 12px', background: 'var(--bg-section)', borderRadius: 10, fontSize: 13.5, fontWeight: 500 }}>{apptDate ? dayjs(apptDate).format('DD MMM YYYY') : '—'}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  {editMode
                    ? <input className="form-input" value={apptTime} onChange={e => setApptTime(e.target.value)} placeholder="e.g. 09:30 AM" />
                    : <div style={{ padding: '9px 12px', background: 'var(--bg-section)', borderRadius: 10, fontSize: 13.5, fontWeight: 500, fontFamily: 'var(--font-mono)' }}>{apptTime || '—'}</div>}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-h"><h2>Status</h2></div>
              <div className="form-group" style={{ maxWidth: 320 }}>
                <label className="form-label">Appointment status</label>
                {editMode
                  ? (
                    <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )
                  : <div style={{ paddingTop: 4 }}><ApptStatusBadge status={status} /></div>}
              </div>
            </div>

            {/* Token information */}
            <div className="card">
              <div className="card-h"><h2>Token information</h2></div>
              {token ? (
                <div className="grid-4" style={{ gap: 14 }}>
                  {/* Token number hero */}
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--brand-gradient)', borderRadius: 14, padding: '20px 16px', gap: 4,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.75)' }}>Token No.</div>
                    <div style={{ fontSize: 36, fontWeight: 900, color: 'white', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                      {String(token.tokenNumber).padStart(3, '0')}
                    </div>
                  </div>

                  {[
                    { label: 'Status',   value: <Badge variant={token.status === 'completed' ? 'success' : token.status === 'in-consultation' ? 'warning' : token.status === 'cancelled' ? 'muted' : 'info' as any} dot>{token.status}</Badge> },
                    { label: 'Priority', value: <Badge variant={token.priority === 'emergency' ? 'danger' : token.priority === 'priority' ? 'warning' : 'muted' as any} dot>{token.priority}</Badge> },
                    { label: 'Issued at', value: token.issuedAt ? dayjs(token.issuedAt).format('DD MMM YYYY · hh:mm A') : '—' },
                    { label: 'Called at', value: token.calledAt ? dayjs(token.calledAt).format('DD MMM YYYY · hh:mm A') : '—' },
                    { label: 'Completed at', value: token.completedAt ? dayjs(token.completedAt).format('DD MMM YYYY · hh:mm A') : '—' },
                    { label: 'Notes', value: token.notes || '—' },
                  ].map(f => (
                    <div key={f.label} className="form-group">
                      <label className="form-label">{f.label}</label>
                      <div style={{ padding: '9px 12px', background: 'var(--bg-section)', borderRadius: 10, fontSize: 13.5, fontWeight: 500 }}>
                        {f.value}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 24px', color: 'var(--fg-muted)' }}>
                  <Icon name="ticket" size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-secondary)' }}>No token linked</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>A token will appear here once it is issued for this appointment</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Consultation Info */}
        {tab === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
              <div className="card-h"><h2>Vitals</h2></div>
              <div className="grid-4" style={{ gap: 12 }}>
                {[
                  { key: 'temp'   as const, label: 'Temperature',   unit: '°F',  icon: 'thermometer' },
                  { key: 'bp'     as const, label: 'Blood pressure', unit: 'mmHg',icon: 'activity'    },
                  { key: 'weight' as const, label: 'Weight',         unit: 'kg',  icon: 'pulse'       },
                  { key: 'pulse'  as const, label: 'Pulse',          unit: 'bpm', icon: 'heart'       },
                ].map(v => (
                  <div key={v.key} style={{ background: 'var(--bg-section)', borderRadius: 14, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: 'var(--teal-600)' }}>
                      <Icon name={v.icon} size={16} />
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-secondary)' }}>{v.label}</span>
                    </div>
                    {editMode
                      ? <input className="form-input" value={vitals[v.key]} onChange={e => setVitals(vt => ({ ...vt, [v.key]: e.target.value }))} placeholder={`e.g. ${v.key === 'bp' ? '120/80' : '98'}`} />
                      : (
                        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--fg-primary)', letterSpacing: '-0.03em' }}>
                          {vitals[v.key] || '—'} {vitals[v.key] && <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)' }}>{v.unit}</span>}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-h"><h2>Doctor notes</h2></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { key: 'symptoms'  as const, label: 'Symptoms / chief complaint' },
                  { key: 'diagnosis' as const, label: 'Diagnosis' },
                  { key: 'notes'     as const, label: 'Clinical notes' },
                ].map(f => (
                  <div key={f.key} className="form-group">
                    <label className="form-label">{f.label}</label>
                    {editMode
                      ? <textarea className="form-input form-textarea" value={notes[f.key]} onChange={e => setNotes(n => ({ ...n, [f.key]: e.target.value }))} />
                      : <div style={{ padding: '10px 12px', background: 'var(--bg-section)', borderRadius: 10, fontSize: 13.5, lineHeight: 1.6, minHeight: 52 }}>{notes[f.key] || '—'}</div>}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: Rx Info */}
        {tab === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

              {/* Card header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px', borderBottom: '1px solid var(--border-light)',
              }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)' }}>Medicines</span>
                {editMode && (
                  <button className="btn btn-secondary btn-sm" onClick={addRx}>
                    <Icon name="plus" size={13} /> Add medicine
                  </button>
                )}
              </div>

              {/* Medicines table */}
              <table className="data" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th style={{ width: 140 }}>Dosage</th>
                    <th style={{ width: 80, textAlign: 'center' }}>Qty</th>
                    <th style={{ width: 130 }}>Unit</th>
                    <th style={{ width: 120 }}>Rate (₹)</th>
                    <th style={{ width: 110 }}>Amount (₹)</th>
                    {editMode && <th style={{ width: 44 }} />}
                  </tr>
                </thead>
                <tbody>
                  {rxList.map(rx => (
                    <tr key={rx.id}>
                      <td>
                        {editMode
                          ? <MedicineCombobox value={rx.name} onChange={v => updateRx(rx.id, { name: v })} />
                          : <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-primary)' }}>{rx.name || '—'}</div>}
                      </td>
                      <td>
                        {editMode ? (
                          <input
                            className="form-input"
                            style={{ width: '100%', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}
                            value={rx.dosage}
                            onChange={e => {
                              const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 4)
                              updateRx(rx.id, { dosage: digits.split('').join('-') })
                            }}
                            onBlur={() => {
                              if (!rx.dosage) return
                              const digits = rx.dosage.replace(/[^0-9]/g, '').padEnd(4, '0').slice(0, 4)
                              updateRx(rx.id, { dosage: digits.split('').join('-') })
                            }}
                            placeholder="0-0-0-0"
                            title="Morning · Afternoon · Evening · Night"
                          />
                        ) : (
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '0.05em', color: 'var(--fg-primary)' }}>{rx.dosage || '—'}</div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {editMode
                          ? <input className="form-input" type="number" min={0} style={{ width: 60, textAlign: 'center' }} value={rx.quantity === 0 ? '' : rx.quantity} placeholder="0" onChange={e => updateRx(rx.id, { quantity: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)) })} />
                          : <div style={{ fontSize: 13.5, fontWeight: 600, textAlign: 'center' }}>{rx.quantity}</div>}
                      </td>
                      <td>
                        {editMode
                          ? <select className="form-input" style={{ width: '100%', padding: '6px 8px' }} value={rx.unit} onChange={e => updateRx(rx.id, { unit: e.target.value })}>
                              {MED_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          : <div style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>{rx.unit}</div>}
                      </td>
                      <td>
                        {editMode
                          ? <input className="form-input" type="number" min={0} style={{ width: 108 }} value={rx.rate === 0 ? '' : rx.rate} placeholder="0.00" onChange={e => updateRx(rx.id, { rate: e.target.value === '' ? 0 : Number(e.target.value) })} />
                          : <div style={{ fontSize: 13.5, fontWeight: 600 }}>₹{rx.rate.toFixed(2)}</div>}
                      </td>
                      <td style={{
                        fontWeight: 700, fontSize: 14,
                        background: 'var(--brand-gradient)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      }}>
                        ₹{rx.amount.toFixed(2)}
                      </td>
                      {editMode && (
                        <td>
                          <button className="act danger" onClick={() => deleteRx(rx.id)} title="Remove">
                            <Icon name="trash" size={13} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Notes */}
              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-light)' }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.06em', color: 'var(--fg-muted)', marginBottom: 10,
                }}>
                  Notes
                </div>
                {editMode
                  ? <textarea className="form-textarea" rows={3} value={rxNotes} onChange={e => setRxNotes(e.target.value)} placeholder="Special instructions, allergies, remarks…" style={{ width: '100%' }} />
                  : <div style={{ padding: '10px 12px', background: 'var(--bg-section)', borderRadius: 10, fontSize: 13.5, lineHeight: 1.6, minHeight: 48, color: rxNotes ? 'var(--fg-primary)' : 'var(--fg-muted)' }}>{rxNotes || 'No notes'}</div>}
              </div>

            </div>
          </div>
        )}

        {/* Tab 4: Medical Documents — Lab Tests */}
        {tab === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Tests card */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Card header with inline search */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 20px', borderBottom: '1px solid var(--border-light)',
              }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)', flexShrink: 0 }}>Tests</span>
                {editMode && (
                  <TestCombobox
                    onSelect={addTest}
                    selectedNames={labTests.map(t => t.name)}
                  />
                )}
              </div>

              {/* Test list / empty state */}
              {labTests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--fg-muted)' }}>
                  <Icon name="flask" size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-secondary)' }}>No tests added</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Search and add tests above</div>
                </div>
              ) : (
                <div>
                  <table className="data" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Test name</th>
                        <th>Category</th>
                        <th style={{ width: 90 }}>Priority</th>
                        <th style={{ width: 110 }}>Rate (₹)</th>
                        {editMode && <th style={{ width: 44 }} />}
                      </tr>
                    </thead>
                    <tbody>
                      {labTests.map((t, i) => (
                        <tr key={i}>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t.name}</div>
                            {t.code && <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 1 }}>{t.code}</div>}
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>
                            {t.category || '—'}
                          </td>
                          <td>
                            {editMode
                              ? <select className="form-input" style={{ padding: '4px 8px', fontSize: 12 }} value={t.priority} onChange={e => updateTest(i, { priority: e.target.value as any })}>
                                  <option value="routine">Routine</option>
                                  <option value="urgent">Urgent</option>
                                  <option value="stat">STAT</option>
                                </select>
                              : <Badge variant={t.priority === 'stat' ? 'danger' : t.priority === 'urgent' ? 'warning' : 'info'} dot>{t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}</Badge>}
                          </td>
                          <td>
                            {editMode
                              ? <input className="form-input" type="number" min={0} style={{ width: 98 }} value={t.rate === 0 ? '' : t.rate} placeholder="0.00" onChange={e => updateTest(i, { rate: e.target.value === '' ? 0 : Number(e.target.value), amount: e.target.value === '' ? 0 : Number(e.target.value) })} />
                              : <div style={{ fontSize: 13.5, fontWeight: 600 }}>₹{t.rate.toFixed(2)}</div>}
                          </td>
                          {editMode && (
                            <td>
                              <button className="act danger" onClick={() => removeTest(i)} title="Remove test">
                                <Icon name="trash" size={13} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Subtotal row */}
                  <div style={{
                    display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                    gap: 24, padding: '10px 20px',
                    borderTop: '1px solid var(--border-light)',
                    background: 'var(--bg-section)',
                  }}>
                    <span style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>
                      {labTests.length} test{labTests.length !== 1 ? 's' : ''}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)' }}>
                      Subtotal: <span style={{ background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        ₹{labSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </span>
                  </div>
                </div>
              )}

              {/* Notes section */}
              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-primary)', marginBottom: 10 }}>
                  Notes <span style={{ fontWeight: 400, color: 'var(--fg-muted)', fontSize: 12 }}>(optional)</span>
                </div>
                {editMode
                  ? <textarea className="form-textarea" rows={3} value={labNotes} onChange={e => setLabNotes(e.target.value)} placeholder="Special instructions, fasting requirements…" style={{ width: '100%' }} />
                  : <div style={{ padding: '10px 12px', background: 'var(--bg-section)', borderRadius: 10, fontSize: 13.5, lineHeight: 1.6, minHeight: 48, color: labNotes ? 'var(--fg-primary)' : 'var(--fg-muted)' }}>{labNotes || 'No notes'}</div>}
              </div>

              {/* Action footer */}
              <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: 10,
                padding: '12px 20px', borderTop: '1px solid var(--border-light)',
                background: 'var(--bg-section)',
              }}>
                {existingLabId && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setSelectedId(existingLabId); setRoute('lab-detail') }}
                  >
                    <Icon name="flask" size={13} /> View Lab Order
                  </button>
                )}
                {editMode && (
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={creatingOrder || labTests.length === 0}
                    onClick={handleCreateLabOrder}
                  >
                    <Icon name="check" size={13} />
                    {creatingOrder ? 'Saving…' : existingLabId ? 'Update Lab Order' : 'Create Lab Order'}
                  </button>
                )}
              </div>
            </div>


          </div>
        )}

        {/* Tab 5: Reports & Documents */}
        {tab === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div className="table-card">

              {/* Toolbar */}
              <div className="table-toolbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)', flexShrink: 0 }}>
                    Reports & Documents
                  </span>
                  {editMode && (
                    <select
                      className="form-input"
                      style={{ width: 180, padding: '6px 10px', fontSize: 13 }}
                      value={uploadType}
                      onChange={e => setUploadType(e.target.value)}
                    >
                      {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                {editMode && (
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flexShrink: 0 }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Icon name="upload" size={14} /> Upload document
                  </button>
                )}
              </div>

              {/* Table */}
              <table className="data">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th style={{ width: 160 }}>Type</th>
                    <th style={{ width: 80 }}>Size</th>
                    <th style={{ width: 180 }}>Date &amp; Time</th>
                    <th style={{ width: 90, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div style={{ textAlign: 'center', padding: '52px 24px', color: 'var(--fg-muted)' }}>
                          <Icon name="upload" size={32} style={{ opacity: 0.35, marginBottom: 12 }} />
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-secondary)' }}>No documents uploaded</div>
                          <div style={{ fontSize: 12, marginTop: 4 }}>Select a document type and click "Upload document"</div>
                        </div>
                      </td>
                    </tr>
                  ) : docs.map(doc => (
                    <tr key={doc.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'var(--bg-section)',
                            fontSize: 10, fontWeight: 800, color: 'var(--fg-secondary)',
                          }}>
                            {fileTypeLabel(doc.fileType)}
                          </div>
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-primary)' }}>{doc.name}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge variant={fileTypeVariant(doc.fileType) as any} dot>
                          {doc.docType}
                        </Badge>
                      </td>
                      <td style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>
                        {fmtSize(doc.size)}
                      </td>
                      <td style={{ fontSize: 12.5, color: 'var(--fg-secondary)' }}>
                        <div>{dayjs(doc.date).format('DD MMM YYYY')}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 1 }}>
                          {dayjs(doc.date).format('hh:mm A')}
                        </div>
                      </td>
                      <td>
                        <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="act"
                            title="View"
                            onClick={() => handleViewDoc(doc)}
                            style={{ color: 'var(--teal-600)' }}
                          >
                            <Icon name="eye" size={14} />
                          </button>
                          {editMode && (
                            <button
                              className="act danger"
                              title="Delete"
                              onClick={() => handleDeleteDoc(doc.id)}
                            >
                              <Icon name="trash" size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer count */}
              {docs.length > 0 && (
                <div style={{
                  padding: '10px 20px', borderTop: '1px solid var(--border-light)',
                  fontSize: 12.5, color: 'var(--fg-muted)', background: 'var(--bg-section)',
                }}>
                  {docs.length} document{docs.length !== 1 ? 's' : ''}
                </div>
              )}

            </div>
          </div>
        )}

        {/* Tab 6: Follow-up */}
        {tab === 5 && <FollowUpTab appt={appt} selectedId={selectedId} editMode={editMode} />}

      </div>

      {/* Sticky action bar */}
      <div style={{ position: 'sticky', bottom: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-soft)', boxShadow: '0 -4px 12px rgba(0,0,0,0.06)', flexShrink: 0, zIndex: 10 }}>
        {!editMode ? (
          <>
            <button className="btn btn-secondary" onClick={() => setRoute('appointments')}><Icon name="chevL" size={14} /> Back</button>
            <button className="btn btn-secondary"><Icon name="printer" size={14} /> Print</button>
            <div style={{ flex: 1 }} />
            <button className="btn btn-primary" onClick={() => setEditMode(true)}><Icon name="edit" size={14} /> Edit</button>
          </>
        ) : (
          <>
            <button className="btn btn-secondary" disabled={saving} onClick={() => setEditMode(false)}><Icon name="x" size={14} /> Cancel</button>
            <button className="btn btn-danger" disabled={saving} onClick={handleCancelAppt}><Icon name="x" size={14} /> Cancel appointment</button>
            <div style={{ flex: 1 }} />
            <button className="btn btn-secondary" disabled={saving} style={{ borderColor: 'var(--success-500)', color: 'var(--success-500)' }} onClick={handleMarkCompleted}>
              <Icon name="check" size={14} /> Mark completed
            </button>
            <button className="btn btn-primary" disabled={saving} onClick={saveAll}>
              <Icon name="check" size={14} /> {saving ? 'Saving…' : 'Save changes'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
