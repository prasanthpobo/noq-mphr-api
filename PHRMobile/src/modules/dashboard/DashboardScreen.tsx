import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { useAuthStore } from '../../store/authStore'
import { getMyAppointments } from '../../services/bookingService'
import { getMyActiveToken } from '../../services/queueService'
import type { Appointment } from '../../services/bookingService'
import type { QueueToken } from '../../services/queueService'

// ── Icons ─────────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ink-300)' }}>
    <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
  </svg>
)
const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
)
const CalIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
)
const QueueIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6" width="18" height="4" rx="1"/><rect x="3" y="14" width="18" height="4" rx="1"/>
  </svg>
)
const FileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/>
  </svg>
)
const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.6a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.07a5.5 5.5 0 10-7.78 7.78l8.84 8.84 8.84-8.84a5.5 5.5 0 000-7.78z"/>
  </svg>
)
const StethoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3v5a4 4 0 008 0V3"/><path d="M10 12v3a4 4 0 008 0v-3"/><circle cx="18" cy="19" r="2"/>
  </svg>
)
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0114 0v1"/>
  </svg>
)
const ActivityIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
)
const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 6l6 6-6 6"/>
  </svg>
)
const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
)
const WaveOverlay = () => (
  <svg className="wave" viewBox="0 0 390 80" preserveAspectRatio="none">
    <path d="M0,40 C100,80 200,0 300,40 C340,56 370,50 390,30 L390,80 L0,80 Z" fill="#fff"/>
    <path d="M0,55 C80,80 180,20 280,55 C340,75 370,70 390,60 L390,80 L0,80 Z" fill="#fff" opacity="0.4"/>
  </svg>
)

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
  { key: 'book',  name: 'Book token',   icon: <PlusIcon />,  path: '/app/booking'      },
  { key: 'apts',  name: 'Appointments', icon: <CalIcon />,   path: '/app/appointments' },
  { key: 'queue', name: 'Queue status', icon: <QueueIcon />, path: '/app/queue'        },
  { key: 'phr',   name: 'Records',      icon: <FileIcon />,  path: '/app/records'      },
]

const DEPTS = [
  { n: 'Cardiology',  icon: <HeartIcon />    },
  { n: 'General',     icon: <StethoIcon />   },
  { n: 'Pediatric',   icon: <UserIcon />     },
  { n: 'Ortho',       icon: <ActivityIcon /> },
  { n: 'Dental',      icon: <PlusIcon />     },
  { n: 'Derma',       icon: <FileIcon />     },
]

// ── Active Token Card ─────────────────────────────────────────────────────────

function ActiveTokenCard({
  token,
  aheadCount,
  currentlyServing,
}: {
  token: QueueToken
  aheadCount: number
  currentlyServing: number | null
}) {
  const navigate = useNavigate()
  const doc     = typeof token.doctorId  === 'object' ? token.doctorId  : null
  const clinic  = typeof token.clinicId  === 'object' ? token.clinicId  : null
  const docName = doc ? `Dr. ${doc.name}` : 'Doctor'
  const spec    = doc?.specialization ?? ''
  const clinicName = clinic?.name ?? ''
  const label   = `${spec}${spec && clinicName ? ' · ' : ''}${clinicName}`
  const tokenLabel = String(token.tokenNumber).padStart(3, '0')
  const progress = currentlyServing && token.tokenNumber > 0
    ? Math.min(100, Math.round((currentlyServing / token.tokenNumber) * 100))
    : 10

  const statusLabels: Record<string, string> = {
    waiting: 'ACTIVE TOKEN',
    priority: 'PRIORITY TOKEN',
    'in-room': 'IN ROOM',
    'in-consultation': 'IN CONSULTATION',
  }
  const statusLabel = statusLabels[token.status] ?? 'ACTIVE TOKEN'

  return (
    <div className="active-token-card" onClick={() => navigate('/app/queue')}>
      <div className="atc-head">
        <div className="atc-label">
          <span className="atc-live-dot" />
          {statusLabel}
        </div>
        <div className="atc-time">
          {aheadCount > 0 ? `~${aheadCount * 5} min` : 'Almost your turn'}
        </div>
      </div>
      <div className="atc-body">
        <div className="atc-token">T‑{tokenLabel}</div>
        <div className="atc-meta">
          <div className="atc-doc">{docName}</div>
          {label && <div className="atc-clinic">{label}</div>}
        </div>
      </div>
      <div className="atc-progress">
        <div className="atc-progress-bar">
          <div className="atc-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="atc-progress-row">
          <span><b>{aheadCount}</b> ahead of you</span>
          {currentlyServing !== null && <span>Serving T‑{String(currentlyServing).padStart(3, '0')}</span>}
        </div>
      </div>
      <div className="atc-cta">
        <span>Track live queue</span>
        <ChevronIcon />
      </div>
    </div>
  )
}

function BookTokenBanner() {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate('/app/booking')}
      style={{
        background: 'linear-gradient(135deg, rgba(44,110,213,0.08) 0%, rgba(31,163,168,0.08) 100%)',
        border: '1.5px dashed var(--blue-300)',
        borderRadius: 20,
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        cursor: 'pointer',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 14,
        background: 'var(--brand-gradient)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <PlusIcon />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--blue-800)' }}>No active queue token</div>
        <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 2 }}>Tap to book an appointment now</div>
      </div>
      <ChevronIcon />
    </div>
  )
}

// ── Upcoming Appointment Card ─────────────────────────────────────────────────

function UpcomingCard({ appt }: { appt: Appointment }) {
  const navigate = useNavigate()
  const doc    = typeof appt.doctorId  === 'object' ? appt.doctorId  : null
  const clinic = typeof appt.clinicId  === 'object' ? appt.clinicId  : null
  const docName   = doc ? `Dr. ${doc.name}` : 'Doctor'
  const spec      = doc?.specialization ?? ''
  const clinicName = clinic?.name ?? ''
  const label = `${spec}${spec && clinicName ? ' · ' : ''}${clinicName}`
  const initials = doc ? getInitials(doc.name) : 'DR'
  const dateLabel = formatApptDate(appt.date)

  return (
    <div
      className="noq-card"
      style={{
        background: 'linear-gradient(135deg, #E4F3F4, #F5FAFB)',
        border: '1px solid var(--teal-200)',
        display: 'flex', alignItems: 'center', gap: 12,
        cursor: 'pointer',
      }}
      onClick={() => navigate('/app/appointments')}
    >
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: 'var(--teal-100)', color: 'var(--teal-800)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 15, flexShrink: 0,
      }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--fg-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {docName}
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </div>
        <div style={{
          marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 11, fontWeight: 700,
          background: 'var(--teal-100)', color: 'var(--teal-800)',
          padding: '4px 10px', borderRadius: 999,
        }}>
          {dateLabel}{appt.time ? ` · ${appt.time}` : ''}
        </div>
      </div>
      <ChevronIcon />
    </div>
  )
}

function NoUpcomingBanner() {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate('/app/booking')}
      style={{
        background: '#fff', borderRadius: 20, padding: '16px',
        border: '1px solid var(--border-soft)',
        boxShadow: 'var(--sh-card)',
        display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <CalIcon />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)' }}>No upcoming appointments</div>
        <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 2 }}>Tap to book your next visit</div>
      </div>
      <ChevronIcon />
    </div>
  )
}

// ── Stats Row ─────────────────────────────────────────────────────────────────

function StatsRow({ upcomingCount, pastCount }: { upcomingCount: number; pastCount: number }) {
  const navigate = useNavigate()
  return (
    <div style={{ display: 'flex', gap: 10, padding: '0 16px' }}>
      {[
        { label: 'Upcoming', value: upcomingCount, color: '#2C6ED5', bg: '#EBF2FF', path: '/app/appointments' },
        { label: 'Completed', value: pastCount,    color: '#059669', bg: '#ECFDF5', path: '/app/appointments' },
      ].map((s) => (
        <div key={s.label} onClick={() => navigate(s.path)} style={{
          flex: 1, background: '#fff', borderRadius: 16, padding: '14px 16px',
          boxShadow: 'var(--sh-card)', cursor: 'pointer',
          borderLeft: `4px solid ${s.color}`,
        }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
          <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

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
        if (r.meta) setTokenMeta(r.meta)
      })
      .catch(() => undefined)
      .finally(() => setLoadingToken(false))
  }, [])

  const { label: greetLabel, emoji: greetEmoji } = getGreeting()
  const firstName = user?.name?.split(' ')[0] ?? 'there'
  const nextAppt = upcomingAppts[0] ?? null

  return (
    <div style={{ paddingBottom: 96, background: 'var(--bg-app)', minHeight: '100%' }}>

      {/* ── Greeting header ── */}
      <div className="noq-header greeting">
        <WaveOverlay />
        <div className="top-row">
          <div className="h-brand">
            <div className="h-logo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E4FA3" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L3 7v6c0 5 3.8 8.5 9 10 5.2-1.5 9-5 9-10V7l-9-5z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
            <div>
              <div className="h-wordmark-top">NoQ</div>
              <div className="h-wordmark-sub">skip the queue</div>
            </div>
          </div>
          <div className="h-actions">
            <button className="h-icon-btn" onClick={() => navigate('/app/search')} aria-label="Search" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
              </svg>
            </button>
            <button className="h-icon-btn" aria-label="Notifications" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <BellIcon />
            </button>
          </div>
        </div>
        <div className="greet">
          <div className="greet-label">{greetLabel} {greetEmoji}</div>
          <div className="greet-name">{firstName}</div>
          <div className="greet-sub">How are you feeling today?</div>
        </div>
      </div>

      {/* ── Active token card ── */}
      <div className="floating-wrap">
        {loadingToken ? (
          <div style={{ background: '#fff', borderRadius: 20, height: 148, boxShadow: '0 16px 40px -12px rgba(30,79,163,0.18)' }} />
        ) : activeToken ? (
          <ActiveTokenCard
            token={activeToken}
            aheadCount={tokenMeta?.aheadCount ?? 0}
            currentlyServing={tokenMeta?.currentlyServing ?? null}
          />
        ) : (
          <BookTokenBanner />
        )}
      </div>

      {/* ── Search bar ── */}
      <div style={{ padding: '16px 16px 0' }}>
        <button
          onClick={() => navigate('/app/search')}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            background: '#fff', border: '1.5px solid var(--border-soft)',
            borderRadius: 14, padding: '0 16px 0 44px', height: 48,
            cursor: 'pointer', position: 'relative',
            boxShadow: '0 2px 8px rgba(30,79,163,0.05)', textAlign: 'left',
          }}
          aria-label="Search"
        >
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
            <SearchIcon />
          </span>
          <span style={{ fontSize: 14, color: 'var(--ink-300)', fontFamily: 'inherit' }}>
            Search doctors, clinics, specialties
          </span>
        </button>
      </div>

      {/* ── Stats ── */}
      {!loadingAppts && (
        <>
          <div className="sec-head">
            <div className="t">My Health</div>
            <div className="a" onClick={() => navigate('/app/appointments')}>View all →</div>
          </div>
          <StatsRow upcomingCount={upcomingAppts.length} pastCount={pastCount} />
        </>
      )}
      {loadingAppts && (
        <div style={{ display: 'flex', gap: 10, padding: '22px 16px 0' }}>
          <div style={{ flex: 1, height: 72, borderRadius: 16, background: '#fff', boxShadow: 'var(--sh-card)' }} />
          <div style={{ flex: 1, height: 72, borderRadius: 16, background: '#fff', boxShadow: 'var(--sh-card)' }} />
        </div>
      )}

      {/* ── Quick actions ── */}
      <div className="sec-head">
        <div className="t">Quick Actions</div>
      </div>
      <div className="quick-grid">
        {QUICK_ACTIONS.map((a) => (
          <div key={a.key} className="quick-tile" onClick={() => navigate(a.path)}>
            <div className="q-ic">{a.icon}</div>
            <div className="q-name">{a.name}</div>
          </div>
        ))}
      </div>

      {/* ── Upcoming appointment ── */}
      <div className="sec-head">
        <div className="t">Upcoming</div>
        <div className="a" onClick={() => navigate('/app/appointments')}>View all →</div>
      </div>
      <div style={{ padding: '0 16px' }}>
        {loadingAppts ? (
          <div style={{ height: 80, borderRadius: 20, background: '#fff', boxShadow: 'var(--sh-card)' }} />
        ) : nextAppt ? (
          <UpcomingCard appt={nextAppt} />
        ) : (
          <NoUpcomingBanner />
        )}
      </div>

      {/* ── Departments ── */}
      <div className="sec-head">
        <div className="t">Departments</div>
        <div className="a" onClick={() => navigate('/app/search')}>See all →</div>
      </div>
      <div className="dept-grid">
        {DEPTS.map((d) => (
          <div key={d.n} className="dept-tile" onClick={() => navigate('/app/search')}>
            <div className="d-ic">{d.icon}</div>
            <div className="d-name">{d.n}</div>
          </div>
        ))}
      </div>

    </div>
  )
}
