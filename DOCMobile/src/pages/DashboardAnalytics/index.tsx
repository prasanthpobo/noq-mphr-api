import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { patientService } from '@/services/patientService'
import { appointmentService } from '@/services/appointmentService'
import { unwrapList, clinicId } from '@/services/api'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'
const AVATAR_COLORS = ['#F59E0B', '#EC4899', '#14B8A6', '#A855F7', '#0EA5E9', '#22C55E']

interface ServerPatient {
  _id: string
  name: string
  gender: 'M' | 'F' | 'Other'
  tag?: 'active' | 'new' | 'follow-up' | 'critical'
  createdAt: string
}

interface ServerAppointment {
  _id: string
  patientId?: { _id: string; name: string; phone?: string; gender?: 'M' | 'F' | 'Other'; dob?: string }
  date: string
  time?: string
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'
  notes?: string
  symptoms?: string[]
}

function getTodayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function initialsOf(name: string) {
  return name.split(' ').map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

function ageGenderShort(p?: ServerAppointment['patientId']) {
  if (!p) return ''
  let age: number | null = null
  if (p.dob) {
    const diff = Date.now() - new Date(p.dob).getTime()
    age = Math.floor(diff / (365.25 * 24 * 3600 * 1000))
  }
  const g = p.gender === 'M' ? 'M' : p.gender === 'F' ? 'F' : ''
  return age != null ? `${age}${g}` : g
}

export function DashboardAnalytics() {
  const user = useAuthStore((s) => s.user)
  const clinic = useAuthStore((s) => s.selectedClinic)
  const doctorId = useAuthStore((s) => s.doctorId)
  const navigate = useNavigate()
  const cid = clinicId(clinic)

  const [patients, setPatients] = useState<ServerPatient[]>([])
  const [todayAppts, setTodayAppts] = useState<ServerAppointment[]>([])

  // Clinic-wide patient list (used for stats + gender split)
  useEffect(() => {
    if (!cid) return
    patientService.list(cid)
      .then((res) => setPatients(unwrapList<ServerPatient>(res.data)))
      .catch(() => setPatients([]))
  }, [cid])

  // Today's appointments for this doctor (used for active consult + "patients today")
  useEffect(() => {
    if (!cid) return
    const today = new Date().toISOString().slice(0, 10)
    appointmentService.list({ clinicId: cid, doctorId: doctorId ?? undefined, date: today })
      .then((res) => setTodayAppts(unwrapList<ServerAppointment>(res.data)))
      .catch(() => setTodayAppts([]))
  }, [cid, doctorId])

  const stats = useMemo(() => {
    const women = patients.filter((p) => p.gender === 'F').length
    const men   = patients.filter((p) => p.gender === 'M').length
    const total = patients.length
    const weekAgo = Date.now() - 7 * 86400000
    const newWk      = patients.filter((p) => new Date(p.createdAt).getTime() >= weekAgo || p.tag === 'new').length
    const followUpWk = patients.filter((p) => p.tag === 'follow-up').length
    return {
      total, men, women,
      womenPct: total ? Math.round(women / total * 100) : 0,
      menPct:   total ? Math.round(men   / total * 100) : 0,
      newWk, followUpWk,
    }
  }, [patients])

  const activeConsult = todayAppts.find((a) => a.status === 'in-progress') ?? null
  const upcoming = todayAppts.filter((a) => a.status === 'scheduled').slice(0, 4)
  const seenCount = todayAppts.filter((a) => a.status === 'completed' || a.status === 'in-progress').length

  const cleanName  = (user?.name ?? '').replace(/^Dr\.\s*/i, '') || 'Doctor'
  const firstName  = cleanName.split(' ')[0]
  const initials   = initialsOf(cleanName)
  const todayLabel = getTodayLabel()

  // Donut math
  const C = 2 * Math.PI * 48  // circumference for r=48
  const womenArc = (stats.womenPct / 100) * C
  const menArc   = (stats.menPct / 100) * C

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100%', background: '#F5F8FC' }}>
      {/* Header */}
      <div style={{ background: BRAND_GRADIENT, padding: '52px 20px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', margin: 0, lineHeight: 1.2 }}>
              Hi, Dr. {firstName} 👋
            </h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: '4px 0 0', fontWeight: 500 }}>
              Today overview · {todayLabel}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              <div style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: '50%', background: '#EF4444', border: '1.5px solid white' }} />
            </button>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#1E4FA3' }}>{initials}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Patient split donut */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        style={{
          position: 'relative', zIndex: 2,
          margin: '-16px 16px 16px',
          background: '#FFFFFF', borderRadius: 18, padding: 16,
          boxShadow: '0 6px 24px rgba(30,79,163,0.12)',
          display: 'flex', alignItems: 'center', gap: 16,
        }}
      >
        <div style={{ flexShrink: 0, position: 'relative', width: 130, height: 130 }}>
          <svg width="130" height="130" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="48" fill="none" stroke="#EBF2FF" strokeWidth="14" />
            {stats.womenPct > 0 && (
              <circle cx="60" cy="60" r="48" fill="none" stroke="#EC4899" strokeWidth="14"
                strokeDasharray={`${womenArc} ${C - womenArc}`} strokeLinecap="round" transform="rotate(-90 60 60)" />
            )}
            {stats.menPct > 0 && (
              <circle cx="60" cy="60" r="48" fill="none" stroke="#1E4FA3" strokeWidth="14"
                strokeDasharray={`${menArc} ${C - menArc}`} strokeDashoffset={`${-womenArc}`} strokeLinecap="round" transform="rotate(-90 60 60)" />
            )}
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#1E293B', lineHeight: 1 }}>{stats.total}</span>
            <span style={{ fontSize: 7, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.6px', textTransform: 'uppercase', marginTop: 2 }}>Total Patients</span>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '1px', textTransform: 'uppercase' }}>Patient Split</span>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#1E293B', margin: '3px 0 14px' }}>This clinic</p>

          <SplitRow color="#EC4899" label="Women" count={stats.women} pct={stats.womenPct} />
          <div style={{ height: 12 }} />
          <SplitRow color="#1E4FA3" label="Men"   count={stats.men}   pct={stats.menPct}   />
        </div>
      </motion.div>

      {/* New / Follow-up cards */}
      <div style={{ display: 'flex', gap: 12, margin: '0 16px 16px' }}>
        <SmallStat eyebrow="New" value={stats.newWk} caption="Patients this week" color="#22C55E" trend="up" />
        <SmallStat eyebrow="Returning" value={stats.followUpWk} caption="Follow-ups in roster" color="#EF4444" trend="down" />
      </div>

      {/* Active consultation banner */}
      {activeConsult ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
          style={{
            margin: '0 16px 16px', background: BRAND_GRADIENT, borderRadius: 16, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 20px rgba(30,79,163,0.3)',
          }}
        >
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="2,12 6,12 8,6 10,18 12,10 14,14 16,12 22,12" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>IN PROGRESS</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>· {activeConsult.time || '—'}</span>
            </div>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', margin: '0 0 2px' }}>
              {activeConsult.patientId?.name ?? 'Patient'} · {ageGenderShort(activeConsult.patientId)}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', margin: 0 }}>
              {activeConsult.notes || activeConsult.symptoms?.[0] || 'Consultation'}
            </p>
          </div>
          <button
            onClick={() => navigate('/consultation', { state: { appointment: activeConsult } })}
            style={{ background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 12, padding: '8px 14px', color: '#FFFFFF', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}
          >
            ▶ Continue
          </button>
        </motion.div>
      ) : null}

      {/* Your patients today */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
        style={{ margin: '0 16px 16px', background: '#FFFFFF', borderRadius: 16, padding: 16, boxShadow: '0 4px 12px rgba(30,79,163,0.08)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: 0 }}>Your patients today</p>
            <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0', fontWeight: 500 }}>
              {todayAppts.length} scheduled · {seenCount} already seen
            </p>
          </div>
          <button onClick={() => navigate('/patients')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#1E4FA3', padding: 0 }}>
            All patients →
          </button>
        </div>

        <div style={{ marginTop: 8 }}>
          {upcoming.length === 0 ? (
            <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '16px 0' }}>
              {todayAppts.length === 0 ? 'No appointments today.' : 'All scheduled patients seen 🎉'}
            </p>
          ) : upcoming.map((appt, i) => {
            const name = appt.patientId?.name ?? 'Patient'
            return (
              <div key={appt._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < upcoming.length - 1 ? '1px solid #F5F8FC' : 'none' }}>
                <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500, minWidth: 46, textAlign: 'right', flexShrink: 0 }}>{appt.time || '—'}</span>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: AVATAR_COLORS[i % AVATAR_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>{initialsOf(name)}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: '1px 0 0' }}>
                    {appt.notes || appt.symptoms?.[0] || 'Consult'}
                  </p>
                </div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', color: '#CBD5E1', fontSize: 18, lineHeight: 1, flexShrink: 0 }} aria-label="More">⋮</button>
              </div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}

function SplitRow({ color, label, count, pct }: { color: string; label: string; count: number; pct: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ fontSize: 13, color: '#475569', fontWeight: 600, margin: 0 }}>{label}</p>
          <p style={{ fontSize: 10, color: '#94A3B8', margin: '1px 0 0' }}>{count} patients</p>
        </div>
      </div>
      <span style={{ fontSize: 14, fontWeight: 800, color: '#1E293B' }}>{pct}%</span>
    </div>
  )
}

function SmallStat({ eyebrow, value, caption, color, trend }: { eyebrow: string; value: number; caption: string; color: string; trend: 'up' | 'down' }) {
  const points = trend === 'up'
    ? '0,28 20,20 40,22 60,12 80,15 100,8'
    : '0,8 20,12 40,10 60,18 80,16 100,24'
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
      style={{ flex: 1, background: '#FFFFFF', borderRadius: 14, padding: 14, boxShadow: '0 4px 12px rgba(30,79,163,0.08)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.8px', textTransform: 'uppercase' }}>{eyebrow}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color, background: trend === 'up' ? '#F0FDF4' : '#FFF1F2', borderRadius: 6, padding: '2px 6px' }}>
          {trend === 'up' ? '↑' : '↓'} {value}
        </span>
      </div>
      <p style={{ fontSize: 28, fontWeight: 800, color: '#1E293B', margin: '0 0 2px', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 10px', fontWeight: 500 }}>{caption}</p>
      <svg height="32" width="100%" style={{ display: 'block' }}>
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </motion.div>
  )
}
