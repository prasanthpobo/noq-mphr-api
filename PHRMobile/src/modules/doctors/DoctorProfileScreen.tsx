import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import dayjs from 'dayjs'
import {
  HiArrowLeft, HiHeart, HiStar, HiBadgeCheck,
  HiOfficeBuilding, HiCalendar, HiAcademicCap,
} from 'react-icons/hi'
import {
  getDoctorById, getSlots, toggleFavouriteDoctor, getFavouriteDoctorIds,
  formatDoctorName, type Doctor,
} from '../../services/doctorService'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'
const AVATAR_COLORS  = ['#2C6ED5', '#1FA3A8', '#7C3AED', '#E05B5B', '#D97706', '#059669']

// ── Slot period helpers (mirrors BookingScreen) ────────────────────────────────

type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'night'

const PERIOD_CFG: Record<TimePeriod, { label: string; icon: string; range: string; color: string; bg: string; border: string }> = {
  morning:   { label: 'Morning',   icon: '🌅', range: '6 AM – 12 PM', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  afternoon: { label: 'Afternoon', icon: '☀️', range: '12 PM – 5 PM', color: '#2C6ED5', bg: '#EBF2FF', border: '#BFDBFE' },
  evening:   { label: 'Evening',   icon: '🌇', range: '5 PM – 9 PM',  color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  night:     { label: 'Night',     icon: '🌙', range: '9 PM – 12 AM', color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE' },
}

interface SlotItem { time: string; available: boolean }

function getTimePeriod(time: string): TimePeriod {
  const [rawTime, meridiem] = time.split(' ')
  const hour = parseInt(rawTime.split(':')[0], 10)
  const h24  = meridiem === 'PM' && hour !== 12 ? hour + 12 : meridiem === 'AM' && hour === 12 ? 0 : hour
  if (h24 < 12) return 'morning'
  if (h24 < 17) return 'afternoon'
  if (h24 < 20) return 'evening'
  return 'night'
}

function groupSlotsByPeriod(slots: SlotItem[]) {
  const groups: Partial<Record<TimePeriod, SlotItem[]>> = {}
  for (const slot of slots) {
    const p = getTimePeriod(slot.time)
    if (!groups[p]) groups[p] = []
    groups[p]!.push(slot)
  }
  return groups
}

/** For today's date, mark slots whose time has already passed as unavailable */
function applyPastFilter(slots: SlotItem[], isoDate: string): SlotItem[] {
  const today = dayjs().format('YYYY-MM-DD')
  if (isoDate !== today) return slots

  const nowMins = dayjs().hour() * 60 + dayjs().minute()

  return slots.map((slot) => {
    if (!slot.available) return slot
    const [rawTime, meridiem] = slot.time.split(' ')
    const [h, m] = rawTime.split(':').map(Number)
    let h24 = h
    if (meridiem === 'PM' && h !== 12) h24 = h + 12
    if (meridiem === 'AM' && h === 12) h24 = 0
    const slotMins = h24 * 60 + m
    return slotMins <= nowMins ? { ...slot, available: false, past: true } : slot
  }) as SlotItem[]
}

// ── Avatar / name helpers ──────────────────────────────────────────────────────

function avatarColor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function initials(name: string) {
  return name
    .split(' ')
    .filter((w) => !/^dr\.?$/i.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function clinicName(doc: Doctor): string {
  if (!doc.clinicId || typeof doc.clinicId === 'string') return ''
  return doc.clinicId.name ?? ''
}

function clinicCity(doc: Doctor): string {
  if (!doc.clinicId || typeof doc.clinicId === 'string') return ''
  return (doc.clinicId as { city?: string }).city ?? ''
}

const ALL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function buildNext14Days(availableDays: string[]) {
  const norm = availableDays.map((d) => d.trim().toLowerCase())
  const days = []
  for (let i = 0; i < 14 && days.length < 7; i++) {
    const d = dayjs().add(i, 'day')
    const dayName = ALL_DAYS[d.day()]
    if (norm.length === 0 || norm.includes(dayName.toLowerCase())) {
      days.push({ label: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.format('ddd'), date: d.format('D'), month: d.format('MMM'), dayName, isoDate: d.format('YYYY-MM-DD') })
    }
  }
  if (days.length === 0) {
    return Array.from({ length: 7 }, (_, i) => {
      const d = dayjs().add(i, 'day')
      return { label: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.format('ddd'), date: d.format('D'), month: d.format('MMM'), dayName: ALL_DAYS[d.day()], isoDate: d.format('YYYY-MM-DD') }
    })
  }
  return days
}

function shiftLabel(shift: string) {
  switch (shift?.toLowerCase()) {
    case 'morning': return '☀️ Morning'
    case 'evening': return '🌙 Evening'
    case 'both':    return '☀️🌙 All Day'
    default:        return shift ?? '—'
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DoctorProfileScreen() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const availRef = useRef<HTMLDivElement>(null)

  const [doctor,     setDoctor]     = useState<Doctor | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [isFav,      setIsFav]      = useState(false)
  const [favLoading, setFavLoading] = useState(false)

  const [days,           setDays]           = useState<ReturnType<typeof buildNext14Days>>([])
  const [selDayIdx,      setSelDayIdx]      = useState(0)
  const [rawSlots,       setRawSlots]       = useState<SlotItem[]>([])
  const [slotsLoading,   setSlotsLoading]   = useState(false)
  const [selectedSlot,   setSelectedSlot]   = useState<string | null>(null)

  // Slots filtered by past-time rule
  const slots = rawSlots.length > 0 && days[selDayIdx]
    ? applyPastFilter(rawSlots, days[selDayIdx].isoDate)
    : rawSlots

  const grouped      = groupSlotsByPeriod(slots)
  const PERIOD_ORDER: TimePeriod[] = ['morning', 'afternoon', 'evening', 'night']
  const activePeriods = PERIOD_ORDER.filter((p) => grouped[p] && grouped[p]!.length > 0)

  // fetch doctor
  useEffect(() => {
    if (!id) return
    setLoading(true)
    getDoctorById(id)
      .then((r) => {
        setDoctor(r.data)
        setDays(buildNext14Days(r.data.availableDays ?? []))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  // fetch favourite state
  useEffect(() => {
    if (!id) return
    getFavouriteDoctorIds().then((ids) => setIsFav(ids.includes(id))).catch(() => {})
  }, [id])

  // fetch slots when day changes
  useEffect(() => {
    if (!id || days.length === 0) return
    const iso = days[selDayIdx]?.isoDate
    if (!iso) return
    setSlotsLoading(true)
    setRawSlots([])
    setSelectedSlot(null)
    getSlots(id, iso)
      .then((r) => setRawSlots(r.data))
      .catch(() => setRawSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [id, selDayIdx, days])

  // auto-scroll to booking section if openBooking state
  useEffect(() => {
    if ((location.state as { openBooking?: boolean })?.openBooking && availRef.current) {
      setTimeout(() => availRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 400)
    }
  }, [location.state, loading])

  // keep past-time filter live (re-apply every minute)
  useEffect(() => {
    const timer = setInterval(() => setRawSlots((prev) => [...prev]), 60_000)
    return () => clearInterval(timer)
  }, [])

  const handleFavToggle = async () => {
    if (!id || favLoading) return
    setFavLoading(true)
    const prev = isFav
    setIsFav(!prev)
    try { await toggleFavouriteDoctor(id) }
    catch { setIsFav(prev) }
    finally { setFavLoading(false) }
  }

  const handleBook = () => {
    if (!doctor || !selectedSlot) return
    navigate('/app/book', {
      state: { doctor, prefilledDate: days[selDayIdx].isoDate, prefilledTime: selectedSlot },
    })
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ height: '100%', background: '#F5F8FC', display: 'flex', flexDirection: 'column', fontFamily: 'Roboto, system-ui, sans-serif' }}>
        <NavBar onBack={() => navigate(-1)} title="Doctor Profile" />
        <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[180, 100, 220].map((h, i) => (
            <div key={i} style={{ background: '#FFF', borderRadius: 18, height: h, opacity: 0.5, boxShadow: '0 2px 12px rgba(30,79,163,0.07)' }} />
          ))}
        </div>
      </div>
    )
  }

  if (!doctor) {
    return (
      <div style={{ height: '100%', background: '#F5F8FC', display: 'flex', flexDirection: 'column', fontFamily: 'Roboto, system-ui, sans-serif' }}>
        <NavBar onBack={() => navigate(-1)} title="Doctor Profile" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#6B7C93', fontSize: 15 }}>Doctor not found.</p>
          <button onClick={() => navigate(-1)} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 12, background: BRAND_GRADIENT, border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Go Back</button>
        </div>
      </div>
    )
  }

  const color      = avatarColor(doctor._id)
  const clinic     = clinicName(doctor)
  const city       = clinicCity(doctor)
  const selectedDay = days[selDayIdx]
  const isToday    = selectedDay?.isoDate === dayjs().format('YYYY-MM-DD')

  return (
    <div style={{ height: '100%', background: '#F5F8FC', fontFamily: 'Roboto, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Nav */}
      <div style={{ background: '#FFF', padding: '12px 16px 10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F0F4F8' }}>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F8FC', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HiArrowLeft size={18} color="#1A1A1A" />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>Doctor Profile</span>
        <button onClick={handleFavToggle} disabled={favLoading}
          style={{ width: 36, height: 36, borderRadius: 10, background: isFav ? '#FFF0F0' : '#F5F8FC', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
          <HiHeart size={18} color={isFav ? '#E05B5B' : '#6B7C93'} />
        </button>
      </div>

      {/* Scrollable */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}
          style={{ borderRadius: '0 0 24px 24px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(30,79,163,0.13)', marginBottom: 16 }}>

          <div style={{ background: BRAND_GRADIENT, padding: '20px 18px 22px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.09)' }} />
            <div style={{ position: 'absolute', bottom: -24, left: -24, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
              <div style={{ width: 72, height: 72, borderRadius: 22, flexShrink: 0, background: doctor.avatar ? 'transparent' : color, border: '2.5px solid rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#FFF', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
                {doctor.avatar
                  ? <img src={doctor.avatar} alt={doctor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials(doctor.name)
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 19, fontWeight: 800, color: '#FFF', marginBottom: 2 }}>{formatDoctorName(doctor.name)}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginBottom: 8 }}>{doctor.specialization}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {clinic && (
                    <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '3px 10px', background: 'rgba(255,255,255,0.18)', color: '#FFF', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <HiOfficeBuilding size={10} /> {clinic}{city ? `, ${city}` : ''}
                    </span>
                  )}
                  <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '3px 10px', background: 'rgba(255,255,255,0.18)', color: '#FFF' }}>
                    {shiftLabel(doctor.shift)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ background: '#FFF', display: 'flex', overflow: 'hidden' }}>
            <StatBox icon={<HiBadgeCheck size={18} color="#2C6ED5" />}
              value={doctor.experience != null ? `${doctor.experience} yr${doctor.experience !== 1 ? 's' : ''}` : '—'}
              label="Experience" />
            <StatBox icon={<HiAcademicCap size={18} color="#1FA3A8" />}
              value={doctor.qualification || '—'} label="Qualification" borderX />
            <StatBox icon={<HiStar size={18} color="#F59E0B" />}
              value={doctor.consultationFee != null ? `₹${doctor.consultationFee}` : '—'}
              label="Consult Fee" />
          </div>
        </motion.div>

        <div style={{ padding: '0 16px 16px' }}>

          {/* About */}
          {doctor.bio && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} style={{ marginBottom: 14 }}>
              <div style={{ background: '#FFF', borderRadius: 16, padding: 16, boxShadow: '0 2px 12px rgba(30,79,163,0.08)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', margin: '0 0 10px' }}>About</h3>
                <p style={{ fontSize: 14, color: '#6B7C93', margin: 0, lineHeight: 1.7 }}>{doctor.bio}</p>
              </div>
            </motion.div>
          )}

          {/* Details */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }} style={{ marginBottom: 14 }}>
            <div style={{ background: '#FFF', borderRadius: 16, padding: 16, boxShadow: '0 2px 12px rgba(30,79,163,0.08)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', margin: '0 0 12px' }}>Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {clinic && <DetailRow icon={<HiOfficeBuilding size={15} color="#2C6ED5" />} label="Clinic" value={`${clinic}${city ? `, ${city}` : ''}`} />}
                <DetailRow icon={<HiCalendar size={15} color="#1FA3A8" />} label="Working Days"
                  value={doctor.availableDays.length > 0 ? doctor.availableDays.join(', ') : 'Contact clinic'} />
                <DetailRow icon={<HiStar size={15} color="#D97706" />} label="Shift" value={shiftLabel(doctor.shift)} />
                {doctor.consultationFee != null && (
                  <DetailRow icon={<span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>₹</span>}
                    label="Consultation Fee" value={`₹${doctor.consultationFee} — Pay at clinic`} />
                )}
              </div>
            </div>
          </motion.div>

          {/* ── Book a Slot ───────────────────────────────────────────────────── */}
          <motion.div ref={availRef} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} style={{ marginBottom: 14 }}>
            <div style={{ background: '#FFF', borderRadius: 16, boxShadow: '0 2px 12px rgba(30,79,163,0.08)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 16px 12px' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px' }}>Choose Date & Time</h3>
                <p style={{ fontSize: 13, color: '#6B7C93', margin: '0 0 14px' }}>Select a convenient date and time slot</p>

                {/* Day strip */}
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
                  {days.map((d, idx) => {
                    const sel = selDayIdx === idx
                    const today = d.isoDate === dayjs().format('YYYY-MM-DD')
                    return (
                      <button key={d.isoDate}
                        onClick={() => { setSelDayIdx(idx); setSelectedSlot(null) }}
                        style={{
                          flexShrink: 0, width: 60, padding: '10px 6px', borderRadius: 16,
                          border: sel ? 'none' : '1.5px solid #E8EEF7',
                          background: sel ? BRAND_GRADIENT : '#FFF',
                          cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                          boxShadow: sel ? '0 4px 14px rgba(44,110,213,0.32)' : '0 1px 4px rgba(30,79,163,0.05)',
                          transition: 'all 0.18s', position: 'relative',
                        }}
                      >
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.3px', color: sel ? 'rgba(255,255,255,0.85)' : '#A0AEC0' }}>{d.label}</span>
                        <span style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1, color: sel ? '#FFF' : '#1A1A1A' }}>{d.date}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: sel ? 'rgba(255,255,255,0.85)' : '#A0AEC0' }}>{d.month}</span>
                        {today && !sel && <span style={{ position: 'absolute', bottom: 5, width: 4, height: 4, borderRadius: '50%', background: '#2C6ED5' }} />}
                        {today && sel  && <span style={{ position: 'absolute', bottom: 5, width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.7)' }} />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Today notice */}
              {isToday && (
                <div style={{ margin: '0 16px 10px', padding: '8px 12px', background: '#FFFBEB', borderRadius: 10, border: '1px solid #FDE68A', fontSize: 12, color: '#92400E', fontWeight: 600 }}>
                  ⏰ Showing only upcoming time slots for today
                </div>
              )}

              {/* Slot groups */}
              <div style={{ padding: '0 16px 16px' }}>
                {slotsLoading ? (
                  <>
                    {[0, 1].map((g) => (
                      <div key={g} style={{ marginBottom: 20 }}>
                        <div style={{ height: 36, borderRadius: 12, background: '#F5F8FC', marginBottom: 10 }} />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                          {[0, 1, 2, 3].map((i) => <div key={i} style={{ height: 38, background: '#F5F8FC', borderRadius: 10 }} />)}
                        </div>
                      </div>
                    ))}
                  </>
                ) : activePeriods.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '28px 0' }}>
                    <div style={{ fontSize: 30, marginBottom: 8 }}>📅</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 4 }}>
                      {isToday ? 'No upcoming slots today' : 'No slots available'}
                    </div>
                    <div style={{ fontSize: 13, color: '#A0AEC0' }}>
                      {isToday ? 'All today\'s slots are in the past — try another day' : 'Try selecting a different date'}
                    </div>
                  </div>
                ) : (
                  activePeriods.map((period) => {
                    const cfg          = PERIOD_CFG[period]
                    const periodSlots  = grouped[period]!
                    const availCount   = periodSlots.filter((s) => s.available).length
                    return (
                      <div key={period} style={{ marginBottom: 18 }}>
                        {/* Period header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12, padding: '8px 14px', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 16 }}>{cfg.icon}</span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 800, color: cfg.color }}>{cfg.label}</div>
                              <div style={{ fontSize: 10, color: cfg.color, opacity: 0.75 }}>{cfg.range}</div>
                            </div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '2px 9px', background: availCount > 0 ? cfg.color : '#E5E7EB', color: '#FFF' }}>
                            {availCount} slot{availCount !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* 4-column slot grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                          {periodSlots.map((slot) => {
                            const isSel = selectedSlot === slot.time
                            return (
                              <button key={slot.time}
                                disabled={!slot.available}
                                onClick={() => slot.available && setSelectedSlot(isSel ? null : slot.time)}
                                style={{
                                  padding: '9px 4px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                                  border: !slot.available ? '1.5px solid #EEF2F7' : isSel ? 'none' : `1.5px solid ${cfg.border}`,
                                  background: !slot.available ? '#F9FAFB' : isSel ? BRAND_GRADIENT : '#FFF',
                                  color: !slot.available ? '#CBD5E1' : isSel ? '#FFF' : cfg.color,
                                  cursor: slot.available ? 'pointer' : 'not-allowed',
                                  textDecoration: !slot.available ? 'line-through' : 'none',
                                  boxShadow: isSel ? '0 4px 12px rgba(44,110,213,0.30)' : 'none',
                                  transition: 'all 0.18s', textAlign: 'center',
                                }}
                              >
                                {slot.time}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Book button */}
      <div style={{ flexShrink: 0, padding: '12px 16px 16px', background: '#FFF', borderTop: '1px solid #F0F4F8', boxShadow: '0 -4px 20px rgba(30,79,163,0.08)' }}>
        <button onClick={handleBook} disabled={!selectedSlot}
          style={{
            width: '100%', height: 52, borderRadius: 14, border: 'none',
            background: selectedSlot ? BRAND_GRADIENT : '#C4CDD6',
            color: '#FFF', fontSize: 16, fontWeight: 700, fontFamily: 'inherit',
            cursor: selectedSlot ? 'pointer' : 'not-allowed',
            boxShadow: selectedSlot ? '0 8px 20px rgba(44,110,213,0.32)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          {selectedSlot
            ? `Book — ${selectedDay?.dayName} at ${selectedSlot}`
            : 'Select a Time Slot to Continue'}
        </button>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function NavBar({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <div style={{ background: '#FFF', padding: '12px 16px 10px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #F0F4F8' }}>
      <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F8FC', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <HiArrowLeft size={18} color="#1A1A1A" />
      </button>
      <span style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>{title}</span>
    </div>
  )
}

function StatBox({ icon, value, label, borderX }: { icon: React.ReactNode; value: string; label: string; borderX?: boolean }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 8px', borderLeft: borderX ? '1px solid #EEF2F7' : undefined, borderRight: borderX ? '1px solid #EEF2F7' : undefined }}>
      {icon}
      <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', margin: '6px 0 2px', textAlign: 'center', lineHeight: 1.2 }}>{value}</p>
      <p style={{ fontSize: 11, color: '#A0AEC0', margin: 0, textAlign: 'center' }}>{label}</p>
    </div>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F5F8FC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, color: '#A0AEC0', margin: '0 0 1px', fontWeight: 500 }}>{label}</p>
        <p style={{ fontSize: 13, color: '#1A1A1A', margin: 0, fontWeight: 600, lineHeight: 1.4 }}>{value}</p>
      </div>
    </div>
  )
}
