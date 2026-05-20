import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import dayjs from 'dayjs'
import {
  HiArrowLeft, HiMenuAlt3, HiDocumentText, HiUpload, HiX, HiCheck,
} from 'react-icons/hi'
import { getTicketById, replyToTicket, closeTicket, type SupportTicket } from '../../services/supportService'
import { useAuthStore } from '../../store/authStore'

const ORANGE_GRADIENT = 'linear-gradient(135deg, #F59E0B 0%, #D97706 60%, #B45309 100%)'
const BRAND_GRADIENT  = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

const STATUS_CFG = {
  open:          { label: 'OPEN',        dot: '#F59E0B', bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
  'in-progress': { label: 'IN PROGRESS', dot: '#3B82F6', bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
  resolved:      { label: 'RESOLVED',    dot: '#22C55E', bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  closed:        { label: 'CLOSED',      dot: '#9CA3AF', bg: '#F9FAFB', text: '#374151', border: '#E5E7EB' },
}

const CAT_CFG: Record<string, { bg: string; text: string }> = {
  Payment:           { bg: '#EFF6FF', text: '#1E40AF' },
  'App issue':       { bg: '#F5F3FF', text: '#5B21B6' },
  'Booking issue':   { bg: '#FFF7ED', text: '#9A3412' },
  'Doctor / clinic': { bg: '#ECFDF5', text: '#065F46' },
  'Medical records': { bg: '#FFF0F6', text: '#9D174D' },
  General:           { bg: '#F1F5F9', text: '#475569' },
  Complaint:         { bg: '#FFF0F0', text: '#991B1B' },
}

const STEPS = [
  { key: 'open',        label: 'Received',     n: 1 },
  { key: 'in-progress', label: 'Under review', n: 2 },
  { key: 'resolved',    label: 'Resolved',     n: 3 },
]

function activeStep(status: string) {
  if (status === 'resolved' || status === 'closed') return 3
  if (status === 'in-progress') return 2
  return 1
}

function formatRaised(iso: string) {
  const d = dayjs(iso)
  if (d.isSame(dayjs(), 'day')) return `Today, ${d.format('h:mm A')}`
  if (d.isSame(dayjs().subtract(1, 'day'), 'day')) return `Yesterday, ${d.format('h:mm A')}`
  return d.format('D MMM YYYY, h:mm A')
}

export default function TicketDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [ticket, setTicket] = useState<SupportTicket | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    getTicketById(id)
      .then((r) => setTicket(r.data))
      .catch(() => setTicket(null))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [ticket?.messages.length])

  const handleSend = async () => {
    if (!reply.trim() || !ticket) return
    const text = reply.trim()
    setReply('')
    setTicket((prev) => prev ? {
      ...prev,
      messages: [...prev.messages, {
        _id: Date.now().toString(),
        sender: 'patient',
        senderName: user?.name ?? 'You',
        text,
        createdAt: new Date().toISOString(),
      }],
    } : prev)
    setSending(true)
    try {
      const res = await replyToTicket(ticket._id, text)
      setTicket(res.data)
    } catch { /* keep optimistic update on failure */ }
    finally { setSending(false) }
  }

  const handleClose = async () => {
    if (!ticket) return
    setShowMenu(false)
    try {
      const res = await closeTicket(ticket._id)
      setTicket(res.data)
    } catch {
      setTicket((prev) => prev ? { ...prev, status: 'closed' } : prev)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: '#F5F8FC', fontFamily: 'Roboto, system-ui, sans-serif' }}>
        <div style={{ background: '#FFFFFF', height: 60, borderBottom: '1px solid #F0F4F8' }} />
        <div style={{ padding: 16 }}>
          {[160, 200, 140].map((h, i) => (
            <div key={i} style={{ background: '#FFFFFF', borderRadius: 20, height: h, marginBottom: 14 }} />
          ))}
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div style={{ minHeight: '100dvh', background: '#F5F8FC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, fontFamily: 'Roboto, system-ui, sans-serif' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', margin: '0 0 8px' }}>Ticket not found</p>
        <button onClick={() => navigate(-1)} style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: '#2C6ED5', color: '#FFFFFF', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Go back</button>
      </div>
    )
  }

  const st = STATUS_CFG[ticket.status] ?? STATUS_CFG.open
  const cat = CAT_CFG[ticket.category] ?? CAT_CFG['General']
  const curStep = activeStep(ticket.status)
  const isClosed = ticket.status === 'resolved' || ticket.status === 'closed'

  return (
    <div style={{ minHeight: '100dvh', background: '#F5F8FC', fontFamily: 'Roboto, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>

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

        <span style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>Ticket details</span>

        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowMenu((v) => !v)} style={{
            width: 36, height: 36, borderRadius: 10, background: '#F5F8FC',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <HiMenuAlt3 size={18} color="#1A1A1A" />
          </button>
          {showMenu && (
            <div style={{
              position: 'absolute', right: 0, top: 44,
              background: '#FFFFFF', borderRadius: 14,
              boxShadow: '0 8px 28px rgba(0,0,0,0.14)',
              zIndex: 10, minWidth: 170, overflow: 'hidden',
            }}>
              <button onClick={handleClose} disabled={isClosed} style={{
                width: '100%', padding: '13px 16px', background: 'none', border: 'none',
                cursor: isClosed ? 'default' : 'pointer',
                fontSize: 14, fontWeight: 600,
                color: isClosed ? '#9CA3AF' : '#E05B5B', textAlign: 'left',
              }}>
                {isClosed ? 'Ticket closed' : 'Close ticket'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 16px' }} onClick={() => setShowMenu(false)}>

        {/* ── Single merged card: orange gradient top + white info + progress ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          style={{
            borderRadius: 20, overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(245,158,11,0.18)',
            marginBottom: 16,
          }}
        >
          {/* Orange gradient hero */}
          <div style={{ background: ORANGE_GRADIENT, padding: '20px 20px 22px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
            <div style={{ position: 'absolute', bottom: -20, left: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Ticket number + status badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  background: 'rgba(255,255,255,0.22)', color: '#FFFFFF',
                  borderRadius: 20, padding: '3px 12px',
                }}>
                  {ticket.ticketNumber}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 10px',
                  background: 'rgba(255,255,255,0.22)', color: '#FFFFFF',
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFFFFF', opacity: 0.9 }} />
                  {st.label}
                </span>
              </div>

              {/* Title */}
              <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.35, marginBottom: 10 }}>
                {ticket.title}
              </div>

              {/* Category + raised */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 12, fontWeight: 700, borderRadius: 20, padding: '3px 10px',
                  background: 'rgba(255,255,255,0.22)', color: '#FFFFFF',
                }}>
                  {ticket.category}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.80)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  🕐 {formatRaised(ticket.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* White progress section */}
          <div style={{ background: '#FFFFFF', padding: '18px 20px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 16 }}>
              Progress
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {STEPS.map((s, idx) => {
                const isDone = s.n < curStep
                const isCur  = s.n === curStep
                return (
                  <div key={s.key} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 88 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: isCur ? ORANGE_GRADIENT : isDone ? '#22C55E' : '#FFFFFF',
                        border: isCur || isDone ? 'none' : '2px solid #E3EAF2',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isCur ? '0 4px 14px rgba(245,158,11,0.45)' : isDone ? '0 2px 8px rgba(34,197,94,0.30)' : 'none',
                        transition: 'all 0.3s',
                      }}>
                        {isDone
                          ? <HiCheck size={18} color="#FFFFFF" />
                          : <span style={{ fontSize: 15, fontWeight: 700, color: isCur ? '#FFFFFF' : '#A0AEC0' }}>{s.n}</span>
                        }
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: isCur ? 700 : 500, marginTop: 7, textAlign: 'center',
                        color: isCur ? '#D97706' : isDone ? '#22C55E' : '#A0AEC0',
                      }}>
                        {s.label}
                      </span>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div style={{
                        width: 32, height: 2,
                        background: isDone ? '#22C55E' : '#E3EAF2',
                        marginBottom: 22, flexShrink: 0, transition: 'background 0.3s',
                      }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* ── Conversation ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Conversation</span>
          <span style={{ fontSize: 12, color: '#A0AEC0' }}>{ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}</span>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 16, boxShadow: '0 2px 12px rgba(30,79,163,0.06)' }}>
          {ticket.messages.length === 0 && (
            <p style={{ fontSize: 13, color: '#A0AEC0', textAlign: 'center', margin: '8px 0' }}>No messages yet.</p>
          )}
          {ticket.messages.map((msg, idx) => {
            const isPatient = msg.sender === 'patient'
            const msgTime = dayjs(msg.createdAt).format('h:mm A')
            return (
              <div key={msg._id} style={{ marginBottom: idx < ticket.messages.length - 1 ? 18 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: isPatient ? '#E8EEF7' : BRAND_GRADIENT,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                    }}>
                      {isPatient ? '👤' : '🎧'}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{msg.senderName}</span>
                  </div>
                  <span style={{ fontSize: 12, color: '#A0AEC0' }}>{msgTime}</span>
                </div>
                <div style={{
                  background: isPatient ? '#F5F8FC' : '#EBF2FF',
                  borderRadius: isPatient ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                  padding: '12px 14px', fontSize: 14, color: '#1A1A1A', lineHeight: 1.65,
                }}>
                  {msg.text}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* ── Helpful Actions ───────────────────────────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>Helpful Actions</div>
          <div style={{ background: '#FFFFFF', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(30,79,163,0.06)' }}>
            {[
              {
                icon: <HiDocumentText size={18} color="#7C3AED" />, iconBg: '#F5F3FF',
                title: 'View related FAQ', sub: 'Refund & cancellation policy', onClick: undefined,
              },
              {
                icon: <HiUpload size={18} color="#2C6ED5" />, iconBg: '#EBF2FF',
                title: 'Attach a screenshot', sub: 'Add supporting image (max 5 MB)', onClick: undefined,
              },
              {
                icon: isClosed ? <HiCheck size={18} color="#22C55E" /> : <HiX size={18} color="#E05B5B" />,
                iconBg: isClosed ? '#F0FDF4' : '#FFF0F0',
                title: isClosed ? 'Ticket closed' : 'Close this ticket',
                sub: isClosed ? 'This ticket has been resolved' : 'Mark as resolved if your issue is fixed',
                onClick: isClosed ? undefined : handleClose,
              },
            ].map((a, i) => (
              <div key={i} onClick={a.onClick} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                borderBottom: i < 2 ? '1px solid #F0F4F8' : 'none',
                cursor: a.onClick ? 'pointer' : 'default',
              }}>
                <div style={{ width: 42, height: 42, borderRadius: 13, background: a.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {a.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: '#6B7C93', marginTop: 1 }}>{a.sub}</div>
                </div>
                <HiArrowLeft size={16} color="#C8D4E3" style={{ transform: 'rotate(180deg)', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Reply bar ─────────────────────────────────────────────────────────── */}
      {!isClosed && (
        <div style={{
          padding: '10px 16px 20px', background: '#FFFFFF',
          borderTop: '1px solid #EEF2F7',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        }}>
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Type a reply…"
            style={{
              flex: 1, height: 44, borderRadius: 22, border: '1.5px solid #E3EAF2',
              padding: '0 16px', fontSize: 14, color: '#1A1A1A', background: '#F5F8FC',
              outline: 'none', fontFamily: 'inherit',
            }}
          />
          <button style={{
            width: 36, height: 36, borderRadius: '50%', background: '#F5F8FC',
            border: '1.5px solid #E3EAF2', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <HiUpload size={16} color="#6B7C93" />
          </button>
          <button onClick={handleSend} disabled={sending || !reply.trim()} style={{
            width: 44, height: 44, borderRadius: '50%', border: 'none', flexShrink: 0,
            background: reply.trim() ? BRAND_GRADIENT : '#E8EEF7',
            cursor: reply.trim() ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: reply.trim() ? '0 4px 12px rgba(44,110,213,0.4)' : 'none',
            transition: 'all 0.2s',
          }}>
            <HiArrowLeft size={18} color={reply.trim() ? '#FFFFFF' : '#A0AEC0'} style={{ transform: 'rotate(180deg)' }} />
          </button>
        </div>
      )}
    </div>
  )
}
