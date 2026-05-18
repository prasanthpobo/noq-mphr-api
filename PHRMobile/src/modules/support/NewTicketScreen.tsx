import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiArrowLeft, HiUpload, HiCheck, HiX } from 'react-icons/hi'
import { createTicket, type SupportTicket } from '../../services/supportService'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'
const MAX_LEN = 500

const ISSUE_TYPES = [
  'Booking issue',
  'Payment',
  'App issue',
  'Doctor / clinic',
  'Medical records',
  'Other',
]

export default function NewTicketScreen() {
  const navigate = useNavigate()
  const [type, setType] = useState('')
  const [desc, setDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdTicket, setCreatedTicket] = useState<SupportTicket | null>(null)
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const canSubmit = !!type && desc.trim().length >= 10

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true); setError(null)
    try {
      const { data: ticket } = await createTicket({
        title: type,
        category: type,
        description: desc.trim(),
      })
      setCreatedTicket(ticket)
      // Navigate to the new ticket's detail after showing success briefly
      setTimeout(() => navigate(`/app/support/${ticket._id}`, { replace: true }), 1800)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (createdTicket) {
    return (
      <div style={{ minHeight: '100dvh', background: '#F5F8FC', fontFamily: 'Roboto, system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 14, stiffness: 200 }}
          style={{
            width: 84, height: 84, borderRadius: '50%',
            background: 'linear-gradient(135deg, #22C55E, #16A34A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 24, boxShadow: '0 10px 32px rgba(34,197,94,0.40)',
          }}
        >
          <HiCheck size={42} color="#FFFFFF" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#22C55E', letterSpacing: '0.5px', marginBottom: 8, textTransform: 'uppercase' }}>
            Ticket Created
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#F59E0B', marginBottom: 6 }}>
            {createdTicket.ticketNumber}
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A', margin: '0 0 10px' }}>
            {createdTicket.title}
          </h2>
          <p style={{ fontSize: 14, color: '#6B7C93', lineHeight: 1.65, margin: '0 0 28px' }}>
            We've received your request and will get back to you within 2 hours.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#A0AEC0', fontSize: 12 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#A0AEC0' }} />
            Opening your ticket…
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Form screen ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100dvh', background: '#F5F8FC', fontFamily: 'Roboto, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#FFFFFF', padding: '14px 16px', borderBottom: '1px solid #EEF2F7', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F8FC', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HiArrowLeft size={18} color="#1A1A1A" />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A', flex: 1, textAlign: 'center', marginRight: 36 }}>New ticket</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', paddingBottom: 110 }}>

        {/* Issue type */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Issue Type</span>
            {!type && <span style={{ fontSize: 11, color: '#F59E0B', fontWeight: 600 }}>Required</span>}
            {type && <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><HiCheck size={12} /> Selected</span>}
          </div>
          <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 16, boxShadow: '0 2px 12px rgba(30,79,163,0.06)', border: !type ? '1.5px solid #FDE68A' : '1.5px solid transparent', transition: 'border-color 0.2s' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {ISSUE_TYPES.map((t) => {
                const sel = type === t
                return (
                  <button key={t} onClick={() => setType(sel ? '' : t)} style={{
                    padding: '8px 16px', borderRadius: 20,
                    border: sel ? 'none' : '1.5px solid #E3EAF2',
                    background: sel ? BRAND_GRADIENT : '#F5F8FC',
                    color: sel ? '#FFFFFF' : '#4A5568',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    boxShadow: sel ? '0 4px 10px rgba(44,110,213,0.30)' : 'none',
                    transition: 'all 0.2s',
                  }}>
                    {t}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Describe Your Issue</span>
            {desc.trim().length > 0 && desc.trim().length < 10 && (
              <span style={{ fontSize: 11, color: '#F59E0B', fontWeight: 600 }}>{10 - desc.trim().length} more chars</span>
            )}
          </div>
          <div style={{
            background: '#FFFFFF', borderRadius: 20, boxShadow: '0 2px 12px rgba(30,79,163,0.06)', overflow: 'hidden',
            border: desc.trim().length > 0 && desc.trim().length < 10 ? '1.5px solid #FDE68A' : '1.5px solid transparent',
            transition: 'border-color 0.2s',
          }}>
            <textarea
              rows={6}
              value={desc}
              onChange={(e) => setDesc(e.target.value.slice(0, MAX_LEN))}
              placeholder="Describe the problem in detail — what happened, when, and what you expected..."
              style={{
                width: '100%', border: 'none', outline: 'none', resize: 'none',
                padding: '16px', fontSize: 14, color: '#1A1A1A', background: 'transparent',
                fontFamily: 'inherit', lineHeight: 1.7, boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 16px 12px', gap: 8 }}>
              {desc.trim().length >= 10 && <HiCheck size={14} color="#22C55E" />}
              <span style={{ fontSize: 12, color: desc.length >= MAX_LEN ? '#E05B5B' : '#A0AEC0' }}>
                {desc.length}/{MAX_LEN}
              </span>
            </div>
          </div>
        </div>

        {/* Screenshot */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>Attach Screenshot (Optional)</div>
          <input
            ref={fileRef} type="file" accept="image/png,image/jpeg"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f && f.size <= 5 * 1024 * 1024) setScreenshot(f)
            }}
          />
          <div style={{ background: '#FFFFFF', borderRadius: 20, boxShadow: '0 2px 12px rgba(30,79,163,0.06)', overflow: 'hidden' }}>
            {screenshot ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <HiCheck size={20} color="#16A34A" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{screenshot.name}</div>
                  <div style={{ fontSize: 12, color: '#6B7C93', marginTop: 2 }}>{(screenshot.size / 1024).toFixed(0)} KB</div>
                </div>
                <button onClick={() => setScreenshot(null)} style={{ width: 28, height: 28, borderRadius: '50%', background: '#FEE2E2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <HiX size={14} color="#E05B5B" />
                </button>
              </div>
            ) : (
              <div onClick={() => fileRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, cursor: 'pointer' }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: '#EBF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <HiUpload size={20} color="#2C6ED5" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>Upload screenshot</div>
                  <div style={{ fontSize: 12, color: '#6B7C93', marginTop: 2 }}>PNG, JPG · max 5 MB</div>
                </div>
                <HiArrowLeft size={16} color="#C8D4E3" style={{ transform: 'rotate(180deg)' }} />
              </div>
            )}
          </div>
        </div>

        {/* Validation hint */}
        <AnimatePresence>
          {!canSubmit && (type || desc.trim().length > 0) && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#92400E', marginBottom: 12 }}>
              {!type ? '⚠ Please select an issue type.' : '⚠ Description must be at least 10 characters.'}
            </motion.div>
          )}
        </AnimatePresence>

        {/* API error */}
        {error && (
          <div style={{ background: '#FEE2E2', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#B91C1C', display: 'flex', alignItems: 'center', gap: 8 }}>
            <HiX size={16} /> {error}
          </div>
        )}
      </div>

      {/* Submit */}
      <div style={{ padding: '12px 16px 36px', background: '#F5F8FC', borderTop: '1px solid #EEF2F7', flexShrink: 0 }}>
        <button onClick={handleSubmit} disabled={!canSubmit || submitting} style={{
          width: '100%', height: 54, borderRadius: 16, border: 'none',
          background: canSubmit ? BRAND_GRADIENT : '#C0CCDA',
          color: '#FFFFFF', fontSize: 16, fontWeight: 700,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          boxShadow: canSubmit ? '0 6px 20px rgba(44,110,213,0.40)' : 'none',
          transition: 'all 0.2s',
        }}>
          {submitting ? 'Submitting…' : 'Submit ticket'}
        </button>
      </div>
    </div>
  )
}
