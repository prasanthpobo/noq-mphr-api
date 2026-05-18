import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiArrowLeft, HiPencil, HiCheck, HiX, HiDuplicate,
} from 'react-icons/hi'
import { MdPerson, MdCalendarToday, MdWc, MdFavorite, MdPhone, MdHeight, MdFitnessCenter } from 'react-icons/md'
import dayjs from 'dayjs'
import { useAuthStore } from '../../store/authStore'
import { getMe, updateProfile } from '../../services/authService'
import ModalSheet from '../../components/ModalSheet'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

const GENDER_OPTIONS     = [{ value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }, { value: 'Other', label: 'Other' }]
const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function computeCompletion(user: ReturnType<typeof useAuthStore.getState>['user']): number {
  if (!user) return 0
  const fields = [user.name, user.email, user.phone, user.dob, user.gender, user.bloodGroup, user.height, user.weight]
  return Math.round((fields.filter(Boolean).length / fields.length) * 100)
}

function CircleProgress({ pct }: { pct: number }) {
  const r = 22, circ = 2 * Math.PI * r
  return (
    <div style={{ position: 'relative', width: 56, height: 56 }}>
      <svg width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
        <circle cx="28" cy="28" r={r} fill="none" stroke="#FFFFFF" strokeWidth="4"
          strokeDasharray={`${(pct / 100) * circ} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{pct}%</span>
        <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.75)', fontWeight: 600, marginTop: 1 }}>DONE</span>
      </div>
    </div>
  )
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

interface EditForm {
  name: string; phone: string; gender: string
  dob: string; bloodGroup: string; height: string; weight: string
}

function EditModal({
  isOpen, initial, onClose, onSaved,
}: {
  isOpen: boolean
  initial: EditForm
  onClose: () => void
  onSaved: (form: EditForm) => void
}) {
  const [form, setForm]     = useState<EditForm>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => { if (isOpen) { setForm(initial); setError(null) } }, [isOpen])

  const set = (key: keyof EditForm) => (val: string) => setForm((f) => ({ ...f, [key]: val }))

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Full name is required'); return }
    setSaving(true); setError(null)
    try {
      await updateProfile({
        name:       form.name.trim() || undefined,
        phone:      form.phone.trim() || undefined,
        gender:     (form.gender as 'M' | 'F' | 'Other') || undefined,
        dob:        form.dob || undefined,
        bloodGroup: form.bloodGroup || undefined,
        height:     form.height ? parseFloat(form.height) : undefined,
        weight:     form.weight ? parseFloat(form.weight) : undefined,
      })
      onSaved(form)
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save. Please try again.')
    } finally { setSaving(false) }
  }

  const inp: React.CSSProperties = {
    width: '100%', height: 48, borderRadius: 12, border: '1.5px solid #E3EAF2',
    padding: '0 14px', fontSize: 14, color: '#1A1A1A', background: '#F5F8FC',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }
  const sel: React.CSSProperties = { ...inp, appearance: 'none' }

  return (
    <ModalSheet isOpen={isOpen} onClose={onClose}>
      <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E3EAF2', margin: '0 auto 20px' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>Edit Profile</h2>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F5F8FC', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HiX size={18} color="#6B7C93" />
        </button>
      </div>

      {error && (
        <div style={{ background: '#FEE2E2', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#B91C1C', display: 'flex', alignItems: 'center', gap: 8 }}>
          <HiX size={14} /> {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Section: Basic */}
        <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: -4 }}>Basic Info</div>

        <Field label="Full Name *">
          <input style={inp} type="text" placeholder="Enter your full name"
            value={form.name} onChange={(e) => set('name')(e.target.value)} />
        </Field>

        <Field label="Date of Birth">
          <input style={inp} type="date" value={form.dob} onChange={(e) => set('dob')(e.target.value)} />
        </Field>

        <Field label="Gender">
          <select style={sel} value={form.gender} onChange={(e) => set('gender')(e.target.value)}>
            <option value="">Select gender</option>
            {GENDER_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </Field>

        <Field label="Blood Group">
          <select style={sel} value={form.bloodGroup} onChange={(e) => set('bloodGroup')(e.target.value)}>
            <option value="">Select blood group</option>
            {BLOOD_GROUP_OPTIONS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
          </select>
        </Field>

        {/* Section: Physical */}
        <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: -4, marginTop: 4 }}>Physical</div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Field label="Height (cm)" style={{ flex: 1 }}>
            <input style={inp} type="number" placeholder="e.g. 170"
              value={form.height} onChange={(e) => set('height')(e.target.value)} />
          </Field>
          <Field label="Weight (kg)" style={{ flex: 1 }}>
            <input style={inp} type="number" placeholder="e.g. 65"
              value={form.weight} onChange={(e) => set('weight')(e.target.value)} />
          </Field>
        </div>

        {/* Section: Contact */}
        <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: -4, marginTop: 4 }}>Contact</div>

        <Field label="Phone Number">
          <input style={inp} type="tel" placeholder="+60 XXXXX XXXXX"
            value={form.phone} onChange={(e) => set('phone')(e.target.value)} />
        </Field>

        <button onClick={handleSave} disabled={saving} style={{
          width: '100%', height: 52, borderRadius: 14, border: 'none',
          background: saving ? 'rgba(44,110,213,0.6)' : BRAND_GRADIENT,
          color: '#FFFFFF', fontSize: 15, fontWeight: 700,
          cursor: saving ? 'not-allowed' : 'pointer', marginTop: 6,
          boxShadow: saving ? 'none' : '0 4px 16px rgba(44,110,213,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {saving ? 'Saving…' : <><HiCheck size={16} /> Save Changes</>}
        </button>
      </div>
    </ModalSheet>
  )
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7C93', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      {children}
    </div>
  )
}

// ── Info Row ──────────────────────────────────────────────────────────────────

function InfoRow({ icon, iconBg, label, value, missing }: {
  icon: React.ReactNode; iconBg: string; label: string; value: string; missing?: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' }}>
      <div style={{ width: 38, height: 38, borderRadius: 11, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: missing ? 500 : 700, color: missing ? '#C8D4E0' : '#1A1A1A' }}>{value}</div>
      </div>
    </div>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function PersonalInfoScreen() {
  const navigate  = useNavigate()
  const user      = useAuthStore((s) => s.user)
  const setUser   = useAuthStore((s) => s.setUser)
  const [editOpen, setEditOpen] = useState(false)
  const [copied,   setCopied]   = useState(false)
  const [saved,    setSaved]    = useState(false)

  useEffect(() => {
    getMe().then((r) => { if (r.success) setUser(r.data) }).catch(() => {})
  }, [setUser])

  const name       = user?.name ?? '—'
  const phone      = user?.phone ?? ''
  const age        = user?.dob ? dayjs().diff(dayjs(user.dob), 'year') : null
  const gender     = user?.gender === 'M' ? 'Male' : user?.gender === 'F' ? 'Female' : user?.gender === 'Other' ? 'Other' : ''
  const bloodGroup = user?.bloodGroup ?? ''
  const dob        = user?.dob ? dayjs(user.dob).format('D MMMM YYYY') : ''
  const height     = user?.height
  const weight     = user?.weight
  const bmi        = height && weight ? (weight / ((height / 100) ** 2)).toFixed(1) : null
  const bmiLabel   = bmi
    ? parseFloat(bmi) < 18.5 ? 'Underweight' : parseFloat(bmi) < 25 ? 'Normal' : parseFloat(bmi) < 30 ? 'Overweight' : 'Obese'
    : null
  const bmiColor   = bmi
    ? parseFloat(bmi) < 18.5 ? '#2C6ED5' : parseFloat(bmi) < 25 ? '#059669' : parseFloat(bmi) < 30 ? '#D97706' : '#E05B5B'
    : '#A0AEC0'
  const completion = computeCompletion(user)
  const healthId   = user?.id ? `NQ-${user.id.slice(-8).toUpperCase()}` : 'NQ-——'

  const initialForm: EditForm = {
    name:       user?.name ?? '',
    phone:      user?.phone ?? '',
    gender:     user?.gender ?? '',
    dob:        user?.dob ? dayjs(user.dob).format('YYYY-MM-DD') : '',
    bloodGroup: user?.bloodGroup ?? '',
    height:     user?.height?.toString() ?? '',
    weight:     user?.weight?.toString() ?? '',
  }

  const handleSaved = (form: EditForm) => {
    setUser({
      ...user!,
      name:       form.name,
      phone:      form.phone || undefined,
      gender:     (form.gender as 'M' | 'F' | 'Other') || undefined,
      dob:        form.dob || undefined,
      bloodGroup: form.bloodGroup || undefined,
      height:     form.height ? parseFloat(form.height) : undefined,
      weight:     form.weight ? parseFloat(form.weight) : undefined,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  const handleCopy = () => {
    if (phone) navigator.clipboard.writeText(phone).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F5F8FC', fontFamily: 'Roboto, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* ── White nav bar ─────────────────────────────────────────────────────── */}
      <div style={{
        background: '#FFFFFF', padding: '12px 16px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #F0F4F8', flexShrink: 0,
      }}>
        <button onClick={() => navigate(-1)} style={{
          width: 36, height: 36, borderRadius: 10, background: '#F5F8FC',
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <HiArrowLeft size={18} color="#1A1A1A" />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>Personal Info</span>
        <button onClick={() => setEditOpen(true)} style={{
          height: 36, borderRadius: 20, background: BRAND_GRADIENT, border: 'none', cursor: 'pointer',
          padding: '0 14px', fontSize: 13, fontWeight: 700, color: '#FFFFFF',
          display: 'flex', alignItems: 'center', gap: 5,
          boxShadow: '0 4px 12px rgba(44,110,213,0.35)',
        }}>
          <HiPencil size={13} /> Edit
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 96px' }}>

        {/* ── Save success toast ────────────────────────────────────────────── */}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12,
              padding: '10px 14px', marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 13, fontWeight: 600, color: '#15803D',
            }}
          >
            <HiCheck size={16} /> Profile updated successfully
          </motion.div>
        )}

        {/* ── Single merged hero card ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(30,79,163,0.14)', marginBottom: 16 }}
        >
          {/* Gradient hero */}
          <div style={{ background: BRAND_GRADIENT, padding: '22px 20px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
            <div style={{ position: 'absolute', bottom: -20, left: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 68, height: 68, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.22)', border: '3px solid rgba(255,255,255,0.50)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 800, color: '#FFFFFF',
                }}>
                  {getInitials(name)}
                </div>
                <div style={{
                  position: 'absolute', bottom: 1, right: 1,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#22C55E', border: '2px solid rgba(255,255,255,0.8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <HiCheck size={9} color="#FFFFFF" />
                </div>
              </div>

              {/* Name + ID */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 19, fontWeight: 800, color: '#FFFFFF', marginBottom: 3 }}>{name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 10 }}>
                  {healthId}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, borderRadius: 20, padding: '3px 10px', background: 'rgba(255,255,255,0.20)', color: '#FFFFFF' }}>
                    Patient
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, borderRadius: 20, padding: '3px 10px', background: 'rgba(255,255,255,0.20)', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 4 }}>
                    ✓ Verified
                  </span>
                </div>
              </div>

              <CircleProgress pct={completion} />
            </div>
          </div>

          {/* White stats grid */}
          <div style={{ background: '#FFFFFF', padding: '16px' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { value: age !== null ? `${age}` : '—', unit: age !== null ? 'yrs' : '', label: 'AGE',    color: '#2C6ED5', bg: '#EBF2FF', border: '#BFDBFE' },
                { value: user?.gender === 'M' ? 'M' : user?.gender === 'F' ? 'F' : '—', unit: '', label: 'GENDER', color: '#7C3AED', bg: '#F3EEFF', border: '#DDD6FE' },
                { value: bloodGroup || '—', unit: '',          label: 'BLOOD',  color: '#E05B5B', bg: '#FFF0F0', border: '#FECACA' },
                { value: bmi ?? '—',         unit: bmiLabel ?? '', label: 'BMI',    color: bmiColor,  bg: '#F5F8FC', border: '#E3EAF2' },
              ].map((s) => (
                <div key={s.label} style={{
                  flex: 1, textAlign: 'center', padding: '11px 4px',
                  background: s.bg, borderRadius: 13, border: `1.5px solid ${s.border}`,
                }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  {s.unit && <div style={{ fontSize: 9, color: s.color, opacity: 0.8, marginTop: 2 }}>{s.unit}</div>}
                  <div style={{ fontSize: 9, fontWeight: 700, color: s.color, letterSpacing: '0.4px', marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Complete profile banner ────────────────────────────────────────── */}
        {completion < 100 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            onClick={() => setEditOpen(true)}
            style={{
              background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 16,
              padding: '13px 16px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 11, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
              ✏️
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 2 }}>
                Profile {completion}% complete
              </div>
              <div style={{ fontSize: 12, color: '#B45309' }}>Tap to add height, weight & more fields.</div>
            </div>
            <span style={{ color: '#D97706', fontSize: 18, fontWeight: 700 }}>→</span>
          </motion.div>
        )}

        {/* ── Basic Information card ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: '#FFFFFF', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(30,79,163,0.06)', marginBottom: 14 }}
        >
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #F0F4F8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: '#EBF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MdPerson size={16} color="#2C6ED5" />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>Basic Information</span>
            </div>
            <button onClick={() => setEditOpen(true)} style={{ width: 28, height: 28, borderRadius: 8, background: '#F5F8FC', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HiPencil size={13} color="#6B7C93" />
            </button>
          </div>

          {[
            { icon: <MdPerson size={17} color="#2C6ED5" />,       iconBg: '#EBF2FF', label: 'Full Name',    value: name,         missing: !user?.name },
            { icon: <MdCalendarToday size={17} color="#7C3AED" />, iconBg: '#F3EEFF', label: 'Date of Birth', value: dob || 'Not set',  missing: !dob },
            { icon: <MdWc size={17} color="#059669" />,            iconBg: '#ECFDF5', label: 'Gender',       value: gender || 'Not set', missing: !gender },
            { icon: <MdFavorite size={17} color="#E05B5B" />,      iconBg: '#FFF0F0', label: 'Blood Group',  value: bloodGroup || 'Not set', missing: !bloodGroup },
            { icon: <MdHeight size={17} color="#D97706" />,        iconBg: '#FFFBEB', label: 'Height',       value: height ? `${height} cm` : 'Not set', missing: !height },
            { icon: <MdFitnessCenter size={17} color="#7C3AED" />, iconBg: '#F3EEFF', label: 'Weight',       value: weight ? `${weight} kg` : 'Not set', missing: !weight },
          ].map((row, i, arr) => (
            <div key={row.label}>
              <InfoRow {...row} />
              {i < arr.length - 1 && <div style={{ height: 1, background: '#F0F4F8', marginLeft: 68 }} />}
            </div>
          ))}
        </motion.div>

        {/* ── Contact card ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ background: '#FFFFFF', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(30,79,163,0.06)' }}
        >
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #F0F4F8', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MdPhone size={16} color="#059669" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>Contact</span>
          </div>

          {/* Phone */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: user?.email ? '1px solid #F0F4F8' : 'none' }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MdPhone size={17} color="#059669" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>Mobile Number</div>
              <div style={{ fontSize: 15, fontWeight: phone ? 700 : 500, color: phone ? '#1A1A1A' : '#C8D4E0' }}>{phone || 'Not set'}</div>
            </div>
            {phone && (
              <button onClick={handleCopy} style={{
                width: 32, height: 32, borderRadius: 8,
                background: copied ? '#ECFDF5' : '#F5F8FC',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {copied ? <HiCheck size={15} color="#059669" /> : <HiDuplicate size={15} color="#A0AEC0" />}
              </button>
            )}
          </div>

          {/* Email */}
          {user?.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: '#EBF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 17 }}>
                ✉️
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>Email Address</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>{user.email}</div>
              </div>
              <div style={{
                fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '2px 8px',
                background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0',
              }}>
                Verified
              </div>
            </div>
          )}
        </motion.div>

      </div>

      <EditModal
        isOpen={editOpen}
        initial={initialForm}
        onClose={() => setEditOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  )
}
