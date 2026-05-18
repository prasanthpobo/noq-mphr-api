import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import dayjs from 'dayjs'
import {
  HiArrowLeft, HiRefresh, HiLocationMarker,
} from 'react-icons/hi'
import { MdConfirmationNumber } from 'react-icons/md'
import { getMyActiveToken, getTokens } from '../../services/queueService'
import { useQueueStore } from '../../store/queueStore'
import type { QueueToken } from '../../services/queueService'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'
const POLL_INTERVAL  = 12000

const STATUS_CFG: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
  'waiting':         { label: 'Waiting',       dot: '#F59E0B', bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
  'in-room':         { label: 'In Room',        dot: '#3B82F6', bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
  'in-consultation': { label: 'Consulting',     dot: '#10B981', bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  'completed':       { label: 'Completed',      dot: '#9CA3AF', bg: '#F9FAFB', text: '#374151', border: '#E5E7EB' },
  'cancelled':       { label: 'Cancelled',      dot: '#EF4444', bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  'not-visited':     { label: 'Not Visited',    dot: '#9CA3AF', bg: '#F9FAFB', text: '#374151', border: '#E5E7EB' },
  'priority':        { label: 'Priority',       dot: '#7C3AED', bg: '#F3EEFF', text: '#5B21B6', border: '#DDD6FE' },
}

function getMyStatusLabel(token: QueueToken, aheadCount: number): { label: string; bg: string; color: string } {
  if (token.status === 'in-room' || token.status === 'in-consultation') {
    return { label: "You're In! 🎉", bg: '#ECFDF5', color: '#065F46' }
  }
  if (aheadCount === 0) return { label: "You're Next!", bg: '#ECFDF5', color: '#065F46' }
  if (aheadCount <= 2)  return { label: 'Almost There!', bg: '#ECFDF5', color: '#065F46' }
  return { label: 'Waiting…', bg: '#FFFBEB', color: '#92400E' }
}

// ── Queue Row ──────────────────────────────────────────────────────────────────

function QueueRow({ token, position, isMe }: {
  token: QueueToken
  position: number
  isMe: boolean
}) {
  const isDone = token.status === 'completed' || token.status === 'cancelled' || token.status === 'not-visited'
  const isNow  = token.status === 'in-room' || token.status === 'in-consultation'
  const sc     = STATUS_CFG[token.status] ?? STATUS_CFG['waiting']
  const patientName = typeof token.patientId === 'object' ? token.patientId.name : `Patient #${token.tokenNumber}`

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: isDone ? 0.5 : 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      style={{
        background: isMe ? '#EBF2FF' : isDone ? '#F8FAFC' : '#FFFFFF',
        borderRadius: 16, marginBottom: 8,
        border: isMe ? '1.5px solid #BFDBFE' : isNow ? '1.5px solid #A7F3D0' : '1.5px solid transparent',
        boxShadow: isMe ? '0 4px 16px rgba(44,110,213,0.14)' : isDone ? 'none' : '0 2px 8px rgba(30,79,163,0.06)',
        overflow: 'hidden', position: 'relative',
      }}
    >
      {/* Left accent bar */}
      {(isMe || isNow) && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
          background: isNow ? 'linear-gradient(180deg,#10B981,#059669)' : BRAND_GRADIENT,
        }} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px 12px 16px' }}>

        {/* Token number bubble */}
        <div style={{
          width: 44, height: 44, borderRadius: 14, flexShrink: 0,
          background: isNow
            ? 'linear-gradient(135deg,#059669,#10B981)'
            : isMe
              ? BRAND_GRADIENT
              : isDone ? '#F1F5F9' : '#F5F8FC',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          boxShadow: (isMe || isNow) ? '0 3px 10px rgba(0,0,0,0.15)' : 'none',
        }}>
          <span style={{ fontSize: 8, fontWeight: 700, color: (isMe || isNow) ? 'rgba(255,255,255,0.7)' : '#A0AEC0', letterSpacing: '0.4px' }}>NO.</span>
          <span style={{ fontSize: 17, fontWeight: 900, lineHeight: 1, color: (isMe || isNow) ? '#FFFFFF' : isDone ? '#CBD5E1' : '#1A1A1A' }}>
            {token.tokenNumber}
          </span>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, marginBottom: 3,
            color: isDone ? '#A0AEC0' : '#1A1A1A',
            textDecoration: isDone ? 'line-through' : 'none',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {isMe ? 'You' : patientName}
          </div>
          {/* Status chip */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '2px 8px',
            background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.dot }} />
            {sc.label}
          </span>
        </div>

        {/* Right badge */}
        <div style={{ flexShrink: 0 }}>
          {isNow ? (
            <motion.span
              animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}
              style={{ fontSize: 11, fontWeight: 800, background: '#ECFDF5', color: '#065F46', padding: '4px 10px', borderRadius: 20, border: '1px solid #A7F3D0', display: 'block' }}
            >
              Now ●
            </motion.span>
          ) : isMe ? (
            <span style={{ fontSize: 11, fontWeight: 800, background: BRAND_GRADIENT, color: '#FFFFFF', padding: '4px 10px', borderRadius: 20, display: 'block' }}>
              You
            </span>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 700, color: isDone ? '#CBD5E1' : '#A0AEC0' }}>
              #{position}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function QueueScreen() {
  const navigate       = useNavigate()
  const setStoreToken  = useQueueStore((s) => s.setActiveToken)

  const [myToken, setMyToken]         = useState<QueueToken | null>(null)
  const [aheadCount, setAheadCount]   = useState(0)
  const [serving, setServing]         = useState<number | null>(null)
  const [queueList, setQueueList]     = useState<QueueToken[]>([])
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [updatedAt, setUpdatedAt]     = useState<Date | null>(null)
  const [error, setError]             = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchQueue = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const tokenRes = await getMyActiveToken()
      const token    = tokenRes.data
      setMyToken(token)
      setStoreToken(token)
      if (tokenRes.meta) {
        setAheadCount(tokenRes.meta.aheadCount)
        setServing(tokenRes.meta.currentlyServing)
      }

      if (token) {
        const docId    = typeof token.doctorId === 'object' ? token.doctorId._id : token.doctorId
        const clinicId = typeof token.clinicId === 'object' ? token.clinicId._id : token.clinicId
        const listRes  = await getTokens({ doctorId: docId, clinicId, date: dayjs().format('YYYY-MM-DD') })
        setQueueList(listRes.data)
      } else {
        setQueueList([])
      }

      setUpdatedAt(new Date())
      setError(null)
    } catch {
      setError('Could not refresh queue')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [setStoreToken])

  useEffect(() => {
    fetchQueue()
    pollRef.current = setInterval(() => fetchQueue(true), POLL_INTERVAL)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchQueue])

  const doc    = myToken && typeof myToken.doctorId === 'object' ? myToken.doctorId : null
  const clinic = myToken && typeof myToken.clinicId === 'object' ? myToken.clinicId : null

  const docName    = doc   ? `Dr. ${doc.name}` : 'Doctor'
  const clinicName = clinic?.name ?? ''
  const docInitials = docName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()

  const statusInfo    = myToken ? getMyStatusLabel(myToken, aheadCount) : null
  const estimatedWait = aheadCount * 5

  // Filter queue to show: waiting/active (not done/cancelled) + a few completed above
  const activeQueue = queueList.filter((t) =>
    t.status !== 'completed' && t.status !== 'cancelled' && t.status !== 'not-visited'
  )
  const recentDone = queueList
    .filter((t) => t.status === 'completed')
    .slice(-2)
  const displayQueue = [...recentDone, ...activeQueue].sort((a, b) => a.tokenNumber - b.tokenNumber)

  // Progress: how far along the queue
  const totalActive = activeQueue.length
  const myPosition  = activeQueue.findIndex((t) => t._id === myToken?._id) + 1
  const progressPct = totalActive > 1
    ? Math.max(8, Math.round(((totalActive - myPosition) / (totalActive - 1)) * 100))
    : myToken ? 100 : 0

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: '#F5F8FC', fontFamily: 'Roboto, system-ui, sans-serif' }}>
        <div style={{ background: '#FFFFFF', padding: '12px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F0F4F8' }}>
          <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F8FC', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HiArrowLeft size={18} color="#1A1A1A" />
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>Live Queue</span>
          <div style={{ width: 36 }} />
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ height: 220, background: '#FFFFFF', borderRadius: 20, marginBottom: 14, boxShadow: '0 2px 12px rgba(30,79,163,0.06)' }} />
          <div style={{ height: 100, background: '#FFFFFF', borderRadius: 20, marginBottom: 10 }} />
          <div style={{ height: 100, background: '#FFFFFF', borderRadius: 20 }} />
        </div>
      </div>
    )
  }

  if (!myToken) {
    return (
      <div style={{ minHeight: '100dvh', background: '#F5F8FC', fontFamily: 'Roboto, system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#EBF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <MdConfirmationNumber size={36} color="#2C6ED5" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A', marginBottom: 8 }}>No active token</div>
        <div style={{ fontSize: 13, color: '#6B7C93', marginBottom: 28, lineHeight: 1.6 }}>
          You don't have a queue token right now. Book an appointment to get in the queue.
        </div>
        <button onClick={() => navigate('/app/booking')} style={{
          height: 50, padding: '0 32px', borderRadius: 14, border: 'none',
          background: BRAND_GRADIENT, color: '#FFFFFF', fontSize: 15, fontWeight: 700,
          cursor: 'pointer', boxShadow: '0 6px 20px rgba(44,110,213,0.35)',
        }}>
          Book Appointment
        </button>
        <button onClick={() => navigate(-1)} style={{
          marginTop: 14, background: 'none', border: 'none', fontSize: 14, color: '#6B7C93', cursor: 'pointer', fontWeight: 600,
        }}>
          ← Go Back
        </button>
      </div>
    )
  }

  const sc = STATUS_CFG[myToken.status] ?? STATUS_CFG['waiting']

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
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A', lineHeight: 1 }}>Live Queue</div>
          {updatedAt && (
            <div style={{ fontSize: 10, color: '#A0AEC0', marginTop: 2 }}>
              Updated {dayjs(updatedAt).format('h:mm A')}
            </div>
          )}
        </div>
        <button onClick={() => fetchQueue()} disabled={refreshing} style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F8FC', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.span
            animate={{ rotate: refreshing ? 360 : 0 }}
            transition={{ duration: 0.7, ease: 'linear', repeat: refreshing ? Infinity : 0 }}
            style={{ display: 'flex' }}
          >
            <HiRefresh size={17} color={refreshing ? '#2C6ED5' : '#6B7C93'} />
          </motion.span>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px' }}>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#B91C1C', fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── Merged hero card ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}
          style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(30,79,163,0.15)', marginBottom: 16 }}
        >
          {/* Gradient section — doctor info */}
          <div style={{ background: BRAND_GRADIENT, padding: '20px 18px 22px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
            <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
              {/* Doctor avatar */}
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: 'rgba(255,255,255,0.22)', border: '2.5px solid rgba(255,255,255,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 800, color: '#FFFFFF', flexShrink: 0,
                boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
              }}>
                {docInitials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#FFFFFF', marginBottom: 2 }}>{docName}</div>
                {doc?.specialization && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.80)', marginBottom: 6 }}>{doc.specialization}</div>
                )}
                {clinicName && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <HiLocationMarker size={11} /> {clinicName}
                  </div>
                )}
              </div>
              {/* My status badge */}
              {statusInfo && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={statusInfo.label}
                    initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    style={{
                      background: statusInfo.bg, color: statusInfo.color,
                      fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20,
                      flexShrink: 0, whiteSpace: 'nowrap',
                    }}
                  >
                    {statusInfo.label}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* White section — token + stats */}
          <div style={{ background: '#FFFFFF', padding: '18px 18px 14px' }}>

            {/* Token number row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              {/* Big token bubble */}
              <div style={{
                width: 76, height: 76, borderRadius: 22, flexShrink: 0,
                background: BRAND_GRADIENT,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 18px rgba(44,110,213,0.30)',
              }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.8px' }}>TOKEN</span>
                <span style={{ fontSize: 32, fontWeight: 900, color: '#FFFFFF', lineHeight: 1.05 }}>{myToken.tokenNumber}</span>
              </div>

              <div style={{ flex: 1 }}>
                {/* Status chip */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 8,
                  fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '4px 10px',
                  background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                }}>
                  <motion.span
                    animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1.8 }}
                    style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, display: 'block' }}
                  />
                  {sc.label}
                </span>
                {myToken.priority !== 'normal' && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 6,
                    fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '3px 8px',
                    background: myToken.priority === 'emergency' ? '#FEF2F2' : '#F3EEFF',
                    color: myToken.priority === 'emergency' ? '#DC2626' : '#5B21B6',
                    border: `1px solid ${myToken.priority === 'emergency' ? '#FECACA' : '#DDD6FE'}`,
                  }}>
                    {myToken.priority === 'emergency' ? '🚨 Emergency' : '⭐ Priority'}
                  </span>
                )}
                <div style={{ fontSize: 11, color: '#A0AEC0' }}>
                  Issued {dayjs(myToken.issuedAt).format('h:mm A')}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', background: '#F5F8FC', borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
              {[
                { label: 'Ahead',        value: String(aheadCount),              sub: 'patients',  color: '#2C6ED5' },
                { label: 'Est. Wait',    value: `~${estimatedWait}`,             sub: 'minutes',   color: '#D97706' },
                { label: 'Now Serving',  value: serving !== null ? String(serving) : '—', sub: 'token', color: '#10B981' },
              ].map((s, i) => (
                <div key={s.label} style={{
                  flex: 1, padding: '12px 6px', textAlign: 'center',
                  borderRight: i < 2 ? '1px solid #E8EEF7' : 'none',
                }}>
                  <div style={{ fontSize: 11, color: '#A0AEC0', fontWeight: 600, marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#A0AEC0', marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#A0AEC0', marginBottom: 5 }}>
                <span>Queue progress</span>
                <span style={{ fontWeight: 700, color: '#2C6ED5' }}>{progressPct}%</span>
              </div>
              <div style={{ height: 7, borderRadius: 999, background: '#EEF2F7', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: '5%' }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  style={{ height: '100%', borderRadius: 999, background: BRAND_GRADIENT }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Queue list ──────────────────────────────────────────────────── */}
        {displayQueue.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>
              Current Queue
            </div>
            <AnimatePresence>
              {displayQueue.map((t, i) => (
                <QueueRow
                  key={t._id}
                  token={t}
                  position={i + 1}
                  isMe={t._id === myToken._id}
                />
              ))}
            </AnimatePresence>
          </>
        )}
      </div>

    </div>
  )
}
