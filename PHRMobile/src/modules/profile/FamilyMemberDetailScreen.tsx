import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import dayjs from 'dayjs'
import {
  HiArrowLeft, HiCalendar, HiPhone, HiPencil,
  HiClock, HiUser,
} from 'react-icons/hi'
import { MdBloodtype, MdFamilyRestroom, MdMedicalServices } from 'react-icons/md'
import { getFamilyMemberById, type FamilyMember } from '../../services/familyService'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

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

const BLOOD_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'A+':  { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' },
  'A-':  { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' },
  'B+':  { bg: '#DBEAFE', text: '#1E3A8A', border: '#BFDBFE' },
  'B-':  { bg: '#DBEAFE', text: '#1E3A8A', border: '#BFDBFE' },
  'AB+': { bg: '#F3E8FF', text: '#6B21A8', border: '#DDD6FE' },
  'AB-': { bg: '#F3E8FF', text: '#6B21A8', border: '#DDD6FE' },
  'O+':  { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' },
  'O-':  { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' },
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}
function getAvatarColor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

export default function FamilyMemberDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const [member, setMember] = useState<FamilyMember | null>(
    (location.state as { member?: FamilyMember })?.member ?? null
  )
  const [loading, setLoading] = useState(!member)

  useEffect(() => {
    if (member || !id) return
    getFamilyMemberById(id)
      .then((r) => setMember(r.data))
      .catch(() => setMember(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: '#F5F8FC', fontFamily: 'Roboto, system-ui, sans-serif' }}>
        <div style={{ background: '#FFFFFF', height: 60, borderBottom: '1px solid #F0F4F8' }} />
        <div style={{ padding: 16 }}>
          {[180, 220, 140].map((h, i) => (
            <div key={i} style={{ background: '#FFFFFF', borderRadius: 20, height: h, marginBottom: 14 }} />
          ))}
        </div>
      </div>
    )
  }

  if (!member) {
    return (
      <div style={{ minHeight: '100dvh', background: '#F5F8FC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, fontFamily: 'Roboto, system-ui, sans-serif' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', margin: '0 0 8px' }}>Member not found</p>
        <button onClick={() => navigate(-1)} style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: '#2C6ED5', color: '#FFFFFF', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Go back</button>
      </div>
    )
  }

  const avatarColor = getAvatarColor(member._id)
  const rel         = RELATION_STYLES[member.relation] ?? RELATION_STYLES['Other']
  const bloodCfg    = member.bloodGroup ? (BLOOD_COLORS[member.bloodGroup] ?? BLOOD_COLORS['O+']) : null
  const age         = member.dob ? dayjs().diff(dayjs(member.dob), 'year') : null
  const dobFormatted = member.dob ? dayjs(member.dob).format('D MMMM YYYY') : null
  const gender      = member.gender === 'M' ? 'Male' : member.gender === 'F' ? 'Female' : member.gender === 'Other' ? 'Other' : null
  const addedOn     = dayjs(member.createdAt).format('D MMM YYYY')

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
        <span style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>Member Profile</span>
        <button
          onClick={() => navigate('/app/family', { state: { editId: member._id } })}
          style={{
            width: 36, height: 36, borderRadius: 10, background: '#EBF2FF',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <HiPencil size={16} color="#2C6ED5" />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 96px' }}>

        {/* ── Hero card ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(30,79,163,0.14)', marginBottom: 16 }}
        >
          {/* Gradient top */}
          <div style={{ background: BRAND_GRADIENT, padding: '28px 20px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
            <div style={{ position: 'absolute', bottom: -24, left: -24, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              {/* Large avatar */}
              <div style={{
                width: 84, height: 84, borderRadius: '50%',
                background: `${avatarColor}30`,
                border: '3px solid rgba(255,255,255,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 14, boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
              }}>
                <span style={{ fontSize: 30, fontWeight: 800, color: '#FFFFFF' }}>{getInitials(member.name)}</span>
              </div>

              {/* Name */}
              <div style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', marginBottom: 6, textAlign: 'center' }}>
                {member.name}
              </div>

              {/* Badges row */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <span style={{
                  fontSize: 12, fontWeight: 700, borderRadius: 20, padding: '4px 12px',
                  background: 'rgba(255,255,255,0.22)', color: '#FFFFFF',
                }}>
                  {member.relation}
                </span>
                {age !== null && (
                  <span style={{
                    fontSize: 12, fontWeight: 700, borderRadius: 20, padding: '4px 12px',
                    background: 'rgba(255,255,255,0.22)', color: '#FFFFFF',
                  }}>
                    {age} yrs old
                  </span>
                )}
                {gender && (
                  <span style={{
                    fontSize: 12, fontWeight: 700, borderRadius: 20, padding: '4px 12px',
                    background: 'rgba(255,255,255,0.22)', color: '#FFFFFF',
                  }}>
                    {gender}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* White info rows */}
          <div style={{ background: '#FFFFFF', padding: '4px 0' }}>
            {[
              dobFormatted && {
                icon: <HiCalendar size={17} color="#2C6ED5" />,
                iconBg: '#EBF2FF',
                label: 'Date of Birth',
                value: dobFormatted,
                sub: age !== null ? `${age} years old` : undefined,
              },
              gender && {
                icon: <HiUser size={17} color="#7C3AED" />,
                iconBg: '#F3EEFF',
                label: 'Gender',
                value: gender,
              },
              member.phone && {
                icon: <HiPhone size={17} color="#059669" />,
                iconBg: '#ECFDF5',
                label: 'Phone Number',
                value: member.phone,
              },
              {
                icon: <MdFamilyRestroom size={17} color="#C2185B" />,
                iconBg: '#FFF0F6',
                label: 'Relation',
                value: member.relation,
                badge: rel,
              },
              {
                icon: <HiClock size={17} color="#6B7C93" />,
                iconBg: '#F5F8FC',
                label: 'Profile Added',
                value: addedOn,
              },
            ].filter(Boolean).map((row, i, arr) => {
              const r = row as NonNullable<typeof row>
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px',
                  borderBottom: i < arr.length - 1 ? '1px solid #F0F4F8' : 'none',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 11,
                    background: r.iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {r.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>
                      {r.label}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>{r.value}</span>
                      {r.sub && <span style={{ fontSize: 12, color: '#A0AEC0' }}>· {r.sub}</span>}
                      {'badge' in r && r.badge && (
                        <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '2px 8px', background: r.badge.bg, color: r.badge.text }}>
                          {r.value}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* ── Health snapshot card ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }}
          style={{ background: '#FFFFFF', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(30,79,163,0.06)', marginBottom: 16 }}
        >
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #F0F4F8', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: '#FFF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MdMedicalServices size={17} color="#E05B5B" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>Health Snapshot</span>
          </div>

          <div style={{ padding: '12px 16px 16px' }}>
            {/* Vitals row */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              {/* Blood group */}
              <div style={{
                flex: 1, textAlign: 'center', padding: '14px 8px',
                background: bloodCfg ? bloodCfg.bg : '#F5F8FC',
                borderRadius: 14,
                border: `1.5px solid ${bloodCfg ? bloodCfg.border : '#E3EAF2'}`,
              }}>
                <MdBloodtype size={20} color={bloodCfg ? bloodCfg.text : '#A0AEC0'} style={{ marginBottom: 4 }} />
                <div style={{ fontSize: 20, fontWeight: 800, color: bloodCfg ? bloodCfg.text : '#A0AEC0', lineHeight: 1 }}>
                  {member.bloodGroup ?? '—'}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: bloodCfg ? bloodCfg.text : '#A0AEC0', marginTop: 4, letterSpacing: '0.4px' }}>BLOOD GROUP</div>
              </div>

              {/* Age */}
              <div style={{
                flex: 1, textAlign: 'center', padding: '14px 8px',
                background: '#EBF2FF', borderRadius: 14, border: '1.5px solid #BFDBFE',
              }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#1E40AF', lineHeight: 1, marginBottom: 4 }}>
                  {age ?? '—'}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#1E40AF', letterSpacing: '0.4px' }}>AGE (YRS)</div>
              </div>

              {/* Conditions placeholder */}
              <div style={{
                flex: 1, textAlign: 'center', padding: '14px 8px',
                background: '#F0FDF4', borderRadius: 14, border: '1.5px solid #BBF7D0',
              }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#15803D', lineHeight: 1, marginBottom: 4 }}>0</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#15803D', letterSpacing: '0.4px' }}>CONDITIONS</div>
              </div>
            </div>

            <div style={{
              background: '#FFFBEB', borderRadius: 12, padding: '10px 14px',
              border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 14 }}>💡</span>
              <p style={{ margin: 0, fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>
                Medical history, conditions and allergies will be synced automatically from their health records.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Quick Actions ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.3 }}
          style={{ background: '#FFFFFF', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(30,79,163,0.06)' }}
        >
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #F0F4F8' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>Quick Actions</span>
          </div>

          {[
            {
              icon: <HiCalendar size={18} color="#2C6ED5" />, iconBg: '#EBF2FF',
              title: 'Book Appointment',
              sub: `Schedule a visit for ${member.name.split(' ')[0]}`,
              onClick: () => navigate('/app/booking', { state: { preSelectedPatient: member } }),
            },
            {
              icon: <MdMedicalServices size={18} color="#059669" />, iconBg: '#ECFDF5',
              title: 'Medical History',
              sub: 'View past visits and records',
              onClick: () => {},
            },
            {
              icon: <HiPhone size={18} color="#7C3AED" />, iconBg: '#F3EEFF',
              title: 'Call Member',
              sub: member.phone ?? 'No phone number added',
              onClick: member.phone ? () => window.open(`tel:${member.phone}`) : undefined,
            },
          ].map((a, i) => (
            <div
              key={i}
              onClick={a.onClick}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                borderBottom: i < 2 ? '1px solid #F0F4F8' : 'none',
                cursor: a.onClick ? 'pointer' : 'default',
                opacity: a.onClick ? 1 : 0.5,
              }}
            >
              <div style={{ width: 42, height: 42, borderRadius: 13, background: a.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {a.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{a.title}</div>
                <div style={{ fontSize: 12, color: '#6B7C93', marginTop: 1 }}>{a.sub}</div>
              </div>
              <HiArrowLeft size={16} color="#C8D4E3" style={{ transform: 'rotate(180deg)', flexShrink: 0 }} />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
