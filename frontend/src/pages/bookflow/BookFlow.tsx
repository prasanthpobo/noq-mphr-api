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
import { paymentsService, openRazorpayCheckout } from '@/services/payments.service'
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
  // Morning
  '08:00 AM','08:30 AM','09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  // Afternoon
  '12:00 PM','12:30 PM','01:00 PM','02:00 PM','02:30 PM','03:00 PM','03:30 PM',
  // Evening
  '04:00 PM','04:30 PM','05:00 PM','05:30 PM','06:00 PM','06:30 PM',
  // Night
  '07:00 PM','07:30 PM','08:00 PM','08:30 PM','09:00 PM',
]
const TAKEN = ['10:00 AM','11:00 AM','02:00 PM','05:30 PM','08:00 PM']

type SlotPeriod = 'morning' | 'afternoon' | 'evening' | 'night'

const SLOT_SECTIONS: { key: SlotPeriod; label: string; icon: string; hint: string }[] = [
  { key: 'morning',   label: 'Morning',   icon: '🌅', hint: 'Before noon' },
  { key: 'afternoon', label: 'Afternoon', icon: '☀️', hint: '12 PM – 4 PM' },
  { key: 'evening',   label: 'Evening',   icon: '🌆', hint: '4 PM – 7 PM' },
  { key: 'night',     label: 'Night',     icon: '🌙', hint: 'After 7 PM' },
]

/** Convert a "HH:mm AM/PM" string to a 24-hour {h, m} tuple. */
function parseSlot(slot: string): { h: number; m: number } | null {
  const match = slot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return null
  let h = parseInt(match[1], 10)
  const m = parseInt(match[2], 10)
  const meridiem = match[3].toUpperCase()
  if (meridiem === 'PM' && h !== 12) h += 12
  if (meridiem === 'AM' && h === 12) h = 0
  return { h, m }
}

/** Convert a "HH:mm AM/PM" string to its time-of-day bucket. */
function slotPeriod(slot: string): SlotPeriod {
  const t = parseSlot(slot)
  if (!t) return 'morning'
  if (t.h < 12) return 'morning'
  if (t.h < 16) return 'afternoon'
  if (t.h < 19) return 'evening'
  return 'night'
}

/**
 * Returns true if the slot has already passed for the given date.
 * Past slots are anything ≤ "now" when the chosen date is today.
 * Future dates always return false (nothing is in the past yet).
 * Past dates always return true (all slots are gone).
 */
function isPastSlot(dateIso: string, slot: string, now: Date = new Date()): boolean {
  if (!dateIso) return false
  const today = now.toISOString().slice(0, 10)
  if (dateIso > today) return false
  if (dateIso < today) return true
  const t = parseSlot(slot)
  if (!t) return false
  const slotMins = t.h * 60 + t.m
  const nowMins  = now.getHours() * 60 + now.getMinutes()
  return slotMins <= nowMins
}

const REASON_CATS = ['Follow-up','New symptoms','Routine check','Emergency','Second opinion']

const PAYMENT_METHODS = [
  { id: 'online', label: 'Online · ₹10 platform fee', sub: 'UPI / Card / Net banking (Razorpay)', icon: 'card'    },
  { id: 'cash',   label: 'Cash at counter',            sub: 'No advance payment',                   icon: 'receipt' },
]

const FAKE_DISTANCES = ['2.1 km','3.4 km','1.8 km','5.2 km','4.0 km','2.9 km','6.1 km','3.7 km']

/**
 * Platform booking fee charged via Razorpay (in rupees).
 * This is independent of the doctor's consultation fee — that's collected
 * at the clinic. Only this small platform fee flows through the gateway.
 */
const PLATFORM_BOOKING_FEE = 10

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
  const [search, setSearch] = useState('')

  const q = search.trim().toLowerCase()
  const filtered = q
    ? patients.filter((p) =>
        (p.name  ?? '').toLowerCase().includes(q) ||
        (p.phone ?? '').toLowerCase().includes(q) ||
        (p.email ?? '').toLowerCase().includes(q) ||
        (p.bloodGroup ?? '').toLowerCase().includes(q),
      )
    : patients

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--fg-primary)' }}>Select patient</div>
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', fontWeight: 600 }}>
          {q ? `${filtered.length} match${filtered.length === 1 ? '' : 'es'} · ${patients.length} total` : `${patients.length} patient${patients.length === 1 ? '' : 's'}`}
        </div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--fg-secondary)', marginBottom: 16 }}>
        Choose who this appointment is for
      </div>

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: 18 }}>
        <Icon name="search" size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)' }} />
        <input
          className="form-input"
          style={{ paddingLeft: 38, paddingRight: q ? 38 : 14 }}
          placeholder="Search by name, phone, email, or blood group…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        {q && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label="Clear search"
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'var(--bg-section)', border: 'none', borderRadius: '50%',
              width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--fg-secondary)', cursor: 'pointer',
            }}>
            <Icon name="x" size={12} />
          </button>
        )}
      </div>

      {/* Results grid */}
      {filtered.length === 0 ? (
        <div style={{
          padding: '40px 20px', textAlign: 'center', borderRadius: 14,
          border: '2px dashed var(--border-soft)', color: 'var(--fg-muted)',
        }}>
          <Icon name="users" size={28} />
          <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600, color: 'var(--fg-primary)' }}>
            No patients match “{search}”
          </div>
          <div style={{ marginTop: 4, fontSize: 12 }}>
            Try a different name, phone number, or email.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {filtered.map((p, idx) => {
            const tone = TONES[idx % TONES.length]
            const age  = p.dob ? dayjs().diff(dayjs(p.dob), 'year') : null
            const initials = (p.name ?? 'P').split(' ').map((s: string) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
            const selected = sel?._id === p._id
            return (
              <button
                key={p._id}
                onClick={() => onSelect(p)}
                style={{
                  border: selected ? '2px solid var(--teal-600)' : '2px solid var(--border-soft)',
                  borderRadius: 14, padding: '16px',
                  background: selected ? 'var(--brand-gradient-soft)' : 'var(--bg-surface)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className={`av ${tone}`} style={{ width: 40, height: 40 }}>{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>
                      {[age != null ? `${age}y` : null, p.gender, p.bloodGroup].filter(Boolean).join(' · ')}
                    </div>
                    {p.phone && (
                      <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{p.phone}</div>
                    )}
                  </div>
                  {selected && (
                    <Icon name="check" size={16} style={{ color: 'var(--teal-600)' }} />
                  )}
                </div>
              </button>
            )
          })}

        </div>
      )}
    </div>
  )
}

/* ── Step 3 — Doctor ────────────────────────────────────────────────────── */
function StepDoctor({ doctors, sel, onSelect }: { doctors: any[]; sel: any | null; onSelect: (d: any) => void }) {
  const [search, setSearch] = useState('')

  // Collect unique specializations for the quick-filter chip row
  const specializations = Array.from(
    new Set(doctors.map((d) => d.specialization).filter(Boolean)),
  ).sort()

  const q = search.trim().toLowerCase()
  const filtered = q
    ? doctors.filter((d) =>
        (d.name           ?? '').toLowerCase().includes(q) ||
        (d.specialization ?? '').toLowerCase().includes(q) ||
        (d.qualification  ?? '').toLowerCase().includes(q) ||
        (d.phone          ?? '').toLowerCase().includes(q) ||
        (d.email          ?? '').toLowerCase().includes(q),
      )
    : doctors

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--fg-primary)' }}>Choose a doctor</div>
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', fontWeight: 600 }}>
          {q ? `${filtered.length} match${filtered.length === 1 ? '' : 'es'} · ${doctors.length} total` : `${doctors.length} doctor${doctors.length === 1 ? '' : 's'}`}
        </div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--fg-secondary)', marginBottom: 16 }}>
        Available doctors at selected clinic
      </div>

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Icon name="search" size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)' }} />
        <input
          className="form-input"
          style={{ paddingLeft: 38, paddingRight: q ? 38 : 14 }}
          placeholder="Search by name, specialization, qualification, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        {q && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label="Clear search"
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'var(--bg-section)', border: 'none', borderRadius: '50%',
              width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--fg-secondary)', cursor: 'pointer',
            }}>
            <Icon name="x" size={12} />
          </button>
        )}
      </div>

      {/* Specialization quick chips */}
      {specializations.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
          <button
            className={`chip ${q === '' ? 'active' : ''}`}
            onClick={() => setSearch('')}
          >
            All
          </button>
          {specializations.map((s) => (
            <button
              key={s}
              className={`chip ${q === s.toLowerCase() ? 'active' : ''}`}
              onClick={() => setSearch(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div style={{
          padding: '40px 20px', textAlign: 'center', borderRadius: 14,
          border: '2px dashed var(--border-soft)', color: 'var(--fg-muted)',
        }}>
          <Icon name="stethoscope" size={28} />
          <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600, color: 'var(--fg-primary)' }}>
            No doctors match “{search}”
          </div>
          <div style={{ marginTop: 4, fontSize: 12 }}>
            Try a different name, specialization, or qualification.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {filtered.map((d, idx) => {
            const tone = TONES[idx % TONES.length]
            const initials = (d.name ?? 'Dr').split(' ').map((s: string) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
            const selected = sel?._id === d._id
            return (
              <button
                key={d._id}
                onClick={() => onSelect(d)}
                style={{
                  border: selected ? '2px solid var(--teal-600)' : '2px solid var(--border-soft)',
                  borderRadius: 14, padding: '16px',
                  background: selected ? 'var(--brand-gradient-soft)' : 'var(--bg-surface)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div className={`av ${tone}`} style={{ width: 40, height: 40 }}>{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {d.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>{d.specialization ?? '—'}</div>
                    {(d.experience || d.qualification) && (
                      <div style={{ fontSize: 12, color: 'var(--fg-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {[d.qualification, d.experience ? `${d.experience} exp` : null].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                  {selected && <Icon name="check" size={16} style={{ color: 'var(--teal-600)' }} />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <Badge variant={d.status === 'active' ? 'success' : 'gray'}>
                    {d.status === 'active' ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Step 4 — Schedule ──────────────────────────────────────────────────── */
function StepSchedule({ sel, onChange }: {
  sel: { date: string; time: string }
  onChange: (date: string, time: string) => void
}) {
  const days = Array.from({ length: 7 }, (_, i) => dateLabel(i))

  // Default-select Today the first time this step is opened with no date chosen yet.
  useEffect(() => {
    if (!sel.date) onChange(days[0].iso, sel.time)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Bucket the slot list once per render
  const grouped: Record<SlotPeriod, string[]> = { morning: [], afternoon: [], evening: [], night: [] }
  for (const s of SLOTS) grouped[slotPeriod(s)].push(s)

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

      {/* Time slots — period tabs + selected period's grid */}
      {sel.date && (
        <>
          <SlotPeriodTabs grouped={grouped} sel={sel} onChange={onChange} />
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

/* ── Step 4 helper — Slot period tabs ───────────────────────────────────── */
function SlotPeriodTabs({
  grouped, sel, onChange,
}: {
  grouped: Record<SlotPeriod, string[]>
  sel: { date: string; time: string }
  onChange: (date: string, time: string) => void
}) {
  // Pick a sensible default tab: the one containing the currently selected slot,
  // else the first non-empty section.
  const periodOfSelected: SlotPeriod | null = sel.time ? slotPeriod(sel.time) : null
  const firstWithSlots = SLOT_SECTIONS.find((s) => grouped[s.key].length > 0)?.key ?? 'morning'
  const [tab, setTab] = useState<SlotPeriod>(periodOfSelected ?? firstWithSlots)

  // Keep the tab in sync if the user picks a slot from another period (shouldn't
  // normally happen, but it keeps state consistent on direct sel changes).
  useEffect(() => {
    if (periodOfSelected && periodOfSelected !== tab) setTab(periodOfSelected)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel.time])

  const activeSection = SLOT_SECTIONS.find((s) => s.key === tab)!
  const activeSlots   = grouped[tab]

  return (
    <>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-primary)', marginBottom: 12 }}>
        Available slots
      </div>

      {/* Tab strip */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {SLOT_SECTIONS.map((section) => {
          const slots     = grouped[section.key]
          // A slot is bookable when not yet taken AND not in the past.
          const freeCount = slots.filter((s) => !TAKEN.includes(s) && !isPastSlot(sel.date, s)).length
          const isActive  = tab === section.key
          const isEmpty   = slots.length === 0
          return (
            <button
              key={section.key}
              onClick={() => !isEmpty && setTab(section.key)}
              disabled={isEmpty}
              style={{
                flex: 1, minWidth: 120,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 12,
                cursor: isEmpty ? 'not-allowed' : 'pointer',
                border: isActive ? '2px solid var(--teal-600)' : '2px solid var(--border-soft)',
                background: isActive ? 'var(--brand-gradient-soft)' : 'var(--bg-surface)',
                color: isActive ? 'var(--teal-600)' : isEmpty ? 'var(--fg-muted)' : 'var(--fg-primary)',
                fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                transition: 'all 0.15s',
                opacity: isEmpty ? 0.5 : 1,
              }}>
              <span style={{ fontSize: 16 }}>{section.icon}</span>
              <span>{section.label}</span>
              <span style={{
                fontSize: 10, fontWeight: 800,
                color: isActive ? '#fff' : freeCount > 0 ? 'var(--teal-600)' : 'var(--fg-muted)',
                background: isActive ? 'var(--teal-600)' : freeCount > 0 ? 'var(--brand-gradient-soft)' : 'var(--bg-section)',
                borderRadius: 999, padding: '2px 8px', letterSpacing: 0.3,
                border: isActive ? 'none' : '1px solid var(--border-soft)',
              }}>
                {freeCount}
              </span>
            </button>
          )
        })}
      </div>

      {/* Active section hint + grid */}
      <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', fontWeight: 600, marginBottom: 10 }}>
        {activeSection.label} · {activeSection.hint} · {activeSlots.filter((s) => !TAKEN.includes(s) && !isPastSlot(sel.date, s)).length} open
      </div>

      {activeSlots.length === 0 ? (
        <div style={{
          padding: '24px 16px', textAlign: 'center', borderRadius: 12,
          border: '2px dashed var(--border-soft)', color: 'var(--fg-muted)', fontSize: 13,
        }}>
          No slots in this period.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {activeSlots.map((slot) => {
            const taken    = TAKEN.includes(slot)
            const past     = isPastSlot(sel.date, slot)
            const disabled = taken || past
            const active   = sel.time === slot
            const title    = past ? 'Past — no longer bookable' : taken ? 'Already booked' : undefined
            return (
              <button
                key={slot}
                disabled={disabled}
                onClick={() => onChange(sel.date, slot)}
                title={title}
                style={{
                  padding: '10px 8px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  border: active ? '2px solid var(--teal-600)' : '2px solid var(--border-soft)',
                  background: disabled ? 'var(--bg-section)' : active ? 'var(--brand-gradient-soft)' : 'var(--bg-surface)',
                  color: disabled ? 'var(--fg-muted)' : active ? 'var(--teal-600)' : 'var(--fg-primary)',
                  textDecoration: disabled ? 'line-through' : 'none',
                  opacity: past ? 0.55 : 1,
                }}>
                {slot}
              </button>
            )
          })}
        </div>
      )}
    </>
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

      <div className="form-group">
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
    </div>
  )
}

/* ── Step 6 — Confirm ───────────────────────────────────────────────────── */
function StepConfirm({ sel, onPaymentChange }: {
  sel: Selections
  onPaymentChange: (method: string) => void
}) {
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

        {/* Online — fee callout */}
        {sel.payment === 'online' && (
          <>
            <div style={{
              marginTop: 12, padding: '12px 14px', borderRadius: 10,
              background: 'var(--brand-gradient-soft)', border: '1px solid var(--teal-600)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <Icon name="info" size={16} style={{ color: 'var(--teal-600)', flexShrink: 0 }} />
              <div style={{ fontSize: 12.5, color: 'var(--fg-primary)', lineHeight: 1.5 }}>
                <b>₹{PLATFORM_BOOKING_FEE} platform booking fee</b> only — the doctor's consultation
                fee is paid at the clinic.
              </div>
            </div>

            {/* Razorpay test-mode helper */}
            <div style={{
              marginTop: 8, padding: '12px 14px', borderRadius: 10,
              background: '#FFFBEB', border: '1.5px dashed #FDE68A',
              fontSize: 12, color: '#92400E', lineHeight: 1.6,
            }}>
              <div style={{ fontWeight: 800, marginBottom: 4, letterSpacing: 0.3, textTransform: 'uppercase', fontSize: 10.5 }}>
                🧪 Razorpay test mode
              </div>
              International cards (e.g. <code>4111&nbsp;1111&nbsp;1111&nbsp;1111</code>) are blocked.
              Use one of the test methods below:
              <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                <li><b>UPI&nbsp;Success:</b> <code>success@razorpay</code></li>
                <li><b>UPI&nbsp;Failure:</b> <code>failure@razorpay</code></li>
                <li><b>Domestic Visa:</b> <code>4012&nbsp;0010&nbsp;3714&nbsp;1112</code> · any CVV · any future expiry</li>
                <li><b>Domestic Mastercard:</b> <code>5104&nbsp;0155&nbsp;5555&nbsp;5558</code> · any CVV · any future expiry</li>
                <li><b>Netbanking:</b> any test bank → click <i>Success</i></li>
              </ul>
            </div>
          </>
        )}
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

  const createApptAndToken = async () => {
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
    const token = await tokensService.create({
      patientId: sel.patient?._id,
      doctorId: sel.doctor?._id,
      clinicId: sel.clinic?._id,
      appointmentId: appt._id,
      priority: 'normal',
      date: sel.date || new Date().toISOString(),
    })
    return token
  }

  const handleConfirm = async () => {
    try {
      if (sel.payment === 'online') {
        // Always the flat platform booking fee — the consultation fee is collected
        // at the clinic, not through the gateway.
        const fee = PLATFORM_BOOKING_FEE
        // 1. Ask the server to create a Razorpay order
        const orderRes = await paymentsService.createRazorpayOrder(fee, `appt_${Date.now()}`, {
          kind:      'platform_booking_fee',
          clinicId:  String(sel.clinic?._id  ?? ''),
          doctorId:  String(sel.doctor?._id  ?? ''),
          patientId: String(sel.patient?._id ?? ''),
        }).catch((err) => {
          // Bubble the server's actual error message instead of a generic one.
          const msg = err?.response?.data?.message
            ?? err?.message
            ?? 'Could not start payment'
          throw new Error(msg)
        })
        if (!orderRes?.success || !orderRes.order?.id || !orderRes.keyId) {
          throw new Error('Could not start payment — server did not return an order')
        }
        // 2. Open the Razorpay checkout — resolves when the user finishes payment
        const verifyPayload = await openRazorpayCheckout({
          key:      orderRes.keyId,
          amount:   orderRes.order.amount,
          currency: 'INR',
          name:     'NoQ Clinic',
          description: `Platform booking fee · ${sel.doctor?.name ?? ''}`,
          order_id: orderRes.order.id,
          prefill:  {
            name:    sel.patient?.name,
            email:   sel.patient?.email,
            contact: sel.patient?.phone,
          },
          theme: { color: '#0d9488' },
        })
        // 3. Verify signature on the server
        const verifyRes = await paymentsService.verifyRazorpay(verifyPayload)
        if (!verifyRes.success) {
          toast.error('Payment could not be verified')
          return
        }
        toast.success('Payment successful')
      }

      // Cash or successfully-verified online → create the appointment + token
      const token = await createApptAndToken()
      setCreatedToken(token)
      setConfirmed(true)
    } catch (err: any) {
      // Cancellation throws "Payment cancelled" — surface that distinctly
      const msg = err?.message === 'Payment cancelled'
        ? 'Payment was cancelled'
        : err?.response?.data?.message || 'Booking failed. Please try again.'
      toast.error(msg)
    }
  }

  const handleContinue = () => {
    if (step < 6) setStep(s => (s + 1) as Step)
    else handleConfirm()
  }

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
