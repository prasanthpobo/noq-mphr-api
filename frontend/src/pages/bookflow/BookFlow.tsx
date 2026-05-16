import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import Icon from '@/components/ui/Icon'
import Badge from '@/components/ui/Badge'
import { useAppStore } from '@/store/app'
import { clinicsService } from '@/services/clinics.service'
import { doctorsService } from '@/services/doctors.service'
import { patientsService } from '@/services/patients.service'
import { appointmentsService } from '@/services/appointments.service'
import { tokensService } from '@/services/tokens.service'
import { toast } from '@/store/toast'

/* ── Types ─────────────────────────────────────────────────────────────── */
type Step = 1 | 2 | 3 | 4 | 5 | 6

interface Selections {
  clinic:    any | null
  patient:   any | null
  doctor:    any | null
  date:      string
  time:      string
  reason:    string
  reasonCat: string
  payment:   string
}

const EMPTY: Selections = {
  clinic: null, patient: null, doctor: null,
  date: '', time: '', reason: '', reasonCat: '', payment: '',
}

/* ── Helpers ────────────────────────────────────────────────────────────── */
function today(): Date { return new Date() }

function dateLabel(offset: number): { label: string; sub: string; iso: string } {
  const d = today()
  d.setDate(d.getDate() + offset)
  const iso = d.toISOString().slice(0, 10)
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return {
    iso,
    label: offset === 0 ? 'Today' : days[d.getDay()],
    sub: `${d.getDate()} ${months[d.getMonth()]}`,
  }
}

const SLOTS = [
  '09:00 AM','09:30 AM','10:00 AM','10:30 AM',
  '11:00 AM','11:30 AM','12:00 PM','02:00 PM',
  '02:30 PM','03:00 PM','03:30 PM','04:00 PM',
]
const TAKEN = ['10:00 AM','11:00 AM','02:00 PM']

const REASON_CATS = ['Follow-up','New symptoms','Routine check','Emergency','Second opinion']

const PAYMENT_METHODS = [
  { id: 'upi',    label: 'UPI',            sub: 'GPay / PhonePe / BHIM', icon: 'phone' },
  { id: 'hdfc',   label: 'HDFC Debit Card',sub: '····  ····  ····  4532',  icon: 'card'  },
  { id: 'icici',  label: 'ICICI Credit',   sub: '····  ····  ····  7891',  icon: 'card'  },
  { id: 'cash',   label: 'Cash',           sub: 'Pay at counter',          icon: 'receipt'},
]

const FAKE_DISTANCES = ['2.1 km','3.4 km','1.8 km','5.2 km','4.0 km','2.9 km','6.1 km','3.7 km']

const TONES = ['blue','teal','pink','amber','green','plum','indigo','brand']

function stars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <Icon
      key={i}
      name="star"
      size={12}
      style={{ color: i < Math.floor(rating) ? '#f59e0b' : 'var(--border-soft)', fill: i < Math.floor(rating) ? '#f59e0b' : 'none' }}
    />
  ))
}

/* ── Step indicator ─────────────────────────────────────────────────────── */
const STEP_LABELS = [
  'Search Clinic',
  'Patient',
  'Doctor',
  'Schedule',
  'Reason',
  'Confirm',
]

function Stepper({ step, sel, clinics, onJump }: { step: Step; sel: Selections; clinics: any[]; onJump: (s: Step) => void }) {
  const clinicIdx = sel.clinic ? clinics.findIndex((c: any) => c._id === sel.clinic?._id) : -1
  const summaries: Record<number, string> = {
    1: sel.clinic  ? `${sel.clinic.name} · ${FAKE_DISTANCES[clinicIdx >= 0 ? clinicIdx : 0]}` : '',
    2: sel.patient ? `${sel.patient.name} · ${dayjs().diff(dayjs(sel.patient.dob), 'year')}y` : '',
    3: sel.doctor  ? `${sel.doctor.name}` : '',
    4: sel.date && sel.time ? `${sel.date} · ${sel.time}` : '',
    5: sel.reasonCat ? sel.reasonCat : '',
    6: '',
  }

  return (
    <aside style={{
      width: 260, flexShrink: 0, padding: '32px 0',
      borderRight: '1px solid var(--border-light)',
      background: 'var(--bg-surface)',
    }}>
      <div style={{ padding: '0 24px 24px', borderBottom: '1px solid var(--border-light)', marginBottom: 8 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--fg-primary)' }}>Book appointment</div>
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>6-step booking flow</div>
      </div>

      {STEP_LABELS.map((label, i) => {
        const s = (i + 1) as Step
        const done = s < step
        const active = s === step

        return (
          <button
            key={s}
            onClick={() => done && onJump(s)}
            disabled={!done && !active}
            style={{
              width: '100%', display: 'flex', alignItems: 'flex-start', gap: 14,
              padding: '12px 24px', border: 'none', cursor: done ? 'pointer' : 'default',
              background: active ? 'var(--brand-gradient-soft)' : 'transparent',
              borderLeft: active ? '3px solid var(--teal-600)' : '3px solid transparent',
              textAlign: 'left',
            }}
          >
            {/* Number / check */}
            <span style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800,
              background: done ? 'var(--success-500)' : active ? 'var(--brand-gradient)' : 'var(--bg-section)',
              color: done || active ? '#fff' : 'var(--fg-muted)',
            }}>
              {done ? <Icon name="check" size={13} stroke={3} /> : s}
            </span>
            <div>
              <div style={{
                fontSize: 13, fontWeight: active ? 700 : 500,
                color: active ? 'var(--teal-600)' : done ? 'var(--fg-primary)' : 'var(--fg-muted)',
              }}>
                {label}
              </div>
              {summaries[s] && (
                <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2, lineHeight: 1.4 }}>
                  {summaries[s]}
                </div>
              )}
            </div>
          </button>
        )
      })}
    </aside>
  )
}

/* ── Step 1 — Clinic ────────────────────────────────────────────────────── */
function StepClinic({ clinics, sel, onSelect }: { clinics: any[]; sel: any | null; onSelect: (c: any) => void }) {
  const [search, setSearch] = useState('')
  const filtered = clinics.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.address || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, color: 'var(--fg-primary)' }}>Find a clinic</div>
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <Icon name="search" size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)' }} />
        <input
          className="form-input"
          style={{ paddingLeft: 38 }}
          placeholder="Search by clinic name or area…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {filtered.map((c, idx) => {
          const tone = TONES[idx % TONES.length]
          const logo = (c.code || c.name || '??').slice(0, 2).toUpperCase()
          const rating = 4.5
          return (
            <button
              key={c._id}
              onClick={() => onSelect(c)}
              style={{
                border: sel?._id === c._id ? '2px solid var(--teal-600)' : '2px solid var(--border-soft)',
                borderRadius: 14, padding: '16px', background: sel?._id === c._id ? 'var(--brand-gradient-soft)' : 'var(--bg-surface)',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div className={`av ${tone}`} style={{ width: 40, height: 40, fontSize: 13, borderRadius: 10 }}>{logo}</div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-primary)' }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>{c.address}</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--fg-muted)' }}>{FAKE_DISTANCES[idx % FAKE_DISTANCES.length]}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                {stars(rating)}
                <span style={{ fontSize: 12, fontWeight: 700, marginLeft: 4 }}>{rating}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span className="badge muted" style={{ fontSize: 11 }}>{c.type}</span>
                <span className="badge muted" style={{ fontSize: 11 }}>{c.capacity || 0} doctors</span>
                <Badge variant={c.status === 'active' ? 'success' : 'gray'}>{c.status}</Badge>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Step 2 — Patient ───────────────────────────────────────────────────── */
function StepPatient({ patients, sel, onSelect }: { patients: any[]; sel: any | null; onSelect: (p: any) => void }) {
  const shown = patients.slice(0, 4)

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6, color: 'var(--fg-primary)' }}>Select patient</div>
      <div style={{ fontSize: 13, color: 'var(--fg-secondary)', marginBottom: 24 }}>Choose who this appointment is for</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {shown.map((p, idx) => {
          const tone = TONES[idx % TONES.length]
          const age = dayjs().diff(dayjs(p.dob), 'year')
          return (
            <button
              key={p._id}
              onClick={() => onSelect(p)}
              style={{
                border: sel?._id === p._id ? '2px solid var(--teal-600)' : '2px solid var(--border-soft)',
                borderRadius: 14, padding: '16px', background: sel?._id === p._id ? 'var(--brand-gradient-soft)' : 'var(--bg-surface)',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className={`av ${tone}`} style={{ width: 40, height: 40 }}>{p.name.slice(0,2)}</div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-primary)' }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>{age}y · {p.gender} · {p.bloodGroup}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{p.phone}</div>
                </div>
              </div>
            </button>
          )
        })}
        {/* Add family member */}
        <button style={{
          border: '2px dashed var(--border-soft)', borderRadius: 14, padding: '16px',
          background: 'transparent', cursor: 'pointer', textAlign: 'center',
          color: 'var(--fg-muted)', fontSize: 13,
        }}>
          <Icon name="plus" size={20} style={{ display: 'block', margin: '0 auto 8px' }} />
          Add family member
        </button>
      </div>
    </div>
  )
}

/* ── Step 3 — Doctor ────────────────────────────────────────────────────── */
function StepDoctor({ doctors, sel, onSelect }: { doctors: any[]; sel: any | null; onSelect: (d: any) => void }) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6, color: 'var(--fg-primary)' }}>Choose a doctor</div>
      <div style={{ fontSize: 13, color: 'var(--fg-secondary)', marginBottom: 24 }}>Available doctors at selected clinic</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {doctors.map((d, idx) => {
          const tone = TONES[idx % TONES.length]
          const av = (d.name || '??').slice(0, 2)
          return (
            <button
              key={d._id}
              onClick={() => onSelect(d)}
              style={{
                border: sel?._id === d._id ? '2px solid var(--teal-600)' : '2px solid var(--border-soft)',
                borderRadius: 14, padding: '16px', background: sel?._id === d._id ? 'var(--brand-gradient-soft)' : 'var(--bg-surface)',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div className={`av ${tone}`} style={{ width: 40, height: 40 }}>{av}</div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-primary)' }}>{d.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>{d.specialization}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{d.experience} exp</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-primary)' }}>₹{d.consultationFee}</span>
                <Badge variant={d.status === 'active' ? 'success' : 'gray'}>
                  {d.status === 'active' ? 'Available' : 'Unavailable'}
                </Badge>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Step 4 — Schedule ──────────────────────────────────────────────────── */
function StepSchedule({ sel, onChange }: {
  sel: { date: string; time: string }
  onChange: (date: string, time: string) => void
}) {
  const days = Array.from({ length: 7 }, (_, i) => dateLabel(i))

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6, color: 'var(--fg-primary)' }}>Pick a date & time</div>
      <div style={{ fontSize: 13, color: 'var(--fg-secondary)', marginBottom: 20 }}>Select an available slot</div>

      {/* Day strip */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 28, overflowX: 'auto', paddingBottom: 4 }}>
        {days.map(d => (
          <button
            key={d.iso}
            onClick={() => onChange(d.iso, sel.time)}
            style={{
              flexShrink: 0, width: 72, padding: '10px 8px', borderRadius: 12, cursor: 'pointer',
              border: sel.date === d.iso ? '2px solid var(--teal-600)' : '2px solid var(--border-soft)',
              background: sel.date === d.iso ? 'var(--brand-gradient)' : 'var(--bg-surface)',
              color: sel.date === d.iso ? '#fff' : 'var(--fg-primary)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{d.label}</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{d.sub}</div>
          </button>
        ))}
      </div>

      {/* Time slots */}
      {sel.date && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-primary)', marginBottom: 12 }}>Available slots</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {SLOTS.map(slot => {
              const taken = TAKEN.includes(slot)
              const active = sel.time === slot
              return (
                <button
                  key={slot}
                  disabled={taken}
                  onClick={() => onChange(sel.date, slot)}
                  style={{
                    padding: '10px 8px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: taken ? 'not-allowed' : 'pointer',
                    border: active ? '2px solid var(--teal-600)' : '2px solid var(--border-soft)',
                    background: taken ? 'var(--bg-section)' : active ? 'var(--brand-gradient-soft)' : 'var(--bg-surface)',
                    color: taken ? 'var(--fg-muted)' : active ? 'var(--teal-600)' : 'var(--fg-primary)',
                    textDecoration: taken ? 'line-through' : 'none',
                  }}
                >
                  {slot}
                </button>
              )
            })}
          </div>
          {sel.time && (
            <div style={{
              marginTop: 20, padding: '12px 16px', borderRadius: 10,
              background: 'var(--brand-gradient-soft)', border: '1px solid var(--teal-600)',
              fontSize: 13, color: 'var(--teal-600)', fontWeight: 600,
            }}>
              <Icon name="clock" size={14} style={{ marginRight: 6 }} />
              Estimated wait time: ~15 minutes after your scheduled slot
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ── Step 5 — Reason ────────────────────────────────────────────────────── */
function StepReason({ sel, onChange }: {
  sel: { reasonCat: string; reason: string }
  onChange: (cat: string, text: string) => void
}) {
  const MAX = 500
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6, color: 'var(--fg-primary)' }}>Reason for visit</div>
      <div style={{ fontSize: 13, color: 'var(--fg-secondary)', marginBottom: 20 }}>Help the doctor prepare for your visit</div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        {REASON_CATS.map(cat => (
          <button
            key={cat}
            onClick={() => onChange(cat, sel.reason)}
            className={`chip ${sel.reasonCat === cat ? 'active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="form-group" style={{ marginBottom: 16 }}>
        <label className="form-label">Additional notes</label>
        <textarea
          className="form-textarea"
          rows={5}
          maxLength={MAX}
          placeholder="Describe your symptoms or reason for visit…"
          value={sel.reason}
          onChange={e => onChange(sel.reasonCat, e.target.value)}
        />
        <div style={{ textAlign: 'right', fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 4 }}>
          {sel.reason.length}/{MAX}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-secondary btn-sm">
          <Icon name="activity" size={14} /> Voice note
        </button>
        <button className="btn btn-secondary btn-sm">
          <Icon name="clipboard" size={14} /> Upload report
        </button>
        <button className="btn btn-secondary btn-sm">
          <Icon name="upload" size={14} /> Add image
        </button>
      </div>
    </div>
  )
}

/* ── Step 6 — Confirm ───────────────────────────────────────────────────── */
function StepConfirm({ sel, onPaymentChange }: {
  sel: Selections
  onPaymentChange: (method: string) => void
}) {
  const fee      = sel.doctor?.consultationFee ?? 600
  const discount = Math.round(fee * 0.1)
  const total    = fee - discount

  const patientAge = sel.patient?.dob ? dayjs().diff(dayjs(sel.patient.dob), 'year') : '—'

  const rows = [
    { label: 'Patient',   val: `${sel.patient?.name} · ${patientAge}y ${sel.patient?.gender}` },
    { label: 'Doctor',    val: `${sel.doctor?.name} · ${sel.doctor?.specialization}` },
    { label: 'Clinic',    val: `${sel.clinic?.name} · ${sel.clinic?.address}` },
    { label: 'Date',      val: `${sel.date} · ${sel.time}` },
    { label: 'Reason',    val: sel.reasonCat || '—' },
  ]

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, color: 'var(--fg-primary)' }}>Review & confirm</div>

      {/* Token highlight */}
      <div style={{
        padding: '16px 20px', borderRadius: 14, marginBottom: 24,
        background: 'var(--brand-gradient)', color: '#fff',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.8, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your token</div>
          <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1 }}>A-032</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 11, opacity: 0.8 }}>Queue position</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>#8</div>
        </div>
      </div>

      {/* Summary card */}
      <div className="card" style={{ marginBottom: 20 }}>
        {rows.map((r, i) => (
          <div key={r.label} style={{
            display: 'flex', gap: 16,
            padding: '10px 0',
            borderBottom: i < rows.length - 1 ? '1px solid var(--border-light)' : 'none',
          }}>
            <div style={{ width: 90, fontSize: 12.5, color: 'var(--fg-muted)', fontWeight: 600 }}>{r.label}</div>
            <div style={{ fontSize: 13.5, color: 'var(--fg-primary)', fontWeight: 500 }}>{r.val}</div>
          </div>
        ))}
      </div>

      {/* Fee breakdown */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 12 }}>Fee breakdown</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span>Consultation fee</span><span>₹{fee}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--success-500)' }}>
            <span>Discount (10%)</span><span>− ₹{discount}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: 'var(--fg-primary)', paddingTop: 8, borderTop: '1px solid var(--border-light)' }}>
            <span>Total payable</span><span>₹{total}</span>
          </div>
        </div>
      </div>

      {/* Payment methods */}
      <div>
        <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 12 }}>Payment method</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {PAYMENT_METHODS.map(m => (
            <button
              key={m.id}
              onClick={() => onPaymentChange(m.id)}
              style={{
                border: sel.payment === m.id ? '2px solid var(--teal-600)' : '2px solid var(--border-soft)',
                borderRadius: 12, padding: '12px 14px', background: sel.payment === m.id ? 'var(--brand-gradient-soft)' : 'var(--bg-surface)',
                cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <Icon name={m.icon} size={18} style={{ color: sel.payment === m.id ? 'var(--teal-600)' : 'var(--fg-secondary)' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-primary)' }}>{m.label}</div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>{m.sub}</div>
              </div>
              {sel.payment === m.id && <Icon name="check" size={14} style={{ marginLeft: 'auto', color: 'var(--teal-600)' }} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Success state ──────────────────────────────────────────────────────── */
function SuccessView({ createdToken, onViewQueue, onBookAnother }: {
  createdToken: any | null
  onViewQueue: () => void
  onBookAnother: () => void
}) {
  const tokenNumber = createdToken?.tokenNumber ?? 'A-032'
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, textAlign: 'center' }}>
      {/* Animated check */}
      <div style={{
        width: 80, height: 80, borderRadius: '50%', background: 'var(--success-500)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
        animation: 'pulse-success 1.5s ease infinite',
      }}>
        <Icon name="check" size={36} stroke={3} style={{ color: '#fff' }} />
      </div>
      <style>{`
        @keyframes pulse-success {
          0%,100%{ box-shadow: 0 0 0 0 rgba(52,211,153,0.4); }
          50%     { box-shadow: 0 0 0 18px rgba(52,211,153,0); }
        }
      `}</style>

      <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--fg-primary)', marginBottom: 8 }}>Appointment confirmed!</div>
      <div style={{ fontSize: 14, color: 'var(--fg-secondary)', marginBottom: 32 }}>Your token has been issued. See you soon!</div>

      {/* Token */}
      <div style={{
        padding: '20px 40px', borderRadius: 16, marginBottom: 36,
        background: 'var(--brand-gradient)', color: '#fff',
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.8, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Token number</div>
        <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1 }}>{tokenNumber}</div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-secondary" onClick={onViewQueue}>
          <Icon name="eye" size={14} /> View in queue
        </button>
        <button className="btn btn-primary" onClick={onBookAnother}>
          <Icon name="plus" size={14} /> Book another
        </button>
      </div>
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────────────── */
export default function BookFlow() {
  const { setRoute } = useAppStore()
  const [step, setStep]           = useState<Step>(1)
  const [sel, setSel]             = useState<Selections>(EMPTY)
  const [confirmed, setConfirmed] = useState(false)
  const [createdToken, setCreatedToken] = useState<any>(null)

  const [clinics, setClinics]     = useState<any[]>([])
  const [doctors, setDoctors]     = useState<any[]>([])
  const [patients, setPatients]   = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    Promise.all([
      clinicsService.list(),
      doctorsService.list(),
      patientsService.list(),
    ]).then(([c, d, p]) => {
      setClinics(c.data || [])
      setDoctors(d.data || [])
      setPatients(p.data || [])
    }).finally(() => setLoadingData(false))
  }, [])

  const setField = <K extends keyof Selections>(k: K, v: Selections[K]) =>
    setSel(s => ({ ...s, [k]: v }))

  const canContinue = (): boolean => {
    if (step === 1) return !!sel.clinic
    if (step === 2) return !!sel.patient
    if (step === 3) return !!sel.doctor
    if (step === 4) return !!sel.date && !!sel.time
    if (step === 5) return !!sel.reasonCat
    if (step === 6) return !!sel.payment
    return false
  }

  const handleConfirm = async () => {
    try {
      // Create appointment
      const appt = await appointmentsService.create({
        patientId: sel.patient?._id,
        doctorId: sel.doctor?._id,
        clinicId: sel.clinic?._id,
        date: sel.date,
        time: sel.time,
        type: sel.reasonCat === 'Follow-up' ? 'follow-up' : sel.reasonCat === 'Emergency' ? 'emergency' : sel.reasonCat === 'Routine check' ? 'routine' : 'consultation',
        symptoms: sel.reason ? [sel.reason] : [],
        notes: sel.reason,
      })
      // Create token
      const token = await tokensService.create({
        patientId: sel.patient?._id,
        doctorId: sel.doctor?._id,
        clinicId: sel.clinic?._id,
        appointmentId: appt._id,
        priority: 'normal',
        date: sel.date || new Date().toISOString(),
      })
      setCreatedToken(token)
      setConfirmed(true)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Booking failed. Please try again.')
    }
  }

  const handleContinue = () => {
    if (step < 6) setStep(s => (s + 1) as Step)
    else handleConfirm()
  }

  const fee   = sel.doctor?.consultationFee ?? 600
  const total = fee - Math.round(fee * 0.1)

  if (confirmed) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-app)' }}>
        <SuccessView
          createdToken={createdToken}
          onViewQueue={() => setRoute('live-tokens')}
          onBookAnother={() => { setSel(EMPTY); setStep(1); setConfirmed(false); setCreatedToken(null) }}
        />
      </div>
    )
  }

  // Loading overlay for data-dependent steps
  if (loadingData && step <= 3) {
    return (
      <div style={{
        display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-app)', fontSize: 15, color: 'var(--fg-muted)', fontWeight: 600,
      }}>
        Loading...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-app)', overflow: 'hidden' }}>
      <Stepper step={step} sel={sel} clinics={clinics} onJump={setStep} />

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 28px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setRoute('dashboard')}>
            <Icon name="x" size={15} /> Close
          </button>
          <div style={{ flex: 1, textAlign: 'center', fontSize: 13.5, fontWeight: 700, color: 'var(--fg-primary)' }}>
            Step {step} of 6 — {STEP_LABELS[step - 1]}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
          {step === 1 && <StepClinic  clinics={clinics}   sel={sel.clinic}  onSelect={c => setField('clinic', c)} />}
          {step === 2 && <StepPatient patients={patients} sel={sel.patient} onSelect={p => setField('patient', p)} />}
          {step === 3 && <StepDoctor  doctors={doctors}   sel={sel.doctor}  onSelect={d => setField('doctor', d)} />}
          {step === 4 && (
            <StepSchedule
              sel={{ date: sel.date, time: sel.time }}
              onChange={(date, time) => setSel(s => ({ ...s, date, time }))}
            />
          )}
          {step === 5 && (
            <StepReason
              sel={{ reasonCat: sel.reasonCat, reason: sel.reason }}
              onChange={(cat, text) => setSel(s => ({ ...s, reasonCat: cat, reason: text }))}
            />
          )}
          {step === 6 && (
            <StepConfirm
              sel={sel}
              onPaymentChange={m => setField('payment', m)}
            />
          )}
        </div>

        {/* Sticky footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 40px', borderTop: '1px solid var(--border-light)',
          background: 'var(--bg-surface)',
        }}>
          <button
            className="btn btn-secondary"
            onClick={() => setStep(s => Math.max(1, s - 1) as Step)}
            disabled={step === 1}
          >
            <Icon name="chevL" size={14} /> Back
          </button>

          {step === 6 && sel.payment && (
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-primary)' }}>
              Total: <span style={{ color: 'var(--teal-600)' }}>₹{total}</span>
            </span>
          )}

          <button
            className="btn btn-primary"
            disabled={!canContinue()}
            onClick={handleContinue}
          >
            {step === 6 ? (
              <><Icon name="check" size={14} /> Confirm &amp; Pay</>
            ) : (
              <>Continue <Icon name="chevR" size={14} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
