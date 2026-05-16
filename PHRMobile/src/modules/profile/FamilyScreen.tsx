import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import dayjs from 'dayjs'
import { HiX, HiPlus, HiCalendar, HiPhone, HiTrash } from 'react-icons/hi'
import MobileHeader from '../../components/MobileHeader'
import { getFamilyMembers, addFamilyMember, deleteFamilyMember, type FamilyMember } from '../../services/familyService'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

const RELATION_OPTIONS = ['Spouse', 'Parent', 'Child', 'Sibling', 'Other']
const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const AVATAR_COLORS = ['#2C6ED5', '#1FA3A8', '#7C3AED', '#E05B5B', '#D97706', '#059669']

const RELATION_CHIP_COLORS: Record<string, { bg: string; text: string }> = {
  Spouse:  { bg: '#FFF0F6', text: '#C2185B' },
  Parent:  { bg: '#F3EEFF', text: '#7C3AED' },
  Child:   { bg: '#EBF2FF', text: '#2C6ED5' },
  Sibling: { bg: '#E6F6F6', text: '#1FA3A8' },
  Other:   { bg: '#F5F8FC', text: '#6B7C93' },
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function getAvatarColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// ── Add Member Modal ──────────────────────────────────────────────────────────

interface AddMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onAdded: (m: FamilyMember) => void
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
        dob: form.dob || undefined, bloodGroup: form.bloodGroup || undefined,
        phone: form.phone || undefined,
      })
      onAdded(res.data)
      onClose()
      setForm({ name: '', relation: '', dob: '', bloodGroup: '', phone: '' })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally { setSaving(false) }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 48, borderRadius: 12,
    border: '1.5px solid #E3EAF2', padding: '0 14px',
    fontSize: 14, color: '#1A1A1A', background: '#F5F8FC',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#6B7C93', marginBottom: 6, display: 'block' }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
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
              <div><label style={labelStyle}>Full Name *</label><input style={inputStyle} placeholder="Enter name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div>
                <label style={labelStyle}>Relation *</label>
                <select style={{ ...inputStyle, appearance: 'none' }} value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })}>
                  <option value="">Select relation</option>
                  {RELATION_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Date of Birth</label><input style={inputStyle} type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} /></div>
              <div>
                <label style={labelStyle}>Blood Group</label>
                <select style={{ ...inputStyle, appearance: 'none' }} value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
                  <option value="">Select blood group</option>
                  {BLOOD_GROUP_OPTIONS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Phone Number</label><input style={inputStyle} type="tel" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
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

// ── Member Card ────────────────────────────────────────────────────────────────

function MemberCard({ member, index, onBook, onDelete }: { member: FamilyMember; index: number; onBook: () => void; onDelete: () => void }) {
  const chipColors = RELATION_CHIP_COLORS[member.relation] ?? RELATION_CHIP_COLORS['Other']
  const color = getAvatarColor(member._id)
  const age = member.dob ? dayjs().diff(dayjs(member.dob), 'year') : null

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08, duration: 0.4 }}
      style={{ background: '#FFFFFF', borderRadius: 20, padding: 16, boxShadow: '0 4px 12px rgba(30,79,163,0.08)', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>{getInitials(member.name)}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>{member.name}</span>
            <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '2px 9px', background: chipColors.bg, color: chipColors.text }}>{member.relation}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {age !== null && <span style={{ fontSize: 13, color: '#6B7C93' }}>{age} yrs</span>}
            {member.bloodGroup && (
              <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '2px 9px', background: '#FFF5F5', color: '#E53E3E', border: '1px solid #FEB2B2' }}>
                {member.bloodGroup}
              </span>
            )}
          </div>
          {member.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 12, color: '#6B7C93' }}>
              <HiPhone size={12} /> {member.phone}
            </div>
          )}
        </div>
        <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#A0AEC0', flexShrink: 0 }}>
          <HiTrash size={16} />
        </button>
      </div>
      <div style={{ height: 1, background: '#EEF2F7', margin: '12px 0' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <HiCalendar size={14} color="#A0AEC0" />
          <span style={{ fontSize: 12, color: '#6B7C93' }}>
            {member.dob ? dayjs(member.dob).format('DD MMM YYYY') : 'DOB not set'}
          </span>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={onBook}
          style={{ background: BRAND_GRADIENT, border: 'none', borderRadius: 24, padding: '7px 18px', color: '#FFFFFF', fontSize: 12, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(44,110,213,0.3)' }}>
          Book
        </motion.button>
      </div>
    </motion.div>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function FamilyScreen() {
  const navigate = useNavigate()
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    getFamilyMembers()
      .then((r) => { setMembers(r.data); setError(null) })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    try {
      await deleteFamilyMember(id)
      setMembers((prev) => prev.filter((m) => m._id !== id))
    } catch {
      // silently fail — UX feedback can be added later
    }
  }

  const handleBook = (member: FamilyMember) => {
    navigate('/app/booking', { state: { familyMemberId: member._id, familyMemberName: member.name } })
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F5F8FC', fontFamily: 'Roboto, system-ui, sans-serif', overflowX: 'hidden' }}>
      <MobileHeader
        title="Family Members"
        showBack
        rightAction={
          <button onClick={() => setModalOpen(true)} style={{ background: 'none', border: 'none', color: '#2C6ED5', fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: 4 }}>
            Add
          </button>
        }
      />

      <div style={{ padding: '16px 16px 0' }}>
        {loading && [0, 1].map((i) => <div key={i} style={{ background: '#FFFFFF', borderRadius: 20, height: 120, marginBottom: 12 }} />)}
        {error && <div style={{ textAlign: 'center', color: '#EF4444', fontSize: 14, padding: '48px 0' }}>{error}</div>}
        {!loading && !error && members.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👨‍👩‍👧</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>No family members yet</div>
            <div style={{ fontSize: 14, color: '#6B7C93' }}>Add family members to book appointments on their behalf</div>
          </div>
        )}
        {members.map((member, index) => (
          <MemberCard key={member._id} member={member} index={index}
            onDelete={() => handleDelete(member._id)}
            onBook={() => handleBook(member)} />
        ))}
      </div>

      <div style={{ padding: '8px 16px', paddingBottom: 96 }}>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setModalOpen(true)}
          style={{ width: '100%', height: 52, borderRadius: 14, border: 'none', background: BRAND_GRADIENT, color: '#FFFFFF', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(44,110,213,0.3)' }}>
          <HiPlus size={20} color="#FFFFFF" />
          Add Family Member
        </motion.button>
      </div>

      <AddMemberModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onAdded={(m) => setMembers((prev) => [...prev, m])} />
    </div>
  )
}
