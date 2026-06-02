import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { appointmentService } from '@/services/appointmentService'
import { unwrapList, clinicId } from '@/services/api'
import type { Appointment } from '@/types'

// Server populates patientId/doctorId, so the raw response shape is richer than Appointment.
interface ServerAppointment {
  _id: string
  patientId?: { _id: string; name: string; phone: string; tag?: string; gender?: 'M' | 'F' | 'Other'; dob?: string }
  doctorId?: { _id: string; name: string; specialization?: string }
  clinicId?: { _id: string; name: string } | string
  date: string
  time?: string
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'
  type?: string
  notes?: string
  symptoms?: string[]
}

type AppointmentRow = Appointment & {
  patientAge?: number
  patientGender?: 'M' | 'F' | 'Other'
  apptType?: string
}

function calcAge(dob?: string): number | undefined {
  if (!dob) return undefined
  const t = new Date(dob).getTime()
  if (Number.isNaN(t)) return undefined
  return Math.floor((Date.now() - t) / (365.25 * 24 * 3600 * 1000))
}

function mapAppointment(a: ServerAppointment, index: number): AppointmentRow {
  const status: Appointment['status'] =
    a.status === 'in-progress' ? 'in-progress'
    : a.status === 'completed' ? 'done'
    : a.status === 'cancelled' || a.status === 'no-show' ? 'cancelled'
    : 'scheduled'
  return {
    id: a._id,
    token: index + 1,
    patientId: a.patientId?._id ?? '',
    patientName: a.patientId?.name ?? 'Patient',
    patientPhone: a.patientId?.phone ?? '',
    clinicId: typeof a.clinicId === 'string' ? a.clinicId : a.clinicId?._id ?? '',
    doctorId: a.doctorId?._id ?? '',
    date: a.date,
    time: a.time ?? '',
    status,
    notes: a.notes ?? (a.symptoms?.[0] ?? ''),
    patientAge: calcAge(a.patientId?.dob),
    patientGender: a.patientId?.gender,
    apptType: a.type,
  }
}

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

type Tab = 'today' | 'upcoming'

export function Appointments() {
  const navigate = useNavigate()
  const clinic = useAuthStore((s) => s.selectedClinic)
  const doctorId = useAuthStore((s) => s.doctorId)
  const cid = clinicId(clinic)
  const [tab, setTab] = useState<Tab>('today')
  const [items, setItems] = useState<AppointmentRow[]>([])
  const [todayItems, setTodayItems] = useState<AppointmentRow[]>([])
  const [upcomingCount, setUpcomingCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!cid) return
    setLoading(true)
    const todayDate = new Date().toISOString().slice(0, 10)

    Promise.all([
      // Today's full list — drives both the Today tab list AND the stat tiles
      appointmentService.list({ clinicId: cid, doctorId: doctorId ?? undefined, date: todayDate }),
      // Future appointments — drives the Upcoming tab list AND its count
      appointmentService.list({ clinicId: cid, doctorId: doctorId ?? undefined, status: 'scheduled' }),
    ])
      .then(([todayRes, scheduledRes]) => {
        const today = unwrapList<ServerAppointment>(todayRes.data).map(mapAppointment)
        const upcoming = unwrapList<ServerAppointment>(scheduledRes.data)
          .filter((a) => a.date.slice(0, 10) > todayDate)
          .map(mapAppointment)
        setTodayItems(today)
        setUpcomingCount(upcoming.length)
        setItems(tab === 'today' ? today : upcoming)
      })
      .finally(() => setLoading(false))
  }, [cid, doctorId, tab])

  // Stat tiles always show today's breakdown, even when the Upcoming tab is active.
  const counts = useMemo(() => {
    const done    = todayItems.filter((a) => a.status === 'done').length
    const waiting = todayItems.filter((a) => a.status === 'scheduled' || a.status === 'waiting').length
    const urgent  = todayItems.filter((a) => isEmergency(a)).length
    return { done, waiting, urgent }
  }, [todayItems])

  const todayCount = todayItems.length

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100%', background: '#F5F8FC' }}>
      {/* Hero */}
      <div style={{
        background: BRAND_GRADIENT,
        padding: '52px 20px 26px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '0 0 28px 28px',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 700, margin: 0 }}>
              {clinic?.name ?? 'No clinic'}
            </p>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', margin: '4px 0 0' }}>Appointments</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <IconBtn><SearchSvg /></IconBtn>
            <IconBtn><CalendarSvg /></IconBtn>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginTop: 16, display: 'inline-flex', gap: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 4 }}>
          {(['today', 'upcoming'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: tab === t ? '#FFFFFF' : 'transparent',
                color: tab === t ? '#1E4FA3' : 'rgba(255,255,255,0.9)',
                fontSize: 12, fontWeight: 700,
              }}
            >
              {t === 'today' ? `Today · ${todayCount}` : `Upcoming · ${upcomingCount}`}
            </button>
          ))}
        </div>
      </div>

      {/* Stat tiles */}
      <div style={{ display: 'flex', gap: 10, margin: '16px 16px 16px' }}>
        <MiniStat value={counts.done} label="DONE" color="#22C55E" />
        <MiniStat value={counts.waiting} label="WAITING" color="#F59E0B" />
        <MiniStat value={counts.urgent} label="URGENT" color="#EF4444" />
      </div>

      {/* List */}
      <div style={{ margin: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : items.map((a) => <AppointmentCard key={a.id} appt={a} onClick={() => navigate('/consultation', { state: { appointment: a } })} />)}
      </div>
    </motion.div>
  )
}

function isEmergency(a: AppointmentRow) {
  if (a.apptType === 'emergency') return true
  return /emerg|urgent|asap/i.test(a.notes ?? '')
}

function AppointmentCard({ appt, onClick }: { appt: AppointmentRow; onClick: () => void }) {
  const emergency = isEmergency(appt)
  const tone = toneFor(appt.status, emergency)
  const ageGender = appt.patientAge != null && appt.patientGender
    ? `${appt.patientAge}${appt.patientGender === 'M' ? 'M' : appt.patientGender === 'F' ? 'F' : 'O'}`
    : appt.patientGender
      ? appt.patientGender === 'M' ? 'M' : appt.patientGender === 'F' ? 'F' : 'O'
      : ''
  return (
    <button onClick={onClick}
      style={{
        all: 'unset', cursor: 'pointer',
        background: tone.bg, borderRadius: 16, padding: 14,
        display: 'flex', gap: 14, alignItems: 'stretch',
        boxShadow: '0 2px 8px rgba(30,79,163,0.06)',
      }}>
      <div style={{ minWidth: 60, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 4 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: emergency ? '#DC2626' : '#1E4FA3', letterSpacing: '0.4px' }}>
          {emergency ? 'E' : 'A'}-{String(appt.token).padStart(3, '0')}
        </span>
        <span style={{ fontSize: 11, color: emergency ? '#DC2626' : '#64748B', fontWeight: 500 }}>{emergency ? 'asap' : appt.time}</span>
      </div>

      <div style={{ borderLeft: '2px dotted #CBD5E1', alignSelf: 'stretch' }} />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {appt.patientName}
          {ageGender && <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, marginLeft: 6 }}>{ageGender}</span>}
        </p>
        <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {appt.notes || 'Consult'}
        </p>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color: tone.fg, background: tone.badge, borderRadius: 999, padding: '3px 9px', alignSelf: 'flex-start' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: tone.fg }} />
          {tone.label}
        </span>
      </div>

      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, alignSelf: 'center' }}>
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  )
}

/**
 * Card tone per status.
 *  - in-progress  → light-green CARD bg + green pill         ("In room")
 *  - emergency    → light-red CARD bg + red pill             ("Emergency")
 *  - scheduled/waiting → WHITE card + yellow pill            ("Waiting")
 *  - done         → soft-grey card + slate pill              ("Completed")
 *  - cancelled    → soft-grey card + mute pill               ("Cancelled")
 */
function toneFor(status: Appointment['status'], emergency: boolean) {
  if (emergency) return { bg: '#FEF2F2', badge: '#FEE2E2', fg: '#DC2626', label: 'Emergency' }
  switch (status) {
    case 'in-progress': return { bg: '#ECFDF5', badge: '#D1FAE5', fg: '#059669', label: 'In room' }
    case 'done':        return { bg: '#F8FAFC', badge: '#E2E8F0', fg: '#475569', label: 'Completed' }
    case 'cancelled':   return { bg: '#F8FAFC', badge: '#E2E8F0', fg: '#94A3B8', label: 'Cancelled' }
    case 'waiting':
    case 'scheduled':
    default:            return { bg: '#FFFFFF', badge: '#FEF3C7', fg: '#D97706', label: 'Waiting' }
  }
}

function MiniStat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{ flex: 1, background: '#FFFFFF', borderRadius: 12, padding: '12px 10px', boxShadow: '0 2px 8px rgba(30,79,163,0.06)' }}>
      <p style={{ fontSize: 22, fontWeight: 800, color, margin: 0, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.8px', margin: '6px 0 0' }}>{label}</p>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <p style={{ fontSize: 32, marginBottom: 8 }}>📅</p>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: 0 }}>No appointments</p>
      <p style={{ fontSize: 12, color: '#94A3B8', margin: '4px 0 0' }}>Check back later</p>
    </div>
  )
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </button>
  )
}

function SearchSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  )
}
function CalendarSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}
