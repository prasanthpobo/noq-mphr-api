import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import dayjs from 'dayjs'
import {
  HiArrowLeft, HiCalendar, HiClock, HiLocationMarker,
  HiUser, HiPhone, HiMail, HiClipboardList,
  HiCurrencyRupee, HiShieldCheck, HiCreditCard, HiLibrary,
} from 'react-icons/hi'
import { MdMedicalServices, MdMonitorHeart, MdEventNote, MdConfirmationNumber, MdPhoneAndroid, MdLocalHospital } from 'react-icons/md'
import { getAppointmentById } from '../../services/bookingService'
import type { Appointment, PrescriptionItem, Vitals } from '../../services/bookingService'
import { getTokens, createToken } from '../../services/queueService'
import type { QueueToken } from '../../services/queueService'
import { formatDoctorName } from '../../services/doctorService'

const BRAND_GRADIENT  = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'
const AVATAR_COLORS   = ['#2C6ED5', '#E05B5B', '#9B59B6', '#1FA3A8', '#E07A5B', '#16A34A', '#D97706']

const STATUS_CFG: Record<string, { dot: string; bg: string; text: string; border: string; label: string }> = {
  scheduled:     { dot: '#22C55E', bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', label: 'Scheduled' },
  'in-progress': { dot: '#3B82F6', bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE', label: 'In Progress' },
  completed:     { dot: '#9CA3AF', bg: '#F9FAFB', text: '#374151', border: '#E5E7EB', label: 'Completed' },
  cancelled:     { dot: '#EF4444', bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', label: 'Cancelled' },
  'no-show':     { dot: '#F59E0B', bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', label: 'No Show' },
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}
function getAvatarColor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

const TOKEN_STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  'waiting':         { label: 'Waiting',        color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE', dot: '#3B82F6' },
  'in-room':         { label: 'In Room',         color: '#92400E', bg: '#FFFBEB', border: '#FDE68A', dot: '#F59E0B' },
  'in-consultation': { label: 'Consulting',      color: '#065F46', bg: '#ECFDF5', border: '#A7F3D0', dot: '#10B981' },
  'completed':       { label: 'Completed',       color: '#374151', bg: '#F9FAFB', border: '#E5E7EB', dot: '#9CA3AF' },
  'cancelled':       { label: 'Cancelled',       color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', dot: '#EF4444' },
  'not-visited':     { label: 'Not Visited',     color: '#4B5563', bg: '#F3F4F6', border: '#E5E7EB', dot: '#9CA3AF' },
  'priority':        { label: 'Priority',        color: '#5B21B6', bg: '#F3EEFF', border: '#DDD6FE', dot: '#7C3AED' },
}

// ── Section Card ──────────────────────────────────────────────────────────────

function SectionCard({ icon, title, iconBg, iconColor, children }: {
  icon: React.ReactNode; title: string; iconBg: string; iconColor: string; children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: '#FFFFFF', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(30,79,163,0.06)', marginBottom: 14 }}
    >
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #F0F4F8', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{title}</span>
      </div>
      {children}
    </motion.div>
  )
}

function InfoRow({ icon, label, value, missing }: {
  icon: React.ReactNode; label: string; value: string; missing?: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: '1px solid #F8FAFC' }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: '#F5F8FC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: missing ? 400 : 600, color: missing ? '#C8D4E0' : '#1A1A1A' }}>{value}</div>
      </div>
    </div>
  )
}

// ── Vitals Grid ───────────────────────────────────────────────────────────────

function VitalsGrid({ vitals }: { vitals: Vitals }) {
  const tiles = [
    { label: 'Blood Pressure', value: vitals.bp, unit: 'mmHg',   color: '#E05B5B', bg: '#FFF0F0' },
    { label: 'Pulse',          value: vitals.pulse?.toString(), unit: 'bpm',    color: '#2C6ED5', bg: '#EBF2FF' },
    { label: 'Temperature',    value: vitals.temp?.toString(),  unit: '°C',     color: '#D97706', bg: '#FFFBEB' },
    { label: 'Weight',         value: vitals.weight?.toString(), unit: 'kg',    color: '#059669', bg: '#ECFDF5' },
    { label: 'Height',         value: vitals.height?.toString(), unit: 'cm',    color: '#7C3AED', bg: '#F3EEFF' },
  ].filter((t) => t.value)

  if (tiles.length === 0) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '14px 16px' }}>
      {tiles.map((t) => (
        <div key={t.label} style={{ background: t.bg, borderRadius: 13, padding: '12px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: t.color, lineHeight: 1 }}>{t.value}</div>
          <div style={{ fontSize: 9, color: t.color, opacity: 0.8, marginTop: 2 }}>{t.unit}</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: t.color, letterSpacing: '0.3px', marginTop: 3, opacity: 0.75 }}>{t.label.toUpperCase()}</div>
        </div>
      ))}
    </div>
  )
}

// ── Prescription Item ─────────────────────────────────────────────────────────

function PrescriptionCard({ item, index }: { item: PrescriptionItem; index: number }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: '1px solid #F8FAFC', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10, background: '#EBF2FF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 800, color: '#2C6ED5', flexShrink: 0,
      }}>
        {index + 1}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 4 }}>{item.medicine}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {item.dosage && (
            <span style={{ fontSize: 11, fontWeight: 600, background: '#EBF2FF', color: '#2C6ED5', borderRadius: 20, padding: '2px 9px' }}>
              {item.dosage}
            </span>
          )}
          {item.duration && (
            <span style={{ fontSize: 11, fontWeight: 600, background: '#ECFDF5', color: '#059669', borderRadius: 20, padding: '2px 9px' }}>
              {item.duration}
            </span>
          )}
        </div>
        {item.instructions && (
          <div style={{ fontSize: 12, color: '#6B7C93', marginTop: 5, lineHeight: 1.4 }}>{item.instructions}</div>
        )}
      </div>
    </div>
  )
}

// ── Payment Card ──────────────────────────────────────────────────────────────

const PLATFORM_FEE = 10
const OTHER_FEE    = 0

const PAY_METHOD_CFG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  upi:        { label: 'UPI',           icon: <MdPhoneAndroid size={15} color="#4CAF50" />, color: '#4CAF50' },
  card:       { label: 'Card',          icon: <HiCreditCard   size={15} color="#2C6ED5" />, color: '#2C6ED5' },
  netbanking: { label: 'Net Banking',   icon: <HiLibrary      size={15} color="#7C3AED" />, color: '#7C3AED' },
  clinic:     { label: 'Pay at Clinic', icon: <MdLocalHospital size={15} color="#D97706" />, color: '#D97706' },
}

const PAY_STATUS_CFG: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
  paid:    { label: 'Paid',    dot: '#16A34A', bg: '#ECFDF5', text: '#065F46', border: '#BBF7D0' },
  pending: { label: 'Pending', dot: '#D97706', bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
  failed:  { label: 'Failed',  dot: '#DC2626', bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
  waived:  { label: 'Waived',  dot: '#6B7C93', bg: '#F5F8FC', text: '#4A5568', border: '#E3EAF2' },
}

function PaymentCard({ consultationFee, paymentMethod, paymentStatus }: {
  consultationFee: number
  paymentMethod?: string | null
  paymentStatus?: string | null
}) {
  const status   = paymentStatus ?? 'pending'
  const psc      = PAY_STATUS_CFG[status] ?? PAY_STATUS_CFG.pending
  const pmCfg    = paymentMethod ? PAY_METHOD_CFG[paymentMethod] : null
  const total    = consultationFee + PLATFORM_FEE + OTHER_FEE

  const feeRows = [
    { label: 'Consultation Fee', amount: consultationFee, icon: <HiCurrencyRupee size={14} color="#2C6ED5" />, iconBg: '#EBF2FF' },
    { label: 'Platform Fee',     amount: PLATFORM_FEE,    icon: <HiShieldCheck   size={14} color="#059669" />, iconBg: '#ECFDF5' },
    { label: 'Other Fee',        amount: OTHER_FEE,       icon: <HiCurrencyRupee size={14} color="#A0AEC0" />, iconBg: '#F5F8FC' },
  ]

  return (
    <SectionCard
      icon={<HiCurrencyRupee size={16} color="#059669" />}
      title="Payment"
      iconBg="#ECFDF5"
      iconColor="#059669"
    >
      {/* Status + method row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #F0F4F8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {pmCfg ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F5F8FC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {pmCfg.icon}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A' }}>{pmCfg.label}</span>
            </div>
          ) : (
            <span style={{ fontSize: 13, fontWeight: 600, color: '#A0AEC0' }}>Method not set</span>
          )}
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 10px',
          background: psc.bg, color: psc.text, border: `1px solid ${psc.border}`,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: psc.dot }} />
          {psc.label}
        </span>
      </div>

      {/* Fee rows */}
      {feeRows.map((row, i) => (
        <div key={row.label} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px',
          borderBottom: i < feeRows.length - 1 ? '1px solid #F8FAFC' : 'none',
        }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: row.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {row.icon}
          </div>
          <span style={{ flex: 1, fontSize: 13, color: '#6B7C93', fontWeight: 500 }}>{row.label}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: row.amount === 0 ? '#C8D4E0' : '#1A1A1A' }}>
            {row.amount === 0 ? '—' : `₹${row.amount}`}
          </span>
        </div>
      ))}

      {/* Total row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', background: BRAND_GRADIENT, margin: '4px 12px 12px', borderRadius: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <HiShieldCheck size={15} color="rgba(255,255,255,0.85)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>Total Payable</span>
        </div>
        <span style={{ fontSize: 20, fontWeight: 900, color: '#FFFFFF' }}>₹{total}</span>
      </div>
    </SectionCard>
  )
}

// ── Token Section ─────────────────────────────────────────────────────────────

function TokenSection({ token, loading, booking, canGetToken, onGetToken }: {
  token: QueueToken | null
  loading: boolean
  booking: boolean
  canGetToken: boolean
  onGetToken: () => void
}) {
  const tsc = token ? (TOKEN_STATUS_CFG[token.status] ?? TOKEN_STATUS_CFG['waiting']) : null

  return (
    <SectionCard
      icon={<MdConfirmationNumber size={16} color="#7C3AED" />}
      title="Queue Token"
      iconBg="#F3EEFF"
      iconColor="#7C3AED"
    >
      {loading ? (
        <div style={{ padding: '16px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: '#F0F4F8', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: '50%', height: 14, borderRadius: 6, background: '#F0F4F8', marginBottom: 8 }} />
            <div style={{ width: '70%', height: 12, borderRadius: 6, background: '#F0F4F8', marginBottom: 6 }} />
            <div style={{ width: '40%', height: 12, borderRadius: 6, background: '#F0F4F8' }} />
          </div>
        </div>
      ) : token && tsc ? (
        <div style={{ padding: '16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Token number bubble */}
            <div style={{
              width: 76, height: 76, borderRadius: 20, flexShrink: 0,
              background: BRAND_GRADIENT,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(44,110,213,0.30)',
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Token</span>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#FFFFFF', lineHeight: 1.1 }}>
                {token.tokenNumber}
              </span>
            </div>

            {/* Right info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Status badge */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 10px',
                background: tsc.bg, color: tsc.color, border: `1px solid ${tsc.border}`,
                marginBottom: 8,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: tsc.dot }} />
                {tsc.label}
              </span>

              {/* Priority badge */}
              {token.priority !== 'normal' && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '2px 8px',
                  background: token.priority === 'emergency' ? '#FEF2F2' : '#F3EEFF',
                  color: token.priority === 'emergency' ? '#DC2626' : '#5B21B6',
                  border: `1px solid ${token.priority === 'emergency' ? '#FECACA' : '#DDD6FE'}`,
                  marginLeft: 6, marginBottom: 8,
                }}>
                  {token.priority === 'emergency' ? '🚨 Emergency' : '⭐ Priority'}
                </span>
              )}

              {/* Issued at */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6B7C93' }}>
                <HiClock size={13} color="#2C6ED5" />
                <span>Issued {dayjs(token.issuedAt).format('h:mm A')}</span>
              </div>

              {/* Called at */}
              {token.calledAt && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6B7C93', marginTop: 3 }}>
                  <HiCheckCircle size={13} color="#10B981" />
                  <span>Called {dayjs(token.calledAt).format('h:mm A')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes if any */}
          {token.notes && (
            <div style={{ marginTop: 12, padding: '10px 12px', background: '#F5F8FC', borderRadius: 10, fontSize: 13, color: '#3D4A5B', lineHeight: 1.5 }}>
              {token.notes}
            </div>
          )}
        </div>
      ) : canGetToken ? (
        /* No token yet — eligible to get one */
        <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, background: '#F3EEFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
          }}>
            <MdConfirmationNumber size={30} color="#C4B5FD" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#3D4A5B', marginBottom: 5 }}>No queue token yet</div>
          <div style={{ fontSize: 12, color: '#A0AEC0', lineHeight: 1.6, maxWidth: 230, marginBottom: 20 }}>
            Book a token to get your queue number for this appointment
          </div>
          <button
            onClick={onGetToken}
            disabled={booking}
            style={{
              height: 48, paddingLeft: 28, paddingRight: 28,
              borderRadius: 14, border: 'none',
              background: booking ? '#E3EAF2' : BRAND_GRADIENT,
              color: booking ? '#A0AEC0' : '#FFFFFF',
              fontSize: 14, fontWeight: 700,
              cursor: booking ? 'not-allowed' : 'pointer',
              boxShadow: booking ? 'none' : '0 6px 18px rgba(44,110,213,0.32)',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <MdConfirmationNumber size={17} />
            {booking ? 'Booking Token…' : 'Get Queue Token'}
          </button>
        </div>
      ) : null}
    </SectionCard>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function AppointmentDetailScreen() {
  const navigate  = useNavigate()
  const { id }    = useParams<{ id: string }>()
  const location  = useLocation()

  const stateAppt = (location.state as { appointment?: Appointment } | null)?.appointment ?? null
  const [appt, setAppt]       = useState<Appointment | null>(stateAppt)
  const [loading, setLoading] = useState(!stateAppt)
  const [error, setError]     = useState(false)
  const [token, setToken]               = useState<QueueToken | null>(null)
  const [tokenLoading, setTokenLoading] = useState(true)
  const [bookingToken, setBookingToken] = useState(false)
  const [tokenError, setTokenError]     = useState<string | null>(null)

  useEffect(() => {
    if (stateAppt || !id) return
    getAppointmentById(id)
      .then((r) => setAppt(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    const apptId = appt?._id
    if (!apptId) return
    setTokenLoading(true)
    getTokens({ appointmentId: apptId })
      .then((r) => setToken(r.data[0] ?? null))
      .catch(() => setToken(null))
      .finally(() => setTokenLoading(false))
  }, [appt?._id])

  const handleGetToken = async () => {
    if (!appt) return
    setBookingToken(true)
    setTokenError(null)
    try {
      const patientId = typeof appt.patientId === 'object' ? appt.patientId._id : appt.patientId
      const doctorId  = typeof appt.doctorId  === 'object' ? appt.doctorId._id  : appt.doctorId
      const clinicId  = typeof appt.clinicId  === 'object' ? appt.clinicId._id  : appt.clinicId
      const r = await createToken({ patientId, doctorId, clinicId, appointmentId: appt._id })
      setToken(r.data)
    } catch (e: unknown) {
      setTokenError(e instanceof Error ? e.message : 'Failed to book token. Please try again.')
    } finally {
      setBookingToken(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: '#F5F8FC', fontFamily: 'Roboto, system-ui, sans-serif' }}>
        <div style={{ background: '#FFFFFF', padding: '12px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F0F4F8' }}>
          <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F8FC', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HiArrowLeft size={18} color="#1A1A1A" />
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>Appointment Details</span>
          <div style={{ width: 36 }} />
        </div>
        <div style={{ padding: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: i === 1 ? 180 : 100, background: '#FFFFFF', borderRadius: 20, marginBottom: 14, boxShadow: '0 2px 12px rgba(30,79,163,0.05)' }} />
          ))}
        </div>
      </div>
    )
  }

  if (error || !appt) {
    return (
      <div style={{ minHeight: '100dvh', background: '#F5F8FC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Roboto, system-ui, sans-serif' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>Failed to load appointment</div>
        <button onClick={() => navigate(-1)} style={{ height: 44, padding: '0 24px', borderRadius: 12, border: 'none', background: BRAND_GRADIENT, color: '#FFFFFF', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          Go Back
        </button>
      </div>
    )
  }

  const doc       = typeof appt.doctorId  === 'object' ? appt.doctorId  : null
  const clinic    = typeof appt.clinicId  === 'object' ? appt.clinicId  : null
  const patient   = typeof appt.patientId === 'object' ? appt.patientId : null

  const docName    = doc ? formatDoctorName(doc.name) : 'Doctor'
  const initials   = doc ? getInitials(doc.name) : 'DR'
  const avatarColor = doc?._id ? getAvatarColor(doc._id) : '#2C6ED5'
  const sc         = STATUS_CFG[appt.status] ?? STATUS_CFG.scheduled
  const dateLabel  = dayjs(appt.date).format('dddd, D MMMM YYYY')
  const hasVitals  = appt.vitals && Object.values(appt.vitals).some(Boolean)
  const hasRx      = appt.prescription && appt.prescription.length > 0
  const hasSymptoms = appt.symptoms && appt.symptoms.length > 0
  const typeLabel  = appt.type ? appt.type.charAt(0).toUpperCase() + appt.type.slice(1).replace('-', ' ') : 'Consultation'
  const isToday    = dayjs(appt.date).isSame(dayjs(), 'day')
  const isTokenEligible = isToday && appt.status === 'scheduled'

  return (
    <div style={{ minHeight: '100dvh', background: '#F5F8FC', fontFamily: 'Roboto, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* ── White nav bar ─────────────────────────────────────────────────── */}
      <div style={{
        background: '#FFFFFF', padding: '12px 16px 10px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #F0F4F8',
      }}>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F8FC', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HiArrowLeft size={18} color="#1A1A1A" />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>Appointment Details</span>
        {/* Status badge */}
        <span style={{
          fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '4px 10px',
          background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }} />
          {sc.label}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 32px' }}>

        {/* ── Single merged hero card ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}
          style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(30,79,163,0.14)', marginBottom: 14 }}
        >
          {/* Gradient section */}
          <div style={{ background: BRAND_GRADIENT, padding: '20px 18px 22px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
              {/* Doctor avatar */}
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: `${avatarColor}33`, border: `3px solid ${avatarColor}66`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                fontSize: 20, fontWeight: 800, color: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', marginBottom: 2 }}>{docName}</div>
                {doc?.specialization && (
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', marginBottom: 10 }}>{doc.specialization}</div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, borderRadius: 20, padding: '3px 10px', background: 'rgba(255,255,255,0.20)', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <HiCalendar size={11} /> {dayjs(appt.date).format('D MMM YYYY')}
                  </span>
                  {appt.time && (
                    <span style={{ fontSize: 12, fontWeight: 600, borderRadius: 20, padding: '3px 10px', background: 'rgba(255,255,255,0.20)', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <HiClock size={11} /> {appt.time}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* White info rows */}
          <div style={{ background: '#FFFFFF' }}>
            {clinic && (
              <InfoRow
                icon={<HiLocationMarker size={15} color="#E05B5B" />}
                label="Clinic"
                value={[clinic.name, clinic.address].filter(Boolean).join(' · ')}
              />
            )}
            {patient && (
              <InfoRow
                icon={<HiUser size={15} color="#2C6ED5" />}
                label="Patient"
                value={patient.name}
              />
            )}
            <InfoRow
              icon={<MdEventNote size={15} color="#7C3AED" />}
              label="Type"
              value={typeLabel}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#F5F8FC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <HiCalendar size={15} color="#059669" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Date & Time</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>
                  {dateLabel}{appt.time ? ` · ${appt.time}` : ''}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Payment ────────────────────────────────────────────────────── */}
        <PaymentCard
          consultationFee={doc?.consultationFee ?? 0}
          paymentMethod={(appt as unknown as { paymentMethod?: string }).paymentMethod}
          paymentStatus={(appt as unknown as { paymentStatus?: string }).paymentStatus}
        />

        {/* ── Queue Token — only shown when today + scheduled, or a token already exists ── */}
        {(isTokenEligible || token) && (
          <>
            <TokenSection token={token} loading={tokenLoading} booking={bookingToken} canGetToken={isTokenEligible} onGetToken={handleGetToken} />
            {tokenError && (
              <div style={{
                background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 12,
                padding: '11px 14px', marginBottom: 14, fontSize: 13, fontWeight: 600, color: '#B91C1C',
              }}>
                ⚠️ {tokenError}
              </div>
            )}
          </>
        )}

        {/* ── Doctor contact (if available) ──────────────────────────────── */}
        {doc && (doc.phone || doc.email) && (
          <SectionCard icon={<HiUser size={15} color="#2C6ED5" />} title="Doctor Contact" iconBg="#EBF2FF" iconColor="#2C6ED5">
            {doc.phone && (
              <InfoRow icon={<HiPhone size={14} color="#2C6ED5" />} label="Phone" value={doc.phone} />
            )}
            {doc.email && (
              <InfoRow icon={<HiMail size={14} color="#6B7C93" />} label="Email" value={doc.email} />
            )}
          </SectionCard>
        )}

        {/* ── Vitals ──────────────────────────────────────────────────────── */}
        {hasVitals && (
          <SectionCard icon={<MdMonitorHeart size={16} color="#E05B5B" />} title="Vitals" iconBg="#FFF0F0" iconColor="#E05B5B">
            <VitalsGrid vitals={appt.vitals!} />
          </SectionCard>
        )}

        {/* ── Prescription ────────────────────────────────────────────────── */}
        {hasRx && (
          <SectionCard icon={<MdMedicalServices size={16} color="#059669" />} title="Prescription" iconBg="#ECFDF5" iconColor="#059669">
            {appt.prescription!.map((item, i) => (
              <PrescriptionCard key={i} item={item} index={i} />
            ))}
          </SectionCard>
        )}

        {/* ── Symptoms & Notes ────────────────────────────────────────────── */}
        {(hasSymptoms || appt.notes) && (
          <SectionCard icon={<HiClipboardList size={16} color="#D97706" />} title="Symptoms & Notes" iconBg="#FFFBEB" iconColor="#D97706">
            {hasSymptoms && (
              <div style={{ padding: '12px 16px', borderBottom: appt.notes ? '1px solid #F8FAFC' : 'none' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Symptoms</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {appt.symptoms!.map((s) => (
                    <span key={s} style={{ fontSize: 12, fontWeight: 600, background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A', borderRadius: 20, padding: '3px 10px' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {appt.notes && (
              <div style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Notes</div>
                <div style={{ fontSize: 14, color: '#3D4A5B', lineHeight: 1.6 }}>{appt.notes}</div>
              </div>
            )}
          </SectionCard>
        )}

        {/* ── Booked on ───────────────────────────────────────────────────── */}
        {appt.createdAt && (
          <div style={{ textAlign: 'center', fontSize: 11, color: '#C8D4E0', fontWeight: 500, marginBottom: 8 }}>
            Booked on {dayjs(appt.createdAt).format('D MMM YYYY [at] h:mm A')}
          </div>
        )}

      </div>

    </div>
  )
}
