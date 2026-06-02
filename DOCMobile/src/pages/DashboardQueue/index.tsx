import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { queueService } from '@/services/queueService'
import { unwrapList, clinicId } from '@/services/api'
import type { QueueToken } from '@/types'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

export function DashboardQueue() {
  const user = useAuthStore((s) => s.user)
  const clinic = useAuthStore((s) => s.selectedClinic)
  const [tokens, setTokens] = useState<QueueToken[]>([])
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const cid = clinicId(clinic)

  const refresh = () => {
    if (!cid) return
    queueService.getQueue(cid).then((res) => setTokens(unwrapList<QueueToken>(res.data)))
  }

  useEffect(() => { refresh() }, [cid])

  const current = tokens.find((t) => t.status === 'in-progress') ?? null
  const waiting = tokens.filter((t) => t.status === 'waiting')
  const done = tokens.filter((t) => t.status === 'done').length

  // Live timer for in-room session
  useEffect(() => {
    if (!current) { setStartedAt(null); setElapsed(0); return }
    setStartedAt((prev) => prev ?? Date.now())
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [current?.id])

  const minutesIn = startedAt ? Math.floor((Date.now() - startedAt) / 60000) : 0

  const callNext = async () => {
    if (!cid) return
    await queueService.callNext(cid)
    refresh()
  }
  const complete = async () => {
    if (!current) return
    await queueService.updateStatus(current.id, 'done')
    setStartedAt(null); setElapsed(0)
    refresh()
  }

  const initials = (user?.name ?? '')
    .replace(/^Dr\.\s*/i, '')
    .split(' ').map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100%', background: '#F5F8FC' }}>
      {/* Hero */}
      <div style={{ background: BRAND_GRADIENT, padding: '52px 20px 70px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>{initials || 'D'}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', margin: 0, fontWeight: 500 }}>{today}</p>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', margin: '2px 0 0' }}>Dr. {(user?.name ?? '').replace(/^Dr\.\s*/i, '') || 'Doctor'}</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <IconChip><BellSvg /></IconChip>
            <IconChip><SearchSvg /></IconChip>
          </div>
        </div>

        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', margin: 0, textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 700 }}>
              {clinic?.name ?? 'No clinic'}
            </p>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', margin: '4px 0 0' }}>Session in progress</h2>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.18)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 999, padding: '6px 12px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />
            <span style={{ fontSize: 11, color: '#FFFFFF', fontWeight: 700 }}>Available</span>
          </div>
        </div>
      </div>

      {/* In-room card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{ position: 'relative', zIndex: 2, margin: '-44px 16px 16px', background: '#FFFFFF', borderRadius: 18, padding: 16, boxShadow: '0 6px 24px rgba(30,79,163,0.12)' }}
      >
        {current ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ECFDF5', color: '#059669', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
                NOW IN ROOM
              </span>
              <span style={{ fontSize: 11, color: '#94A3B8' }}>
                {new Date(startedAt ?? Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} · {minutesIn} min in
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: '#1E4FA3', letterSpacing: '0.5px' }}>A-{String(current.number).padStart(3, '0')}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', margin: 0 }}>{current.patientName}</p>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>Token in progress · {formatElapsed(elapsed)}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button onClick={complete} style={{ flex: 1, padding: '12px', borderRadius: 12, background: BRAND_GRADIENT, color: '#FFFFFF', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                Complete &amp; next ›
              </button>
              <button style={{ padding: '12px 18px', borderRadius: 12, background: '#FFFFFF', color: '#1E4FA3', fontSize: 13, fontWeight: 700, border: '1.5px solid #DBE7F8', cursor: 'pointer' }}>
                Pause
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>No active patient</p>
            <button onClick={callNext} disabled={waiting.length === 0}
              style={{ marginTop: 12, padding: '12px 18px', borderRadius: 12, background: BRAND_GRADIENT, color: '#FFFFFF', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: waiting.length === 0 ? 0.5 : 1 }}>
              Call next →
            </button>
          </div>
        )}
      </motion.div>

      {/* Stat tiles */}
      <div style={{ display: 'flex', gap: 10, margin: '0 16px 16px' }}>
        <StatTile value={tokens.length} eyebrow="TODAY" sub="patients" />
        <StatTile value={waiting.length} eyebrow="WAITING" sub="in queue" />
        <StatTile value={done > 0 ? `~${Math.max(8, Math.round(elapsed / Math.max(done, 1) / 60))}m` : '—'} eyebrow="AVG" sub="consult" />
      </div>

      {/* Up next */}
      <div style={{ margin: '0 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1E293B', margin: 0 }}>Up next</h3>
          <span style={{ fontSize: 12, color: '#1E4FA3', fontWeight: 600 }}>See all ›</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {waiting.map((t) => {
            const emergency = t.number >= 900 || t.patientName.toLowerCase().includes('emergency')
            return (
              <div key={t.id} style={{
                background: emergency ? '#FEF2F2' : '#FFFFFF',
                borderRadius: 14, padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 12,
                boxShadow: '0 2px 8px rgba(30,79,163,0.06)',
              }}>
                <div style={{
                  minWidth: 56, padding: '8px 10px', borderRadius: 10,
                  background: emergency ? '#FEE2E2' : '#EBF2FF',
                  color: emergency ? '#DC2626' : '#1E4FA3',
                  fontSize: 13, fontWeight: 800, textAlign: 'center', letterSpacing: '0.5px',
                }}>
                  {emergency ? 'E' : 'A'}-{String(t.number).padStart(3, '0')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', margin: 0 }}>{t.patientName}</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>{emergency ? 'Urgent · review' : 'Waiting'}</p>
                </div>
                <span style={{ fontSize: 11, color: emergency ? '#DC2626' : '#94A3B8', fontWeight: 600 }}>
                  {emergency ? 'now' : `${Math.max(2, (waiting.indexOf(t) + 1) * 8)} min`}
                </span>
              </div>
            )
          })}
          {waiting.length === 0 && (
            <p style={{ textAlign: 'center', fontSize: 13, color: '#94A3B8', padding: '20px 0' }}>All patients seen 🎉</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function formatElapsed(s: number) {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

function StatTile({ value, eyebrow, sub }: { value: React.ReactNode; eyebrow: string; sub: string }) {
  return (
    <div style={{ flex: 1, background: '#FFFFFF', borderRadius: 14, padding: 12, boxShadow: '0 2px 8px rgba(30,79,163,0.06)' }}>
      <p style={{ fontSize: 18, fontWeight: 800, color: '#1E293B', margin: 0, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.8px', margin: '6px 0 0' }}>{eyebrow}</p>
      <p style={{ fontSize: 10, color: '#94A3B8', margin: '2px 0 0' }}>{sub}</p>
    </div>
  )
}

function IconChip({ children }: { children: React.ReactNode }) {
  return (
    <button style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </button>
  )
}

function BellSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
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
