import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import dayjs from 'dayjs'
import { HiArrowLeft, HiPlus, HiX, HiSearch, HiChevronRight, HiCalendar, HiTrash, HiExclamationCircle } from 'react-icons/hi'
import { MdEdit, MdFamilyRestroom } from 'react-icons/md'
import { getFamilyMembers, addFamilyMember, deleteFamilyMember, updateFamilyMember, type FamilyMember } from '../../services/familyService'
import ModalSheet from '../../components/ModalSheet'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

const RELATION_OPTIONS  = ['Spouse', 'Parent', 'Father', 'Mother', 'Child', 'Son', 'Daughter', 'Sibling', 'Other']
const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const AVATAR_COLORS = ['#2C6ED5', '#1FA3A8', '#7C3AED', '#E05B5B', '#D97706', '#059669', '#DB2777']

const RELATION_STYLES: Record<string, { bg: string; text: string }> = {
  Spouse:   { bg: '#FFF0F6', text: '#C2185B' },
  Parent:   { bg: '#F3EEFF', text: '#7C3AED' },
  Father:   { bg: '#F3EEFF', text: '#7C3AED' },
  Mother:   { bg: '#FFF0F6', text: '#C2185B' },
  Child:    { bg: '#EBF2FF', text: '#2C6ED5' },
  Son:      { bg: '#EBF2FF', text: '#2C6ED5' },
  Daughter: { bg: '#FFF0F0', text: '#E05B5B' },
  Sibling:  { bg: '#E6F6F6', text: '#1FA3A8' },
  Other:    { bg: '#F5F8FC', text: '#6B7C93' },
}

const STRIP_COLORS = ['#2C6ED5', '#1FA3A8', '#D97706', '#7C3AED', '#E05B5B', '#059669', '#DB2777']

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}
function getAvatarColor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

// ── Delete Confirmation Modal ─────────────────────────────────────────────────

function DeleteConfirmModal({
  member,
  onConfirm,
  onCancel,
}: {
  member: FamilyMember | null
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!member) return null
  const avatarColor = getAvatarColor(member._id)

  return (
    <ModalSheet isOpen={!!member} onClose={onCancel}>
      <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E3EAF2', margin: '0 auto 24px' }} />

      {/* Icon */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <div style={{
          width: 68, height: 68, borderRadius: '50%',
          background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <HiExclamationCircle size={34} color="#E05B5B" />
        </div>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A', margin: '0 0 8px' }}>
          Remove Family Member?
        </h2>
        <p style={{ fontSize: 14, color: '#6B7C93', margin: 0, lineHeight: 1.6 }}>
          Are you sure you want to remove
        </p>
      </div>

      {/* Member preview */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: '#FFF5F5', borderRadius: 14, padding: '12px 14px',
        border: '1.5px solid #FECACA', marginBottom: 24,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${avatarColor}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: avatarColor }}>{getInitials(member.name)}</span>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>{member.name}</div>
          <div style={{ fontSize: 12, color: '#6B7C93', marginTop: 2 }}>{member.relation}</div>
        </div>
      </div>

      <p style={{ fontSize: 12, color: '#A0AEC0', textAlign: 'center', margin: '0 0 20px', lineHeight: 1.55 }}>
        This will permanently delete their profile and health records. This action cannot be undone.
      </p>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onCancel} style={{
          flex: 1, height: 50, borderRadius: 14,
          border: '1.5px solid #E3EAF2', background: '#F5F8FC',
          fontSize: 15, fontWeight: 700, color: '#4A5568', cursor: 'pointer',
        }}>
          No, Keep
        </button>
        <button onClick={onConfirm} style={{
          flex: 1, height: 50, borderRadius: 14,
          border: 'none', background: 'linear-gradient(135deg, #E05B5B, #B91C1C)',
          fontSize: 15, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(224,91,91,0.40)',
        }}>
          Yes, Remove
        </button>
      </div>
    </ModalSheet>
  )
}

// ── Add / Edit Member Modal ───────────────────────────────────────────────────

interface MemberModalProps {
  isOpen: boolean
  initial?: FamilyMember | null
  onClose: () => void
  onSaved: (m: FamilyMember, isEdit: boolean) => void
}

function MemberModal({ isOpen, initial, onClose, onSaved }: MemberModalProps) {
  const [form, setForm]     = useState({ name: '', relation: '', dob: '', bloodGroup: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name,
        relation: initial.relation,
        dob: initial.dob ? dayjs(initial.dob).format('YYYY-MM-DD') : '',
        bloodGroup: initial.bloodGroup ?? '',
        phone: initial.phone ?? '',
      })
    } else {
      setForm({ name: '', relation: '', dob: '', bloodGroup: '', phone: '' })
    }
    setError(null)
  }, [initial, isOpen])

  const handleSave = async () => {
    if (!form.name.trim() || !form.relation) { setError('Name and relation are required'); return }
    setSaving(true); setError(null)
    try {
      const payload = {
        name: form.name.trim(), relation: form.relation,
        dob: form.dob || undefined, bloodGroup: form.bloodGroup || undefined, phone: form.phone || undefined,
      }
      let res: { data: FamilyMember }
      if (initial) {
        res = await updateFamilyMember(initial._id, payload)
        onSaved(res.data, true)
      } else {
        res = await addFamilyMember(payload)
        onSaved(res.data, false)
      }
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally { setSaving(false) }
  }

  const inp: React.CSSProperties = {
    width: '100%', height: 48, borderRadius: 12, border: '1.5px solid #E3EAF2',
    padding: '0 14px', fontSize: 14, color: '#1A1A1A', background: '#F5F8FC',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  return (
    <ModalSheet isOpen={isOpen} onClose={onClose}>
      <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E3EAF2', margin: '0 auto 20px' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
          {initial ? 'Edit Member' : 'Add Family Member'}
        </h2>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F5F8FC', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HiX size={18} color="#6B7C93" />
        </button>
      </div>
      {error && <div style={{ background: '#FEE2E2', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#B91C1C' }}>{error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { key: 'name',  label: 'Full Name *',   type: 'text', placeholder: 'Enter full name' },
          { key: 'dob',   label: 'Date of Birth', type: 'date', placeholder: '' },
          { key: 'phone', label: 'Phone Number',  type: 'tel',  placeholder: '+60 XXXXX XXXXX' },
        ].map((f) => (
          <div key={f.key}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7C93', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</label>
            <input style={inp} type={f.type} placeholder={f.placeholder}
              value={(form as Record<string, string>)[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
          </div>
        ))}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7C93', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Relation *</label>
          <select style={{ ...inp, appearance: 'none' }} value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })}>
            <option value="">Select relation</option>
            {RELATION_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7C93', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Blood Group</label>
          <select style={{ ...inp, appearance: 'none' }} value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
            <option value="">Select blood group</option>
            {BLOOD_GROUP_OPTIONS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
          </select>
        </div>
        <button onClick={handleSave} disabled={saving} style={{
          width: '100%', height: 52, borderRadius: 14, border: 'none',
          background: saving ? 'rgba(44,110,213,0.6)' : BRAND_GRADIENT,
          color: '#FFFFFF', fontSize: 15, fontWeight: 700,
          cursor: saving ? 'not-allowed' : 'pointer', marginTop: 4,
          boxShadow: '0 4px 16px rgba(44,110,213,0.35)',
        }}>
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Member'}
        </button>
      </div>
    </ModalSheet>
  )
}

// ── Member card ───────────────────────────────────────────────────────────────

function MemberCard({
  member, idx, onBook, onDelete, onEdit,
}: {
  member: FamilyMember; idx: number
  onBook: () => void; onDelete: () => void; onEdit: () => void
}) {
  const navigate   = useNavigate()
  const avatarColor = getAvatarColor(member._id)
  const stripColor  = STRIP_COLORS[idx % STRIP_COLORS.length]
  const age  = member.dob ? dayjs().diff(dayjs(member.dob), 'year') : null
  const gender = member.gender === 'M' ? 'Male' : member.gender === 'F' ? 'Female' : member.gender === 'Other' ? 'Other' : null
  const rel  = RELATION_STYLES[member.relation] ?? RELATION_STYLES['Other']

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 18, marginBottom: 12,
      boxShadow: '0 2px 14px rgba(30,79,163,0.08)',
      overflow: 'hidden', position: 'relative',
    }}>
      {/* Full-height left colour strip (no borderLeft float bug) */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: stripColor }} />

      <div style={{ padding: '14px 14px 10px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>

        {/* Avatar + blood group badge */}
        <div style={{ flexShrink: 0, position: 'relative' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: `${avatarColor}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: avatarColor }}>{getInitials(member.name)}</span>
          </div>
          {member.bloodGroup && (
            <div style={{
              position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
              background: avatarColor, color: '#FFFFFF',
              fontSize: 9, fontWeight: 700, borderRadius: 6, padding: '2px 5px',
              whiteSpace: 'nowrap', border: '1.5px solid #FFFFFF',
            }}>
              {member.bloodGroup}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>{member.name}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '2px 7px',
              background: rel.bg, color: rel.text,
              textTransform: 'uppercase', letterSpacing: '0.3px',
            }}>
              {member.relation}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#6B7C93', marginBottom: 6 }}>
            {[age !== null ? `${age} yrs` : null, gender, member.phone].filter(Boolean).join(' · ')}
          </div>
          <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 600 }}>● Healthy</span>
        </div>

        <button onClick={() => navigate(`/app/family/${member._id}`, { state: { member } })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <HiChevronRight size={18} color="#C8D4E3" />
        </button>
      </div>

      {/* Action row */}
      <div style={{ display: 'flex', borderTop: '1px solid #F0F4F8' }}>
        {[
          { label: 'Book',    icon: <HiCalendar size={14} />, action: onBook,  color: '#2C6ED5', bg: '#EBF2FF' },
          { label: 'Edit',    icon: <MdEdit size={14} />,     action: onEdit,  color: '#6B7C93', bg: '#F5F8FC' },
        ].map((btn, i) => (
          <button key={btn.label} onClick={btn.action} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            padding: '11px 0', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, color: btn.color,
            borderRight: i === 0 ? '1px solid #F0F4F8' : 'none',
          }}>
            {btn.icon} {btn.label}
          </button>
        ))}
        <button onClick={onDelete} style={{
          width: 46, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'none', border: 'none', borderLeft: '1px solid #F0F4F8', cursor: 'pointer',
        }}>
          <HiTrash size={15} color="#FCA5A5" />
        </button>
      </div>
    </div>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function FamilyScreen() {
  const navigate = useNavigate()
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [modalOpen, setModalOpen]       = useState(false)
  const [editTarget, setEditTarget]     = useState<FamilyMember | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FamilyMember | null>(null)

  useEffect(() => {
    getFamilyMembers()
      .then((r) => setMembers(r.data))
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [])

  const filtered   = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.relation.toLowerCase().includes(search.toLowerCase())
  )
  const bloodTypes = new Set(members.map((m) => m.bloodGroup).filter(Boolean)).size

  const handleSaved = (m: FamilyMember, isEdit: boolean) => {
    setMembers((prev) => isEdit ? prev.map((x) => x._id === m._id ? m : x) : [...prev, m])
  }
  const handleDelete = async () => {
    if (!deleteTarget) return
    const id = deleteTarget._id
    setDeleteTarget(null)
    try { await deleteFamilyMember(id); setMembers((prev) => prev.filter((m) => m._id !== id)) }
    catch { /* ignore */ }
  }
  const handleBook = (member: FamilyMember) => {
    navigate('/app/booking', { state: { preSelectedPatient: member } })
  }
  const openAdd  = () => { setEditTarget(null);  setModalOpen(true) }
  const openEdit = (m: FamilyMember) => { setEditTarget(m); setModalOpen(true) }

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
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <HiArrowLeft size={18} color="#1A1A1A" />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>Family Members</span>
        <button onClick={openAdd} style={{
          height: 36, borderRadius: 20, background: BRAND_GRADIENT, border: 'none', cursor: 'pointer',
          padding: '0 14px', fontSize: 13, fontWeight: 700, color: '#FFFFFF',
          display: 'flex', alignItems: 'center', gap: 4,
          boxShadow: '0 4px 12px rgba(44,110,213,0.35)',
        }}>
          <HiPlus size={14} /> Add
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 96px' }}>

        {/* ── Single merged hero card ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(30,79,163,0.14)', marginBottom: 20 }}
        >
          {/* Gradient hero */}
          <div style={{ background: BRAND_GRADIENT, padding: '20px 20px 22px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
            <div style={{ position: 'absolute', bottom: -20, left: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: 'rgba(255,255,255,0.20)', border: '2px solid rgba(255,255,255,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <MdFamilyRestroom size={28} color="#FFFFFF" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', marginBottom: 3 }}>Family Members</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', marginBottom: 10 }}>Manage health profiles for everyone</div>
                {/* Overlapping avatars */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex' }}>
                    {members.slice(0, 4).map((m, i) => (
                      <div key={m._id} style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: getAvatarColor(m._id),
                        border: '2px solid rgba(255,255,255,0.6)',
                        marginLeft: i > 0 ? -8 : 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, color: '#FFFFFF',
                        position: 'relative', zIndex: 4 - i,
                      }}>
                        {getInitials(m.name)}
                      </div>
                    ))}
                    {members.length === 0 && (
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.20)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <HiPlus size={12} color="#FFFFFF" />
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.90)' }}>
                    {members.length} {members.length === 1 ? 'member' : 'members'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* White stats + search */}
          <div style={{ background: '#FFFFFF', padding: 16 }}>
            {/* Stats row */}
            <div style={{ display: 'flex', marginBottom: 14 }}>
              {[
                { value: members.length, label: 'MEMBERS',    cfg: { dot: '#2C6ED5', bg: '#EBF2FF', text: '#1E40AF', border: '#BFDBFE' } },
                { value: 0,              label: 'CONDITIONS',  cfg: { dot: '#E05B5B', bg: '#FFF0F0', text: '#991B1B', border: '#FECACA' } },
                { value: bloodTypes,     label: 'BLOOD TYPES', cfg: { dot: '#D97706', bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' } },
              ].map((s, i) => (
                <div key={s.label} style={{
                  flex: 1, textAlign: 'center', padding: '12px 4px',
                  background: s.cfg.bg, borderRadius: 14,
                  border: `1.5px solid ${s.cfg.border}`,
                  margin: i === 1 ? '0 8px' : 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 2 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.cfg.dot }} />
                    <span style={{ fontSize: 24, fontWeight: 800, color: s.cfg.text }}>{s.value}</span>
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: s.cfg.text, letterSpacing: '0.5px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F5F8FC', borderRadius: 12, padding: '10px 14px', border: '1.5px solid #EEF2F7' }}>
              <HiSearch size={16} color="#A0AEC0" />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or relation…"
                style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, color: '#1A1A1A', outline: 'none' }}
              />
            </div>
          </div>
        </motion.div>

        {/* ── List header ───────────────────────────────────────────────────── */}
        {members.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              All Members
            </span>
            <button
              onClick={() => setMembers((prev) => [...prev].sort((a, b) => a.name.localeCompare(b.name)))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#2C6ED5', fontWeight: 600 }}
            >
              Sort A–Z
            </button>
          </div>
        )}

        {/* ── Skeleton ──────────────────────────────────────────────────────── */}
        {loading && [0, 1].map((i) => (
          <div key={i} style={{ background: '#FFFFFF', borderRadius: 18, height: 120, marginBottom: 12, overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: '#E8EEF7' }} />
          </div>
        ))}

        {/* ── Member cards ──────────────────────────────────────────────────── */}
        {!loading && filtered.map((member, idx) => (
          <motion.div key={member._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}>
            <MemberCard
              member={member}
              idx={idx}
              onBook={() => handleBook(member)}
              onDelete={() => setDeleteTarget(member)}
              onEdit={() => openEdit(member)}
            />
          </motion.div>
        ))}

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {!loading && members.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>👨‍👩‍👧</div>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A', margin: '0 0 8px' }}>No family members yet</p>
            <p style={{ fontSize: 13, color: '#6B7C93', marginBottom: 24 }}>
              Add family members to book appointments and manage their health profiles.
            </p>
            <button onClick={openAdd} style={{
              padding: '12px 28px', borderRadius: 14, border: 'none',
              background: BRAND_GRADIENT, color: '#FFFFFF', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(44,110,213,0.35)',
            }}>
              <HiPlus size={14} style={{ marginRight: 6 }} /> Add First Member
            </button>
          </div>
        )}

        {/* ── Add more button ───────────────────────────────────────────────── */}
        {!loading && members.length > 0 && (
          <button onClick={openAdd} style={{
            width: '100%', padding: '14px', borderRadius: 16,
            border: '2px dashed #BFDBFE', background: '#F5F9FF',
            color: '#2C6ED5', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <HiPlus size={16} /> Add another member
          </button>
        )}
      </div>

      <MemberModal
        isOpen={modalOpen}
        initial={editTarget}
        onClose={() => { setModalOpen(false); setEditTarget(null) }}
        onSaved={handleSaved}
      />

      <DeleteConfirmModal
        member={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
