import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import dayjs from 'dayjs'
import {
  HiCheck,
  HiSearch,
  HiPhone,
  HiCalendar,
  HiClock,
  HiClipboardList,
  HiCurrencyRupee,
  HiPlus,
  HiX,
  HiLocationMarker,
} from 'react-icons/hi'
import MobileHeader from '../../components/MobileHeader'
import { useBookingStore } from '../../store/bookingStore'
import { useAuthStore } from '../../store/authStore'
import { getSlots, bookAppointment, type Doctor } from '../../services/doctorService'
import { getFamilyMembers, addFamilyMember, type FamilyMember } from '../../services/familyService'
import { getClinics, getDoctorsByClinic, type Clinic, type ClinicDoctor } from '../../services/clinicService'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

const STEP_LABELS = ['Clinic', 'Doctor', 'Schedule', 'Patient', 'Reason', 'Confirm']

const QUICK_REASONS = ['Follow-up', 'Consultation', 'Check-up', 'Prescription', 'Test Results', 'Other']
const RELATION_OPTIONS = ['Spouse', 'Parent', 'Child', 'Sibling', 'Other']
const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const AVATAR_COLORS = ['#2C6ED5', '#1FA3A8', '#7C3AED', '#E05B5B', '#D97706', '#059669']

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}
function getAvatarColor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

// ── Step Indicator ────────────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div style={{ padding: '14px 16px 10px', background: '#FFFFFF', borderBottom: '1px solid #EEF2F7' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        {STEP_LABELS.map((label, idx) => {
          const stepNum = idx + 1
          const isCompleted = stepNum < currentStep
          const isCurrent = stepNum === currentStep
          return (
            <div key={stepNum} style={{ display: 'flex', alignItems: 'flex-start' }}>
              {/* Circle + label stacked */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isCompleted ? '#2C6ED5' : isCurrent ? BRAND_GRADIENT : '#E8EEF7',
                  color: isCompleted || isCurrent ? '#FFFFFF' : '#A0AEC0',
                  fontSize: 12, fontWeight: 700,
                  boxShadow: isCurrent ? '0 2px 8px rgba(44,110,213,0.4)' : 'none',
                  transition: 'all 0.3s ease',
                }}>
                  {isCompleted ? <HiCheck size={14} /> : stepNum}
                </div>
                <span style={{
                  fontSize: 9, fontWeight: isCurrent ? 700 : 500, marginTop: 5,
                  color: isCurrent ? '#2C6ED5' : isCompleted ? '#2C6ED5' : '#A0AEC0',
                  textAlign: 'center', whiteSpace: 'nowrap',
                }}>
                  {label}
                </span>
              </div>
              {/* Connector between steps, vertically centred on the circles */}
              {idx < STEP_LABELS.length - 1 && (
                <div style={{ width: 18, height: 2, background: isCompleted ? '#2C6ED5' : '#E8EEF7', marginTop: 13, flexShrink: 0, transition: 'background 0.3s ease' }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Shared skeleton ───────────────────────────────────────────────────────────

function CardSkeleton({ circle = false }: { circle?: boolean }) {
  return (
    <div style={{ background: '#F5F8FC', borderRadius: circle ? '50%' : 16, height: circle ? 52 : 80, width: circle ? 52 : undefined, marginBottom: 12 }} />
  )
}

// ── Add Family Member Modal ───────────────────────────────────────────────────

interface AddMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onAdded: (member: FamilyMember) => void
}

function AddMemberModal({ isOpen, onClose, onAdded }: AddMemberModalProps) {
  const [form, setForm] = useState({ name: '', relation: '', dob: '', bloodGroup: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!form.name.trim() || !form.relation) { setError('Name and relation are required'); return }
    setSaving(true); setError(null)
    try {
      const res = await addFamilyMember({
        name: form.name.trim(), relation: form.relation,
        dob: form.dob || undefined, bloodGroup: form.bloodGroup || undefined, phone: form.phone || undefined,
      })
      onAdded(res.data)
      onClose()
      setForm({ name: '', relation: '', dob: '', bloodGroup: '', phone: '' })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 48, borderRadius: 12, border: '1.5px solid #E3EAF2',
    padding: '0 14px', fontSize: 14, color: '#1A1A1A', background: '#F5F8FC',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100 }} />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#FFFFFF', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', zIndex: 101, maxHeight: '90dvh', overflowY: 'auto' }}
          >
            <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E3EAF2', margin: '0 auto 20px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>Add Family Member</h2>
              <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F5F8FC', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HiX size={18} color="#6B7C93" />
              </button>
            </div>
            {error && <div style={{ background: '#FEE2E2', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#B91C1C' }}>{error}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#6B7C93', marginBottom: 6, display: 'block' }}>Full Name *</label>
                <input style={inputStyle} placeholder="Enter name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#6B7C93', marginBottom: 6, display: 'block' }}>Relation *</label>
                <select style={{ ...inputStyle, appearance: 'none' }} value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })}>
                  <option value="">Select relation</option>
                  {RELATION_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#6B7C93', marginBottom: 6, display: 'block' }}>Date of Birth</label>
                <input style={inputStyle} type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#6B7C93', marginBottom: 6, display: 'block' }}>Blood Group</label>
                <select style={{ ...inputStyle, appearance: 'none' }} value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
                  <option value="">Select blood group</option>
                  {BLOOD_GROUP_OPTIONS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#6B7C93', marginBottom: 6, display: 'block' }}>Phone Number</label>
                <input style={inputStyle} type="tel" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <button onClick={handleSave} disabled={saving} style={{
                width: '100%', height: 52, borderRadius: 14, border: 'none',
                background: saving ? 'rgba(44,110,213,0.6)' : BRAND_GRADIENT,
                color: '#FFFFFF', fontSize: 15, fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer', marginTop: 8,
                boxShadow: '0 4px 16px rgba(44,110,213,0.35)',
              }}>
                {saving ? 'Saving…' : 'Save Member'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Step 1: Select Clinic ─────────────────────────────────────────────────────

function Step1Clinic({ selected, onSelect }: { selected: Clinic | null; onSelect: (c: Clinic) => void }) {
  const [search, setSearch] = useState('')
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getClinics({ status: 'active' })
      .then((r) => { setClinics(r.data); setError(null) })
      .catch(() => setError('Failed to load clinics'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = clinics.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: '20px 16px' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px' }}>Select Clinic</h2>
      <p style={{ fontSize: 14, color: '#6B7C93', margin: '0 0 20px' }}>Choose a clinic for your appointment</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F5F8FC', borderRadius: 12, padding: '10px 14px', marginBottom: 20, border: '1px solid #EEF2F7' }}>
        <HiSearch size={17} color="#A0AEC0" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or city…"
          style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, color: '#1A1A1A', outline: 'none' }} />
      </div>

      {loading && [0, 1, 2].map((i) => (
        <div key={i} style={{ background: '#F5F8FC', borderRadius: 16, height: 80, marginBottom: 12 }} />
      ))}
      {error && <div style={{ textAlign: 'center', color: '#EF4444', fontSize: 14, padding: '32px 0' }}>{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: '#6B7C93', fontSize: 14, padding: '32px 0' }}>No clinics found</div>
      )}

      {filtered.map((clinic) => {
        const isSelected = selected?._id === clinic._id
        const color = getAvatarColor(clinic._id)
        const isOpen = clinic.status === 'active'
        return (
          <div key={clinic._id} onClick={() => onSelect(clinic)} style={{
            background: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12,
            boxShadow: '0 4px 12px rgba(30,79,163,0.08)',
            border: isSelected ? '2px solid #2C6ED5' : '2px solid transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
            position: 'relative', transition: 'border-color 0.2s ease',
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#FFFFFF', flexShrink: 0 }}>
              {getInitials(clinic.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 2 }}>{clinic.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <HiLocationMarker size={12} color="#A0AEC0" />
                <span style={{ fontSize: 12, color: '#6B7C93', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {clinic.address}, {clinic.city}
                </span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '2px 8px', background: isOpen ? '#DCFCE7' : '#FEE2E2', color: isOpen ? '#15803D' : '#DC2626' }}>
                {isOpen ? '● Open' : '● Closed'}
              </span>
            </div>
            {isSelected && (
              <div style={{ position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: '50%', background: '#2C6ED5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HiCheck size={14} color="#FFFFFF" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Step 2: Select Doctor (from clinic) ──────────────────────────────────────

function Step2Doctor({ clinicId, selected, onSelect }: { clinicId: string; selected: Doctor | null; onSelect: (d: Doctor) => void }) {
  const [search, setSearch] = useState('')
  const [doctors, setDoctors] = useState<ClinicDoctor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getDoctorsByClinic(clinicId, { status: 'active' })
      .then((r) => setDoctors(r.data))
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false))
  }, [clinicId])

  const filtered = doctors.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: '20px 16px' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px' }}>Choose a Doctor</h2>
      <p style={{ fontSize: 14, color: '#6B7C93', margin: '0 0 16px' }}>Select your preferred doctor</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F5F8FC', borderRadius: 12, padding: '10px 14px', marginBottom: 20, border: '1px solid #EEF2F7' }}>
        <HiSearch size={17} color="#A0AEC0" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search doctor or specialty…"
          style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, color: '#1A1A1A', outline: 'none' }} />
      </div>

      {loading && [0, 1, 2].map((i) => (
        <div key={i} style={{ background: '#F5F8FC', borderRadius: 16, height: 90, marginBottom: 12 }} />
      ))}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: '#6B7C93', fontSize: 14, padding: '32px 0' }}>
          {doctors.length === 0 ? 'No doctors available at this clinic' : 'No doctors match your search'}
        </div>
      )}

      {filtered.map((doc) => {
        const isSelected = selected?._id === doc._id
        const color = getAvatarColor(doc._id)
        return (
          <div key={doc._id} onClick={() => onSelect(doc as unknown as Doctor)} style={{
            background: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12,
            boxShadow: '0 4px 12px rgba(30,79,163,0.08)',
            border: isSelected ? '2px solid #2C6ED5' : '2px solid transparent',
            cursor: 'pointer', position: 'relative', transition: 'border-color 0.2s ease',
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                {getInitials(doc.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 2 }}>Dr. {doc.name}</div>
                <div style={{ fontSize: 13, color: '#2C6ED5', fontWeight: 500, marginBottom: 6 }}>{doc.specialization}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {doc.experience !== undefined && (
                    <span style={{ fontSize: 11, background: '#F0F5FF', color: '#2C6ED5', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                      {doc.experience} yr{doc.experience !== 1 ? 's' : ''} exp
                    </span>
                  )}
                  {doc.consultationFee !== undefined && (
                    <span style={{ fontSize: 11, background: '#F0FFF4', color: '#059669', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                      ₹{doc.consultationFee}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {isSelected && (
              <div style={{ position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: '50%', background: '#2C6ED5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HiCheck size={14} color="#FFFFFF" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Step 3: Select Schedule ───────────────────────────────────────────────────

function Step3Schedule({
  doctorId, selectedDate, selectedTime, onSelectDate, onSelectTime,
}: {
  doctorId: string; selectedDate: string; selectedTime: string
  onSelectDate: (d: string) => void; onSelectTime: (t: string) => void
}) {
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = dayjs().add(i, 'day')
    return { key: d.format('YYYY-MM-DD'), dayName: d.format('ddd'), dateNum: d.format('D'), month: d.format('MMM') }
  })

  useEffect(() => {
    if (!doctorId || !selectedDate) return
    setLoadingSlots(true)
    setSlots([])
    getSlots(doctorId, selectedDate)
      .then((r) => setSlots(r.data))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [doctorId, selectedDate])

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ paddingLeft: 16, paddingRight: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px' }}>Choose Date & Time</h2>
        <p style={{ fontSize: 14, color: '#6B7C93', margin: '0 0 20px' }}>Select a convenient date and time slot</p>
      </div>

      <div style={{ overflowX: 'auto', display: 'flex', gap: 10, paddingLeft: 16, paddingRight: 16, paddingBottom: 4, scrollbarWidth: 'none' }}>
        {days.map((day) => {
          const isSelected = selectedDate === day.key
          return (
            <button key={day.key} onClick={() => { onSelectDate(day.key); onSelectTime('') }} style={{
              flexShrink: 0, width: 62, padding: '10px 6px', borderRadius: 14,
              border: isSelected ? 'none' : '1.5px solid #E8EEF7',
              background: isSelected ? BRAND_GRADIENT : '#FFFFFF',
              color: isSelected ? '#FFFFFF' : '#1A1A1A', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              boxShadow: isSelected ? '0 4px 12px rgba(44,110,213,0.3)' : '0 2px 6px rgba(30,79,163,0.04)',
              transition: 'all 0.2s ease',
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, opacity: isSelected ? 0.9 : 0.6 }}>{day.dayName}</span>
              <span style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>{day.dateNum}</span>
              <span style={{ fontSize: 10, fontWeight: 600, opacity: isSelected ? 0.9 : 0.6 }}>{day.month}</span>
            </button>
          )
        })}
      </div>

      <div style={{ paddingLeft: 16, paddingRight: 16, marginTop: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
          Available Slots
        </div>
        {loadingSlots ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} style={{ height: 40, background: '#F5F8FC', borderRadius: 10 }} />)}
          </div>
        ) : slots.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6B7C93', fontSize: 14, padding: '24px 0' }}>No slots available for this date</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {slots.map((slot) => {
              const isSelected = selectedTime === slot.time
              return (
                <button key={slot.time} disabled={!slot.available} onClick={() => slot.available && onSelectTime(slot.time)} style={{
                  padding: '10px 4px', borderRadius: 10,
                  border: !slot.available ? '1.5px solid #E8EEF7' : isSelected ? 'none' : '1.5px solid #2C6ED5',
                  background: !slot.available ? '#F5F8FC' : isSelected ? BRAND_GRADIENT : '#FFFFFF',
                  color: !slot.available ? '#C0CCDA' : isSelected ? '#FFFFFF' : '#2C6ED5',
                  fontSize: 13, fontWeight: 600, cursor: slot.available ? 'pointer' : 'not-allowed',
                  textDecoration: !slot.available ? 'line-through' : 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 4px 12px rgba(44,110,213,0.3)' : 'none',
                }}>
                  {slot.time}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Step 4: Select Patient ────────────────────────────────────────────────────

function Step4Patient({
  selectedId, onSelect,
}: {
  selectedId: string; onSelect: (id: string, member?: FamilyMember) => void
}) {
  const user = useAuthStore((s) => s.user)
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)

  useEffect(() => {
    getFamilyMembers()
      .then((r) => setMembers(r.data))
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [])

  const userInitials = user ? getInitials(user.name) : 'ME'
  const age = user?.dob ? dayjs().diff(dayjs(user.dob), 'year') : null

  return (
    <div style={{ padding: '20px 16px' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px' }}>Who is the appointment for?</h2>
      <p style={{ fontSize: 14, color: '#6B7C93', margin: '0 0 24px' }}>Select the patient for this visit</p>

      {/* Self card */}
      <div onClick={() => onSelect('self')} style={{
        background: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12,
        boxShadow: '0 4px 12px rgba(30,79,163,0.08)',
        border: selectedId === 'self' ? '2px solid #2C6ED5' : '2px solid transparent',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
        position: 'relative', transition: 'border-color 0.2s ease',
      }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: BRAND_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
          {userInitials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>{user?.name || 'Me'}</div>
          {age !== null && <div style={{ fontSize: 13, color: '#6B7C93', marginTop: 2 }}>Age: {age} years</div>}
          {user?.phone && (
            <div style={{ fontSize: 13, color: '#6B7C93', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <HiPhone size={12} /> {user.phone}
            </div>
          )}
        </div>
        {selectedId === 'self' && (
          <div style={{ position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: '50%', background: '#2C6ED5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HiCheck size={14} color="#FFFFFF" />
          </div>
        )}
      </div>

      {loading && <div style={{ background: '#F5F8FC', borderRadius: 16, height: 72, marginBottom: 12 }} />}
      {members.map((fm) => {
        const isSelected = selectedId === fm._id
        const color = getAvatarColor(fm._id)
        const fmAge = fm.dob ? dayjs().diff(dayjs(fm.dob), 'year') : null
        return (
          <div key={fm._id} onClick={() => onSelect(fm._id, fm)} style={{
            background: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12,
            boxShadow: '0 4px 12px rgba(30,79,163,0.08)',
            border: isSelected ? '2px solid #2C6ED5' : '2px solid transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
            position: 'relative', transition: 'border-color 0.2s ease',
          }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
              {getInitials(fm.name)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>{fm.name}</span>
                <span style={{ fontSize: 11, fontWeight: 600, background: '#EBF2FF', color: '#2C6ED5', borderRadius: 20, padding: '2px 9px' }}>{fm.relation}</span>
              </div>
              {fmAge !== null && <div style={{ fontSize: 13, color: '#6B7C93', marginTop: 2 }}>Age: {fmAge} years</div>}
              {fm.phone && (
                <div style={{ fontSize: 13, color: '#6B7C93', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <HiPhone size={12} /> {fm.phone}
                </div>
              )}
            </div>
            {isSelected && (
              <div style={{ position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: '50%', background: '#2C6ED5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HiCheck size={14} color="#FFFFFF" />
              </div>
            )}
          </div>
        )
      })}

      <button onClick={() => setAddOpen(true)} style={{
        width: '100%', padding: 16, borderRadius: 16, border: '2px dashed #2C6ED5',
        background: 'transparent', color: '#2C6ED5', fontSize: 15, fontWeight: 600,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <HiPlus size={18} /> Add Family Member
      </button>

      <AddMemberModal isOpen={addOpen} onClose={() => setAddOpen(false)}
        onAdded={(m) => { setMembers((prev) => [...prev, m]); onSelect(m._id, m) }} />
    </div>
  )
}

// ── Step 5: Reason ────────────────────────────────────────────────────────────

function Step5Reason({ reason, onChangeReason }: { reason: string; onChangeReason: (r: string) => void }) {
  const handleChip = (chip: string) => {
    onChangeReason(reason.trim() ? `${reason.trim()}, ${chip}` : chip)
  }
  return (
    <div style={{ padding: '20px 16px' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px' }}>Reason for Visit</h2>
      <p style={{ fontSize: 14, color: '#6B7C93', margin: '0 0 20px' }}>Tell us why you are visiting</p>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>Quick Select</div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
          {QUICK_REASONS.map((r) => (
            <button key={r} onClick={() => handleChip(r)} style={{
              flexShrink: 0, padding: '7px 14px', borderRadius: 20, border: '1.5px solid #2C6ED5',
              background: reason.includes(r) ? '#EEF5FF' : '#FFFFFF',
              color: '#2C6ED5', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>{r}</button>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>Details</div>
        <textarea rows={4} value={reason} onChange={(e) => onChangeReason(e.target.value)}
          placeholder="Describe your symptoms or reason for visit…"
          style={{
            width: '100%', borderRadius: 12, border: '1.5px solid #E8EEF7',
            padding: '12px 14px', fontSize: 14, color: '#1A1A1A', background: '#FFFFFF',
            outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6,
            boxSizing: 'border-box', boxShadow: '0 2px 8px rgba(30,79,163,0.04)',
          }} />
      </div>
    </div>
  )
}

// ── Step 6: Confirm ───────────────────────────────────────────────────────────

function Step6Confirm({
  clinic, doctor, patientType, familyMember,
  selectedDate, selectedTime, reason,
  onConfirm, isBooking, bookError,
}: {
  clinic: Clinic | null; doctor: Doctor | null
  patientType: 'self' | 'family'; familyMember: FamilyMember | null
  selectedDate: string; selectedTime: string; reason: string
  onConfirm: () => void; isBooking: boolean; bookError: string | null
}) {
  const user = useAuthStore((s) => s.user)
  const patientName = patientType === 'family' && familyMember ? familyMember.name : user?.name || 'Me'
  const formattedDate = selectedDate ? dayjs(selectedDate).format('dddd, MMMM D, YYYY') : 'Not selected'
  const divider = <div style={{ height: 1, background: '#EEF2F7', margin: '12px 0' }} />

  return (
    <div style={{ padding: '20px 16px' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px' }}>Confirm Booking</h2>
      <p style={{ fontSize: 14, color: '#6B7C93', margin: '0 0 20px' }}>Review your appointment details</p>

      <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 20, boxShadow: '0 4px 20px rgba(30,79,163,0.10)', marginBottom: 24 }}>

        {/* Clinic */}
        {clinic && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: getAvatarColor(clinic._id), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: 14, fontWeight: 700 }}>
                {getInitials(clinic.name)}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{clinic.name}</div>
                <div style={{ fontSize: 12, color: '#6B7C93', display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
                  <HiLocationMarker size={11} /> {clinic.address}, {clinic.city}
                </div>
              </div>
            </div>
            {divider}
          </>
        )}

        {/* Doctor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: doctor ? getAvatarColor(doctor._id) : '#E8EEF7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: 14, fontWeight: 700 }}>
            {doctor ? getInitials(doctor.name) : '?'}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{doctor ? `Dr. ${doctor.name}` : '—'}</div>
            {doctor?.specialization && <div style={{ fontSize: 12, color: '#2C6ED5', fontWeight: 500 }}>{doctor.specialization}</div>}
          </div>
        </div>
        {divider}

        {/* Patient */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: BRAND_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: 14, fontWeight: 700 }}>
            {getInitials(patientName)}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{patientName}</div>
            <div style={{ fontSize: 12, color: '#6B7C93' }}>
              {patientType === 'family' && familyMember ? familyMember.relation : 'Patient (Self)'}
            </div>
          </div>
        </div>
        {divider}

        {/* Date & Time */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <HiCalendar size={16} color="#2C6ED5" />
            <span style={{ fontSize: 14, color: '#1A1A1A', fontWeight: 500 }}>{formattedDate}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <HiClock size={16} color="#2C6ED5" />
            <span style={{ fontSize: 14, color: '#1A1A1A', fontWeight: 500 }}>{selectedTime || 'Not selected'}</span>
          </div>
        </div>

        {reason && (
          <>
            {divider}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <HiClipboardList size={16} color="#2C6ED5" style={{ marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 12, color: '#6B7C93', marginBottom: 2 }}>Reason</div>
                <div style={{ fontSize: 14, color: '#1A1A1A', fontWeight: 500 }}>{reason.slice(0, 80)}{reason.length > 80 ? '…' : ''}</div>
              </div>
            </div>
          </>
        )}

        {doctor?.consultationFee !== undefined && (
          <>
            {divider}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <HiCurrencyRupee size={16} color="#2C6ED5" />
                <span style={{ fontSize: 14, color: '#6B7C93' }}>Consultation Fee</span>
              </div>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A' }}>₹{doctor.consultationFee}</span>
            </div>
          </>
        )}
      </div>

      {bookError && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#B91C1C' }}>
          {bookError}
        </div>
      )}

      <button onClick={onConfirm} disabled={isBooking} style={{
        width: '100%', height: 52, borderRadius: 14, border: 'none',
        background: isBooking ? 'rgba(44,110,213,0.6)' : BRAND_GRADIENT,
        color: '#FFFFFF', fontSize: 16, fontWeight: 700,
        cursor: isBooking ? 'not-allowed' : 'pointer',
        boxShadow: isBooking ? 'none' : '0 6px 20px rgba(44,110,213,0.4)',
      }}>
        {isBooking ? 'Booking…' : 'Confirm Booking'}
      </button>
    </div>
  )
}

// ── Main BookingScreen ────────────────────────────────────────────────────────

export default function BookingScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setPatientSelf, setPatientFamily, setDoctor, setDate, setTime, setReason, reset } = useBookingStore()

  // Pre-fill doctor (and derive clinic) from navigation state
  const stateDoctor = (location.state as { doctor?: Doctor } | null)?.doctor ?? null

  // Derive a minimal Clinic object from pre-filled doctor's clinicId
  const deriveClinicFromDoctor = (doc: Doctor): Clinic | null => {
    const cid = doc.clinicId
    if (typeof cid === 'object' && cid !== null) {
      return {
        _id: cid._id, name: cid.name, code: '', address: '',
        city: (cid as { city?: string }).city ?? '',
        state: '', pincode: '', phone: '', email: '',
        type: '', status: 'active', openDays: [],
        createdAt: '',
      } as Clinic
    }
    return null
  }

  const initialClinic = stateDoctor ? deriveClinicFromDoctor(stateDoctor) : null
  // When both clinic+doctor are pre-filled, jump to step 3 (Schedule)
  const initialStep = stateDoctor ? 3 : 1

  const [localStep, setLocalStep] = useState(initialStep)
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(initialClinic)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(stateDoctor)
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedId, setSelectedId] = useState('self')
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<FamilyMember | null>(null)
  const [reason, setReasonLocal] = useState('')
  const [isBooking, setIsBooking] = useState(false)
  const [bookError, setBookError] = useState<string | null>(null)

  // Sync pre-filled doctor to booking store on mount
  useEffect(() => {
    if (stateDoctor) setDoctor(stateDoctor)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelectPatient = (id: string, member?: FamilyMember) => {
    setSelectedId(id)
    if (id === 'self') { setPatientSelf(); setSelectedFamilyMember(null) }
    else if (member) { setPatientFamily(member); setSelectedFamilyMember(member) }
  }

  const handleSelectClinic = (clinic: Clinic) => {
    setSelectedClinic(clinic)
    // Reset doctor when clinic changes
    if (selectedDoctor && typeof selectedDoctor.clinicId === 'object' && selectedDoctor.clinicId._id !== clinic._id) {
      setSelectedDoctor(null)
    }
  }

  const handleSelectDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setDoctor(doctor)
  }

  const handleNext = () => {
    if (localStep === 3) { setDate(selectedDate); setTime(selectedTime) }
    if (localStep === 5) { setReason(reason) }
    setLocalStep((s) => Math.min(s + 1, 6))
  }

  const handleBack = () => setLocalStep((s) => Math.max(s - 1, 1))

  const handleConfirm = async () => {
    if (!selectedDoctor) return
    setIsBooking(true)
    setBookError(null)
    try {
      await bookAppointment({
        doctorId: selectedDoctor._id,
        date: selectedDate,
        time: selectedTime,
        reason: reason || undefined,
        familyMemberId: selectedId !== 'self' ? selectedId : undefined,
      })
      reset()
      navigate('/app/appointments')
    } catch (e: unknown) {
      setBookError(e instanceof Error ? e.message : 'Booking failed. Please try again.')
    } finally {
      setIsBooking(false)
    }
  }

  const nextDisabled =
    (localStep === 1 && !selectedClinic) ||
    (localStep === 2 && !selectedDoctor) ||
    (localStep === 3 && (!selectedDate || !selectedTime))

  const isLastStep = localStep === 6

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? '100%' : '-100%', opacity: 0 }),
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F8FC', display: 'flex', flexDirection: 'column', paddingBottom: 96 }}>
      <MobileHeader title="Book Appointment" showBack />
      <StepIndicator currentStep={localStep} />

      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <AnimatePresence mode="wait" initial={false} custom={localStep}>
          <motion.div
            key={localStep}
            custom={localStep}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
            style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}
          >
            {localStep === 1 && (
              <Step1Clinic selected={selectedClinic} onSelect={handleSelectClinic} />
            )}
            {localStep === 2 && (
              <Step2Doctor
                clinicId={selectedClinic?._id ?? ''}
                selected={selectedDoctor}
                onSelect={handleSelectDoctor}
              />
            )}
            {localStep === 3 && (
              <Step3Schedule
                doctorId={selectedDoctor?._id ?? ''}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onSelectDate={setSelectedDate}
                onSelectTime={setSelectedTime}
              />
            )}
            {localStep === 4 && (
              <Step4Patient selectedId={selectedId} onSelect={handleSelectPatient} />
            )}
            {localStep === 5 && (
              <Step5Reason reason={reason} onChangeReason={setReasonLocal} />
            )}
            {localStep === 6 && (
              <Step6Confirm
                clinic={selectedClinic}
                doctor={selectedDoctor}
                patientType={selectedId === 'self' ? 'self' : 'family'}
                familyMember={selectedFamilyMember}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                reason={reason}
                onConfirm={handleConfirm}
                isBooking={isBooking}
                bookError={bookError}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      {!isLastStep && (
        <div style={{ padding: 16, background: '#FFFFFF', borderTop: '1px solid #EEF2F7', display: 'flex', gap: 10 }}>
          {localStep > 1 && (
            <button onClick={handleBack} style={{
              flex: 1, height: 48, borderRadius: 12, border: '1.5px solid #2C6ED5',
              background: '#FFFFFF', color: '#2C6ED5', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}>
              Back
            </button>
          )}
          <button onClick={handleNext} disabled={nextDisabled} style={{
            flex: localStep > 1 ? 2 : 1, height: 48, borderRadius: 12, border: 'none',
            background: nextDisabled ? '#C0CCDA' : BRAND_GRADIENT,
            color: '#FFFFFF', fontSize: 15, fontWeight: 700,
            cursor: nextDisabled ? 'not-allowed' : 'pointer',
            boxShadow: nextDisabled ? 'none' : '0 4px 14px rgba(44,110,213,0.35)',
          }}>
            Next
          </button>
        </div>
      )}
      {isLastStep && (
        <div style={{ padding: 16, background: '#FFFFFF', borderTop: '1px solid #EEF2F7' }}>
          <button onClick={handleBack} style={{
            width: '100%', height: 44, borderRadius: 12, border: '1.5px solid #2C6ED5',
            background: '#FFFFFF', color: '#2C6ED5', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}>
            Back
          </button>
        </div>
      )}
    </div>
  )
}
