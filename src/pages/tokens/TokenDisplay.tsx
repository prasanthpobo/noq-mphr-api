import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/app'
import { DOCTORS, TOKEN_QUEUE } from '@/data'
import type { Doctor, TokenQueue } from '@/types'

// Group TOKEN_QUEUE by doctor
function getDocQueues(): Map<string, TokenQueue[]> {
  const map = new Map<string, TokenQueue[]>()
  TOKEN_QUEUE.forEach(t => {
    if (!map.has(t.doctor)) map.set(t.doctor, [])
    map.get(t.doctor)!.push(t)
  })
  return map
}

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

  const docQueues = getDocQueues()
  const activeDoctors = DOCTORS.filter(d => d.status !== 'leave')

  useEffect(() => {
    if (!isAutoRotate) return
    const id = setInterval(() => {
      setCurrentDoctorIdx(i => (i + 1) % activeDoctors.length)
    }, 15000)
    return () => clearInterval(id)
  }, [isAutoRotate, activeDoctors.length])

  const currentDoctor: Doctor = activeDoctors[currentDoctorIdx] ?? activeDoctors[0]
  const doctorQueue = docQueues.get(currentDoctor?.name ?? '') ?? []
  const nowToken = doctorQueue.find(t => t.status === 'in-consultation') ?? doctorQueue[0]
  const nextTokens = doctorQueue.filter(t => t !== nowToken && t.status !== 'completed' && t.status !== 'cancelled').slice(0, 6)

  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
  const [timePart, ampm] = timeStr.split(' ')
  const parts = timePart.split(':')
  const displayTime = `${parts[0]}${colon ? ':' : ' '}${parts[1]}`

  const totalSeen = doctorQueue.filter(t => t.status === 'completed').length

  return (
    <div className="tv-overlay">
      {/* Exit button */}
      <button
        onClick={() => setRoute('tokens-mgr')}
        style={{
          position: 'absolute', top: 16, right: 16, zIndex: 10,
          background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 10, padding: '6px 14px', color: 'rgba(255,255,255,0.7)',
          fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'all 200ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'white' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
      >
        Exit
      </button>

      {/* Header 3-column */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center', padding: '20px 32px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0,
      }}>
        {/* Left: Clinic */}
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Sunshine Clinic</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <span style={{
              background: 'rgba(31,163,168,0.25)', border: '1px solid rgba(31,163,168,0.4)',
              borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 600,
              color: 'rgba(255,255,255,0.85)',
            }}>
              Koramangala · Bengaluru
            </span>
          </div>
        </div>

        {/* Center: Clock */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 'clamp(40px, 5vw, 64px)',
            fontWeight: 800, color: '#4fd8da', letterSpacing: '-0.02em', lineHeight: 1,
          }}>
            {displayTime}
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
            {ampm} · {now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>

        {/* Right: Doctor */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{currentDoctor?.name}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>{currentDoctor?.spec}</div>
            <div style={{ fontSize: 12, color: 'rgba(79,216,218,0.8)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{currentDoctor?.room}</div>
          </div>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(31,163,168,0.4), rgba(44,110,213,0.4))',
            border: '2px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, flexShrink: 0,
          }}>
            {currentDoctor?.av}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden', minHeight: 0 }}>

        {/* HERO: Now Serving */}
        <div style={{
          flex: '0 0 42%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '32px 40px',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.5)', marginBottom: 24,
          }}>
            Now Serving
          </div>

          {/* Token card */}
          <div style={{
            background: 'linear-gradient(135deg, #0c4a6e 0%, #0e7490 40%, #0f766e 100%)',
            border: '1px solid rgba(79,216,218,0.3)',
            borderRadius: 28, padding: '40px 56px',
            textAlign: 'center', width: '100%', maxWidth: 420,
            boxShadow: '0 0 60px rgba(31,163,168,0.3), 0 0 120px rgba(31,163,168,0.15)',
            animation: 'pulse 3s ease-in-out infinite',
          }}>
            <style>{`
              @keyframes pulse {
                0%, 100% { box-shadow: 0 0 60px rgba(31,163,168,0.3), 0 0 120px rgba(31,163,168,0.15); }
                50% { box-shadow: 0 0 80px rgba(31,163,168,0.5), 0 0 160px rgba(31,163,168,0.25); }
              }
              @keyframes glow-pulse {
                0%, 100% { opacity: 0.6; }
                50% { opacity: 1; }
              }
            `}</style>

            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(80px, 12vw, 160px)',
              fontWeight: 900, lineHeight: 1,
              background: 'linear-gradient(135deg, #ffffff 0%, #7dd3fc 50%, #4fd8da 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.04em',
            }}>
              {nowToken?.id ?? '—'}
            </div>

            <div style={{ fontSize: 20, fontWeight: 700, color: 'white', marginTop: 12 }}>
              {nowToken?.patient ?? 'No patient'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              {[
                { label: currentDoctor?.name ?? '', icon: '👨‍⚕️' },
                { label: currentDoctor?.room ?? '', icon: '🚪' },
                { label: `${totalSeen} seen today`, icon: '✓' },
              ].map((pill, i) => (
                <span key={i} style={{
                  background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 999, padding: '5px 12px', fontSize: 12.5, fontWeight: 600,
                  color: 'rgba(255,255,255,0.85)',
                }}>
                  {pill.icon} {pill.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Next in Queue */}
        <div style={{ flex: 1, padding: '28px 32px', overflow: 'hidden' }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
            Next in queue
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, height: 'calc(100% - 48px)' }}>
            {Array.from({ length: 6 }, (_, i) => {
              const t = nextTokens[i]
              const isNext = i === 0
              return (
                <div
                  key={i}
                  style={{
                    background: t
                      ? (isNext ? 'rgba(31,163,168,0.2)' : 'rgba(255,255,255,0.05)')
                      : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${t ? (isNext ? 'rgba(79,216,218,0.5)' : 'rgba(255,255,255,0.1)') : 'rgba(255,255,255,0.04)'}`,
                    borderRadius: 16, padding: 20,
                    display: 'flex', flexDirection: 'column', gap: 8,
                    boxShadow: isNext && t ? '0 0 24px rgba(31,163,168,0.2)' : 'none',
                    animation: isNext && t ? 'glow-pulse 2s ease-in-out infinite' : 'none',
                  }}
                >
                  {t ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800,
                          color: isNext ? '#4fd8da' : 'rgba(255,255,255,0.85)',
                        }}>{t.id}</span>
                        {isNext && (
                          <span style={{
                            background: 'rgba(79,216,218,0.2)', border: '1px solid rgba(79,216,218,0.4)',
                            borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 800,
                            color: '#4fd8da', textTransform: 'uppercase', letterSpacing: '0.08em',
                          }}>Up next</span>
                        )}
                      </div>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: 'white', lineHeight: 1.3 }}>{t.patient}</div>
                      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-mono)' }}>{t.slot}</div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.08)', fontSize: 30 }}>—</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer ticker */}
      <div style={{
        flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.3)', padding: '10px 24px',
        display: 'flex', alignItems: 'center', gap: 12, overflowX: 'auto',
      }}>
        <div style={{ display: 'flex', gap: 8, flex: 1, overflowX: 'auto', paddingBottom: 2 }}>
          {activeDoctors.map((doc, i) => {
            const dq = docQueues.get(doc.name) ?? []
            const nowTk = dq.find(t => t.status === 'in-consultation')
            const waitingCount = dq.filter(t => t.status === 'waiting').length
            const isActive = i === currentDoctorIdx
            return (
              <button
                key={doc.id}
                onClick={() => { setCurrentDoctorIdx(i); setIsAutoRotate(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
                  padding: '6px 12px', borderRadius: 10,
                  background: isActive ? 'rgba(79,216,218,0.15)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${isActive ? 'rgba(79,216,218,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  color: 'white', cursor: 'pointer', transition: 'all 200ms',
                }}
              >
                <span style={{
                  background: 'rgba(255,255,255,0.15)', borderRadius: 6,
                  padding: '2px 6px', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800,
                }}>{doc.room}</span>
                {nowTk && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#4fd8da' }}>{nowTk.id}</span>
                )}
                <span style={{ fontSize: 12.5, fontWeight: 600, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.08)', borderRadius: 999, padding: '1px 6px' }}>{waitingCount} waiting</span>
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
              background: isAutoRotate ? 'rgba(79,216,218,0.2)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${isAutoRotate ? 'rgba(79,216,218,0.4)' : 'rgba(255,255,255,0.15)'}`,
              color: isAutoRotate ? '#4fd8da' : 'rgba(255,255,255,0.5)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 200ms',
            }}
          >
            {isAutoRotate ? '⟳ Auto' : '⏸ Paused'}
          </button>
          <button
            onClick={() => setSoundOn(s => !s)}
            style={{
              padding: '6px 12px', borderRadius: 8,
              background: soundOn ? 'rgba(79,216,218,0.2)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${soundOn ? 'rgba(79,216,218,0.4)' : 'rgba(255,255,255,0.15)'}`,
              color: soundOn ? '#4fd8da' : 'rgba(255,255,255,0.5)',
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
