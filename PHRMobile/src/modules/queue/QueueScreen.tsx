import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiRefresh,
  HiPhone,
  HiX,
  HiClock,
  HiUser,
  HiLocationMarker,
} from 'react-icons/hi'

// ── Constants ─────────────────────────────────────────────────────────────────
const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

// ── Types ─────────────────────────────────────────────────────────────────────
interface QueueEntry {
  id: string
  tokenNumber: string
  status: 'active' | 'waiting' | 'done'
  isMyToken: boolean
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
const INITIAL_QUEUE: QueueEntry[] = [
  { id: 'q1',  tokenNumber: 'A-37', status: 'done',    isMyToken: false },
  { id: 'q2',  tokenNumber: 'A-38', status: 'done',    isMyToken: false },
  { id: 'q3',  tokenNumber: 'A-39', status: 'done',    isMyToken: false },
  { id: 'q4',  tokenNumber: 'A-40', status: 'active',  isMyToken: false },
  { id: 'q5',  tokenNumber: 'A-41', status: 'waiting', isMyToken: false },
  { id: 'q6',  tokenNumber: 'A-42', status: 'waiting', isMyToken: true  },
  { id: 'q7',  tokenNumber: 'A-43', status: 'waiting', isMyToken: false },
  { id: 'q8',  tokenNumber: 'A-44', status: 'waiting', isMyToken: false },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function getAheadCount(queue: QueueEntry[]): number {
  const myIdx = queue.findIndex((e) => e.isMyToken)
  const activeIdx = queue.findIndex((e) => e.status === 'active')
  if (myIdx === -1 || activeIdx === -1) return 0
  const count = myIdx - activeIdx - 1
  return Math.max(count, 0)
}

function getStatusForMyToken(aheadCount: number): {
  label: string
  bg: string
  color: string
} {
  if (aheadCount === 0) {
    return { label: "You're Next!", bg: '#DCFCE7', color: '#15803D' }
  }
  if (aheadCount <= 2) {
    return { label: 'Almost There!', bg: '#DCFCE7', color: '#15803D' }
  }
  return { label: 'Waiting', bg: '#FEF3C7', color: '#D97706' }
}

function getQueuePosition(queue: QueueEntry[]): { current: number; total: number } {
  const myIdx = queue.findIndex((e) => e.isMyToken)
  const waitingEntries = queue.filter((e) => e.status !== 'done')
  const myPositionInWaiting = waitingEntries.findIndex((e) => e.isMyToken) + 1
  return { current: myPositionInWaiting, total: waitingEntries.length }
}

// ── QueueScreen ───────────────────────────────────────────────────────────────
export default function QueueScreen() {
  const navigate = useNavigate()
  const [queue, setQueue] = useState<QueueEntry[]>(INITIAL_QUEUE)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Simulate live queue advancement every 5 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setQueue((prev) => {
        const activeIdx = prev.findIndex((e) => e.status === 'active')
        if (activeIdx === -1) return prev

        // Move active -> done, next waiting -> active
        const updated = prev.map((entry, idx) => {
          if (idx === activeIdx) return { ...entry, status: 'done' as const }
          if (idx === activeIdx + 1 && entry.status === 'waiting')
            return { ...entry, status: 'active' as const }
          return entry
        })
        return updated
      })
      setLastUpdated(new Date())
    }, 5000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setLastUpdated(new Date())
      setRefreshing(false)
    }, 800)
  }

  const myToken = queue.find((e) => e.isMyToken)
  const activeToken = queue.find((e) => e.status === 'active')
  const aheadCount = getAheadCount(queue)
  const statusInfo = getStatusForMyToken(aheadCount)
  const position = getQueuePosition(queue)
  const progressPercent = position.total > 1
    ? Math.max(5, Math.round(((position.total - position.current) / (position.total - 1)) * 100))
    : 100
  const estimatedWait = aheadCount * 5

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  const statusDotColor = (status: QueueEntry['status']) => {
    if (status === 'active') return '#22C55E'
    if (status === 'waiting') return '#F59E0B'
    return '#CBD5E1'
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F5F8FC',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: 96,
      }}
    >
      {/* ── Gradient Header ── */}
      <div
        style={{
          background: BRAND_GRADIENT,
          paddingTop: 52,
          paddingBottom: 52,
          paddingLeft: 16,
          paddingRight: 16,
          position: 'relative',
        }}
      >
        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          style={{
            position: 'absolute',
            top: 12,
            right: 16,
            width: 38,
            height: 38,
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255,255,255,0.18)',
            color: '#FFFFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Refresh queue"
        >
          <motion.span
            animate={{ rotate: refreshing ? 360 : 0 }}
            transition={{ duration: 0.7, ease: 'linear' }}
            style={{ display: 'flex' }}
          >
            <HiRefresh size={20} />
          </motion.span>
        </button>

        {/* Title */}
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#FFFFFF',
            margin: 0,
            marginBottom: 6,
          }}
        >
          Live Queue
        </h1>

        {/* Clinic & doctor info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.85)',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <HiUser size={13} />
            Dr. Priya Sharma · General Physician
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.75)',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <HiLocationMarker size={12} />
            Apollo Clinic, Banjara Hills
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
            Updated at {formatTime(lastUpdated)}
          </div>
        </div>
      </div>

      {/* ── My Token Card (floats over gradient) ── */}
      <div style={{ marginTop: -32, paddingLeft: 16, paddingRight: 16, zIndex: 10 }}>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{
            background: '#FFFFFF',
            borderRadius: 20,
            padding: '20px',
            boxShadow: '0 8px 32px rgba(30,79,163,0.18)',
          }}
        >
          {/* Token header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: '#6B7C93',
                  textTransform: 'uppercase',
                  letterSpacing: '1.2px',
                  marginBottom: 4,
                }}
              >
                Your Token
              </div>
              <div
                style={{
                  fontSize: 52,
                  fontWeight: 800,
                  color: '#1E4FA3',
                  lineHeight: 1,
                  letterSpacing: '-2px',
                }}
              >
                {myToken?.tokenNumber ?? 'A-42'}
              </div>
            </div>
            {/* Status badge */}
            <AnimatePresence mode="wait">
              <motion.div
                key={statusInfo.label}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                style={{
                  background: statusInfo.bg,
                  color: statusInfo.color,
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '5px 12px',
                  borderRadius: 20,
                  marginTop: 4,
                }}
              >
                {statusInfo.label}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Info row */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginTop: 16,
              padding: '12px 0',
              borderTop: '1px solid #EEF2F7',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#A0AEC0', marginBottom: 2 }}>Ahead</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A' }}>
                {aheadCount}
              </div>
              <div style={{ fontSize: 11, color: '#6B7C93' }}>patients</div>
            </div>
            <div
              style={{ width: 1, background: '#EEF2F7' }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 11,
                  color: '#A0AEC0',
                  marginBottom: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <HiClock size={11} /> Estimated wait
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A' }}>
                ~{estimatedWait}
              </div>
              <div style={{ fontSize: 11, color: '#6B7C93' }}>minutes</div>
            </div>
            <div style={{ width: 1, background: '#EEF2F7' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#A0AEC0', marginBottom: 2 }}>Now serving</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#22C55E' }}>
                {activeToken?.tokenNumber ?? '—'}
              </div>
              <div style={{ fontSize: 11, color: '#6B7C93' }}>active</div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 4 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 6,
                fontSize: 11,
                color: '#A0AEC0',
              }}
            >
              <span>Queue progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div
              style={{
                width: '100%',
                height: 8,
                borderRadius: 8,
                background: '#EEF2F7',
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: '5%' }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  borderRadius: 8,
                  background: BRAND_GRADIENT,
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Queue List ── */}
      <div style={{ marginTop: 24, paddingLeft: 16, paddingRight: 16, flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#6B7C93',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            marginBottom: 12,
          }}
        >
          Current Queue
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {queue.map((entry) => {
            const isActive = entry.status === 'active'
            const isDone = entry.status === 'done'

            return (
              <motion.div
                key={entry.id}
                layout
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{
                  background: isDone ? '#F8FAFC' : '#FFFFFF',
                  borderRadius: 14,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  boxShadow: entry.isMyToken
                    ? '0 4px 16px rgba(44,110,213,0.15)'
                    : isDone
                    ? 'none'
                    : '0 2px 8px rgba(30,79,163,0.06)',
                  borderLeft: entry.isMyToken ? '4px solid #2C6ED5' : '4px solid transparent',
                  opacity: isDone ? 0.55 : 1,
                }}
              >
                {/* Status dot */}
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: statusDotColor(entry.status),
                    flexShrink: 0,
                    boxShadow: isActive ? '0 0 0 3px rgba(34,197,94,0.2)' : 'none',
                  }}
                />

                {/* Token number */}
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: isDone ? '#A0AEC0' : entry.isMyToken ? '#1E4FA3' : '#1A1A1A',
                    minWidth: 52,
                  }}
                >
                  {entry.tokenNumber}
                </div>

                {/* Patient initials (blurred) */}
                <div
                  style={{
                    fontSize: 13,
                    color: '#6B7C93',
                    flex: 1,
                    filter: entry.isMyToken ? 'none' : 'blur(3px)',
                    userSelect: 'none',
                  }}
                >
                  P***
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {isActive && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: '#DCFCE7',
                        color: '#15803D',
                        padding: '3px 8px',
                        borderRadius: 20,
                      }}
                    >
                      Active
                    </span>
                  )}
                  {entry.isMyToken && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: '#EEF5FF',
                        color: '#2C6ED5',
                        padding: '3px 8px',
                        borderRadius: 20,
                      }}
                    >
                      You
                    </span>
                  )}
                  {isDone && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: '#F1F5F9',
                        color: '#94A3B8',
                        padding: '3px 8px',
                        borderRadius: 20,
                      }}
                    >
                      Done
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ── Sticky Footer Actions ── */}
      <div
        style={{
          position: 'sticky',
          bottom: 96,
          background: '#FFFFFF',
          borderTop: '1px solid #EEF2F7',
          padding: '12px 16px',
          display: 'flex',
          gap: 10,
          zIndex: 20,
        }}
      >
        <button
          style={{
            flex: 1,
            height: 46,
            borderRadius: 12,
            border: '1.5px solid #EF4444',
            background: '#FFFFFF',
            color: '#EF4444',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
          onClick={() => navigate('/app/appointments')}
        >
          <HiX size={16} /> Cancel Token
        </button>
        <button
          style={{
            flex: 1,
            height: 46,
            borderRadius: 12,
            border: 'none',
            background: BRAND_GRADIENT,
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            boxShadow: '0 4px 14px rgba(44,110,213,0.3)',
          }}
        >
          <HiPhone size={16} /> Call Clinic
        </button>
      </div>
    </div>
  )
}
