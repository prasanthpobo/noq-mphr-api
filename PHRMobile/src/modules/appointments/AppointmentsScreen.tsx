import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import dayjs from 'dayjs'
import {
  HiArrowLeft,
  HiLocationMarker,
  HiClock,
  HiCalendar,
  HiRefresh,
  HiDocumentText,
  HiArrowRight,
  HiX,
  HiTrash,
  HiCheck,
} from 'react-icons/hi'
import { MdEventNote, MdEdit } from 'react-icons/md'
import { getMyAppointments, updateAppointment, getSlots } from '../../services/bookingService'
import type { Appointment as ServerAppointment } from '../../services/bookingService'
import ModalSheet from '../../components/ModalSheet'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'
const AVATAR_COLORS  = ['#2C6ED5', '#E05B5B', '#9B59B6', '#1FA3A8', '#E07A5B', '#16A34A', '#D97706']

// ── Types ─────────────────────────────────────────────────────────────────────

type DisplayStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled'

interface DisplayAppointment {
  id: string
  doctorId: string
  doctorName: string
  doctorInitials: string
  doctorColor: string
  specialty: string
  clinic: string
  date: string
  time: string
  patientName: string
  status: DisplayStatus
  rawStatus: string
  consultationFee?: number
}

function toDisplay(a: ServerAppointment, idx: number): DisplayAppointment {
  const doc     = typeof a.doctorId  === 'object' ? a.doctorId  : null
  const clinic  = typeof a.clinicId  === 'object' ? a.clinicId  : null
  const patient = typeof a.patientId === 'object' ? a.patientId : null

  const doctorName = doc ? doc.name : 'Unknown Doctor'
  const words      = doctorName.split(' ')
  const initials   = ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase()

  const statusMap: Record<string, DisplayStatus> = {
    scheduled:     'Scheduled',
    'in-progress': 'In Progress',
    completed:     'Completed',
    cancelled:     'Cancelled',
    'no-show':     'Cancelled',
  }

  return {
    id:             a._id,
    doctorId:       doc?._id ?? (typeof a.doctorId === 'string' ? a.doctorId : ''),
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
    consultationFee: (doc as Record<string, unknown>)?.consultationFee as number | undefined,
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

const STATUS_CFG: Record<DisplayStatus, { dot: string; bg: string; text: string; border: string }> = {
  'Scheduled':   { dot: '#22C55E', bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  'In Progress': { dot: '#3B82F6', bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
  'Completed':   { dot: '#9CA3AF', bg: '#F9FAFB', text: '#374151', border: '#E5E7EB' },
  'Cancelled':   { dot: '#EF4444', bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
}

// ── Reschedule Modal ──────────────────────────────────────────────────────────

function RescheduleModal({
  appt, onClose, onRescheduled,
}: {
  appt: DisplayAppointment
  onClose: () => void
  onRescheduled: (id: string, date: string, time: string) => void
}) {
  const today = dayjs().format('YYYY-MM-DD')
  const [selectedDate, setSelectedDate] = useState(appt.date > today ? appt.date : today)
  const [selectedTime, setSelectedTime] = useState('')
  const [slots, setSlots]               = useState<{ time: string; available: boolean }[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState<string | null>(null)

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = dayjs().add(i, 'day')
    return { key: d.format('YYYY-MM-DD'), dayName: d.format('ddd'), dateNum: d.format('D'), month: d.format('MMM') }
  })

  useEffect(() => {
    if (!appt.doctorId || !selectedDate) return
    setLoadingSlots(true)
    setSelectedTime('')
    setSlots([])
    getSlots(appt.doctorId, selectedDate)
      .then((r) => setSlots(r.data))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [appt.doctorId, selectedDate])

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return
    setSaving(true); setError(null)
    try {
      await updateAppointment(appt.id, { date: selectedDate, time: selectedTime })
      onRescheduled(appt.id, selectedDate, selectedTime)
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to reschedule. Please try again.')
    } finally {
      setSaving(false) }
  }

  const canConfirm = !!selectedDate && !!selectedTime && !saving

  return (
    <ModalSheet isOpen onClose={onClose}>
      {/* Handle */}
      <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E3EAF2', margin: '0 auto 20px' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>Reschedule</h2>
          <p style={{ fontSize: 12, color: '#6B7C93', margin: '3px 0 0' }}>Pick a new date and time</p>
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F5F8FC', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HiX size={18} color="#6B7C93" />
        </button>
      </div>

      {/* Current appointment info */}
      <div style={{ background: '#F5F8FC', borderRadius: 14, padding: '12px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: `${appt.doctorColor}22`, border: `2px solid ${appt.doctorColor}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800, color: appt.doctorColor,
        }}>
          {appt.doctorInitials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{appt.doctorName}</div>
          {appt.specialty && <div style={{ fontSize: 12, color: '#2C6ED5', fontWeight: 600, marginTop: 1 }}>{appt.specialty}</div>}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: '#A0AEC0', fontWeight: 600 }}>Current</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7C93', marginTop: 2 }}>
            {dayjs(appt.date).format('D MMM')} {appt.time && `· ${appt.time}`}
          </div>
        </div>
      </div>

      {/* Date picker */}
      <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>
        Select New Date
      </div>
      <div style={{ overflowX: 'auto', display: 'flex', gap: 8, paddingBottom: 4, marginBottom: 20, scrollbarWidth: 'none' }}>
        {days.map((day) => {
          const isSel = selectedDate === day.key
          return (
            <button key={day.key} onClick={() => setSelectedDate(day.key)} style={{
              flexShrink: 0, width: 56, padding: '9px 4px', borderRadius: 13,
              border: isSel ? 'none' : '1.5px solid #E3EAF2',
              background: isSel ? BRAND_GRADIENT : '#FFFFFF',
              color: isSel ? '#FFFFFF' : '#1A1A1A',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              boxShadow: isSel ? '0 4px 12px rgba(44,110,213,0.30)' : 'none',
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, opacity: isSel ? 0.85 : 0.55 }}>{day.dayName}</span>
              <span style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.1 }}>{day.dateNum}</span>
              <span style={{ fontSize: 9, fontWeight: 600, opacity: isSel ? 0.85 : 0.55 }}>{day.month}</span>
            </button>
          )
        })}
      </div>

      {/* Time slots */}
      <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>
        Available Slots
      </div>
      {loadingSlots ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
          {[0,1,2,3,4,5].map((i) => <div key={i} style={{ height: 40, background: '#F5F8FC', borderRadius: 10 }} />)}
        </div>
      ) : slots.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#A0AEC0', fontSize: 13, padding: '16px 0', marginBottom: 20 }}>
          No slots available for this date
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
          {slots.map((slot) => {
            const isSel = selectedTime === slot.time
            return (
              <button key={slot.time} disabled={!slot.available}
                onClick={() => slot.available && setSelectedTime(slot.time)}
                style={{
                  padding: '10px 4px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                  border: !slot.available ? '1.5px solid #F0F4F8' : isSel ? 'none' : '1.5px solid #2C6ED5',
                  background: !slot.available ? '#F8FAFC' : isSel ? BRAND_GRADIENT : '#FFFFFF',
                  color: !slot.available ? '#D1D9E6' : isSel ? '#FFFFFF' : '#2C6ED5',
                  cursor: slot.available ? 'pointer' : 'not-allowed',
                  textDecoration: !slot.available ? 'line-through' : 'none',
                  boxShadow: isSel ? '0 4px 12px rgba(44,110,213,0.28)' : 'none',
                  transition: 'all 0.15s',
                }}>
                {slot.time}
              </button>
            )
          })}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: '#FEE2E2', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#B91C1C', display: 'flex', alignItems: 'center', gap: 8 }}>
          <HiX size={14} /> {error}
        </div>
      )}

      {/* Confirm button */}
      <button onClick={handleConfirm} disabled={!canConfirm} style={{
        width: '100%', height: 52, borderRadius: 14, border: 'none',
        background: canConfirm ? BRAND_GRADIENT : '#E3EAF2',
        color: canConfirm ? '#FFFFFF' : '#A0AEC0',
        fontSize: 15, fontWeight: 700,
        cursor: canConfirm ? 'pointer' : 'not-allowed',
        boxShadow: canConfirm ? '0 4px 16px rgba(44,110,213,0.35)' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'all 0.2s',
      }}>
        {saving ? 'Saving…' : <><HiCheck size={16} /> Confirm Reschedule</>}
      </button>
    </ModalSheet>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 12, boxShadow: '0 2px 12px rgba(30,79,163,0.06)', overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: '#E8EEF7' }} />
      <div style={{ paddingLeft: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ width: 90, height: 24, borderRadius: 20, background: '#F0F4F8' }} />
          <div style={{ width: 80, height: 24, borderRadius: 20, background: '#F0F4F8' }} />
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F0F4F8', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: '55%', height: 16, borderRadius: 6, background: '#F0F4F8', marginBottom: 8 }} />
            <div style={{ width: '38%', height: 13, borderRadius: 6, background: '#F0F4F8' }} />
          </div>
        </div>
        <div style={{ height: 1, background: '#EEF2F7', marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, height: 38, borderRadius: 10, background: '#F0F4F8' }} />
          <div style={{ flex: 1, height: 38, borderRadius: 10, background: '#F0F4F8' }} />
        </div>
      </div>
    </div>
  )
}

// ── Appointment Card ──────────────────────────────────────────────────────────

function AppointmentCard({
  appt, type, onCancel, onBookAgain, onReschedule, onOpen,
}: {
  appt: DisplayAppointment
  type: 'upcoming' | 'past'
  onCancel: (id: string) => void
  onBookAgain: () => void
  onReschedule: (appt: DisplayAppointment) => void
  onOpen: (appt: DisplayAppointment) => void
}) {
  const sc          = STATUS_CFG[appt.status]
  const dateLabel   = formatDateLabel(appt.date)
  const isToday     = dateLabel === 'Today'
  const isTomorrow  = dateLabel === 'Tomorrow'
  const isCancelled = appt.status === 'Cancelled'
  const stripColor  = isCancelled ? '#EF4444' : type === 'upcoming' ? appt.doctorColor : '#9CA3AF'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      style={{
        background: '#FFFFFF', borderRadius: 20, marginBottom: 12,
        boxShadow: '0 2px 14px rgba(30,79,163,0.08)',
        overflow: 'hidden', position: 'relative',
        opacity: isCancelled ? 0.75 : 1,
      }}
    >
      {/* Full-height left colour strip */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: stripColor }} />

      <div style={{ padding: '14px 14px 10px 18px' }}>

        {/* Top row: date pill + status badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{
            background: isToday ? BRAND_GRADIENT : isTomorrow ? '#EEF5FF' : type === 'past' ? '#F1F5F9' : '#EEF5FF',
            color: isToday ? '#FFFFFF' : isTomorrow ? '#2C6ED5' : type === 'past' ? '#64748B' : '#2C6ED5',
            fontSize: 12, fontWeight: 700, padding: '4px 11px', borderRadius: 20,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <HiCalendar size={12} /> {dateLabel}
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 10px',
            background: sc.bg, color: sc.text,
            display: 'inline-flex', alignItems: 'center', gap: 4,
            border: `1px solid ${sc.border}`,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }} />
            {appt.status}
          </span>
        </div>

        {/* Doctor row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 14, flexShrink: 0,
            background: `${appt.doctorColor}22`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${appt.doctorColor}33`,
          }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: appt.doctorColor }}>{appt.doctorInitials}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>{appt.doctorName}</div>
            {appt.specialty && (
              <div style={{ fontSize: 12, color: '#2C6ED5', fontWeight: 600, marginTop: 2 }}>{appt.specialty}</div>
            )}
          </div>
          {appt.consultationFee !== undefined && (
            <div style={{
              background: '#F0FDF4', borderRadius: 10, padding: '4px 10px',
              fontSize: 14, fontWeight: 800, color: '#15803D', flexShrink: 0,
            }}>
              RM {appt.consultationFee}
            </div>
          )}
        </div>

        {/* Meta chips */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 8,
          padding: '10px 12px', background: '#F5F8FC', borderRadius: 12, marginBottom: 12,
        }}>
          {appt.time && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#4A5568' }}>
              <HiClock size={13} color="#2C6ED5" />
              <span style={{ fontWeight: 600 }}>{appt.time}</span>
            </div>
          )}
          {appt.clinic && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#4A5568' }}>
              <HiLocationMarker size={13} color="#E05B5B" />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{appt.clinic}</span>
            </div>
          )}
          {appt.patientName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#4A5568' }}>
              <span style={{ fontWeight: 700, color: '#6B7C93' }}>For:</span>
              <span style={{ fontWeight: 600 }}>{appt.patientName}</span>
            </div>
          )}
        </div>

      </div>

      {/* ── Action row (Family Members style) ── */}
      <div style={{ display: 'flex', borderTop: '1px solid #F0F4F8' }}>
        {type === 'upcoming' && !isCancelled ? (
          <>
            {[
              { label: 'Reschedule', icon: <MdEdit size={14} />,        color: '#2C6ED5', action: () => onReschedule(appt) },
              { label: 'Open',       icon: <HiDocumentText size={14} />, color: '#6B7C93', action: () => onOpen(appt) },
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
            <button onClick={() => onCancel(appt.id)} style={{
              width: 46, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', borderLeft: '1px solid #F0F4F8', cursor: 'pointer',
            }}>
              <HiTrash size={15} color="#FCA5A5" />
            </button>
          </>
        ) : (
          <>
            {[
              { label: 'Book Again', icon: <HiRefresh size={14} />,      color: '#2C6ED5', action: onBookAgain },
              { label: 'Open',      icon: <HiDocumentText size={14} />,  color: '#6B7C93', action: () => onOpen(appt) },
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
          </>
        )}
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
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 32px', textAlign: 'center' }}
    >
      <div style={{
        width: 88, height: 88, borderRadius: '50%',
        background: '#EBF2FF',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
      }}>
        <HiCalendar size={40} color="#2C6ED5" />
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1A1A1A', margin: '0 0 8px' }}>
        {tab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
      </h3>
      <p style={{ fontSize: 13, color: '#6B7C93', margin: '0 0 24px', lineHeight: 1.6 }}>
        {tab === 'upcoming'
          ? 'Book your first appointment with a trusted doctor near you'
          : 'Your completed appointments will appear here'}
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

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function AppointmentsScreen() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
  const [upcoming, setUpcoming]   = useState<DisplayAppointment[]>([])
  const [past, setPast]           = useState<DisplayAppointment[]>([])
  const [loadingUpcoming, setLoadingUpcoming] = useState(true)
  const [loadingPast, setLoadingPast]         = useState(true)
  const [errorUpcoming, setErrorUpcoming]     = useState(false)
  const [errorPast, setErrorPast]             = useState(false)
  const [rescheduleTarget, setRescheduleTarget] = useState<DisplayAppointment | null>(null)
  const [rescheduledToast, setRescheduledToast] = useState(false)
  const [cancelTarget, setCancelTarget]         = useState<string | null>(null)
  const [cancelling, setCancelling]             = useState(false)

  const fetchUpcoming = useCallback(() => {
    setLoadingUpcoming(true); setErrorUpcoming(false)
    getMyAppointments('upcoming')
      .then((r) => setUpcoming(r.data.map((a, i) => toDisplay(a, i))))
      .catch(() => setErrorUpcoming(true))
      .finally(() => setLoadingUpcoming(false))
  }, [])

  const fetchPast = useCallback(() => {
    setLoadingPast(true); setErrorPast(false)
    getMyAppointments('past')
      .then((r) => setPast(r.data.map((a, i) => toDisplay(a, i))))
      .catch(() => setErrorPast(true))
      .finally(() => setLoadingPast(false))
  }, [])

  useEffect(() => { fetchUpcoming() }, [fetchUpcoming])
  useEffect(() => { fetchPast() }, [fetchPast])

  const handleCancel = (id: string) => setCancelTarget(id)

  const confirmCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await updateAppointment(cancelTarget, { status: 'cancelled' })
      setUpcoming((prev) => prev.map((a) =>
        a.id === cancelTarget ? { ...a, status: 'Cancelled' as DisplayStatus, rawStatus: 'cancelled' } : a
      ))
    } catch { /* silently fail */ }
    finally {
      setCancelling(false)
      setCancelTarget(null)
    }
  }

  const handleRescheduled = (id: string, date: string, time: string) => {
    setUpcoming((prev) => prev.map((a) =>
      a.id === id ? { ...a, date, time } : a
    ))
    setRescheduledToast(true)
    setTimeout(() => setRescheduledToast(false), 2500)
  }

  const upcomingActive = upcoming.filter((a) => a.rawStatus !== 'cancelled').length
  const completedCount = past.filter((a) => a.status === 'Completed').length
  const totalCount     = upcoming.length + past.length

  const isLoading = activeTab === 'upcoming' ? loadingUpcoming : loadingPast
  const hasError  = activeTab === 'upcoming' ? errorUpcoming   : errorPast
  const list      = activeTab === 'upcoming' ? upcoming        : past
  const isEmpty   = !isLoading && !hasError && list.length === 0

  return (
    <div style={{ minHeight: '100dvh', background: '#F5F8FC', fontFamily: 'Roboto, system-ui, sans-serif', display: 'flex', flexDirection: 'column', position: 'relative' }}>

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
        <span style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>Appointments</span>
        <button onClick={() => navigate('/app/booking')} style={{
          height: 36, borderRadius: 20, background: BRAND_GRADIENT, border: 'none', cursor: 'pointer',
          padding: '0 14px', fontSize: 13, fontWeight: 700, color: '#FFFFFF',
          display: 'flex', alignItems: 'center', gap: 4,
          boxShadow: '0 4px 12px rgba(44,110,213,0.35)',
        }}>
          + Book
        </button>
      </div>

      {/* Reschedule success toast */}
      <AnimatePresence>
        {rescheduledToast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{
              position: 'absolute', top: 64, left: 16, right: 16, zIndex: 50,
              background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12,
              padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 13, fontWeight: 600, color: '#15803D',
              boxShadow: '0 4px 16px rgba(21,128,61,0.15)',
            }}
          >
            <HiCheck size={16} /> Appointment rescheduled successfully
          </motion.div>
        )}
      </AnimatePresence>

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
                <MdEventNote size={28} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', marginBottom: 3 }}>My Appointments</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', marginBottom: 10 }}>Track all your visits in one place</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, borderRadius: 20, padding: '3px 10px', background: 'rgba(255,255,255,0.20)', color: '#FFFFFF' }}>
                    {upcomingActive} Upcoming
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, borderRadius: 20, padding: '3px 10px', background: 'rgba(255,255,255,0.20)', color: '#FFFFFF' }}>
                    {totalCount} Total
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* White stats + tab toggle */}
          <div style={{ background: '#FFFFFF', padding: 16 }}>
            {/* Stats row */}
            <div style={{ display: 'flex', marginBottom: 14 }}>
              {[
                { value: upcomingActive, label: 'UPCOMING',  cfg: { dot: '#22C55E', bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' } },
                { value: completedCount, label: 'COMPLETED', cfg: { dot: '#9CA3AF', bg: '#F9FAFB', text: '#374151', border: '#E5E7EB' } },
                { value: upcoming.filter((a) => a.status === 'Cancelled').length, label: 'CANCELLED', cfg: { dot: '#EF4444', bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' } },
              ].map((s, i) => (
                <div key={s.label} style={{
                  flex: 1, textAlign: 'center', padding: '11px 4px',
                  background: s.cfg.bg, borderRadius: 14,
                  border: `1.5px solid ${s.cfg.border}`,
                  margin: i === 1 ? '0 8px' : 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.cfg.dot }} />
                    <span style={{ fontSize: 22, fontWeight: 800, color: s.cfg.text, lineHeight: 1 }}>{s.value}</span>
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: s.cfg.text, letterSpacing: '0.5px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Tab toggle pills */}
            <div style={{ display: 'flex', background: '#F5F8FC', borderRadius: 12, padding: 4, gap: 4 }}>
              {(['upcoming', 'past'] as const).map((tab) => {
                const isActive = activeTab === tab
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={{
                    flex: 1, height: 36, borderRadius: 9,
                    border: 'none', cursor: 'pointer',
                    background: isActive ? BRAND_GRADIENT : 'transparent',
                    color: isActive ? '#FFFFFF' : '#6B7C93',
                    fontSize: 13, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    boxShadow: isActive ? '0 3px 10px rgba(44,110,213,0.30)' : 'none',
                    transition: 'all 0.2s',
                  }}>
                    {tab === 'upcoming' ? 'Upcoming' : 'Past'}
                    {tab === 'upcoming' && upcomingActive > 0 && (
                      <span style={{
                        fontSize: 10, fontWeight: 800,
                        background: isActive ? 'rgba(255,255,255,0.25)' : '#EBF2FF',
                        color: isActive ? '#FFFFFF' : '#2C6ED5',
                        borderRadius: 20, padding: '1px 7px',
                      }}>
                        {upcomingActive}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* ── List ──────────────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === 'upcoming' ? -12 : 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {isLoading ? (
              <>{[0, 1, 2].map((i) => <CardSkeleton key={i} />)}</>
            ) : hasError ? (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>Failed to load</div>
                <div style={{ fontSize: 13, color: '#6B7C93', marginBottom: 20 }}>Check your connection and try again</div>
                <button onClick={activeTab === 'upcoming' ? fetchUpcoming : fetchPast} style={{
                  height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 12,
                  border: 'none', background: BRAND_GRADIENT, color: '#FFFFFF',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}>Retry</button>
              </div>
            ) : isEmpty ? (
              <EmptyState tab={activeTab} onBook={() => navigate('/app/booking')} />
            ) : (
              <AnimatePresence>
                {list.map((appt, idx) => (
                  <motion.div key={appt.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                    <AppointmentCard
                      appt={appt}
                      type={activeTab}
                      onCancel={handleCancel}
                      onBookAgain={() => navigate('/app/booking')}
                      onReschedule={setRescheduleTarget}
                      onOpen={(a) => navigate(`/app/appointments/${a.id}`)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Reschedule modal */}
      {rescheduleTarget && (
        <RescheduleModal
          appt={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onRescheduled={handleRescheduled}
        />
      )}

      {/* Cancel confirmation portal */}
      {cancelTarget && createPortal(
        <div
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.50)', zIndex: 950, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, pointerEvents: 'all' }}
          onClick={() => !cancelling && setCancelTarget(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#FFFFFF', borderRadius: 24, padding: '28px 24px 24px', width: '100%', maxWidth: 300, textAlign: 'center' }}
          >
            {/* Icon */}
            <div style={{ width: 64, height: 64, borderRadius: 20, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <HiTrash size={28} color="#DC2626" />
            </div>

            <div style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A', marginBottom: 8 }}>
              Cancel Appointment?
            </div>
            <div style={{ fontSize: 13, color: '#6B7C93', lineHeight: 1.6, marginBottom: 24 }}>
              This action cannot be undone. Are you sure you want to cancel this appointment?
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
                style={{ flex: 1, height: 48, borderRadius: 14, border: '1.5px solid #E8EDF2', background: '#F5F8FC', color: '#4A5568', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
              >
                No, Keep
              </button>
              <button
                onClick={confirmCancel}
                disabled={cancelling}
                style={{ flex: 1, height: 48, borderRadius: 14, border: 'none', background: '#DC2626', color: '#FFFFFF', fontSize: 15, fontWeight: 700, cursor: cancelling ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(220,38,38,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                {cancelling ? (
                  <motion.span
                    animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                    style={{ display: 'inline-block', width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#FFFFFF', borderRadius: '50%' }}
                  />
                ) : 'Yes, Cancel'}
              </button>
            </div>
          </motion.div>
        </div>,
        document.getElementById('modal-portal') || document.body
      )}
    </div>
  )
}
