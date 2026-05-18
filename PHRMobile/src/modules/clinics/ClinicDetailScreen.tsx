import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiArrowLeft, HiPhone, HiClock, HiLocationMarker,
  HiCalendar, HiChevronRight, HiMail, HiCheckCircle, HiXCircle,
} from 'react-icons/hi'
import { MdLocalHospital } from 'react-icons/md'
import { getClinicById, getDoctorsByClinic, type Clinic, type ClinicDoctor } from '../../services/clinicService'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'
const AVATAR_COLORS  = ['#2C6ED5', '#1FA3A8', '#7C3AED', '#E05B5B', '#D97706', '#059669']

function avatarColor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

type TabKey = 'doctors' | 'hours' | 'about'

const ALL_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const DAY_SHORT: Record<string, string> = {
  Monday:'Mon', Tuesday:'Tue', Wednesday:'Wed', Thursday:'Thu',
  Friday:'Fri', Saturday:'Sat', Sunday:'Sun',
}

// ── Working Hours Tab ─────────────────────────────────────────────────────────

function WorkingHoursTab({ clinic }: { clinic: Clinic }) {
  const openSet = new Set(
    (clinic.openDays ?? []).map((d) => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase())
  )
  const timing = clinic.openTime && clinic.closeTime
    ? `${clinic.openTime} – ${clinic.closeTime}`
    : clinic.openTime ?? null

  return (
    <motion.div
      key="hours"
      initial={{ opacity: 0, x: 4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      {/* Time banner */}
      {timing && (
        <div style={{
          background: BRAND_GRADIENT, borderRadius: 18, padding: '16px 20px',
          marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: '0 4px 16px rgba(44,110,213,0.22)',
        }}>
          <div style={{
            width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.20)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <HiClock size={22} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 3 }}>Daily Hours</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF' }}>{timing}</div>
          </div>
        </div>
      )}

      {/* Weekly schedule */}
      <div style={{ background: '#FFFFFF', borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 12px rgba(30,79,163,0.06)' }}>
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #F0F4F8' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Weekly Schedule</div>
        </div>
        {ALL_DAYS.map((day, i) => {
          const isOpen = openSet.has(day)
          const isLast = i === ALL_DAYS.length - 1
          const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day
          return (
            <div key={day} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '13px 16px',
              borderBottom: isLast ? 'none' : '1px solid #F8FAFC',
              background: isToday ? '#F5F8FF' : 'transparent',
            }}>
              {/* Day indicator */}
              <div style={{
                width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                background: isOpen ? (isToday ? BRAND_GRADIENT : '#EBF2FF') : '#F5F8FC',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800,
                color: isOpen ? (isToday ? '#FFFFFF' : '#2C6ED5') : '#C8D4E0',
                boxShadow: isToday ? '0 3px 10px rgba(44,110,213,0.28)' : 'none',
              }}>
                {DAY_SHORT[day]}
              </div>

              {/* Day name */}
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 14, fontWeight: isToday ? 700 : 600, color: isOpen ? '#1A1A1A' : '#A0AEC0' }}>
                  {day}
                </span>
                {isToday && (
                  <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, background: '#EBF2FF', color: '#2C6ED5', borderRadius: 20, padding: '1px 7px' }}>
                    Today
                  </span>
                )}
              </div>

              {/* Status */}
              {isOpen ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <HiCheckCircle size={15} color="#10B981" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#065F46' }}>
                    {timing ?? 'Open'}
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <HiXCircle size={15} color="#D1D9E6" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#C8D4E0' }}>Closed</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ── Doctor Card ───────────────────────────────────────────────────────────────

function DoctorCard({ doctor, index, onView, onBook }: {
  doctor: ClinicDoctor; index: number; onView: () => void; onBook: () => void
}) {
  const color = avatarColor(doctor._id)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 28 }}
      style={{
        background: '#FFFFFF', borderRadius: 18, marginBottom: 12,
        boxShadow: '0 2px 16px rgba(30,79,163,0.09)', overflow: 'hidden',
      }}
    >
      {/* Colored accent top bar */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />

      <div style={{ padding: '14px 14px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>

          {/* Avatar */}
          <div style={{
            width: 58, height: 58, borderRadius: 18, flexShrink: 0,
            background: `linear-gradient(135deg, ${color}33 0%, ${color}18 100%)`,
            border: `2px solid ${color}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 18, fontWeight: 800, color }}>{initials(doctor.name)}</span>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#1A1A1A', marginBottom: 2, lineHeight: 1.3 }}>
              Dr. {doctor.name}
            </div>
            <div style={{ fontSize: 12, color, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
              {doctor.specialization}
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {doctor.experience !== undefined && (
                <span style={{ fontSize: 11, fontWeight: 700, background: '#EBF2FF', color: '#2C6ED5', padding: '3px 10px', borderRadius: 20 }}>
                  {doctor.experience} yrs exp
                </span>
              )}
              {doctor.consultationFee !== undefined && (
                <span style={{ fontSize: 11, fontWeight: 700, background: '#ECFDF5', color: '#059669', padding: '3px 10px', borderRadius: 20 }}>
                  RM {doctor.consultationFee}
                </span>
              )}
              {doctor.room && (
                <span style={{ fontSize: 11, fontWeight: 600, background: '#F5F8FC', color: '#6B7C93', padding: '3px 10px', borderRadius: 20 }}>
                  Room {doctor.room}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
          {/* View Profile */}
          <button onClick={onView} style={{
            flex: 1, height: 42, borderRadius: 12,
            border: '1.5px solid #E3EAF2', background: '#F5F8FC',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontSize: 13, fontWeight: 700, color: '#4A5568',
          }}>
            <HiChevronRight size={15} color="#6B7C93" /> View Profile
          </button>

          {/* Book Appointment */}
          <button onClick={onBook} style={{
            flex: 1, height: 42, borderRadius: 12, border: 'none',
            background: BRAND_GRADIENT, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontSize: 13, fontWeight: 700, color: '#FFFFFF',
            boxShadow: '0 4px 12px rgba(44,110,213,0.28)',
          }}>
            <HiCalendar size={15} /> Book
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 18, overflow: 'hidden', marginBottom: 12 }}>
      <div style={{ height: 4, background: '#F0F4F8' }} />
      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
          <div style={{ width: 58, height: 58, borderRadius: 18, background: '#F0F4F8', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: '55%', height: 15, borderRadius: 6, background: '#F0F4F8', marginBottom: 8 }} />
            <div style={{ width: '40%', height: 12, borderRadius: 6, background: '#F0F4F8', marginBottom: 10 }} />
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 72, height: 22, borderRadius: 20, background: '#F0F4F8' }} />
              <div style={{ width: 60, height: 22, borderRadius: 20, background: '#F0F4F8' }} />
            </div>
          </div>
        </div>
        <div style={{ height: 42, borderRadius: 12, background: '#F0F4F8' }} />
      </div>
    </div>
  )
}

// ── Info Row ──────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: '1px solid #F8FAFC' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F8FC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', lineHeight: 1.4 }}>{value}</div>
      </div>
    </div>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ClinicDetailScreen() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [clinic, setClinic]           = useState<Clinic | null>(null)
  const [doctors, setDoctors]         = useState<ClinicDoctor[]>([])
  const [loading, setLoading]         = useState(true)
  const [doctorsLoading, setDoctorsLoading] = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [activeTab, setActiveTab]     = useState<TabKey>('doctors')

  useEffect(() => {
    if (!id) return
    setLoading(true); setError(null)
    getClinicById(id)
      .then((r) => setClinic(r.data))
      .catch(() => setError('Failed to load clinic'))
      .finally(() => setLoading(false))

    setDoctorsLoading(true)
    getDoctorsByClinic(id, { status: 'active' })
      .then((r) => setDoctors(r.data))
      .catch(() => setDoctors([]))
      .finally(() => setDoctorsLoading(false))
  }, [id])

  const isOpen   = clinic?.status === 'active'
  const timing   = clinic?.openTime ? `${clinic.openTime} – ${clinic.closeTime ?? ''}` : null
  const fullAddr = clinic ? [clinic.address, clinic.city, clinic.state, clinic.pincode].filter(Boolean).join(', ') : ''

  const handleBookDoctor = (doctor: ClinicDoctor) => {
    navigate('/app/booking', {
      state: { doctor: { ...doctor, clinicId: clinic ? { _id: clinic._id, name: clinic.name, city: clinic.city } : doctor.clinicId } },
    })
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ minHeight: '100dvh', background: '#F5F8FC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Roboto, system-ui, sans-serif' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>Failed to load clinic</div>
        <button onClick={() => navigate(-1)} style={{ height: 44, padding: '0 24px', borderRadius: 12, border: 'none', background: BRAND_GRADIENT, color: '#FFFFFF', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          Go Back
        </button>
      </div>
    )
  }

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
        <span style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>Clinic</span>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 96 }}>

        {/* ── Merged hero card ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}
          style={{ borderRadius: '0 0 24px 24px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(30,79,163,0.13)', marginBottom: 16 }}
        >
          {/* Gradient section */}
          <div style={{ background: BRAND_GRADIENT, padding: '20px 18px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.09)' }} />
            <div style={{ position: 'absolute', bottom: -24, left: -24, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
              {/* Clinic avatar */}
              <div style={{
                width: 68, height: 68, borderRadius: 22, flexShrink: 0,
                background: 'rgba(255,255,255,0.22)', border: '2.5px solid rgba(255,255,255,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              }}>
                {loading ? (
                  <MdLocalHospital size={30} color="rgba(255,255,255,0.6)" />
                ) : (
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF' }}>
                    {clinic ? initials(clinic.name) : '?'}
                  </span>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {loading ? (
                  <>
                    <div style={{ width: '70%', height: 18, borderRadius: 6, background: 'rgba(255,255,255,0.25)', marginBottom: 8 }} />
                    <div style={{ width: '50%', height: 13, borderRadius: 6, background: 'rgba(255,255,255,0.18)' }} />
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', marginBottom: 3, lineHeight: 1.2 }}>
                      {clinic?.name}
                    </div>
                    {clinic && (
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.80)', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                        <HiLocationMarker size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                        <span>{clinic.address}, {clinic.city}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Chips row */}
            {!loading && clinic && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14, position: 'relative', zIndex: 1 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '4px 11px',
                  background: isOpen ? 'rgba(74,222,128,0.20)' : 'rgba(239,68,68,0.20)',
                  color: '#FFFFFF', border: `1px solid ${isOpen ? 'rgba(74,222,128,0.45)' : 'rgba(239,68,68,0.45)'}`,
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: isOpen ? '#4ADE80' : '#EF4444' }} />
                  {isOpen ? 'Open Now' : 'Closed'}
                </span>
                {timing && (
                  <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '4px 11px', background: 'rgba(255,255,255,0.18)', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <HiClock size={10} /> {timing}
                  </span>
                )}
                {clinic.phone && (
                  <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '4px 11px', background: 'rgba(255,255,255,0.18)', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <HiPhone size={10} /> {clinic.phone}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* White — tab toggle */}
          <div style={{ background: '#FFFFFF', padding: '12px 14px' }}>
            <div style={{ display: 'flex', background: '#F5F8FC', borderRadius: 12, padding: 4, gap: 4 }}>
              {(['doctors', 'hours', 'about'] as TabKey[]).map((tab) => {
                const isActive = activeTab === tab
                const labels: Record<TabKey, string> = { doctors: 'Doctors', hours: 'Hours', about: 'About' }
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={{
                    flex: 1, height: 38, borderRadius: 9, border: 'none', cursor: 'pointer',
                    background: isActive ? BRAND_GRADIENT : 'transparent',
                    color: isActive ? '#FFFFFF' : '#6B7C93',
                    fontSize: 13, fontWeight: 700,
                    boxShadow: isActive ? '0 3px 10px rgba(44,110,213,0.28)' : 'none',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  }}>
                    {labels[tab]}
                    {tab === 'doctors' && !doctorsLoading && doctors.length > 0 && (
                      <span style={{
                        fontSize: 10, fontWeight: 800, lineHeight: 1,
                        background: isActive ? 'rgba(255,255,255,0.28)' : '#EBF2FF',
                        color: isActive ? '#FFFFFF' : '#2C6ED5',
                        borderRadius: 20, padding: '2px 6px',
                      }}>
                        {doctors.length}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* ── Tab content ─────────────────────────────────────────────────── */}
        <div style={{ padding: '0 16px' }}>
          <AnimatePresence mode="wait">

            {/* Doctors tab */}
            {activeTab === 'doctors' && (
              <motion.div key="doctors" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                {doctorsLoading ? (
                  [0, 1, 2].map((i) => <CardSkeleton key={i} />)
                ) : doctors.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '56px 24px' }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#EBF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <MdLocalHospital size={32} color="#2C6ED5" />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>No doctors listed</div>
                    <div style={{ fontSize: 13, color: '#A0AEC0' }}>No active doctors found for this clinic</div>
                  </div>
                ) : (
                  doctors.map((doc, i) => (
                    <DoctorCard key={doc._id} doctor={doc} index={i} onView={() => navigate(`/app/doctor/${doc._id}`)} onBook={() => handleBookDoctor(doc)} />
                  ))
                )}
              </motion.div>
            )}

            {/* Working Hours tab */}
            {activeTab === 'hours' && clinic && (
              <WorkingHoursTab clinic={clinic} />
            )}
            {activeTab === 'hours' && loading && (
              <motion.div key="hours-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ height: 88, background: '#FFFFFF', borderRadius: 18, marginBottom: 10 }} />
                <div style={{ height: 320, background: '#FFFFFF', borderRadius: 18 }} />
              </motion.div>
            )}

            {/* About tab */}
            {activeTab === 'about' && (
              <motion.div key="about" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                {loading ? (
                  <>
                    <div style={{ height: 80, background: '#FFFFFF', borderRadius: 18, marginBottom: 10 }} />
                    <div style={{ height: 220, background: '#FFFFFF', borderRadius: 18 }} />
                  </>
                ) : clinic ? (
                  <>
                    {/* About blurb */}
                    <div style={{ background: '#FFFFFF', borderRadius: 18, padding: '16px 16px 18px', marginBottom: 10, boxShadow: '0 2px 12px rgba(30,79,163,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: '#EBF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <MdLocalHospital size={16} color="#2C6ED5" />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>About {clinic.name}</span>
                      </div>
                      <div style={{ fontSize: 14, color: '#3D4A5B', lineHeight: 1.7 }}>
                        {clinic.about ?? `${clinic.name} is a ${clinic.type} clinic located in ${clinic.city}, providing quality healthcare services to the community.`}
                      </div>
                    </div>

                    {/* Contact & details */}
                    <div style={{ background: '#FFFFFF', borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 12px rgba(30,79,163,0.06)', marginBottom: 10 }}>
                      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #F0F4F8', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F5F8FC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <HiLocationMarker size={13} color="#6B7C93" />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A' }}>Contact & Location</span>
                      </div>
                      <InfoRow icon={<HiLocationMarker size={16} color="#E05B5B" />} label="Address" value={fullAddr} />
                      {clinic.phone && <InfoRow icon={<HiPhone size={16} color="#2C6ED5" />} label="Phone" value={clinic.phone} />}
                      {clinic.email && <InfoRow icon={<HiMail size={16} color="#7C3AED" />} label="Email" value={clinic.email} />}
                    </div>

                    {/* Clinic meta */}
                    <div style={{ background: '#FFFFFF', borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 12px rgba(30,79,163,0.06)', marginBottom: 10 }}>
                      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #F0F4F8', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F5F8FC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <MdLocalHospital size={13} color="#6B7C93" />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A' }}>Clinic Info</span>
                      </div>
                      <InfoRow icon={<MdLocalHospital size={16} color="#059669" />} label="Type" value={clinic.type.charAt(0).toUpperCase() + clinic.type.slice(1)} />
                      {clinic.code && <InfoRow icon={<HiCalendar size={16} color="#D97706" />} label="Clinic Code" value={clinic.code} />}
                      {clinic.defaultFee !== undefined && (
                        <InfoRow icon={<HiCheckCircle size={16} color="#059669" />} label="Default Consultation Fee" value={`RM ${clinic.defaultFee}`} />
                      )}
                    </div>
                  </>
                ) : null}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
