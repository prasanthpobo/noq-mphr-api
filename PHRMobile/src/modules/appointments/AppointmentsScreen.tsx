import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import dayjs from 'dayjs'
import {
  HiLocationMarker,
  HiClock,
  HiCalendar,
  HiRefresh,
  HiDocumentText,
  HiArrowRight,
  HiX,
} from 'react-icons/hi'
import MobileHeader from '../../components/MobileHeader'
import { getMyAppointments, updateAppointment } from '../../services/bookingService'
import type { Appointment as ServerAppointment } from '../../services/bookingService'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'
const AVATAR_COLORS = ['#2C6ED5', '#E05B5B', '#9B59B6', '#1FA3A8', '#E07A5B', '#16A34A', '#D97706']

// ── Types ─────────────────────────────────────────────────────────────────────

type DisplayStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled'

interface DisplayAppointment {
  id: string
  doctorName: string
  doctorInitials: string
  doctorColor: string
  specialty: string
  clinic: string
  date: string          // YYYY-MM-DD
  time: string
  patientName: string
  status: DisplayStatus
  rawStatus: string
  consultationFee?: number
}

function toDisplay(a: ServerAppointment, idx: number): DisplayAppointment {
  const doc    = typeof a.doctorId  === 'object' ? a.doctorId  : null
  const clinic = typeof a.clinicId  === 'object' ? a.clinicId  : null
  const patient = typeof a.patientId === 'object' ? a.patientId : null

  const doctorName = doc ? doc.name : 'Unknown Doctor'
  const words    = doctorName.split(' ')
  const initials = ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase()

  const statusMap: Record<string, DisplayStatus> = {
    scheduled:   'Scheduled',
    'in-progress': 'In Progress',
    completed:   'Completed',
    cancelled:   'Cancelled',
    'no-show':   'Cancelled',
  }

  return {
    id:             a._id,
    doctorName:     `Dr. ${doctorName}`,
    doctorInitials: initials || 'DR',
    doctorColor:    AVATAR_COLORS[idx % AVATAR_COLORS.length],
    specialty:      doc?.specialization ?? '',
    clinic:         clinic?.name ?? '',
    date:           dayjs(a.date).format('YYYY-MM-DD'),
    time:           a.time ?? '',
    patientName:    patient?.name ?? '',
    status:         statusMap[a.status] ?? 'Scheduled',
    rawStatus:      a.status,
    consultationFee: (doc as any)?.consultationFee,
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateLabel(dateStr: string): string {
  const today    = dayjs().format('YYYY-MM-DD')
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')
  if (dateStr === today)    return 'Today'
  if (dateStr === tomorrow) return 'Tomorrow'
  return dayjs(dateStr).format('D MMM YYYY')
}

function statusStyle(s: DisplayStatus): { bg: string; color: string } {
  switch (s) {
    case 'Scheduled':   return { bg: '#DCFCE7', color: '#15803D' }
    case 'In Progress': return { bg: '#DBEAFE', color: '#1D4ED8' }
    case 'Completed':   return { bg: '#F1F5F9', color: '#475569' }
    case 'Cancelled':   return { bg: '#FEE2E2', color: '#DC2626' }
  }
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div style={{ margin: '0 16px 12px', background: '#fff', borderRadius: 20, padding: 16, boxShadow: '0 4px 12px rgba(30,79,163,0.07)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 80, height: 24, borderRadius: 20, background: '#F0F4F8' }} />
        <div style={{ width: 72, height: 24, borderRadius: 20, background: '#F0F4F8' }} />
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F0F4F8', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ width: '60%', height: 16, borderRadius: 6, background: '#F0F4F8', marginBottom: 8 }} />
          <div style={{ width: '40%', height: 13, borderRadius: 6, background: '#F0F4F8' }} />
        </div>
      </div>
      <div style={{ height: 1, background: '#EEF2F7', margin: '0 0 12px' }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, height: 36, borderRadius: 10, background: '#F0F4F8' }} />
        <div style={{ flex: 1, height: 36, borderRadius: 10, background: '#F0F4F8' }} />
      </div>
    </div>
  )
}

// ── Appointment Card ──────────────────────────────────────────────────────────

function AppointmentCard({
  appt,
  type,
  onCancel,
  onBookAgain,
}: {
  appt: DisplayAppointment
  type: 'upcoming' | 'past'
  onCancel: (id: string) => void
  onBookAgain: () => void
}) {
  const ss       = statusStyle(appt.status)
  const dateLabel = formatDateLabel(appt.date)
  const isToday   = dateLabel === 'Today'
  const isTomorrow = dateLabel === 'Tomorrow'
  const isCancelled = appt.status === 'Cancelled'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      style={{
        background: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginLeft: 16,
        marginRight: 16,
        marginBottom: 12,
        boxShadow: '0 4px 12px rgba(30,79,163,0.07)',
        opacity: isCancelled ? 0.72 : 1,
        borderLeft: type === 'upcoming' && !isCancelled ? '4px solid #2C6ED5' : '4px solid transparent',
      }}
    >
      {/* Top row: date pill + status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{
          background: isToday ? BRAND_GRADIENT : isTomorrow ? '#EEF5FF' : type === 'past' ? '#F1F5F9' : '#EEF5FF',
          color: isToday ? '#FFFFFF' : isTomorrow ? '#2C6ED5' : type === 'past' ? '#64748B' : '#2C6ED5',
          fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <HiCalendar size={12} />
          {dateLabel}
        </div>
        <div style={{ background: ss.bg, color: ss.color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
          {appt.status}
        </div>
      </div>

      {/* Doctor row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
          background: appt.doctorColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#FFFFFF', fontSize: 16, fontWeight: 700,
        }}>
          {appt.doctorInitials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>{appt.doctorName}</div>
          {appt.specialty && <div style={{ fontSize: 12, color: '#2C6ED5', fontWeight: 500, marginTop: 2 }}>{appt.specialty}</div>}
        </div>
        {appt.consultationFee !== undefined && (
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1A1A1A', flexShrink: 0 }}>
            ₹{appt.consultationFee}
          </div>
        )}
      </div>

      {/* Meta row */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 12,
        padding: '10px 0', borderTop: '1px solid #EEF2F7', borderBottom: '1px solid #EEF2F7', marginBottom: 12,
      }}>
        {appt.clinic && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B7C93' }}>
            <HiLocationMarker size={13} color="#A0AEC0" />
            <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appt.clinic}</span>
          </div>
        )}
        {appt.time && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B7C93' }}>
            <HiClock size={13} color="#A0AEC0" />
            {appt.time}
          </div>
        )}
        {appt.patientName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B7C93' }}>
            <span style={{ fontWeight: 600 }}>For:</span> {appt.patientName}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        {type === 'upcoming' && !isCancelled ? (
          <button onClick={() => onCancel(appt.id)} style={{
            flex: 1, height: 36, borderRadius: 10,
            border: '1.5px solid #EF4444', background: '#FFFFFF',
            color: '#EF4444', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}>
            <HiX size={14} /> Cancel
          </button>
        ) : type === 'past' ? (
          <>
            <button onClick={onBookAgain} style={{
              flex: 1, height: 36, borderRadius: 10, border: 'none',
              background: BRAND_GRADIENT, color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              boxShadow: '0 3px 10px rgba(44,110,213,0.25)',
            }}>
              <HiRefresh size={14} /> Book Again
            </button>
            <button style={{
              flex: 1, height: 36, borderRadius: 10,
              border: '1.5px solid #2C6ED5', background: '#FFFFFF',
              color: '#2C6ED5', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}>
              <HiDocumentText size={14} /> Records
            </button>
          </>
        ) : null}
      </div>
    </motion.div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ tab, onBook }: { tab: 'upcoming' | 'past'; onBook: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 250, damping: 25 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 32px', textAlign: 'center' }}
    >
      <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(44,110,213,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <HiCalendar size={44} color="#2C6ED5" />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A', margin: '0 0 8px' }}>
        {tab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
      </h3>
      <p style={{ fontSize: 14, color: '#6B7C93', margin: '0 0 28px', lineHeight: 1.5 }}>
        {tab === 'upcoming'
          ? 'Book your first appointment with a trusted doctor near you'
          : "Your completed appointments will appear here"}
      </p>
      {tab === 'upcoming' && (
        <button onClick={onBook} style={{
          height: 48, paddingLeft: 28, paddingRight: 28, borderRadius: 14,
          border: 'none', background: BRAND_GRADIENT, color: '#FFFFFF',
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(44,110,213,0.35)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          Book Now <HiArrowRight size={16} />
        </button>
      )}
    </motion.div>
  )
}

// ── Error State ───────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 32px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>Failed to load appointments</div>
      <div style={{ fontSize: 14, color: '#6B7C93', marginBottom: 24 }}>Check your connection and try again</div>
      <button onClick={onRetry} style={{
        height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 12,
        border: 'none', background: BRAND_GRADIENT, color: '#FFFFFF',
        fontSize: 14, fontWeight: 700, cursor: 'pointer',
      }}>
        Retry
      </button>
    </div>
  )
}

// ── AppointmentsScreen ────────────────────────────────────────────────────────

export default function AppointmentsScreen() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
  const [upcoming, setUpcoming] = useState<DisplayAppointment[]>([])
  const [past, setPast]         = useState<DisplayAppointment[]>([])
  const [loadingUpcoming, setLoadingUpcoming] = useState(true)
  const [loadingPast, setLoadingPast]         = useState(true)
  const [errorUpcoming, setErrorUpcoming]     = useState(false)
  const [errorPast, setErrorPast]             = useState(false)

  const fetchUpcoming = useCallback(() => {
    setLoadingUpcoming(true)
    setErrorUpcoming(false)
    getMyAppointments('upcoming')
      .then((r) => setUpcoming(r.data.map((a, i) => toDisplay(a, i))))
      .catch(() => setErrorUpcoming(true))
      .finally(() => setLoadingUpcoming(false))
  }, [])

  const fetchPast = useCallback(() => {
    setLoadingPast(true)
    setErrorPast(false)
    getMyAppointments('past')
      .then((r) => setPast(r.data.map((a, i) => toDisplay(a, i))))
      .catch(() => setErrorPast(true))
      .finally(() => setLoadingPast(false))
  }, [])

  useEffect(() => { fetchUpcoming() }, [fetchUpcoming])
  useEffect(() => { fetchPast() }, [fetchPast])

  const handleCancel = async (id: string) => {
    try {
      await updateAppointment(id, { status: 'cancelled' })
      setUpcoming((prev) => prev.map((a) => a.id === id ? { ...a, status: 'Cancelled' as DisplayStatus, rawStatus: 'cancelled' } : a))
    } catch {
      // silently fail
    }
  }

  const isLoading = activeTab === 'upcoming' ? loadingUpcoming : loadingPast
  const hasError  = activeTab === 'upcoming' ? errorUpcoming   : errorPast
  const list      = activeTab === 'upcoming' ? upcoming        : past
  const isEmpty   = !isLoading && !hasError && list.length === 0

  const upcomingCount = upcoming.filter((a) => a.rawStatus !== 'cancelled').length

  return (
    <div style={{ minHeight: '100dvh', background: '#F5F8FC', display: 'flex', flexDirection: 'column', paddingBottom: 96, fontFamily: 'Roboto, system-ui, sans-serif' }}>
      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: '#FFFFFF', borderBottom: '1px solid #EEF2F7' }}>
        <MobileHeader title="Appointments" />

        {/* Tabs */}
        <div style={{ display: 'flex', paddingLeft: 16, paddingRight: 16 }}>
          {(['upcoming', 'past'] as const).map((tab) => {
            const isActive = activeTab === tab
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                flex: 1, padding: '10px 8px', background: 'transparent', border: 'none',
                borderBottom: isActive ? '2.5px solid #2C6ED5' : '2.5px solid transparent',
                color: isActive ? '#2C6ED5' : '#A0AEC0',
                fontSize: 14, fontWeight: isActive ? 700 : 500,
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}>
                {tab === 'upcoming' ? 'Upcoming' : 'Past'}
                {tab === 'upcoming' && upcomingCount > 0 && (
                  <span style={{
                    marginLeft: 6,
                    background: isActive ? '#2C6ED5' : '#E8EEF7',
                    color: isActive ? '#FFFFFF' : '#6B7C93',
                    fontSize: 10, fontWeight: 700,
                    padding: '1px 7px', borderRadius: 20, display: 'inline-block',
                  }}>
                    {upcomingCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: activeTab === 'upcoming' ? -16 : 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ flex: 1 }}
        >
          {isLoading ? (
            <div style={{ paddingTop: 20 }}>
              {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
            </div>
          ) : hasError ? (
            <ErrorState onRetry={activeTab === 'upcoming' ? fetchUpcoming : fetchPast} />
          ) : isEmpty ? (
            <EmptyState tab={activeTab} onBook={() => navigate('/app/booking')} />
          ) : (
            <div style={{ paddingTop: 16, paddingBottom: 24 }}>
              <AnimatePresence>
                {list.map((appt) => (
                  <AppointmentCard
                    key={appt.id}
                    appt={appt}
                    type={activeTab}
                    onCancel={handleCancel}
                    onBookAgain={() => navigate('/app/booking')}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
