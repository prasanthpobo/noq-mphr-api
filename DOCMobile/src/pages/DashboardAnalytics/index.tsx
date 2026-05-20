import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

const PATIENTS = [
  { time: '10:30am', initials: 'SH', color: '#F59E0B', name: 'Sarah Hostem',  dx: 'Bronchitis' },
  { time: '11:00am', initials: 'DS', color: '#EC4899', name: 'Dakota Smith',  dx: 'Stroke follow-up' },
  { time: '11:30am', initials: 'JL', color: '#14B8A6', name: 'John Lane',     dx: 'Hypertension' },
]

function getTodayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function DashboardAnalytics() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const firstName  = user?.name?.split(' ')[0] ?? 'Doctor'
  const initials   = (user?.name ?? 'D')
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const todayLabel = getTodayLabel()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ minHeight: '100%', background: '#F5F8FC' }}
    >
      {/* ── Section 1: Header ────────────────────────────────────────────── */}
      <div style={{ background: BRAND_GRADIENT, padding: '48px 20px 28px', position: 'relative', overflow: 'hidden' }}>
        {/* decorative circles */}
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
            {/* Bell button */}
            <button
              style={{
                width: 38, height: 38, borderRadius: 12,
                background: 'rgba(255,255,255,0.18)', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', position: 'relative',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              <div style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: '50%', background: '#EF4444', border: '1.5px solid white' }} />
            </button>

            {/* Avatar */}
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#1E4FA3' }}>{initials}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Patient Split card ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        style={{
          margin: '-16px 16px 16px',
          background: '#FFFFFF',
          borderRadius: 18,
          padding: '16px',
          boxShadow: '0 6px 24px rgba(30,79,163,0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {/* Donut SVG */}
        <div style={{ flexShrink: 0, position: 'relative', width: 108, height: 108 }}>
          <svg width="108" height="108" viewBox="0 0 120 120">
            {/* base track */}
            <circle cx="60" cy="60" r="50" fill="none" stroke="#EBF2FF" strokeWidth="16" />
            {/* Women arc — pink, 44% of 314 ≈ 138 */}
            <circle
              cx="60" cy="60" r="50"
              fill="none"
              stroke="#EC4899"
              strokeWidth="16"
              strokeDasharray="138 176"
              strokeDashoffset="-235"
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
            {/* Men arc — blue, 55% of 314 ≈ 173 */}
            <circle
              cx="60" cy="60" r="50"
              fill="none"
              stroke="#1E4FA3"
              strokeWidth="16"
              strokeDasharray="173 141"
              strokeDashoffset="-97"
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
          </svg>
          {/* Centre label */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#1E4FA3', lineHeight: 1 }}>990</span>
            <span style={{ fontSize: 8, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Total</span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '1px', textTransform: 'uppercase' }}>Patient Split</span>
          <p style={{ fontSize: 11, color: '#CBD5E1', margin: '2px 0 12px', fontWeight: 500 }}>This month</p>

          {/* Women */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EC4899', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>Women</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#EC4899' }}>44%</span>
          </div>

          {/* Men */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1E4FA3', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>Men</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1E4FA3' }}>55%</span>
          </div>
        </div>
      </motion.div>

      {/* ── Section 3: Two stat cards ─────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, margin: '0 16px 16px' }}>
        {/* New patients */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          style={{ flex: 1, background: '#FFFFFF', borderRadius: 14, padding: 14, boxShadow: '0 4px 12px rgba(30,79,163,0.08)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.8px', textTransform: 'uppercase' }}>New</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#22C55E', background: '#F0FDF4', borderRadius: 6, padding: '2px 6px' }}>↑ 39%</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#1E293B', margin: '0 0 2px', lineHeight: 1 }}>67</p>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 10px', fontWeight: 500 }}>Patients this week</p>
          <svg height="32" width="100%" style={{ display: 'block' }}>
            <polyline points="0,28 20,20 40,22 60,12 80,15 100,8" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>

        {/* Returning */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.20 }}
          style={{ flex: 1, background: '#FFFFFF', borderRadius: 14, padding: 14, boxShadow: '0 4px 12px rgba(30,79,163,0.08)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Returning</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#EF4444', background: '#FFF1F2', borderRadius: 6, padding: '2px 6px' }}>↓ 4%</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#1E293B', margin: '0 0 2px', lineHeight: 1 }}>27</p>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 10px', fontWeight: 500 }}>Follow-ups this week</p>
          <svg height="32" width="100%" style={{ display: 'block' }}>
            <polyline points="0,8 20,12 40,10 60,18 80,16 100,24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </div>

      {/* ── Section 4: Active consultation banner ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26 }}
        style={{
          margin: '0 16px 16px',
          background: BRAND_GRADIENT,
          borderRadius: 16,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 8px 20px rgba(30,79,163,0.3)',
        }}
      >
        {/* Pulse icon box */}
        <div
          style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, position: 'relative',
          }}
        >
          <div style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2,12 6,12 8,6 10,18 12,10 14,14 16,12 22,12" />
          </svg>
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>IN PROGRESS</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>· 08:14</span>
          </div>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', margin: '0 0 2px' }}>Rohan Verma · 42M</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', margin: 0 }}>Token A-014 · Chest tightness</p>
        </div>

        {/* Continue button */}
        <button
          onClick={() => navigate('/consultation')}
          style={{
            background: 'rgba(255,255,255,0.22)',
            border: '1px solid rgba(255,255,255,0.35)',
            borderRadius: 12,
            padding: '8px 14px',
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            flexShrink: 0,
          }}
        >
          ▶ Continue
        </button>
      </motion.div>

      {/* ── Section 5: Your patients today ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
        style={{
          margin: '0 16px 16px',
          background: '#FFFFFF',
          borderRadius: 16,
          padding: 16,
          boxShadow: '0 4px 12px rgba(30,79,163,0.08)',
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: 0 }}>Your patients today</p>
            <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0', fontWeight: 500 }}>4 scheduled · 2 already seen</p>
          </div>
          <button
            onClick={() => navigate('/patients')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#1E4FA3', padding: 0 }}
          >
            All patients →
          </button>
        </div>

        {/* Patient list */}
        <div style={{ marginTop: 8 }}>
          {PATIENTS.map((p, i) => (
            <div
              key={p.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                borderBottom: i < PATIENTS.length - 1 ? '1px solid #F5F8FC' : 'none',
              }}
            >
              {/* Time */}
              <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500, minWidth: 46, textAlign: 'right', flexShrink: 0 }}>{p.time}</span>

              {/* Avatar */}
              <div
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: p.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>{p.initials}</span>
              </div>

              {/* Name + Dx */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: '1px 0 0' }}>Dx · {p.dx}</p>
              </div>

              {/* Menu */}
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', color: '#CBD5E1', fontSize: 18, lineHeight: 1, flexShrink: 0 }}
                aria-label="More options"
              >
                ⋮
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
