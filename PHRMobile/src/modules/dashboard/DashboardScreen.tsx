import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import dayjs from 'dayjs'
import {
  HiSearch, HiBell, HiCalendar, HiDocumentText, HiChevronRight,
} from 'react-icons/hi'
import {
  MdEventNote, MdQueuePlayNext, MdLocalHospital, MdFavorite,
  MdShield,
} from 'react-icons/md'
import { useAuthStore } from '../../store/authStore'
import { useQueueStore } from '../../store/queueStore'
import { getMyAppointments } from '../../services/bookingService'
import { getMyActiveToken } from '../../services/queueService'
import type { Appointment } from '../../services/bookingService'
import type { QueueToken } from '../../services/queueService'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting(): { label: string; emoji: string } {
  const h = new Date().getHours()
  if (h < 12) return { label: 'Good morning', emoji: '☀️' }
  if (h < 17) return { label: 'Good afternoon', emoji: '🌤' }
  return { label: 'Good evening', emoji: '🌙' }
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function formatApptDate(dateStr: string): string {
  const today    = dayjs().format('YYYY-MM-DD')
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')
  const d = dayjs(dateStr).format('YYYY-MM-DD')
  if (d === today)    return 'Today'
  if (d === tomorrow) return 'Tomorrow'
  return dayjs(dateStr).format('D MMM')
}

// ── Quick actions ─────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { key: 'book',  name: 'Book Token',    icon: <MdEventNote size={22} />,       path: '/app/booking',      color: '#2C6ED5', bg: '#EBF2FF', border: '#BFDBFE' },
  { key: 'apts',  name: 'Appointments',  icon: <HiCalendar size={22} />,        path: '/app/appointments', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  { key: 'queue', name: "Today's Queue",  icon: <MdQueuePlayNext size={22} />,   path: '/app/today-queue',  color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  { key: 'phr',   name: 'My Records',    icon: <HiDocumentText size={22} />,    path: '/app/records',      color: '#7C3AED', bg: '#F3EEFF', border: '#DDD6FE' },
]


// ── My Token Section ──────────────────────────────────────────────────────────

function MyTokenSection({
  token, aheadCount, currentlyServing, loading,
}: {
  token: QueueToken | null; aheadCount: number; currentlyServing: number | null; loading: boolean
}) {
  const navigate = useNavigate()

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', margin: '20px 0 12px' }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>My Token</span>
        <span
          onClick={() => navigate('/app/queue')}
          style={{ fontSize: 13, color: '#2C6ED5', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
        >
          View All →
        </span>
      </div>
      <div style={{ padding: '0 16px' }}>
        {loading ? (
          <div style={{ height: 130, borderRadius: 20, background: '#FFFFFF', boxShadow: '0 2px 12px rgba(30,79,163,0.06)' }} />
        ) : token ? (
          <ActiveTokenCard token={token} aheadCount={aheadCount} currentlyServing={currentlyServing} />
        ) : (
          <NoTokenBanner />
        )}
      </div>
    </motion.div>
  )
}

function ActiveTokenCard({
  token, aheadCount, currentlyServing,
}: {
  token: QueueToken; aheadCount: number; currentlyServing: number | null
}) {
  const navigate   = useNavigate()
  const doc        = typeof token.doctorId === 'object' ? token.doctorId : null
  const clinic     = typeof token.clinicId === 'object' ? token.clinicId : null
  const docName    = doc ? `Dr. ${doc.name}` : 'Doctor'
  const spec       = doc?.specialization ?? ''
  const clinicName = clinic?.name ?? ''
  const subLabel   = `${spec}${spec && clinicName ? ' · ' : ''}${clinicName}`
  const tokenLabel = String(token.tokenNumber).padStart(3, '0')
  const progress   = currentlyServing && token.tokenNumber > 0
    ? Math.min(100, Math.round((currentlyServing / token.tokenNumber) * 100))
    : 10

  const statusLabels: Record<string, string> = {
    waiting: 'ACTIVE TOKEN', priority: 'PRIORITY TOKEN',
    'in-room': 'IN ROOM', 'in-consultation': 'IN CONSULTATION',
  }
  const statusLabel = statusLabels[token.status] ?? 'ACTIVE TOKEN'

  return (
    <div onClick={() => navigate('/app/queue')} style={{
      background: BRAND_GRADIENT, borderRadius: 20, padding: '18px 18px 16px',
      boxShadow: '0 8px 28px rgba(44,110,213,0.32)', cursor: 'pointer',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -20, left: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(31,163,168,0.25)', pointerEvents: 'none' }} />

      {/* Status + wait time */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
          color: '#FFFFFF', background: 'rgba(255,255,255,0.20)',
          border: '1px solid rgba(255,255,255,0.30)',
          padding: '5px 10px', borderRadius: 999,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', background: '#4ADE80',
            boxShadow: '0 0 0 3px rgba(74,222,128,0.35)', display: 'inline-block', flexShrink: 0,
          }} />
          {statusLabel}
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
          {aheadCount > 0 ? `~${aheadCount * 5} min` : 'Almost your turn'}
        </span>
      </div>

      {/* Token number + doctor */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, position: 'relative', zIndex: 1 }}>
        <div style={{
          fontSize: 38, fontWeight: 800, letterSpacing: '-0.03em', color: '#FFFFFF', lineHeight: 1,
          paddingRight: 16, borderRight: '1px solid rgba(255,255,255,0.25)',
        }}>
          T‑{tokenLabel}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>{docName}</div>
          {subLabel && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 3 }}>{subLabel}</div>}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.20)', overflow: 'hidden', marginBottom: 8, position: 'relative', zIndex: 1 }}>
        <div style={{ height: '100%', borderRadius: 999, background: 'rgba(255,255,255,0.90)', width: `${progress}%` }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 500, marginBottom: 14, position: 'relative', zIndex: 1 }}>
        <span><b style={{ color: '#FFFFFF', fontWeight: 800 }}>{aheadCount}</b> ahead of you</span>
        {currentlyServing !== null && <span>Serving T‑{String(currentlyServing).padStart(3, '0')}</span>}
      </div>

      {/* CTA */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.20)',
        fontSize: 13, fontWeight: 700, color: '#FFFFFF',
        position: 'relative', zIndex: 1,
      }}>
        <span>Track live queue</span>
        <HiChevronRight size={16} />
      </div>
    </div>
  )
}

function NoTokenBanner() {
  const navigate = useNavigate()
  return (
    <div onClick={() => navigate('/app/booking')} style={{
      background: '#FFFFFF', borderRadius: 20, padding: 16,
      border: '1.5px dashed #BFDBFE', boxShadow: '0 2px 12px rgba(30,79,163,0.05)',
      display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14, background: BRAND_GRADIENT,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        boxShadow: '0 4px 14px rgba(44,110,213,0.30)',
      }}>
        <MdEventNote size={22} color="#FFFFFF" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1E4FA3' }}>No active queue token</div>
        <div style={{ fontSize: 12, color: '#6B7C93', marginTop: 2 }}>Tap to book an appointment now</div>
      </div>
      <HiChevronRight size={18} color="#A0AEC0" />
    </div>
  )
}

// ── Upcoming Appointment Card ─────────────────────────────────────────────────

function UpcomingCard({ appt }: { appt: Appointment }) {
  const navigate  = useNavigate()
  const doc       = typeof appt.doctorId === 'object' ? appt.doctorId : null
  const clinic    = typeof appt.clinicId === 'object' ? appt.clinicId : null
  const docName   = doc ? `Dr. ${doc.name}` : 'Doctor'
  const spec      = doc?.specialization ?? ''
  const clinicName = clinic?.name ?? ''
  const label     = `${spec}${spec && clinicName ? ' · ' : ''}${clinicName}`
  const initials  = doc ? getInitials(doc.name) : 'DR'
  const dateLabel = formatApptDate(appt.date)

  return (
    <div onClick={() => navigate('/app/appointments')} style={{
      background: '#FFFFFF', borderRadius: 20, padding: 16,
      border: '1px solid #F0F4F8', boxShadow: '0 2px 12px rgba(30,79,163,0.06)',
      display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
    }}>
      <div style={{
        width: 50, height: 50, borderRadius: 14,
        background: '#E6F7F7', border: '2px solid #BFE3E5',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: 15, color: '#0F766E', flexShrink: 0,
      }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {docName}
        </div>
        <div style={{ fontSize: 12, color: '#6B7C93', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </div>
        <div style={{
          marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 11, fontWeight: 700, background: '#E6F7F7', color: '#0F766E',
          padding: '4px 10px', borderRadius: 999,
        }}>
          {dateLabel}{appt.time ? ` · ${appt.time}` : ''}
        </div>
      </div>
      <HiChevronRight size={16} color="#A0AEC0" />
    </div>
  )
}

function NoUpcomingBanner() {
  const navigate = useNavigate()
  return (
    <div onClick={() => navigate('/app/booking')} style={{
      background: '#FFFFFF', borderRadius: 20, padding: 16,
      border: '1.5px dashed #BFDBFE', boxShadow: '0 2px 12px rgba(30,79,163,0.05)',
      display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
    }}>
      <div style={{ width: 46, height: 46, borderRadius: 13, background: '#EBF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <HiCalendar size={22} color="#2C6ED5" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>No upcoming appointments</div>
        <div style={{ fontSize: 12, color: '#6B7C93', marginTop: 2 }}>Tap to book your next visit</div>
      </div>
      <HiChevronRight size={16} color="#A0AEC0" />
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const navigate         = useNavigate()
  const user             = useAuthStore((s) => s.user)
  const setStoreToken    = useQueueStore((s) => s.setActiveToken)

  const [upcomingAppts, setUpcomingAppts] = useState<Appointment[]>([])
  const [pastCount, setPastCount]         = useState(0)
  const [activeToken, setActiveToken]     = useState<QueueToken | null>(null)
  const [tokenMeta, setTokenMeta]         = useState<{ aheadCount: number; currentlyServing: number | null } | null>(null)
  const [loadingAppts, setLoadingAppts]   = useState(true)
  const [loadingToken, setLoadingToken]   = useState(true)

  useEffect(() => {
    getMyAppointments('upcoming')
      .then((r) => setUpcomingAppts(r.data))
      .catch(() => undefined)
      .finally(() => setLoadingAppts(false))

    getMyAppointments('past')
      .then((r) => setPastCount(r.count))
      .catch(() => undefined)

    getMyActiveToken()
      .then((r) => {
        setActiveToken(r.data)
        setStoreToken(r.data)
        if (r.meta) setTokenMeta(r.meta)
      })
      .catch(() => undefined)
      .finally(() => setLoadingToken(false))
  }, [])

  const { label: greetLabel, emoji: greetEmoji } = getGreeting()
  const firstName = user?.name?.split(' ')[0] ?? 'there'
  const nextAppt  = upcomingAppts[0] ?? null

  return (
    <div style={{ paddingBottom: 96, background: '#F5F8FC', minHeight: '100%', fontFamily: 'Roboto, system-ui, sans-serif' }}>

      {/* ── Single merged hero card: gradient header + white token section ─── */}
      <motion.div
        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        style={{ borderRadius: '0 0 28px 28px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(30,79,163,0.20)' }}
      >
        {/* Gradient section */}
        <div style={{ background: BRAND_GRADIENT, padding: '14px 18px 22px', position: 'relative', overflow: 'hidden' }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -50, left: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(31,163,168,0.25)', pointerEvents: 'none' }} />

          {/* Top row: brand + action buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
            {/* NoQ branding */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              }}>
                <MdShield size={20} color="#1E4FA3" />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em', color: '#FFFFFF', lineHeight: 1 }}>NoQ</div>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)', marginTop: 3 }}>skip the queue</div>
              </div>
            </div>
            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => navigate('/app/search')} style={{
                width: 38, height: 38, borderRadius: 12,
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}>
                <HiSearch size={18} color="#FFFFFF" />
              </button>
              <button style={{
                width: 38, height: 38, borderRadius: 12,
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', position: 'relative',
              }}>
                <HiBell size={18} color="#FFFFFF" />
                <span style={{
                  position: 'absolute', top: 7, right: 7, width: 8, height: 8,
                  borderRadius: '50%', background: '#FFD166', border: '2px solid #2558BC',
                }} />
              </button>
            </div>
          </div>

          {/* Greeting */}
          <div style={{ marginTop: 20, position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 999, padding: '4px 10px',
              fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)',
              letterSpacing: '0.02em', marginBottom: 10,
            }}>
              {greetLabel} {greetEmoji}
            </div>
            <div style={{ fontSize: 27, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em', textShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: 4 }}>
              {firstName}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
              How are you feeling today?
            </div>
          </div>
        </div>

        {/* White section: search bar only */}
        <div style={{ background: '#FFFFFF', padding: '18px 16px 20px' }}>
          <button onClick={() => navigate('/app/search')} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            background: '#F5F8FC', border: '1.5px solid #E3EAF2',
            borderRadius: 14, padding: '0 16px', height: 46,
            cursor: 'pointer', textAlign: 'left',
          }}>
            <HiSearch size={17} color="#A0AEC0" />
            <span style={{ fontSize: 14, color: '#A0AEC0', fontFamily: 'inherit', fontWeight: 500 }}>
              Search doctors, clinics, specialties…
            </span>
          </button>
        </div>
      </motion.div>

      {/* ── My Token ─────────────────────────────────────────────────────────── */}
      <MyTokenSection
        token={activeToken}
        aheadCount={tokenMeta?.aheadCount ?? 0}
        currentlyServing={tokenMeta?.currentlyServing ?? null}
        loading={loadingToken}
      />

      {/* ── My Health stats ─────────────────────────────────────────────────── */}
      {!loadingAppts && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', margin: '22px 0 12px' }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>My Health</span>
            <span onClick={() => navigate('/app/appointments')} style={{ fontSize: 13, color: '#2C6ED5', fontWeight: 600, cursor: 'pointer' }}>View all →</span>
          </div>
          <div style={{ display: 'flex', gap: 10, padding: '0 16px' }}>
            {[
              { label: 'Upcoming',  value: upcomingAppts.length, color: '#2C6ED5', bg: '#EBF2FF', border: '#BFDBFE', icon: <HiCalendar size={18} color="#2C6ED5" /> },
              { label: 'Completed', value: pastCount,            color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', icon: <MdLocalHospital size={18} color="#059669" /> },
            ].map((s) => (
              <div key={s.label} onClick={() => navigate('/app/appointments')} style={{
                flex: 1, background: '#FFFFFF', borderRadius: 18,
                padding: '14px 16px', cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(30,79,163,0.06)',
                border: `1.5px solid ${s.border}`,
                position: 'relative', overflow: 'hidden',
              }}>
                {/* Absolute color strip — no borderLeft bug */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: s.color }} />
                <div style={{ paddingLeft: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {s.icon}
                    </div>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#6B7C93', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
      {loadingAppts && (
        <div style={{ display: 'flex', gap: 10, padding: '22px 16px 0' }}>
          <div style={{ flex: 1, height: 100, borderRadius: 18, background: '#FFFFFF', boxShadow: '0 2px 12px rgba(30,79,163,0.06)' }} />
          <div style={{ flex: 1, height: 100, borderRadius: 18, background: '#FFFFFF', boxShadow: '0 2px 12px rgba(30,79,163,0.06)' }} />
        </div>
      )}

      {/* ── Quick Actions ────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div style={{ padding: '0 16px', margin: '22px 0 12px' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>Quick Actions</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, padding: '0 16px' }}>
          {QUICK_ACTIONS.map((a) => (
            <div key={a.key} onClick={() => navigate(a.path)} style={{
              background: '#FFFFFF', borderRadius: 18, padding: '14px 6px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              boxShadow: '0 2px 8px rgba(30,79,163,0.06)',
              border: `1.5px solid ${a.border}`,
              cursor: 'pointer',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 13, background: a.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: a.color,
              }}>
                {a.icon}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', color: '#3D4A5B', lineHeight: 1.3 }}>
                {a.name}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Upcoming appointment ─────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', margin: '22px 0 12px' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>Upcoming</span>
          <span onClick={() => navigate('/app/appointments')} style={{ fontSize: 13, color: '#2C6ED5', fontWeight: 600, cursor: 'pointer' }}>View all →</span>
        </div>
        <div style={{ padding: '0 16px' }}>
          {loadingAppts ? (
            <div style={{ height: 80, borderRadius: 20, background: '#FFFFFF', boxShadow: '0 2px 12px rgba(30,79,163,0.06)' }} />
          ) : nextAppt ? (
            <UpcomingCard appt={nextAppt} />
          ) : (
            <NoUpcomingBanner />
          )}
        </div>
      </motion.div>

{/* ── Health tip banner ────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <div style={{ margin: '22px 16px 0' }}>
          <div style={{
            background: 'linear-gradient(135deg, #ECFDF5 0%, #E6F7F7 100%)',
            border: '1.5px solid #A7F3D0', borderRadius: 18,
            padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MdFavorite size={20} color="#059669" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#065F46', marginBottom: 2 }}>Health tip of the day</div>
              <div style={{ fontSize: 11, color: '#047857', lineHeight: 1.4 }}>
                Stay hydrated — drink at least 8 glasses of water daily for optimal health.
              </div>
            </div>
          </div>
        </div>
      </motion.div>

    </div>
  )
}
