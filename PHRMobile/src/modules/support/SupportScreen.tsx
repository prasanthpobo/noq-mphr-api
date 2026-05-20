import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import dayjs from 'dayjs'
import {
  HiArrowLeft, HiPlus, HiPhone, HiDocumentText,
  HiExclamationCircle, HiChevronRight, HiClock, HiDocumentDuplicate,
} from 'react-icons/hi'
import { MdHeadsetMic } from 'react-icons/md'
import { getTickets, type SupportTicket } from '../../services/supportService'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

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

function formatDate(iso: string) {
  const d = dayjs(iso)
  if (d.isSame(dayjs(), 'day')) return `Today, ${d.format('h:mm A')}`
  if (d.isSame(dayjs().subtract(1, 'day'), 'day')) return `Yesterday, ${d.format('h:mm A')}`
  return d.format('D MMM, h:mm A')
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CFG[status as keyof typeof STATUS_CFG] ?? STATUS_CFG.open
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 10px',
      background: c.bg, color: c.text,
      display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  )
}

function TicketCard({ ticket, onClick }: { ticket: SupportTicket; onClick: () => void }) {
  const cat     = CAT_CFG[ticket.category] ?? CAT_CFG['General']
  const st      = STATUS_CFG[ticket.status] ?? STATUS_CFG.open
  const lastMsg = ticket.messages[ticket.messages.length - 1]

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 16, marginBottom: 12,
      boxShadow: '0 2px 14px rgba(30,79,163,0.08)',
      overflow: 'hidden', position: 'relative',
    }}>
      {/* Full-height left colour strip */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: st.dot }} />

      <div style={{ padding: '14px 14px 14px 18px' }}>
        {/* Row 1 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6B7C93' }}>{ticket.ticketNumber}</span>
            <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '2px 9px', background: cat.bg, color: cat.text }}>
              {ticket.category.toUpperCase()}
            </span>
          </div>
          <StatusBadge status={ticket.status} />
        </div>

        {/* Title */}
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 10, lineHeight: 1.4 }}>
          {ticket.title}
        </div>

        {/* Last message preview */}
        {lastMsg && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 12, padding: '9px 12px', background: '#F5F8FC', borderRadius: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#E8EEF7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13 }}>
              {lastMsg.sender === 'support' ? '🎧' : '👤'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7C93', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {lastMsg.sender === 'patient' ? 'YOU' : 'SUPPORT'}
              </div>
              <div style={{ fontSize: 13, color: '#4A5568', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {lastMsg.text}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <HiClock size={12} color="#A0AEC0" />
              <span style={{ fontSize: 11, color: '#A0AEC0' }}>{formatDate(ticket.updatedAt)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <HiDocumentDuplicate size={12} color="#A0AEC0" />
              <span style={{ fontSize: 11, color: '#A0AEC0' }}>
                {ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#2C6ED5' }}>
            View <HiChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SupportScreen() {
  const navigate = useNavigate()
  const [tickets, setTickets]   = useState<SupportTicket[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    getTickets()
      .then((r) => setTickets(r.data))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false))
  }, [])

  const open       = tickets.filter((t) => t.status === 'open').length
  const inProgress = tickets.filter((t) => t.status === 'in-progress').length
  const resolved   = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length

  const active   = tickets.filter((t) => t.status === 'open' || t.status === 'in-progress')
  const archived = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed')

  return (
    <div style={{ minHeight: '100dvh', background: '#F5F8FC', fontFamily: 'Roboto, system-ui, sans-serif', paddingBottom: 96 }}>

      {/* ── White nav bar (same pattern as Profile) ────────────────────────── */}
      <div style={{
        background: '#FFFFFF', padding: '12px 16px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #F0F4F8',
      }}>
        <button onClick={() => navigate(-1)} style={{
          width: 36, height: 36, borderRadius: 10, background: '#F5F8FC',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <HiArrowLeft size={18} color="#1A1A1A" />
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>Support</div>
        </div>

        <button onClick={() => navigate('/app/support/new')} style={{
          height: 36, borderRadius: 20, background: BRAND_GRADIENT, border: 'none', cursor: 'pointer',
          padding: '0 14px', fontSize: 13, fontWeight: 700, color: '#FFFFFF',
          display: 'flex', alignItems: 'center', gap: 4,
          boxShadow: '0 4px 12px rgba(44,110,213,0.35)',
        }}>
          <HiPlus size={14} /> New
        </button>
      </div>

      <div style={{ padding: '16px 16px 0' }}>

        {/* ── Single merged card: gradient top + white bottom ──────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          style={{
            borderRadius: 20, overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(30,79,163,0.14)',
            marginBottom: 20,
          }}
        >
          {/* — Gradient hero section — */}
          <div style={{ background: BRAND_GRADIENT, padding: '20px 20px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
            <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
            <div style={{ position: 'absolute', top: 20, right: 60, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: 'rgba(255,255,255,0.20)',
                border: '2px solid rgba(255,255,255,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <MdHeadsetMic size={28} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', marginBottom: 3 }}>NoQ Support</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', marginBottom: 10 }}>We usually reply within 2h</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, borderRadius: 20, padding: '3px 10px', background: 'rgba(255,255,255,0.20)', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 4 }}>
                    ✓ 24 / 7 Available
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, borderRadius: 20, padding: '3px 10px', background: 'rgba(255,255,255,0.20)', color: '#FFFFFF' }}>
                    {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* — White stats + actions section — */}
          <div style={{ background: '#FFFFFF', padding: 16 }}>
            {/* Stats row */}
            <div style={{ display: 'flex', marginBottom: 14 }}>
              {[
                { count: open,       label: 'OPEN',        cfg: STATUS_CFG.open },
                { count: inProgress, label: 'IN PROGRESS', cfg: STATUS_CFG['in-progress'] },
                { count: resolved,   label: 'RESOLVED',    cfg: STATUS_CFG.resolved },
              ].map((s, i) => (
                <div key={s.label} style={{
                  flex: 1, textAlign: 'center', padding: '12px 4px',
                  background: s.cfg.bg, borderRadius: 14,
                  border: `1.5px solid ${s.cfg.border}`,
                  margin: i === 1 ? '0 8px' : 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 2 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.cfg.dot }} />
                    <span style={{ fontSize: 24, fontWeight: 800, color: s.cfg.text }}>{s.count}</span>
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: s.cfg.text, letterSpacing: '0.5px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { icon: <HiPhone size={15} />,             label: 'Call us',   bg: '#F0FDF4', color: '#059669', border: '#BBF7D0' },
                { icon: <HiDocumentText size={15} />,      label: 'FAQs',      bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
                { icon: <HiExclamationCircle size={15} />, label: 'Emergency', bg: '#FFF0F6', color: '#DB2777', border: '#FBCFE8' },
              ].map((btn) => (
                <button key={btn.label} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  padding: '10px 0', borderRadius: 12,
                  border: `1.5px solid ${btn.border}`,
                  background: btn.bg, color: btn.color,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Skeleton ─────────────────────────────────────────────────────── */}
        {loading && [0, 1].map((i) => (
          <div key={i} style={{ background: '#FFFFFF', borderRadius: 16, height: 140, marginBottom: 12, overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: '#E8EEF7' }} />
          </div>
        ))}

        {/* ── Active tickets ────────────────────────────────────────────────── */}
        {!loading && active.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Open Tickets</span>
              <span style={{ fontSize: 12, color: '#A0AEC0' }}>Sort: Newest</span>
            </div>
            <div style={{ height: 3, background: '#F59E0B', borderRadius: 2, marginBottom: 14 }} />
            {active.map((ticket, idx) => (
              <motion.div key={ticket._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}>
                <TicketCard ticket={ticket} onClick={() => navigate(`/app/support/${ticket._id}`)} />
              </motion.div>
            ))}
          </>
        )}

        {/* ── Resolved tickets ──────────────────────────────────────────────── */}
        {!loading && archived.length > 0 && (
          <>
            <div style={{ marginTop: active.length > 0 ? 8 : 0, marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Resolved</span>
            </div>
            {archived.map((ticket, idx) => (
              <motion.div key={ticket._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}>
                <TicketCard ticket={ticket} onClick={() => navigate(`/app/support/${ticket._id}`)} />
              </motion.div>
            ))}
          </>
        )}

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {!loading && tickets.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🎧</div>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A', margin: '0 0 8px' }}>No support tickets yet</p>
            <p style={{ fontSize: 13, color: '#6B7C93', marginBottom: 24 }}>
              Need help? Create a ticket and we'll get back to you within 2h.
            </p>
            <button onClick={() => navigate('/app/support/new')} style={{
              padding: '12px 28px', borderRadius: 14, border: 'none',
              background: BRAND_GRADIENT, color: '#FFFFFF', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(44,110,213,0.35)',
            }}>
              <HiPlus size={14} style={{ marginRight: 6 }} /> Create Ticket
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
