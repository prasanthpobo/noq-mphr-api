import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ModalSheet from '../../components/ModalSheet'
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
  HiArrowLeft,
  HiShieldCheck,
  HiCreditCard,
  HiLibrary,
} from 'react-icons/hi'
import { MdLocalHospital, MdPhoneAndroid } from 'react-icons/md'
import { useBookingStore } from '../../store/bookingStore'
import { useAuthStore } from '../../store/authStore'
import { getSlots, bookAppointment, type Doctor } from '../../services/doctorService'
import { getFamilyMembers, addFamilyMember, type FamilyMember } from '../../services/familyService'
import { getClinics, getDoctorsByClinic, type Clinic, type ClinicDoctor } from '../../services/clinicService'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

const STEP_LABELS = ['Clinic', 'Doctor', 'Schedule', 'Patient', 'Reason', 'Confirm']

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

// ── Booking Header (gradient hero + step indicator) ───────────────────────────

function BookingHeader({ currentStep, onBack }: { currentStep: number; onBack: () => void }) {
  const navigate = useNavigate()
  const pct = Math.round(((currentStep - 1) / (STEP_LABELS.length - 1)) * 100)

  return (
    <div style={{ borderRadius: '0 0 24px 24px', overflow: 'hidden', boxShadow: '0 6px 24px rgba(30,79,163,0.18)', flexShrink: 0 }}>
      {/* Gradient nav row */}
      <div style={{ background: BRAND_GRADIENT, padding: '13px 16px 16px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.09)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <button onClick={currentStep > 1 ? onBack : () => navigate(-1)} style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <HiArrowLeft size={18} color="#FFFFFF" />
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>Book Appointment</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 3 }}>Step {currentStep} of {STEP_LABELS.length}</div>
          </div>
          <div style={{
            height: 28, borderRadius: 20, padding: '0 10px',
            background: 'rgba(255,255,255,0.20)', border: '1px solid rgba(255,255,255,0.30)',
            display: 'flex', alignItems: 'center',
            fontSize: 11, fontWeight: 700, color: '#FFFFFF',
          }}>
            {STEP_LABELS[currentStep - 1]}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 14, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.22)', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{ height: '100%', borderRadius: 999, background: 'rgba(255,255,255,0.90)' }}
          />
        </div>
      </div>

      {/* White step dots row */}
      <div style={{ background: '#FFFFFF', padding: '12px 16px 10px', borderBottom: '1px solid #F0F4F8' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
          {STEP_LABELS.map((label, idx) => {
            const stepNum    = idx + 1
            const isCompleted = stepNum < currentStep
            const isCurrent   = stepNum === currentStep
            const isPending   = stepNum > currentStep
            return (
              <div key={stepNum} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 38 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isCompleted ? '#2C6ED5' : isCurrent ? BRAND_GRADIENT : '#EEF2F7',
                    color: isPending ? '#C0CCDA' : '#FFFFFF',
                    fontSize: 10, fontWeight: 800,
                    boxShadow: isCurrent ? '0 2px 8px rgba(44,110,213,0.30)' : 'none',
                    transition: 'all 0.25s ease',
                  }}>
                    {isCompleted ? <HiCheck size={12} /> : stepNum}
                  </div>
                  <span style={{
                    fontSize: 8, fontWeight: isCurrent ? 700 : 500, marginTop: 3,
                    color: isCurrent ? '#2C6ED5' : isCompleted ? '#6B9FE4' : '#C0CCDA',
                    textAlign: 'center', whiteSpace: 'nowrap', letterSpacing: '0.1px',
                  }}>
                    {label}
                  </span>
                </div>
                {idx < STEP_LABELS.length - 1 && (
                  <div style={{
                    width: 12, height: 2, flexShrink: 0, borderRadius: 1, marginBottom: 12,
                    background: isCompleted ? '#2C6ED5' : '#EEF2F7',
                    transition: 'background 0.25s ease',
                  }} />
                )}
              </div>
            )
          })}
        </div>
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
    <ModalSheet isOpen={isOpen} onClose={onClose}>
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
    </ModalSheet>
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
        <div key={i} style={{ background: '#FFFFFF', borderRadius: 18, overflow: 'hidden', marginBottom: 12, opacity: 0.55 + i * 0.15 }}>
          <div style={{ height: 4, background: '#EEF2F7' }} />
          <div style={{ padding: 14 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: '#EEF2F7' }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 13, borderRadius: 6, background: '#EEF2F7', marginBottom: 8, width: '55%' }} />
                <div style={{ height: 10, borderRadius: 6, background: '#EEF2F7', width: '30%' }} />
              </div>
            </div>
            <div style={{ height: 1, background: '#F0F4F8', marginBottom: 10 }} />
            <div style={{ height: 10, borderRadius: 6, background: '#EEF2F7', width: '70%' }} />
          </div>
          <div style={{ height: 42, background: '#F9FAFC', borderTop: '1px solid #F0F4F8' }} />
        </div>
      ))}
      {error && <div style={{ textAlign: 'center', color: '#EF4444', fontSize: 14, padding: '32px 0' }}>{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: '#6B7C93', fontSize: 14, padding: '32px 0' }}>No clinics found</div>
      )}

      {filtered.map((clinic) => {
        const isSelected = selected?._id === clinic._id
        const isOpen = clinic.status === 'active'
        const words = clinic.name.trim().split(/\s+/)
        const initials = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : clinic.name.slice(0, 2).toUpperCase()
        return (
          <motion.div
            key={clinic._id}
            onClick={() => onSelect(clinic)}
            whileTap={{ scale: 0.98 }}
            style={{
              background: '#FFFFFF', borderRadius: 18, marginBottom: 12,
              boxShadow: isSelected
                ? '0 4px 20px rgba(44,110,213,0.20)'
                : '0 2px 10px rgba(30,79,163,0.07)',
              border: isSelected ? '2px solid #2C6ED5' : '2px solid transparent',
              cursor: 'pointer', overflow: 'hidden', position: 'relative',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            {/* Top accent bar */}
            <div style={{ height: 4, background: isSelected ? BRAND_GRADIENT : isOpen ? BRAND_GRADIENT : '#E5E7EB' }} />

            <div style={{ padding: '14px 14px 0' }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                {/* Avatar */}
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: isOpen ? BRAND_GRADIENT : '#F1F5F9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isOpen ? '0 4px 12px rgba(44,110,213,0.22)' : 'none',
                }}>
                  {isOpen
                    ? <span style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', letterSpacing: 0.5 }}>{initials}</span>
                    : <MdLocalHospital size={22} color="#9CA3AF" />
                  }
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', margin: 0, lineHeight: 1.3, flex: 1, minWidth: 0 }}>
                      {clinic.name}
                    </p>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
                      fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                      background: isOpen ? '#ECFDF5' : '#F9FAFB',
                      color: isOpen ? '#16A34A' : '#6B7280',
                      border: `1px solid ${isOpen ? '#BBF7D0' : '#E5E7EB'}`,
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: isOpen ? '#16A34A' : '#9CA3AF' }} />
                      {isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  {clinic.type && (
                    <span style={{
                      display: 'inline-block', fontSize: 11, fontWeight: 600,
                      background: '#EBF2FF', color: '#2C6ED5', borderRadius: 6, padding: '2px 8px',
                    }}>
                      {clinic.type}
                    </span>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: '#F0F4F8', marginBottom: 10 }} />

              {/* Address row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                <div style={{ width: 22, height: 22, borderRadius: 7, background: '#F5F8FC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <HiLocationMarker size={12} color="#2C6ED5" />
                </div>
                <span style={{ fontSize: 12, color: '#6B7C93', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {clinic.address}, {clinic.city}
                </span>
              </div>
            </div>

            {/* Footer row */}
            <div style={{
              padding: '10px 14px',
              background: isSelected ? '#F0F6FF' : '#F9FAFC',
              borderTop: '1px solid #F0F4F8',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? '#2C6ED5' : isOpen ? '#2C6ED5' : '#9CA3AF' }}>
                {isSelected ? '✓ Selected' : 'Select this clinic'}
              </span>
              {isSelected && (
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#2C6ED5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HiCheck size={13} color="#FFFFFF" />
                </div>
              )}
            </div>
          </motion.div>
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
        <div key={i} style={{ background: '#FFFFFF', borderRadius: 18, overflow: 'hidden', marginBottom: 12, opacity: 0.55 + i * 0.15 }}>
          <div style={{ height: 4, background: '#EEF2F7' }} />
          <div style={{ padding: 14 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#EEF2F7', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 13, borderRadius: 6, background: '#EEF2F7', marginBottom: 8, width: '50%' }} />
                <div style={{ height: 10, borderRadius: 6, background: '#EEF2F7', marginBottom: 8, width: '65%' }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ height: 20, width: 64, borderRadius: 20, background: '#EEF2F7' }} />
                  <div style={{ height: 20, width: 52, borderRadius: 20, background: '#EEF2F7' }} />
                </div>
              </div>
            </div>
          </div>
          <div style={{ height: 42, background: '#F9FAFC', borderTop: '1px solid #F0F4F8' }} />
        </div>
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
          <motion.div
            key={doc._id}
            onClick={() => onSelect(doc as unknown as Doctor)}
            whileTap={{ scale: 0.98 }}
            style={{
              background: '#FFFFFF', borderRadius: 18, marginBottom: 12,
              boxShadow: isSelected ? '0 4px 20px rgba(44,110,213,0.20)' : '0 2px 10px rgba(30,79,163,0.07)',
              border: isSelected ? '2px solid #2C6ED5' : '2px solid transparent',
              cursor: 'pointer', overflow: 'hidden', position: 'relative',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            {/* Top accent bar */}
            <div style={{ height: 4, background: isSelected ? BRAND_GRADIENT : color }} />

            <div style={{ padding: '14px 14px 0' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 12 }}>
                {/* Circular avatar */}
                <div style={{
                  width: 58, height: 58, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${color}DD, ${color})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 800, color: '#FFFFFF',
                  boxShadow: `0 4px 14px ${color}55`,
                }}>
                  {getInitials(doc.name)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Name */}
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#1A1A1A', marginBottom: 2 }}>
                    Dr. {doc.name}
                  </div>
                  {/* Specialization with colored dot */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#6B7C93', fontWeight: 500 }}>{doc.specialization}</span>
                  </div>
                  {/* Chips row */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {doc.experience !== undefined && (
                      <span style={{
                        fontSize: 11, fontWeight: 700, borderRadius: 8, padding: '3px 9px',
                        background: '#EBF2FF', color: '#2C6ED5',
                      }}>
                        {doc.experience} yr{doc.experience !== 1 ? 's' : ''} exp
                      </span>
                    )}
                    {doc.consultationFee !== undefined && (
                      <span style={{
                        fontSize: 11, fontWeight: 700, borderRadius: 8, padding: '3px 9px',
                        background: '#ECFDF5', color: '#059669',
                      }}>
                        ₹{doc.consultationFee}
                      </span>
                    )}
                    {(doc as unknown as { roomNumber?: string }).roomNumber && (
                      <span style={{
                        fontSize: 11, fontWeight: 700, borderRadius: 8, padding: '3px 9px',
                        background: '#F5F3FF', color: '#7C3AED',
                      }}>
                        Room {(doc as unknown as { roomNumber?: string }).roomNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer row */}
            <div style={{
              padding: '10px 14px',
              background: isSelected ? '#F0F6FF' : '#F9FAFC',
              borderTop: '1px solid #F0F4F8',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? '#2C6ED5' : '#6B7C93' }}>
                {isSelected ? '✓ Selected' : 'Select doctor'}
              </span>
              {isSelected && (
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#2C6ED5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HiCheck size={13} color="#FFFFFF" />
                </div>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Time period helpers ───────────────────────────────────────────────────────

type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'night'

const PERIOD_CFG: Record<TimePeriod, { label: string; icon: string; range: string; color: string; bg: string; border: string }> = {
  morning:   { label: 'Morning',   icon: '🌅', range: '6 AM – 12 PM', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  afternoon: { label: 'Afternoon', icon: '☀️', range: '12 PM – 5 PM', color: '#2C6ED5', bg: '#EBF2FF', border: '#BFDBFE' },
  evening:   { label: 'Evening',   icon: '🌇', range: '5 PM – 8 PM',  color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  night:     { label: 'Night',     icon: '🌙', range: '8 PM – 12 AM', color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE' },
}

function getTimePeriod(time: string): TimePeriod {
  const [rawTime, meridiem] = time.split(' ')
  const hour = parseInt(rawTime.split(':')[0], 10)
  const h24 = meridiem === 'PM' && hour !== 12 ? hour + 12 : meridiem === 'AM' && hour === 12 ? 0 : hour
  if (h24 < 12) return 'morning'
  if (h24 < 17) return 'afternoon'
  if (h24 < 20) return 'evening'
  return 'night'
}

function groupSlotsByPeriod(slots: { time: string; available: boolean }[]) {
  const groups: Partial<Record<TimePeriod, { time: string; available: boolean }[]>> = {}
  for (const slot of slots) {
    const period = getTimePeriod(slot.time)
    if (!groups[period]) groups[period] = []
    groups[period]!.push(slot)
  }
  return groups
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

  const grouped = groupSlotsByPeriod(slots)
  const periodOrder: TimePeriod[] = ['morning', 'afternoon', 'evening', 'night']
  const availablePeriods = periodOrder.filter((p) => grouped[p] && grouped[p]!.length > 0)

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ paddingLeft: 16, paddingRight: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px' }}>Choose Date & Time</h2>
        <p style={{ fontSize: 14, color: '#6B7C93', margin: '0 0 16px' }}>Select a convenient date and time slot</p>
      </div>

      {/* Date strip */}
      <div style={{ overflowX: 'auto', display: 'flex', gap: 8, paddingLeft: 16, paddingRight: 16, paddingBottom: 4, scrollbarWidth: 'none' }}>
        {days.map((day) => {
          const isSelected = selectedDate === day.key
          const isToday = day.key === dayjs().format('YYYY-MM-DD')
          return (
            <button key={day.key} onClick={() => { onSelectDate(day.key); onSelectTime('') }} style={{
              flexShrink: 0, width: 60, padding: '10px 6px', borderRadius: 16,
              border: isSelected ? 'none' : '1.5px solid #E8EEF7',
              background: isSelected ? BRAND_GRADIENT : '#FFFFFF',
              color: isSelected ? '#FFFFFF' : '#1A1A1A', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              boxShadow: isSelected ? '0 4px 14px rgba(44,110,213,0.32)' : '0 1px 4px rgba(30,79,163,0.05)',
              transition: 'all 0.2s ease', position: 'relative',
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, opacity: isSelected ? 0.85 : 0.55, letterSpacing: '0.3px' }}>{day.dayName}</span>
              <span style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1 }}>{day.dateNum}</span>
              <span style={{ fontSize: 10, fontWeight: 600, opacity: isSelected ? 0.85 : 0.55 }}>{day.month}</span>
              {isToday && !isSelected && (
                <span style={{ position: 'absolute', bottom: 5, width: 4, height: 4, borderRadius: '50%', background: '#2C6ED5' }} />
              )}
              {isToday && isSelected && (
                <span style={{ position: 'absolute', bottom: 5, width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.7)' }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Slots */}
      <div style={{ paddingLeft: 16, paddingRight: 16, marginTop: 20 }}>
        {loadingSlots ? (
          <>
            {[0, 1].map((g) => (
              <div key={g} style={{ marginBottom: 20 }}>
                <div style={{ height: 36, borderRadius: 12, background: '#F5F8FC', marginBottom: 10 }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[0, 1, 2, 3].map((i) => <div key={i} style={{ height: 38, background: '#F5F8FC', borderRadius: 10 }} />)}
                </div>
              </div>
            ))}
          </>
        ) : slots.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📅</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>No slots available</div>
            <div style={{ fontSize: 13, color: '#A0AEC0' }}>Try selecting a different date</div>
          </div>
        ) : (
          availablePeriods.map((period) => {
            const cfg = PERIOD_CFG[period]
            const periodSlots = grouped[period]!
            const availableCount = periodSlots.filter((s) => s.available).length
            return (
              <div key={period} style={{ marginBottom: 20 }}>
                {/* Period header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: cfg.bg, border: `1px solid ${cfg.border}`,
                  borderRadius: 12, padding: '8px 14px', marginBottom: 10,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{cfg.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: cfg.color }}>{cfg.label}</div>
                      <div style={{ fontSize: 10, color: cfg.color, opacity: 0.75 }}>{cfg.range}</div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '2px 9px',
                    background: availableCount > 0 ? cfg.color : '#E5E7EB',
                    color: '#FFFFFF',
                  }}>
                    {availableCount} slot{availableCount !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Slot grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {periodSlots.map((slot) => {
                    const isSel = selectedTime === slot.time
                    return (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => slot.available && onSelectTime(slot.time)}
                        style={{
                          padding: '9px 4px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                          border: !slot.available ? '1.5px solid #EEF2F7'
                            : isSel ? 'none'
                            : `1.5px solid ${cfg.border}`,
                          background: !slot.available ? '#F9FAFB'
                            : isSel ? BRAND_GRADIENT
                            : '#FFFFFF',
                          color: !slot.available ? '#CBD5E1'
                            : isSel ? '#FFFFFF'
                            : cfg.color,
                          cursor: slot.available ? 'pointer' : 'not-allowed',
                          textDecoration: !slot.available ? 'line-through' : 'none',
                          boxShadow: isSel ? '0 4px 12px rgba(44,110,213,0.30)' : 'none',
                          transition: 'all 0.18s ease',
                        }}
                      >
                        {slot.time}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })
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
  const selfAge = user?.dob ? dayjs().diff(dayjs(user.dob), 'year') : null
  const isSelfSelected = selectedId === 'self'

  return (
    <div style={{ padding: '20px 16px' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px' }}>Who is the appointment for?</h2>
      <p style={{ fontSize: 14, color: '#6B7C93', margin: '0 0 20px' }}>Select the patient for this visit</p>

      {/* Section label */}
      <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>
        Yourself
      </div>

      {/* Self card */}
      <motion.div
        onClick={() => onSelect('self')}
        whileTap={{ scale: 0.98 }}
        style={{
          background: isSelfSelected ? '#EBF2FF' : '#FFFFFF',
          borderRadius: 18, marginBottom: 20, overflow: 'hidden',
          border: isSelfSelected ? '2px solid #2C6ED5' : '2px solid transparent',
          boxShadow: isSelfSelected ? '0 4px 20px rgba(44,110,213,0.18)' : '0 2px 10px rgba(30,79,163,0.07)',
          cursor: 'pointer', transition: 'all 0.2s ease',
        }}
      >
        {/* Accent bar */}
        <div style={{ height: 4, background: BRAND_GRADIENT }} />

        <div style={{ padding: '14px 14px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            {/* Avatar */}
            <div style={{
              width: 58, height: 58, borderRadius: '50%', flexShrink: 0,
              background: BRAND_GRADIENT,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 800, color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(44,110,213,0.30)',
            }}>
              {userInitials}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A' }}>{user?.name || 'Me'}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '2px 8px',
                  background: '#EBF2FF', color: '#2C6ED5', border: '1px solid #BFDBFE',
                }}>
                  Myself
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selfAge !== null && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7C93', background: '#F5F8FC', borderRadius: 8, padding: '2px 8px' }}>
                    Age {selfAge} yrs
                  </span>
                )}
                {user?.bloodGroup && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#E05B5B', background: '#FFF0F0', borderRadius: 8, padding: '2px 8px' }}>
                    {user.bloodGroup}
                  </span>
                )}
                {user?.phone && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7C93', background: '#F5F8FC', borderRadius: 8, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <HiPhone size={10} /> {user.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 14px',
          background: isSelfSelected ? '#D6E8FF' : '#F9FAFC',
          borderTop: '1px solid #F0F4F8',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: isSelfSelected ? '#2C6ED5' : '#6B7C93' }}>
            {isSelfSelected ? '✓ Selected' : 'Book for myself'}
          </span>
          {isSelfSelected && (
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#2C6ED5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HiCheck size={13} color="#FFFFFF" />
            </div>
          )}
        </div>
      </motion.div>

      {/* Family section */}
      {(loading || members.length > 0) && (
        <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>
          Family Members
        </div>
      )}

      {loading && [0, 1].map((i) => (
        <div key={i} style={{ background: '#FFFFFF', borderRadius: 18, overflow: 'hidden', marginBottom: 12, opacity: 0.55 + i * 0.2 }}>
          <div style={{ height: 4, background: '#EEF2F7' }} />
          <div style={{ padding: 14, display: 'flex', gap: 14, alignItems: 'center', marginBottom: 0 }}>
            <div style={{ width: 58, height: 58, borderRadius: '50%', background: '#EEF2F7', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 13, borderRadius: 6, background: '#EEF2F7', marginBottom: 8, width: '45%' }} />
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ height: 20, width: 56, borderRadius: 8, background: '#EEF2F7' }} />
                <div style={{ height: 20, width: 44, borderRadius: 8, background: '#EEF2F7' }} />
              </div>
            </div>
          </div>
          <div style={{ height: 42, background: '#F9FAFC', borderTop: '1px solid #F0F4F8' }} />
        </div>
      ))}

      {members.map((fm) => {
        const isSelected = selectedId === fm._id
        const color = getAvatarColor(fm._id)
        const fmAge = fm.dob ? dayjs().diff(dayjs(fm.dob), 'year') : null
        return (
          <motion.div
            key={fm._id}
            onClick={() => onSelect(fm._id, fm)}
            whileTap={{ scale: 0.98 }}
            style={{
              background: isSelected ? '#EBF2FF' : '#FFFFFF',
              borderRadius: 18, marginBottom: 12, overflow: 'hidden',
              border: isSelected ? '2px solid #2C6ED5' : '2px solid transparent',
              boxShadow: isSelected ? '0 4px 20px rgba(44,110,213,0.18)' : '0 2px 10px rgba(30,79,163,0.07)',
              cursor: 'pointer', transition: 'all 0.2s ease',
            }}
          >
            {/* Accent bar */}
            <div style={{ height: 4, background: `linear-gradient(135deg, ${color}, ${color}BB)` }} />

            <div style={{ padding: '14px 14px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                {/* Avatar */}
                <div style={{
                  width: 58, height: 58, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${color}EE, ${color})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 800, color: '#FFFFFF',
                  boxShadow: `0 4px 14px ${color}44`,
                }}>
                  {getInitials(fm.name)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A' }}>{fm.name}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '2px 8px',
                      background: '#EBF2FF', color: '#2C6ED5', border: '1px solid #BFDBFE',
                    }}>
                      {fm.relation}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {fmAge !== null && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7C93', background: '#F5F8FC', borderRadius: 8, padding: '2px 8px' }}>
                        Age {fmAge} yrs
                      </span>
                    )}
                    {fm.bloodGroup && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#E05B5B', background: '#FFF0F0', borderRadius: 8, padding: '2px 8px' }}>
                        {fm.bloodGroup}
                      </span>
                    )}
                    {fm.phone && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7C93', background: '#F5F8FC', borderRadius: 8, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <HiPhone size={10} /> {fm.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '10px 14px',
              background: isSelected ? '#D6E8FF' : '#F9FAFC',
              borderTop: '1px solid #F0F4F8',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? '#2C6ED5' : '#6B7C93' }}>
                {isSelected ? '✓ Selected' : 'Book for this member'}
              </span>
              {isSelected && (
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#2C6ED5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HiCheck size={13} color="#FFFFFF" />
                </div>
              )}
            </div>
          </motion.div>
        )
      })}

      {/* Add family member */}
      <motion.button
        onClick={() => setAddOpen(true)}
        whileTap={{ scale: 0.97 }}
        style={{
          width: '100%', borderRadius: 14, border: '1.5px dashed #BFD4F5',
          background: '#F5F8FC', cursor: 'pointer', padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: '#EBF2FF', border: '1.5px dashed #2C6ED5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <HiPlus size={16} color="#2C6ED5" />
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#2C6ED5' }}>Add Family Member</div>
          <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 1 }}>Spouse, parent, child, sibling…</div>
        </div>
      </motion.button>

      <AddMemberModal isOpen={addOpen} onClose={() => setAddOpen(false)}
        onAdded={(m) => { setMembers((prev) => [...prev, m]); onSelect(m._id, m) }} />
    </div>
  )
}

// ── Step 5: Reason ────────────────────────────────────────────────────────────

const QUICK_REASON_CFG = [
  { label: 'Follow-up',    icon: '🔄', color: '#2C6ED5', bg: '#EBF2FF', border: '#BFDBFE' },
  { label: 'Consultation', icon: '💬', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  { label: 'Check-up',     icon: '🩺', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  { label: 'Prescription', icon: '💊', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  { label: 'Test Results', icon: '📋', color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC' },
  { label: 'Other',        icon: '✏️', color: '#6B7C93', bg: '#F5F8FC', border: '#E3EAF2' },
]

function Step5Reason({ reason, onChangeReason }: { reason: string; onChangeReason: (r: string) => void }) {
  const [focused, setFocused] = useState(false)

  const toggleChip = (label: string) => {
    const parts = reason.split(',').map((s) => s.trim()).filter(Boolean)
    if (parts.includes(label)) {
      onChangeReason(parts.filter((p) => p !== label).join(', '))
    } else {
      onChangeReason(parts.length > 0 ? `${parts.join(', ')}, ${label}` : label)
    }
  }

  const selectedChips = reason.split(',').map((s) => s.trim()).filter(Boolean)

  return (
    <div style={{ padding: '20px 16px' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px' }}>Reason for Visit</h2>
      <p style={{ fontSize: 14, color: '#6B7C93', margin: '0 0 20px' }}>Tell us why you're visiting today</p>

      {/* Quick select section */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 12 }}>
          Quick Select
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {QUICK_REASON_CFG.map(({ label, icon, color, bg, border }) => {
            const isActive = selectedChips.includes(label)
            return (
              <motion.button
                key={label}
                onClick={() => toggleChip(label)}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '12px 8px', borderRadius: 14,
                  border: isActive ? `2px solid ${color}` : `1.5px solid ${border}`,
                  background: isActive ? bg : '#FFFFFF',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 6,
                  boxShadow: isActive ? `0 4px 12px ${color}22` : '0 1px 4px rgba(30,79,163,0.05)',
                  transition: 'all 0.18s ease',
                  position: 'relative',
                }}
              >
                {isActive && (
                  <div style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 16, height: 16, borderRadius: '50%',
                    background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <HiCheck size={10} color="#FFFFFF" />
                  </div>
                )}
                <span style={{ fontSize: 22 }}>{icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? color : '#4A5568', textAlign: 'center', lineHeight: 1.2 }}>
                  {label}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Textarea section */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 12 }}>
          Additional Details
        </div>
        <div style={{
          borderRadius: 16, border: focused ? '2px solid #2C6ED5' : '1.5px solid #E3EAF2',
          background: '#FFFFFF', overflow: 'hidden',
          boxShadow: focused ? '0 0 0 3px rgba(44,110,213,0.10)' : '0 2px 8px rgba(30,79,163,0.05)',
          transition: 'all 0.18s ease',
        }}>
          <textarea
            rows={5}
            value={reason}
            onChange={(e) => onChangeReason(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Describe your symptoms or any additional details…"
            style={{
              width: '100%', border: 'none', outline: 'none',
              padding: '14px 16px', fontSize: 14, color: '#1A1A1A',
              background: 'transparent', resize: 'none',
              fontFamily: 'inherit', lineHeight: 1.7, boxSizing: 'border-box',
            }}
          />
          {/* Footer bar */}
          <div style={{
            padding: '8px 14px', borderTop: '1px solid #F0F4F8',
            background: '#F9FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 11, color: '#A0AEC0' }}>
              {reason.length > 0 ? `${reason.length} characters` : 'Optional — skip if not needed'}
            </span>
            {reason.length > 0 && (
              <button
                onClick={() => onChangeReason('')}
                style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Selected summary */}
      {selectedChips.length > 0 && (
        <div style={{ marginTop: 16, padding: '12px 14px', background: '#EBF2FF', borderRadius: 14, border: '1px solid #BFDBFE' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#2C6ED5', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Selected Reasons
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {selectedChips.map((chip) => {
              const cfg = QUICK_REASON_CFG.find((c) => c.label === chip)
              return (
                <span key={chip} style={{
                  fontSize: 12, fontWeight: 600, borderRadius: 20, padding: '3px 10px',
                  background: cfg?.bg ?? '#F5F8FC', color: cfg?.color ?? '#6B7C93',
                  border: `1px solid ${cfg?.border ?? '#E3EAF2'}`,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {cfg?.icon} {chip}
                </span>
              )
            })}
          </div>
        </div>
      )}
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
  bookError: string | null
}) {
  const user = useAuthStore((s) => s.user)
  const patientName = patientType === 'family' && familyMember ? familyMember.name : user?.name || 'Me'
  const patientInitials = getInitials(patientName)
  const patientColor = patientType === 'family' && familyMember ? getAvatarColor(familyMember._id) : null
  const formattedDate = selectedDate ? dayjs(selectedDate).format('ddd, MMM D, YYYY') : '—'
  const docColor = doctor ? getAvatarColor(doctor._id) : '#2C6ED5'

  const clinicWords = clinic?.name.trim().split(/\s+/) ?? []
  const clinicInitials = clinicWords.length >= 2
    ? (clinicWords[0][0] + clinicWords[1][0]).toUpperCase()
    : (clinic?.name.slice(0, 2).toUpperCase() ?? '—')

  return (
    <div style={{ padding: '20px 16px' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px' }}>Confirm Booking</h2>
      <p style={{ fontSize: 14, color: '#6B7C93', margin: '0 0 20px' }}>Review your appointment details</p>

      {/* ── Main summary card ── */}
      <div style={{ background: '#FFFFFF', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(30,79,163,0.10)', marginBottom: 14 }}>

        {/* Gradient header */}
        <div style={{ background: BRAND_GRADIENT, padding: '18px 16px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -24, right: -24, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 6 }}>
            Appointment Summary
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${docColor}EE, ${docColor})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#FFFFFF', flexShrink: 0, boxShadow: '0 3px 10px rgba(0,0,0,0.18)' }}>
              {doctor ? getInitials(doctor.name) : '?'}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>{doctor ? `Dr. ${doctor.name}` : '—'}</div>
              {doctor?.specialization && (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.80)', marginTop: 2 }}>{doctor.specialization}</div>
              )}
            </div>
          </div>
        </div>

        {/* Info rows */}
        <div style={{ padding: '4px 0' }}>

          {/* Clinic */}
          {clinic && (
            <InfoRow
              icon={<div style={{ width: 34, height: 34, borderRadius: 10, background: BRAND_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#FFFFFF' }}>{clinicInitials}</div>}
              label="Clinic"
              value={clinic.name}
              sub={`${clinic.address}, ${clinic.city}`}
            />
          )}

          {/* Patient */}
          <InfoRow
            icon={
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: patientColor ? `linear-gradient(135deg,${patientColor}EE,${patientColor})` : BRAND_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#FFFFFF' }}>
                {patientInitials}
              </div>
            }
            label="Patient"
            value={patientName}
            sub={patientType === 'family' && familyMember ? familyMember.relation : 'Self'}
          />

          {/* Date */}
          <InfoRow
            icon={<IconBadge color="#2C6ED5" bg="#EBF2FF"><HiCalendar size={16} color="#2C6ED5" /></IconBadge>}
            label="Date"
            value={formattedDate}
          />

          {/* Time */}
          <InfoRow
            icon={<IconBadge color="#D97706" bg="#FFFBEB"><HiClock size={16} color="#D97706" /></IconBadge>}
            label="Time"
            value={selectedTime || '—'}
          />

          {/* Reason */}
          {reason.trim() && (
            <InfoRow
              icon={<IconBadge color="#7C3AED" bg="#F5F3FF"><HiClipboardList size={16} color="#7C3AED" /></IconBadge>}
              label="Reason"
              value={reason.length > 60 ? reason.slice(0, 60) + '…' : reason}
            />
          )}
        </div>
      </div>

      {/* ── Fee card ── */}
      {doctor?.consultationFee !== undefined && (
        <div style={{
          background: '#FFFFFF', borderRadius: 16, padding: '14px 16px',
          boxShadow: '0 2px 10px rgba(30,79,163,0.07)', marginBottom: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HiCurrencyRupee size={18} color="#059669" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#6B7C93' }}>Consultation Fee</div>
              <div style={{ fontSize: 10, color: '#A0AEC0' }}>Payable at clinic</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#059669' }}>₹{doctor.consultationFee}</div>
          </div>
        </div>
      )}

      {/* ── Notice ── */}
      <div style={{
        background: '#FFFBEB', borderRadius: 14, padding: '12px 14px',
        border: '1px solid #FDE68A', marginBottom: 16,
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
        <p style={{ fontSize: 12, color: '#92400E', margin: 0, lineHeight: 1.6 }}>
          Please arrive <strong>10 minutes early</strong>. Bring any previous reports or prescriptions relevant to your visit.
        </p>
      </div>

      {bookError && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#B91C1C', fontWeight: 600 }}>
          ⚠️ {bookError}
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #F5F8FC' }}>
      <div style={{ flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#A0AEC0', marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: '#6B7C93', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  )
}

function IconBadge({ children, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <div style={{ width: 34, height: 34, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </div>
  )
}

// ── Payment Sheet ─────────────────────────────────────────────────────────────

const PLATFORM_FEE = 10
const OTHER_FEE    = 0

type PayMethod = 'upi' | 'card' | 'netbanking' | 'clinic'

const PAY_METHODS: { id: PayMethod; label: string; sub: string; icon: React.ReactNode }[] = [
  { id: 'upi',        label: 'UPI',           sub: 'GPay, PhonePe, Paytm',  icon: <MdPhoneAndroid size={20} color="#4CAF50" /> },
  { id: 'card',       label: 'Card',          sub: 'Credit / Debit card',   icon: <HiCreditCard   size={20} color="#2C6ED5" /> },
  { id: 'netbanking', label: 'Net Banking',   sub: 'All major banks',       icon: <HiLibrary      size={20} color="#7C3AED" /> },
  { id: 'clinic',     label: 'Pay at Clinic', sub: 'Cash / card on arrival',icon: <MdLocalHospital size={20} color="#D97706" /> },
]

function PaymentSheet({
  consultationFee, onPay, onClose, isPaying,
}: {
  consultationFee: number
  onPay: (method: PayMethod) => void
  onClose: () => void
  isPaying: boolean
}) {
  const [method, setMethod] = useState<PayMethod>('upi')
  const total = consultationFee + PLATFORM_FEE + OTHER_FEE
  const getPortal = () => document.getElementById('modal-portal') || document.body

  const feeRows = [
    { label: 'Consultation Fee', amount: consultationFee, color: '#1A1A1A' },
    { label: 'Platform Fee',     amount: PLATFORM_FEE,    color: '#6B7C93' },
    { label: 'Other Fee',        amount: OTHER_FEE,       color: '#6B7C93' },
  ]

  return createPortal(
    <div
      style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.52)', zIndex: 950, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', pointerEvents: 'all' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 34 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#FFFFFF', borderRadius: '24px 24px 0 0', overflow: 'hidden' }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E3EAF2' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 0' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A' }}>Payment</div>
            <div style={{ fontSize: 12, color: '#A0AEC0', marginTop: 2 }}>Review charges & choose method</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F5F8FC', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HiX size={16} color="#6B7C93" />
          </button>
        </div>

        <div style={{ padding: '16px 18px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Fee breakdown card */}
          <div style={{ background: '#F5F8FC', borderRadius: 16, overflow: 'hidden' }}>
            {feeRows.map((row, i) => (
              <div key={row.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '11px 14px',
                borderBottom: i < feeRows.length - 1 ? '1px solid #EEF2F7' : 'none',
              }}>
                <span style={{ fontSize: 13, color: '#6B7C93', fontWeight: 500 }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: row.color }}>
                  {row.amount === 0 ? <span style={{ color: '#A0AEC0' }}>—</span> : `₹${row.amount}`}
                </span>
              </div>
            ))}
            {/* Total row */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '13px 14px', background: BRAND_GRADIENT,
            }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>Total Payable</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: '#FFFFFF' }}>₹{total}</span>
            </div>
          </div>

          {/* Payment method */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>
              Payment Method
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {PAY_METHODS.map((pm) => {
                const active = method === pm.id
                return (
                  <motion.button
                    key={pm.id}
                    onClick={() => setMethod(pm.id)}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      padding: '12px 12px', borderRadius: 14, cursor: 'pointer',
                      border: active ? '2px solid #2C6ED5' : '1.5px solid #E3EAF2',
                      background: active ? '#EBF2FF' : '#FFFFFF',
                      display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                      boxShadow: active ? '0 2px 10px rgba(44,110,213,0.14)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: active ? '#FFFFFF' : '#F5F8FC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {pm.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: active ? '#2C6ED5' : '#1A1A1A' }}>{pm.label}</div>
                      <div style={{ fontSize: 10, color: '#A0AEC0', marginTop: 1 }}>{pm.sub}</div>
                    </div>
                    {active && (
                      <div style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', background: '#2C6ED5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <HiCheck size={11} color="#FFFFFF" />
                      </div>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Secure note */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', background: '#ECFDF5', borderRadius: 10, border: '1px solid #A7F3D0' }}>
            <HiShieldCheck size={16} color="#059669" />
            <span style={{ fontSize: 11, color: '#065F46', fontWeight: 500 }}>100% secure & encrypted payment</span>
          </div>

          {/* Pay button */}
          <motion.button
            onClick={() => onPay(method)}
            disabled={isPaying}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%', height: 50, borderRadius: 14, border: 'none',
              background: isPaying ? 'rgba(44,110,213,0.55)' : BRAND_GRADIENT,
              color: '#FFFFFF', fontSize: 15, fontWeight: 800,
              cursor: isPaying ? 'not-allowed' : 'pointer',
              boxShadow: isPaying ? 'none' : '0 6px 18px rgba(44,110,213,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            {isPaying ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                  style={{ display: 'inline-block', width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#FFFFFF', borderRadius: '50%' }}
                />
                Processing…
              </>
            ) : (
              <>
                <HiShieldCheck size={17} />
                {method === 'clinic' ? `Confirm Booking` : `Pay ₹${total}`}
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>,
    getPortal()
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
  const [showPayment, setShowPayment] = useState(false)

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

  const handleConfirm = async (_method?: PayMethod) => {
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
      setShowPayment(false)
      navigate('/app/appointments')
    } catch (e: unknown) {
      setBookError(e instanceof Error ? e.message : 'Booking failed. Please try again.')
      setShowPayment(false)
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
    <div style={{ minHeight: '100dvh', background: '#F5F8FC', display: 'flex', flexDirection: 'column' }}>

      {/* Merged gradient hero + step indicator */}
      <BookingHeader currentStep={localStep} onBack={handleBack} />

      {/* Scrollable step content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
        <AnimatePresence mode="wait" initial={false} custom={localStep}>
          <motion.div
            key={localStep}
            custom={localStep}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
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
                bookError={bookError}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom action bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        background: '#FFFFFF',
        borderTop: '1px solid #F0F4F8',
        boxShadow: '0 -6px 24px rgba(30,79,163,0.10)',
      }}>
        {/* Step counter strip */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '8px 16px 0',
        }}>
          {STEP_LABELS.map((_, idx) => {
            const s = idx + 1
            const done = s < localStep
            const cur  = s === localStep
            return (
              <div key={s} style={{
                height: 3, flex: 1, borderRadius: 99,
                background: done ? '#2C6ED5' : cur ? BRAND_GRADIENT : '#EEF2F7',
                transition: 'background 0.25s',
              }} />
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '8px 16px 24px' }}>
          {/* Back button */}
          {localStep > 1 ? (
            <button
              onClick={handleBack}
              disabled={isBooking}
              style={{
                width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                border: '1.5px solid #E3EAF2', background: '#F5F8FC',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <HiArrowLeft size={17} color="#3D4A5B" />
            </button>
          ) : (
            <div style={{ width: 0 }} />
          )}

          {/* Primary CTA */}
          {!isLastStep ? (
            <button
              onClick={handleNext}
              disabled={nextDisabled}
              style={{
                flex: 1, height: 40, borderRadius: 11, border: 'none',
                background: nextDisabled ? '#E8EDF5' : BRAND_GRADIENT,
                color: nextDisabled ? '#A0AEC0' : '#FFFFFF',
                fontSize: 13, fontWeight: 700,
                cursor: nextDisabled ? 'not-allowed' : 'pointer',
                boxShadow: nextDisabled ? 'none' : '0 4px 14px rgba(44,110,213,0.32)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.2s ease',
              }}
            >
              <span>{localStep === 5 ? 'Review Booking' : 'Continue'}</span>
              {!nextDisabled && (
                <div style={{ width: 18, height: 18, borderRadius: 6, background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 900, lineHeight: 1 }}>›</span>
                </div>
              )}
            </button>
          ) : (
            <button
              onClick={() => setShowPayment(true)}
              style={{
                flex: 1, height: 40, borderRadius: 11, border: 'none',
                background: BRAND_GRADIENT,
                color: '#FFFFFF', fontSize: 13, fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(44,110,213,0.32)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HiCurrencyRupee size={13} color="#FFFFFF" />
              </div>
              <span>Proceed to Pay</span>
            </button>
          )}
        </div>
      </div>

      {/* Payment sheet */}
      <AnimatePresence>
        {showPayment && (
          <PaymentSheet
            consultationFee={selectedDoctor?.consultationFee ?? 0}
            onPay={(method) => handleConfirm(method)}
            onClose={() => setShowPayment(false)}
            isPaying={isBooking}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
