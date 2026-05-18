import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import dayjs from 'dayjs'
import {
  HiArrowLeft, HiClock, HiLocationMarker, HiRefresh, HiCheckCircle,
} from 'react-icons/hi'
import { MdConfirmationNumber, MdEventNote } from 'react-icons/md'
import { getMyAppointments } from '../../services/bookingService'
import { getTokens, assignTodayTokens } from '../../services/queueService'
import type { Appointment } from '../../services/bookingService'
import type { QueueToken } from '../../services/queueService'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'
const AVATAR_COLORS  = ['#2C6ED5', '#E05B5B', '#9B59B6', '#1FA3A8', '#E07A5B', '#16A34A', '#D97706']

const TOKEN_STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  'waiting':         { label: 'Waiting',       color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE', dot: '#3B82F6' },
  'in-room':         { label: 'In Room',        color: '#92400E', bg: '#FFFBEB', border: '#FDE68A', dot: '#F59E0B' },
  'in-consultation': { label: 'Consulting',     color: '#065F46', bg: '#ECFDF5', border: '#A7F3D0', dot: '#10B981' },
  'completed':       { label: 'Completed',      color: '#374151', bg: '#F9FAFB', border: '#E5E7EB', dot: '#9CA3AF' },
  'cancelled':       { label: 'Cancelled',      color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', dot: '#EF4444' },
  'not-visited':     { label: 'Not Visited',    color: '#4B5563', bg: '#F3F4F6', border: '#E5E7EB', dot: '#9CA3AF' },
  'priority':        { label: 'Priority',       color: '#5B21B6', bg: '#F3EEFF', border: '#DDD6FE', dot: '#7C3AED' },
}

function timeToMins(t?: string): number {
  if (!t) return 9999
  const m = t.match(/^(\d{1,2}):(\d{2})\s+(AM|PM)$/i)
  if (!m) return 9999
  let h = parseInt(m[1]); const min = parseInt(m[2]); const p = m[3].toUpperCase()
  if (p === 'PM' && h !== 12) h += 12
  if (p === 'AM' && h === 12) h = 0
  return h * 60 + min
}

function getAvatarColor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

interface TodayAppt {
  appt: Appointment
  token: QueueToken | null
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function RowSkeleton() {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 18, padding: '14px 16px', marginBottom: 10, display: 'flex', gap: 12, alignItems: 'center', boxShadow: '0 2px 8px rgba(30,79,163,0.05)' }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: '#F0F4F8', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ width: '55%', height: 14, borderRadius: 6, background: '#F0F4F8', marginBottom: 8 }} />
        <div style={{ width: '38%', height: 11, borderRadius: 6, background: '#F0F4F8' }} />
      </div>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: '#F0F4F8', flexShrink: 0 }} />
    </div>
  )
}

// ── Appointment Row ────────────────────────────────────────────────────────────

function ApptRow({ item, index, onOpen }: { item: TodayAppt; index: number; onOpen: () => void }) {
  const { appt, token } = item
  const doc       = typeof appt.doctorId  === 'object' ? appt.doctorId  : null
  const clinic    = typeof appt.clinicId  === 'object' ? appt.clinicId  : null
  const docName   = doc ? `Dr. ${doc.name}` : 'Doctor'
  const color     = doc?._id ? getAvatarColor(doc._id) : AVATAR_COLORS[index % AVATAR_COLORS.length]
  const initials  = docName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  const tsc       = token ? (TOKEN_STATUS_CFG[token.status] ?? TOKEN_STATUS_CFG['waiting']) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 28 }}
      onClick={onOpen}
      style={{
        background: '#FFFFFF', borderRadius: 18, marginBottom: 10,
        boxShadow: '0 2px 12px rgba(30,79,163,0.07)',
        overflow: 'hidden', cursor: 'pointer',
        position: 'relative',
      }}
    >
      {/* Left accent strip */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: token ? BRAND_GRADIENT : '#E3EAF2' }} />

      <div style={{ padding: '13px 14px 13px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>

        {/* Token number or dash */}
        <div style={{
          width: 54, height: 54, borderRadius: 15, flexShrink: 0,
          background: token ? BRAND_GRADIENT : '#F5F8FC',
          border: token ? 'none' : '1.5px dashed #D0DCF0',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          boxShadow: token ? '0 4px 14px rgba(44,110,213,0.28)' : 'none',
        }}>
          {token ? (
            <>
              <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.6px' }}>TOKEN</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>{token.tokenNumber}</span>
            </>
          ) : (
            <MdConfirmationNumber size={22} color="#C8D4E0" />
          )}
        </div>

        {/* Middle info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            {appt.time && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#2C6ED5', background: '#EBF2FF', borderRadius: 20, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 3 }}>
                <HiClock size={10} /> {appt.time}
              </span>
            )}
            {tsc && (
              <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '2px 7px', background: tsc.bg, color: tsc.color, border: `1px solid ${tsc.border}`, display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: tsc.dot, flexShrink: 0 }} />
                {tsc.label}
              </span>
            )}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {docName}
          </div>
          {doc?.specialization && (
            <div style={{ fontSize: 11, color: '#6B7C93', fontWeight: 500 }}>{doc.specialization}</div>
          )}
          {clinic?.name && (
            <div style={{ fontSize: 11, color: '#A0AEC0', display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
              <HiLocationMarker size={10} color="#E05B5B" /> {clinic.name}
            </div>
          )}
        </div>

        {/* Doctor avatar */}
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: `${color}22`, border: `2px solid ${color}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, color,
        }}>
          {initials}
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function TodayQueueScreen() {
  const navigate = useNavigate()
  const today    = dayjs().format('YYYY-MM-DD')

  const [items, setItems]         = useState<TodayAppt[]>([])
  const [loading, setLoading]     = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [toast, setToast]         = useState<{ created: number } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: allUpcoming } = await getMyAppointments('upcoming')

      // Filter to today only
      const todayAppts = allUpcoming
        .filter((a) => dayjs(a.date).format('YYYY-MM-DD') === today)
        .sort((a, b) => timeToMins(a.time) - timeToMins(b.time))

      if (todayAppts.length === 0) {
        setItems([])
        return
      }

      // Fetch tokens for each appointment
      const tokenMap = new Map<string, QueueToken>()
      await Promise.all(
        todayAppts.map((a) =>
          getTokens({ appointmentId: a._id })
            .then((r) => { if (r.data[0]) tokenMap.set(a._id, r.data[0]) })
            .catch(() => {})
        )
      )

      setItems(todayAppts.map((a) => ({ appt: a, token: tokenMap.get(a._id) ?? null })))
    } catch {
      setError('Failed to load today\'s appointments')
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => { load() }, [load])

  const handleAssignAll = async () => {
    setAssigning(true)
    setError(null)
    try {
      const result = await assignTodayTokens()
      if (result.created > 0) {
        setToast({ created: result.created })
        setTimeout(() => setToast(null), 3000)
        // Reload to show updated tokens
        await load()
      } else {
        setToast({ created: 0 })
        setTimeout(() => setToast(null), 2500)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to assign tokens')
    } finally {
      setAssigning(false)
    }
  }

  const assignedCount   = items.filter((i) => i.token !== null).length
  const unassignedCount = items.length - assignedCount
  const allAssigned     = items.length > 0 && unassignedCount === 0

  return (
    <div style={{ minHeight: '100dvh', background: '#F5F8FC', fontFamily: 'Roboto, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* ── White nav bar ───────────────────────────────────────────────── */}
      <div style={{
        background: '#FFFFFF', padding: '12px 16px 10px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #F0F4F8',
      }}>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F8FC', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HiArrowLeft size={18} color="#1A1A1A" />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>Today's Queue</span>
        <button onClick={load} disabled={loading} style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F8FC', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HiRefresh size={17} color={loading ? '#C8D4E0' : '#2C6ED5'} />
        </button>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
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
            <HiCheckCircle size={16} />
            {toast.created > 0
              ? `${toast.created} token${toast.created > 1 ? 's' : ''} assigned in time order`
              : 'All tokens already assigned'}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px' }}>

        {/* ── Hero card ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}
          style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(30,79,163,0.14)', marginBottom: 18 }}
        >
          {/* Gradient */}
          <div style={{ background: BRAND_GRADIENT, padding: '20px 20px 22px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -28, right: -28, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
            <div style={{ position: 'absolute', bottom: -18, left: -18, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 58, height: 58, borderRadius: '50%',
                background: 'rgba(255,255,255,0.20)', border: '2px solid rgba(255,255,255,0.40)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <MdConfirmationNumber size={28} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', marginBottom: 2 }}>Today's Appointments</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', marginBottom: 10 }}>
                  {dayjs().format('dddd, D MMMM YYYY')}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, borderRadius: 20, padding: '3px 10px', background: 'rgba(255,255,255,0.20)', color: '#FFFFFF' }}>
                    {items.length} Total
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, borderRadius: 20, padding: '3px 10px', background: 'rgba(255,255,255,0.20)', color: '#FFFFFF' }}>
                    {assignedCount} Assigned
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* White stats */}
          <div style={{ background: '#FFFFFF', padding: 14 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[
                { value: items.length,   label: 'TOTAL',      bg: '#EBF2FF', text: '#1E40AF', border: '#BFDBFE', dot: '#3B82F6' },
                { value: assignedCount,  label: 'TOKENISED',  bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', dot: '#10B981' },
                { value: unassignedCount, label: 'PENDING',   bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
              ].map((s) => (
                <div key={s.label} style={{
                  flex: 1, textAlign: 'center', padding: '11px 4px',
                  background: s.bg, borderRadius: 13, border: `1.5px solid ${s.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot }} />
                    <span style={{ fontSize: 22, fontWeight: 800, color: s.text, lineHeight: 1 }}>{s.value}</span>
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: s.text, letterSpacing: '0.5px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Assign All button */}
            <button
              onClick={handleAssignAll}
              disabled={assigning || loading || allAssigned}
              style={{
                width: '100%', height: 50, borderRadius: 14, border: 'none',
                background: (assigning || loading || allAssigned) ? '#E3EAF2' : BRAND_GRADIENT,
                color: (assigning || loading || allAssigned) ? '#A0AEC0' : '#FFFFFF',
                fontSize: 15, fontWeight: 700,
                cursor: (assigning || loading || allAssigned) ? 'not-allowed' : 'pointer',
                boxShadow: (assigning || loading || allAssigned) ? 'none' : '0 6px 18px rgba(44,110,213,0.32)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
            >
              <MdConfirmationNumber size={18} />
              {assigning
                ? 'Assigning Tokens…'
                : allAssigned
                  ? 'All Tokens Assigned'
                  : `Assign All ${unassignedCount > 0 ? `(${unassignedCount}) ` : ''}Tokens by Time`}
            </button>
          </div>
        </motion.div>

        {/* ── List ────────────────────────────────────────────────────────── */}
        {error && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', marginBottom: 14, fontSize: 13, fontWeight: 600, color: '#B91C1C' }}>
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <>{[0, 1, 2].map((i) => <RowSkeleton key={i} />)}</>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 24px', textAlign: 'center' }}
          >
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#EBF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <MdEventNote size={36} color="#2C6ED5" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A', marginBottom: 8 }}>No appointments today</div>
            <div style={{ fontSize: 13, color: '#6B7C93', lineHeight: 1.6, maxWidth: 240, marginBottom: 24 }}>
              Book an appointment and your queue token will appear here
            </div>
            <button onClick={() => navigate('/app/booking')} style={{
              height: 48, padding: '0 28px', borderRadius: 14, border: 'none',
              background: BRAND_GRADIENT, color: '#FFFFFF', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 6px 18px rgba(44,110,213,0.32)',
            }}>
              Book Appointment
            </button>
          </motion.div>
        ) : (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>
              Sorted by appointment time
            </div>
            <AnimatePresence>
              {items.map((item, i) => (
                <ApptRow
                  key={item.appt._id}
                  item={item}
                  index={i}
                  onOpen={() => navigate(`/app/appointments/${item.appt._id}`)}
                />
              ))}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  )
}
