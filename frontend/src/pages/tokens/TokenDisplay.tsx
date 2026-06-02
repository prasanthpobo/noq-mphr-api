import { useState, useEffect, useCallback, useMemo } from 'react'
import dayjs from 'dayjs'
import Icon from '@/components/ui/Icon'
import { useAppStore } from '@/store/app'
import { tokensService } from '@/services/tokens.service'
import { doctorsService } from '@/services/doctors.service'

/* ────────────────────────────────────────────────────────────────────────── */
/*  Palette                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

const PAGE_BG =
  'radial-gradient(at top left, #0B2B6A 0%, #0E2A5A 35%, #0A1F4D 70%, #061638 100%), linear-gradient(135deg, #0E2A5A 0%, #134288 50%, #1B6FA1 100%)'

const TEAL   = '#1FA3A8'
const TEAL_2 = '#7FCDD0'
const TEAL_3 = '#28B7B3'

const W = {
  w03:  'rgba(255,255,255,0.03)',
  w05:  'rgba(255,255,255,0.05)',
  w08:  'rgba(255,255,255,0.08)',
  w10:  'rgba(255,255,255,0.10)',
  w12:  'rgba(255,255,255,0.12)',
  w15:  'rgba(255,255,255,0.15)',
  w18:  'rgba(255,255,255,0.18)',
  w24:  'rgba(255,255,255,0.24)',
  w45:  'rgba(255,255,255,0.45)',
  w60:  'rgba(255,255,255,0.60)',
  w75:  'rgba(255,255,255,0.75)',
  w90:  'rgba(255,255,255,0.90)',
}

function useClockTick() {
  const [now, setNow]   = useState(new Date())
  const [colon, setColon] = useState(true)
  useEffect(() => {
    const id = setInterval(() => { setNow(new Date()); setColon((c) => !c) }, 1000)
    return () => clearInterval(id)
  }, [])
  return { now, colon }
}

function initialsOf(name?: string): string {
  if (!name) return '?'
  return name.split(' ').map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

/* ────────────────────────────────────────────────────────────────────────── */

export default function TokenDisplay() {
  const { setRoute } = useAppStore()
  const { now, colon } = useClockTick()
  const [currentDoctorIdx, setCurrentDoctorIdx] = useState(0)
  const [isAutoAnnounce, setIsAutoAnnounce]     = useState(true)
  const [muted, setMuted]                       = useState(false)
  const [doctors, setDoctors] = useState<any[]>([])
  const [tokens,  setTokens]  = useState<any[]>([])

  const loadData = useCallback(async () => {
    const today = dayjs().format('YYYY-MM-DD')
    const [dRes, tRes] = await Promise.all([
      doctorsService.list(),
      tokensService.list({ date: today }),
    ])
    setDoctors(dRes.data || [])
    setTokens(tRes.data  || [])
  }, [])

  useEffect(() => {
    loadData()
    const id = setInterval(loadData, 30_000)
    return () => clearInterval(id)
  }, [loadData])

  // ── derived state ──────────────────────────────────────────────────────
  const docQueues = useMemo(() => {
    const map = new Map<string, any[]>()
    tokens.forEach((t) => {
      const key = t.doctorId?._id || ''
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    })
    return map
  }, [tokens])

  const activeDoctors = doctors.filter((d: any) => d.status !== 'on-leave')
  const currentDoctor = activeDoctors[currentDoctorIdx] ?? activeDoctors[0]
  const doctorQueue   = docQueues.get(currentDoctor?._id ?? '') ?? []
  const nowToken      = doctorQueue.find((t: any) => t.status === 'in-consultation') ?? doctorQueue[0]
  const nextTokens    = doctorQueue
    .filter((t: any) => t !== nowToken && t.status === 'waiting')
    .slice(0, 9)
  const recentlyServed = doctorQueue
    .filter((t: any) => t.status === 'completed')
    .slice(-4)
    .reverse()

  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  const [timePart, ampm] = timeStr.split(' ')
  const [hh, mm] = timePart.split(':')

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100vh', overflow: 'hidden',
      background: PAGE_BG,
      color: 'white', display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font-sans)',
    }}>
      <style>{`
        @keyframes hero-pulse {
          0%,100% { box-shadow: 0 0 80px rgba(31,163,168,0.30), inset 0 0 60px rgba(31,163,168,0.10); }
          50%     { box-shadow: 0 0 120px rgba(31,163,168,0.50), inset 0 0 80px rgba(31,163,168,0.18); }
        }
        @keyframes glow-soft {
          0%,100% { opacity: 0.75; }
          50%     { opacity: 1;   }
        }
      `}</style>

      {/* Exit */}
      <button
        onClick={() => setRoute('tokens-mgr')}
        style={{
          position: 'absolute', top: 14, right: 16, zIndex: 30,
          background: W.w10, border: `1px solid ${W.w18}`,
          borderRadius: 10, padding: '6px 14px', color: W.w75,
          fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>
        Exit
      </button>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center', padding: '22px 40px 18px',
        flexShrink: 0, zIndex: 1,
      }}>
        {/* Left — clinic */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          }}>
            <Icon name="plus" size={36} style={{ color: '#10B981' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.4 }}>
              {tokens[0]?.clinicId?.name ?? currentDoctor?.clinicId?.name ?? 'NoQ Health Clinic'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, color: W.w75, fontSize: 14, fontWeight: 600 }}>
              <span style={{ color: TEAL_2 }}>📍</span>
              {tokens[0]?.clinicId?.address ?? '12, MG Road, Anna Nagar, Chennai'}
            </div>
          </div>
        </div>

        {/* Center — clock */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 10, justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(56px, 6vw, 88px)', fontWeight: 900,
            color: 'white', lineHeight: 1, letterSpacing: -1,
          }}>
            <span>{hh}</span>
            <span style={{ opacity: colon ? 1 : 0.25, transition: 'opacity 200ms' }}>:</span>
            <span>{mm}</span>
            <span style={{ fontSize: 'clamp(20px, 2vw, 28px)', fontWeight: 700, color: W.w60, marginLeft: 6 }}>
              {ampm}
            </span>
          </div>
          <div style={{ fontSize: 14, color: W.w60, marginTop: 4, fontWeight: 600 }}>
            {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* Right — doctor */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.2 }}>{currentDoctor?.name ?? 'Doctor'}</div>
            <div style={{ fontSize: 14, color: TEAL_2, marginTop: 2, fontWeight: 700 }}>{currentDoctor?.specialization ?? ''}</div>
            <div style={{ fontSize: 12, color: W.w60, marginTop: 2, textTransform: 'capitalize', fontWeight: 600 }}>
              {currentDoctor?.shift ? `${currentDoctor.shift} Shift` : 'On duty'}
            </div>
          </div>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: TEAL, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 900, flexShrink: 0,
            border: `2px solid ${W.w24}`, boxShadow: `0 0 20px ${TEAL}66`,
          }}>
            {initialsOf(currentDoctor?.name)}
          </div>
        </div>
      </div>

      {/* ── Main split: Now serving | Next in queue ─────────────────────── */}
      <div style={{ flex: 1, display: 'flex', gap: 28, padding: '8px 40px 16px', minHeight: 0, zIndex: 1 }}>

        {/* HERO — Now Serving */}
        <div style={{ flex: '0 0 44%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, minHeight: 0 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 999,
            background: W.w10, border: `1px solid ${W.w18}`,
            fontSize: 12, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase',
            color: W.w90,
          }}>
            <span style={{ color: TEAL_2 }}>📡</span> Now Serving
          </div>

          {/* Hero card */}
          <div style={{
            flex: 1, width: '100%', maxWidth: 540,
            background: `linear-gradient(180deg, ${W.w08} 0%, ${W.w03} 100%)`,
            border: `1px solid ${W.w15}`,
            borderRadius: 28, padding: '28px 36px 32px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
            animation: nowToken ? 'hero-pulse 3s ease-in-out infinite' : undefined,
            backdropFilter: 'blur(8px)',
            minHeight: 0,
          }}>
            {/* TOKEN label */}
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '6px 16px', borderRadius: 999,
              background: W.w10, border: `1px solid ${W.w18}`,
              fontSize: 12, fontWeight: 800, letterSpacing: '0.2em',
              color: W.w75,
            }}>
              TOKEN
            </div>

            {/* Token number */}
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(140px, 18vw, 240px)',
              fontWeight: 900, lineHeight: 0.9, letterSpacing: -8,
              color: 'white',
              textShadow: `0 0 60px ${TEAL}80, 0 0 120px ${TEAL}40`,
            }}>
              {nowToken?.tokenNumber != null ? String(nowToken.tokenNumber) : '—'}
            </div>

            {/* Patient name */}
            <div style={{
              fontSize: 'clamp(28px, 3vw, 38px)', fontWeight: 800,
              color: TEAL_2, letterSpacing: -0.5, textAlign: 'center',
            }}>
              {nowToken?.patientId?.name || 'No patient'}
            </div>

            {/* Doctor + specialty chips */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
              {currentDoctor?.name && (
                <span style={chipStyle}>
                  <Icon name="user" size={14} style={{ color: TEAL_2 }} />
                  {currentDoctor.name}
                </span>
              )}
              {currentDoctor?.specialization && (
                <span style={chipStyle}>
                  <Icon name="stethoscope" size={14} style={{ color: TEAL_2 }} />
                  {currentDoctor.specialization}
                </span>
              )}
            </div>

            {/* Please come CTA */}
            <button
              onClick={() => { /* future: re-trigger announcement */ }}
              style={{
                width: '100%', maxWidth: 380,
                padding: '16px 18px', borderRadius: 18,
                background: `linear-gradient(135deg, ${TEAL_3} 0%, ${TEAL} 100%)`,
                border: 'none', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                fontSize: 18, fontWeight: 800, color: 'white',
                boxShadow: `0 12px 32px ${TEAL}66`,
              }}>
              <Icon name="speech" size={20} style={{ color: 'white' }} />
              Please come to Room {currentDoctor?.workingHours?.length ? '1' : currentDoctorIdx + 1}
            </button>
          </div>
        </div>

        {/* NEXT IN QUEUE */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 800, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: W.w75, marginBottom: 14,
          }}>
            Next in queue
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gridAutoRows: 'minmax(0, 1fr)',
            gap: 14, flex: 1, minHeight: 0,
          }}>
            {Array.from({ length: 9 }).map((_, i) => {
              const t       = nextTokens[i]
              const isFirst = i === 0
              return (
                <div key={i}
                  style={{
                    background: t
                      ? (isFirst ? `linear-gradient(135deg, ${TEAL}22 0%, ${TEAL}10 100%)` : W.w05)
                      : W.w03,
                    border: `1px solid ${t ? (isFirst ? `${TEAL}80` : W.w12) : W.w08}`,
                    borderRadius: 18, padding: '14px 18px',
                    display: 'flex', alignItems: 'center', gap: 14,
                    minHeight: 0, overflow: 'hidden',
                    boxShadow: isFirst && t ? `0 0 24px ${TEAL}40` : 'none',
                    animation: isFirst && t ? 'glow-soft 2.5s ease-in-out infinite' : 'none',
                  }}>
                  {t ? (
                    <>
                      {/* Big number */}
                      <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 36, fontWeight: 900, lineHeight: 1,
                        color: TEAL_2, minWidth: 44, textAlign: 'center',
                      }}>
                        {t.tokenNumber}
                      </div>
                      {/* Name + time */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 16, fontWeight: 800, color: 'white',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {t.patientId?.name || 'Patient'}
                        </div>
                        <div style={{ fontSize: 12, color: W.w60, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Icon name="clock" size={12} style={{ color: W.w60 }} />
                          {t.appointmentId?.time || dayjs(t.issuedAt ?? new Date()).format('hh:mm A')}
                        </div>
                      </div>
                      {isFirst && (
                        <span style={{
                          background: TEAL_3, color: 'white',
                          borderRadius: 8, padding: '4px 10px',
                          fontSize: 10, fontWeight: 900, letterSpacing: '0.1em',
                          textTransform: 'uppercase', flexShrink: 0,
                        }}>
                          Up next
                        </span>
                      )}
                    </>
                  ) : (
                    <div style={{
                      flex: 1, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 8, color: W.w24,
                    }}>
                      <Icon name="users" size={28} style={{ color: W.w24 }} />
                      <div style={{ fontSize: 22, fontWeight: 800 }}>—</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Recently served strip ───────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, margin: '0 40px 18px',
        background: W.w03, border: `1px solid ${W.w08}`,
        borderRadius: 18, padding: 16,
        display: 'flex', alignItems: 'center', gap: 14,
        backdropFilter: 'blur(6px)',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0,
          fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase',
          color: W.w75,
        }}>
          <Icon name="clock" size={14} style={{ color: TEAL_2 }} />
          Recently served
        </div>

        <div style={{ flex: 1, display: 'flex', gap: 12, overflowX: 'auto' }}>
          {recentlyServed.length === 0 ? (
            <div style={{ color: W.w45, fontSize: 13, fontWeight: 600, padding: '6px 0' }}>
              No completed tokens yet today.
            </div>
          ) : recentlyServed.map((t: any) => (
            <div key={t._id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
                padding: '10px 16px', borderRadius: 14,
                background: W.w05, border: `1px solid ${W.w10}`,
                minWidth: 220,
              }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: '#10B981', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                boxShadow: '0 0 12px rgba(16,185,129,0.5)',
              }}>
                <Icon name="check" size={14} stroke={3} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: W.w60, letterSpacing: 0.4 }}>Token</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 900, color: TEAL_2 }}>
                    {t.tokenNumber}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
                  {t.doctorId?.name ?? '—'}
                </div>
                <div style={{ fontSize: 11, color: W.w45, fontFamily: 'var(--font-mono)' }}>
                  {t.completedAt ? dayjs(t.completedAt).format('hh:mm A') :
                    t.calledAt   ? dayjs(t.calledAt).format('hh:mm A')   :
                    t.issuedAt   ? dayjs(t.issuedAt).format('hh:mm A')   : '—'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <button
            onClick={() => setIsAutoAnnounce((v) => !v)}
            style={controlBtnStyle(isAutoAnnounce)}>
            <Icon name="speech" size={14} />
            Auto Announce
          </button>
          <button
            onClick={() => setMuted((v) => !v)}
            style={controlBtnStyle(!muted, true)}>
            {muted ? '🔇' : '🔊'}
            Mute
          </button>
        </div>
      </div>

      {/* ── Doctor switcher (compact, only when multiple doctors) ───────── */}
      {activeDoctors.length > 1 && (
        <div style={{
          flexShrink: 0, padding: '0 40px 10px',
          display: 'flex', gap: 8, overflowX: 'auto',
        }}>
          {activeDoctors.map((doc, i) => {
            const isActive = i === currentDoctorIdx
            return (
              <button
                key={doc._id}
                onClick={() => setCurrentDoctorIdx(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
                  padding: '6px 12px', borderRadius: 10,
                  background: isActive ? `${TEAL}33` : W.w05,
                  border: `1px solid ${isActive ? TEAL : W.w10}`,
                  color: isActive ? TEAL_2 : W.w75,
                  cursor: 'pointer', fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit',
                }}>
                Dr. {(doc.name ?? '').split(' ').slice(-1)[0]}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Shared styles ──────────────────────────────────────────────────────── */

const chipStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '8px 16px', borderRadius: 999,
  background: W.w08, border: `1px solid ${W.w15}`,
  fontSize: 14, fontWeight: 700, color: 'white',
}

function controlBtnStyle(active: boolean, _isMute = false): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '10px 16px', borderRadius: 12,
    background: active ? `${TEAL}33` : W.w05,
    border: `1px solid ${active ? `${TEAL}80` : W.w10}`,
    color: active ? TEAL_2 : W.w75,
    fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  }
}
