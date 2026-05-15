import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/store/app'
import { tokensService } from '@/services/tokens.service'
import { doctorsService } from '@/services/doctors.service'
import dayjs from 'dayjs'

/* ── Theme-consistent palette ─────────────────────────────────────────────
 *  All colours derived from the app's CSS variable values so the TV display
 *  stays in sync with the brand (navy → blue → teal gradient).
 * ────────────────────────────────────────────────────────────────────────── */
const C = {
  // CSS variable references (usable directly in style props)
  accent:     'var(--teal-300)',   // #7FCDD0 — highlight
  accentMid:  'var(--teal-400)',   // #28B7B3
  brand:      'var(--teal-500)',   // #1FA3A8 — teal
  brandBlue:  'var(--teal-600)',   // #2C6ED5 — blue
  dark:       'var(--teal-800)',   // #1E4FA3
  darker:     'var(--teal-900)',   // #102E63
  cardBg:     'var(--brand-gradient-dark)', // navy→blue→teal

  // rgba variants — CSS vars can't nest inside rgba(), use literal hex
  t5_15:  'rgba(31,163,168,0.15)',
  t5_20:  'rgba(31,163,168,0.20)',
  t5_25:  'rgba(31,163,168,0.25)',
  t5_30:  'rgba(31,163,168,0.30)',
  t5_40:  'rgba(31,163,168,0.40)',
  t5_50:  'rgba(31,163,168,0.50)',
  t6_20:  'rgba(44,110,213,0.20)',
  t6_40:  'rgba(44,110,213,0.40)',
  t3_20:  'rgba(127,205,208,0.20)',
  t3_40:  'rgba(127,205,208,0.40)',
  t3_50:  'rgba(127,205,208,0.50)',

  w02:  'rgba(255,255,255,0.02)',
  w05:  'rgba(255,255,255,0.05)',
  w06:  'rgba(255,255,255,0.06)',
  w08:  'rgba(255,255,255,0.08)',
  w10:  'rgba(255,255,255,0.10)',
  w12:  'rgba(255,255,255,0.12)',
  w15:  'rgba(255,255,255,0.15)',
  w18:  'rgba(255,255,255,0.18)',
  w45:  'rgba(255,255,255,0.45)',
  w50:  'rgba(255,255,255,0.50)',
  w70:  'rgba(255,255,255,0.70)',
  w85:  'rgba(255,255,255,0.85)',
} as const

function useClockTick() {
  const [now, setNow] = useState(new Date())
  const [colon, setColon] = useState(true)
  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date())
      setColon(c => !c)
    }, 1000)
    return () => clearInterval(id)
  }, [])
  return { now, colon }
}

export default function TokenDisplay() {
  const { setRoute } = useAppStore()
  const { now, colon } = useClockTick()
  const [currentDoctorIdx, setCurrentDoctorIdx] = useState(0)
  const [isAutoRotate, setIsAutoRotate] = useState(true)
  const [soundOn, setSoundOn] = useState(false)
  const [doctors, setDoctors] = useState<any[]>([])
  const [tokens, setTokens] = useState<any[]>([])

  const loadData = useCallback(async () => {
    const today = dayjs().format('YYYY-MM-DD')
    const [dRes, tRes] = await Promise.all([
      doctorsService.list(),
      tokensService.list({ date: today }),
    ])
    setDoctors(dRes.data || [])
    setTokens(tRes.data || [])
  }, [])

  useEffect(() => {
    loadData()
    const id = setInterval(loadData, 30000)
    return () => clearInterval(id)
  }, [loadData])

  // Group tokens by doctorId._id
  const docQueues = new Map<string, any[]>()
  tokens.forEach(t => {
    const key = t.doctorId?._id || ''
    if (!docQueues.has(key)) docQueues.set(key, [])
    docQueues.get(key)!.push(t)
  })

  const activeDoctors = doctors.filter((d: any) => d.status !== 'on-leave')

  useEffect(() => {
    if (!isAutoRotate) return
    const id = setInterval(() => {
      setCurrentDoctorIdx(i => (i + 1) % (activeDoctors.length || 1))
    }, 15000)
    return () => clearInterval(id)
  }, [isAutoRotate, activeDoctors.length])

  const currentDoctor = activeDoctors[currentDoctorIdx] ?? activeDoctors[0]
  const doctorQueue   = docQueues.get(currentDoctor?._id ?? '') ?? []
  const nowToken      = doctorQueue.find((t: any) => t.status === 'in-consultation') ?? doctorQueue[0]
  const nextTokens    = doctorQueue
    .filter((t: any) => t !== nowToken && t.status !== 'completed' && t.status !== 'cancelled')
    .slice(0, 6)

  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
  const [timePart, ampm] = timeStr.split(' ')
  const parts = timePart.split(':')
  const displayTime = `${parts[0]}${colon ? ':' : ' '}${parts[1]}`

  const totalSeen = doctorQueue.filter((t: any) => t.status === 'completed').length

  return (
    <div className="tv-overlay">

      {/* ── Keyframe animations ─────────────────────────────────────────── */}
      <style>{`
        @keyframes tv-pulse {
          0%, 100% { box-shadow: 0 0 60px ${C.t5_30}, 0 0 120px ${C.t5_15}; }
          50%       { box-shadow: 0 0 80px ${C.t5_50}, 0 0 160px ${C.t5_25}; }
        }
        @keyframes tv-glow {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 1;   }
        }
      `}</style>

      {/* ── Exit ─────────────────────────────────────────────────────────── */}
      <button
        onClick={() => setRoute('tokens-mgr')}
        style={{
          position: 'absolute', top: 16, right: 16, zIndex: 10,
          background: C.w12, border: `1px solid ${C.w18}`,
          borderRadius: 10, padding: '6px 14px', color: C.w70,
          fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'all 200ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = C.w18; e.currentTarget.style.color = 'white' }}
        onMouseLeave={e => { e.currentTarget.style.background = C.w12; e.currentTarget.style.color = C.w70 }}
      >
        Exit
      </button>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center', padding: '20px 32px 16px',
        borderBottom: `1px solid ${C.w08}`, flexShrink: 0,
      }}>

        {/* Left: Clinic */}
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
            {tokens[0]?.clinicId?.name ?? 'NoQ Clinic'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <span style={{
              background: C.t5_25, border: `1px solid ${C.t5_40}`,
              borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 600,
              color: C.w85,
            }}>
              {tokens[0]?.clinicId?.address ?? 'Token Queue Display'}
            </span>
          </div>
        </div>

        {/* Center: Clock */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(40px, 5vw, 64px)',
            fontWeight: 800, color: C.accent,
            letterSpacing: '-0.02em', lineHeight: 1,
          }}>
            {displayTime}
          </div>
          <div style={{
            fontSize: 14, color: C.w50, marginTop: 4,
            fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
          }}>
            {ampm} · {now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>

        {/* Right: Doctor */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{currentDoctor?.name}</div>
            <div style={{ fontSize: 13, color: C.w70, marginTop: 3 }}>{currentDoctor?.specialization}</div>
            <div style={{ fontSize: 12, color: C.accent, marginTop: 2, fontFamily: 'var(--font-mono)', textTransform: 'capitalize' }}>
              {currentDoctor?.shift} shift
            </div>
          </div>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: `linear-gradient(135deg, ${C.t5_40}, ${C.t6_40})`,
            border: `2px solid ${C.w15}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, flexShrink: 0,
          }}>
            {currentDoctor?.name?.slice(0, 2) || 'DR'}
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden', minHeight: 0 }}>

        {/* HERO: Now Serving */}
        <div style={{
          flex: '0 0 42%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '32px 40px',
          borderRight: `1px solid ${C.w06}`,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 800, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: C.w50, marginBottom: 24,
          }}>
            Now Serving
          </div>

          {/* Token card */}
          <div style={{
            background: C.cardBg,
            border: `1px solid ${C.t3_40}`,
            borderRadius: 28, padding: '40px 56px',
            textAlign: 'center', width: '100%', maxWidth: 420,
            animation: 'tv-pulse 3s ease-in-out infinite',
          }}>

            {/* Token number */}
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(80px, 12vw, 160px)',
              fontWeight: 900, lineHeight: 1,
              background: `linear-gradient(135deg, #ffffff 0%, ${C.accentMid} 50%, ${C.accent} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.04em',
            }}>
              {nowToken?.tokenNumber != null ? String(nowToken.tokenNumber) : '—'}
            </div>

            <div style={{ fontSize: 20, fontWeight: 700, color: 'white', marginTop: 12 }}>
              {nowToken?.patientId?.name || 'No patient'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              {[
                { label: currentDoctor?.name ?? '',          icon: '👨‍⚕️' },
                { label: currentDoctor?.specialization ?? '', icon: '🩺' },
                { label: `${totalSeen} seen today`,          icon: '✓'  },
              ].map((pill, i) => (
                <span key={i} style={{
                  background: C.w12, border: `1px solid ${C.w18}`,
                  borderRadius: 999, padding: '5px 12px', fontSize: 12.5, fontWeight: 600,
                  color: C.w85,
                }}>
                  {pill.icon} {pill.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Next in Queue */}
        <div style={{ flex: 1, padding: '28px 32px', overflow: 'hidden' }}>
          <div style={{
            fontSize: 11, fontWeight: 800, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: C.w45, marginBottom: 20,
          }}>
            Next in queue
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, height: 'calc(100% - 48px)' }}>
            {Array.from({ length: 6 }, (_, i) => {
              const t      = nextTokens[i]
              const isNext = i === 0
              return (
                <div
                  key={i}
                  style={{
                    background: t
                      ? (isNext ? C.t5_20 : C.w05)
                      : C.w02,
                    border: `1px solid ${t ? (isNext ? C.t3_50 : C.w10) : 'rgba(255,255,255,0.04)'}`,
                    borderRadius: 16, padding: 20,
                    display: 'flex', flexDirection: 'column', gap: 8,
                    boxShadow: isNext && t ? `0 0 24px ${C.t5_20}` : 'none',
                    animation: isNext && t ? 'tv-glow 2s ease-in-out infinite' : 'none',
                  }}
                >
                  {t ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800,
                          color: isNext ? C.accent : C.w85,
                        }}>
                          {t.tokenNumber}
                        </span>
                        {isNext && (
                          <span style={{
                            background: C.t3_20, border: `1px solid ${C.t3_40}`,
                            borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 800,
                            color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em',
                          }}>
                            Up next
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: 'white', lineHeight: 1.3 }}>
                        {t.patientId?.name || 'Patient'}
                      </div>
                      <div style={{ fontSize: 11.5, color: C.w45, fontFamily: 'var(--font-mono)' }}>
                        {t.appointmentId?.time || ''}
                      </div>
                    </>
                  ) : (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      height: '100%', color: C.w08, fontSize: 30,
                    }}>
                      —
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Footer ticker ────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, borderTop: `1px solid ${C.w08}`,
        background: 'rgba(0,0,0,0.25)', padding: '10px 24px',
        display: 'flex', alignItems: 'center', gap: 12, overflowX: 'auto',
      }}>
        <div style={{ display: 'flex', gap: 8, flex: 1, overflowX: 'auto', paddingBottom: 2 }}>
          {activeDoctors.map((doc, i) => {
            const dq          = docQueues.get(doc._id) ?? []
            const nowTk       = dq.find((t: any) => t.status === 'in-consultation')
            const waitingCount = dq.filter((t: any) => t.status === 'waiting').length
            const isActive    = i === currentDoctorIdx
            return (
              <button
                key={doc._id}
                onClick={() => { setCurrentDoctorIdx(i); setIsAutoRotate(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
                  padding: '6px 12px', borderRadius: 10,
                  background: isActive ? C.t5_15 : C.w06,
                  border: `1px solid ${isActive ? C.t5_40 : C.w10}`,
                  color: 'white', cursor: 'pointer', transition: 'all 200ms',
                }}
              >
                <span style={{
                  background: C.w15, borderRadius: 6,
                  padding: '2px 6px', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800,
                }}>
                  {doc.shift ?? 'AM'}
                </span>
                {nowTk && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: C.accent }}>
                    {nowTk.tokenNumber}
                  </span>
                )}
                <span style={{
                  fontSize: 12.5, fontWeight: 600,
                  maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {doc.name}
                </span>
                <span style={{
                  fontSize: 11, color: C.w45,
                  background: C.w08, borderRadius: 999, padding: '1px 6px',
                }}>
                  {waitingCount} waiting
                </span>
              </button>
            )
          })}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 8 }}>
          <button
            onClick={() => setIsAutoRotate(a => !a)}
            style={{
              padding: '6px 12px', borderRadius: 8,
              background: isAutoRotate ? C.t5_20 : C.w06,
              border: `1px solid ${isAutoRotate ? C.t5_40 : C.w15}`,
              color: isAutoRotate ? C.accent : C.w50,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 200ms',
            }}
          >
            {isAutoRotate ? '⟳ Auto' : '⏸ Paused'}
          </button>
          <button
            onClick={() => setSoundOn(s => !s)}
            style={{
              padding: '6px 12px', borderRadius: 8,
              background: soundOn ? C.t5_20 : C.w06,
              border: `1px solid ${soundOn ? C.t5_40 : C.w15}`,
              color: soundOn ? C.accent : C.w50,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 200ms',
            }}
          >
            {soundOn ? '🔊 Sound' : '🔇 Muted'}
          </button>
        </div>
      </div>
    </div>
  )
}
