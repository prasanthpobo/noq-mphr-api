import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiArrowLeft, HiSearch, HiLocationMarker, HiX, HiHeart,
  HiChevronRight, HiStar,
} from 'react-icons/hi'
import { MdLocalHospital } from 'react-icons/md'
import { getClinics, type Clinic } from '../../services/clinicService'
import { getDoctors, toggleFavouriteDoctor, getFavouriteDoctorIds, formatDoctorName, type Doctor } from '../../services/doctorService'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

const AVATAR_COLORS = ['#2C6ED5', '#1FA3A8', '#7C3AED', '#E05B5B', '#D97706', '#059669']
function avatarColor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

type FilterChip = 'All' | 'Clinics' | 'Doctors'
const FILTER_CHIPS: FilterChip[] = ['All', 'Clinics', 'Doctors']

const SPECIALTIES = [
  { label: 'General',      emoji: '🩺' },
  { label: 'Cardiology',   emoji: '❤️' },
  { label: 'Dermatology',  emoji: '🧴' },
  { label: 'Pediatrics',   emoji: '👶' },
  { label: 'Orthopedics',  emoji: '🦴' },
  { label: 'ENT',          emoji: '👂' },
  { label: 'Dental',       emoji: '🦷' },
  { label: 'Gynecology',   emoji: '🌸' },
]

// ── Clinic Card ───────────────────────────────────────────────────────────────

function ClinicResultCard({ clinic, onClick }: { clinic: Clinic; onClick: () => void }) {
  const color  = avatarColor(clinic._id)
  const isOpen = clinic.status === 'active'
  const inits  = initials(clinic.name)

  return (
    <motion.div
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      style={{
        background: '#FFFFFF', borderRadius: 18,
        boxShadow: '0 2px 12px rgba(30,79,163,0.08)',
        overflow: 'hidden', marginBottom: 12, cursor: 'pointer',
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: 4, background: isOpen ? BRAND_GRADIENT : '#E5E7EB' }} />

      <div style={{ padding: '14px 14px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
          {/* Avatar */}
          <div style={{
            width: 50, height: 50, borderRadius: 14, flexShrink: 0,
            background: isOpen ? color : '#F1F5F9',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isOpen ? `0 4px 12px ${color}44` : 'none',
          }}>
            {isOpen
              ? <span style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF' }}>{inits}</span>
              : <MdLocalHospital size={22} color="#9CA3AF" />}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px', lineHeight: 1.3, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {clinic.name}
              </p>
              {/* Status badge */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
                fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                background: isOpen ? '#ECFDF5' : '#F9FAFB',
                color: isOpen ? '#16A34A' : '#6B7280',
                border: `1px solid ${isOpen ? '#BBF7D0' : '#E5E7EB'}`,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: isOpen ? '#16A34A' : '#9CA3AF', flexShrink: 0 }} />
                {isOpen ? 'Open' : 'Closed'}
              </span>
            </div>
            {/* Type chip */}
            {clinic.type && (
              <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, background: '#EBF2FF', color: '#2C6ED5', borderRadius: 6, padding: '2px 8px' }}>
                {clinic.type}
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#F0F4F8', marginBottom: 10 }} />

        {/* Address */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
          <div style={{ width: 22, height: 22, borderRadius: 7, background: '#F5F8FC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <HiLocationMarker size={12} color="#2C6ED5" />
          </div>
          <span style={{ fontSize: 12, color: '#6B7C93', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {clinic.address}, {clinic.city}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 14px', background: isOpen ? '#F0F6FF' : '#F9FAFB',
        borderTop: '1px solid #F0F4F8',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: isOpen ? '#2C6ED5' : '#9CA3AF' }}>View Clinic</span>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: isOpen ? '#2C6ED5' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HiChevronRight size={14} color={isOpen ? '#FFFFFF' : '#9CA3AF'} />
        </div>
      </div>
    </motion.div>
  )
}

// ── Doctor Card ───────────────────────────────────────────────────────────────

function DoctorResultCard({
  doctor, isFav, onFavToggle, onClick,
}: {
  doctor: Doctor
  isFav: boolean
  onFavToggle: (e: React.MouseEvent) => void
  onClick: () => void
}) {
  const color      = avatarColor(doctor._id)
  const clinicName = typeof doctor.clinicId === 'object' ? doctor.clinicId.name : ''

  return (
    <motion.div
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      style={{
        background: '#FFFFFF', borderRadius: 18,
        boxShadow: '0 2px 12px rgba(30,79,163,0.08)',
        overflow: 'hidden', marginBottom: 12, cursor: 'pointer',
        position: 'relative',
      }}
    >
      {/* Colored top bar */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${color} 0%, ${color}99 100%)` }} />

      <div style={{ padding: '14px 14px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* Avatar */}
          <div style={{
            width: 58, height: 58, borderRadius: '50%', flexShrink: 0,
            background: `${color}22`, border: `2.5px solid ${color}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color,
            boxShadow: `0 4px 12px ${color}33`,
          }}>
            {initials(doctor.name)}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {formatDoctorName(doctor.name)}
                </p>
                {doctor.specialization && (
                  <p style={{ fontSize: 12, color, fontWeight: 600, margin: '0 0 6px' }}>
                    {doctor.specialization}
                  </p>
                )}
              </div>

              {/* Fav button */}
              <motion.button
                onClick={onFavToggle}
                whileTap={{ scale: 0.8 }}
                animate={{ scale: isFav ? [1, 1.25, 1] : 1 }}
                transition={{ duration: 0.25 }}
                style={{
                  width: 34, height: 34, borderRadius: 10, border: 'none', flexShrink: 0,
                  background: isFav ? '#FEE2E2' : '#F5F8FC',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <HiHeart size={17} color={isFav ? '#EF4444' : '#CBD5E1'} />
              </motion.button>
            </div>

            {/* Chips row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {doctor.experience !== undefined && (
                <span style={{ fontSize: 11, fontWeight: 600, background: '#EBF2FF', color: '#2C6ED5', borderRadius: 20, padding: '3px 9px' }}>
                  {doctor.experience} yrs exp
                </span>
              )}
              {doctor.consultationFee !== undefined && (
                <span style={{ fontSize: 11, fontWeight: 700, background: '#ECFDF5', color: '#059669', borderRadius: 20, padding: '3px 9px' }}>
                  ₹{doctor.consultationFee}
                </span>
              )}
              {(doctor as unknown as { rating?: number }).rating && (
                <span style={{ fontSize: 11, fontWeight: 600, background: '#FFFBEB', color: '#D97706', borderRadius: 20, padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <HiStar size={11} /> {(doctor as unknown as { rating: number }).rating}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Clinic row */}
        {clinicName && (
          <>
            <div style={{ height: 1, background: '#F0F4F8', margin: '10px 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 22, height: 22, borderRadius: 7, background: '#F5F8FC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MdLocalHospital size={12} color="#6B7C93" />
              </div>
              <span style={{ fontSize: 12, color: '#6B7C93', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clinicName}</span>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 14px', background: '#F0F6FF',
        borderTop: '1px solid #F0F4F8',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#2C6ED5' }}>Book Appointment</span>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: '#2C6ED5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HiChevronRight size={14} color="#FFFFFF" />
        </div>
      </div>
    </motion.div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ResultSkeleton({ isDoctor = false }: { isDoctor?: boolean }) {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 12px rgba(30,79,163,0.06)', marginBottom: 12 }}>
      <div style={{ height: 4, background: '#EEF2F7' }} />
      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
          <div style={{ width: isDoctor ? 58 : 50, height: isDoctor ? 58 : 50, borderRadius: isDoctor ? '50%' : 14, background: '#EEF2F7', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 14, borderRadius: 6, background: '#EEF2F7', marginBottom: 8, width: '60%' }} />
            <div style={{ height: 11, borderRadius: 6, background: '#EEF2F7', width: '35%' }} />
          </div>
        </div>
        <div style={{ height: 1, background: '#F0F4F8', marginBottom: 10 }} />
        <div style={{ height: 11, borderRadius: 6, background: '#EEF2F7', width: '50%' }} />
      </div>
      <div style={{ height: 40, background: '#F9FAFB', borderTop: '1px solid #F0F4F8' }} />
    </div>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery]               = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterChip>('All')
  const [clinics, setClinics]           = useState<Clinic[]>([])
  const [doctors, setDoctors]           = useState<Doctor[]>([])
  const [loading, setLoading]           = useState(false)
  const [searched, setSearched]         = useState(false)
  const [favIds, setFavIds]             = useState<Set<string>>(new Set())

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 150) }, [])

  // Load persisted favourites on mount
  useEffect(() => {
    getFavouriteDoctorIds().then((ids) => setFavIds(new Set(ids))).catch(() => {})
  }, [])

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setClinics([]); setDoctors([]); setSearched(false); return }
    setLoading(true)
    setSearched(true)
    try {
      const [cRes, dRes] = await Promise.all([
        getClinics({ search: q }),
        getDoctors({ search: q, status: 'active' }),
      ])
      setClinics(cRes.data)
      setDoctors(dRes.data)
    } catch {
      setClinics([]); setDoctors([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 350)
    return () => clearTimeout(t)
  }, [query, doSearch])

  const toggleFav = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    // Optimistic update
    setFavIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    toggleFavouriteDoctor(id).catch(() => {
      // Revert on failure
      setFavIds((prev) => {
        const next = new Set(prev)
        next.has(id) ? next.delete(id) : next.add(id)
        return next
      })
    })
  }

  const filteredClinics = activeFilter === 'Doctors' ? [] : clinics
  const filteredDoctors = activeFilter === 'Clinics' ? [] : doctors
  const totalCount      = filteredClinics.length + filteredDoctors.length

  const handleDoctorClick = (doctor: Doctor) => navigate('/app/booking', { state: { doctor, fromSearch: true } })
  const handleClinicClick = (clinic: Clinic) => navigate(`/app/clinic/${clinic._id}`)

  return (
    <div style={{ minHeight: '100dvh', background: '#F5F8FC', fontFamily: 'Roboto, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* ── Gradient header ────────────────────────────────────────────────── */}
      <div style={{ background: BRAND_GRADIENT, padding: '14px 16px 20px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(31,163,168,0.20)', pointerEvents: 'none' }} />

        {/* Back + title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, position: 'relative', zIndex: 2 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: 38, height: 38, borderRadius: 12, border: 'none', flexShrink: 0,
              background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <HiArrowLeft size={20} color="#FFFFFF" />
          </button>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>Search</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', marginTop: 2 }}>Clinics, Doctors &amp; Specialties</div>
          </div>
        </div>

        {/* Search input */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#FFFFFF', borderRadius: 14,
            padding: '0 14px', height: 48,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            position: 'relative', zIndex: 2,
          }}
        >
          <HiSearch size={18} color={query ? '#2C6ED5' : '#A0AEC0'} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clinics, doctors, specialty…"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 15, color: '#1A1A1A' }}
          />
          {query.length > 0 && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#EEF2F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HiX size={13} color="#6B7C93" />
              </div>
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto', scrollbarWidth: 'none', position: 'relative', zIndex: 2 }}>
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => setActiveFilter(chip)}
              style={{
                flexShrink: 0, padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                border: `1.5px solid ${activeFilter === chip ? '#FFFFFF' : 'rgba(255,255,255,0.30)'}`,
                background: activeFilter === chip ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
                color: activeFilter === chip ? '#1E4FA3' : 'rgba(255,255,255,0.90)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 96 }}>
        <AnimatePresence mode="wait">

          {/* Idle state */}
          {!query.trim() && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: '20px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
                Popular Specialties
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 32 }}>
                {SPECIALTIES.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => setQuery(s.label)}
                    style={{
                      padding: '12px 14px', borderRadius: 14,
                      border: '1.5px solid #E3EAF2', background: '#FFFFFF',
                      fontSize: 13, fontWeight: 600, color: '#3D4A5B', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                      boxShadow: '0 2px 8px rgba(30,79,163,0.05)',
                    }}
                  >
                    <span style={{ fontSize: 20, lineHeight: 1 }}>{s.emoji}</span>
                    {s.label}
                  </button>
                ))}
              </div>

              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ width: 72, height: 72, borderRadius: 22, background: '#EBF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <HiSearch size={32} color="#BFDBFE" />
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', margin: '0 0 6px' }}>Find the right care</p>
                <p style={{ color: '#A0AEC0', fontSize: 13, margin: 0 }}>Search for clinics or doctors</p>
              </div>
            </motion.div>
          )}

          {/* Skeletons */}
          {loading && query.trim() && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: '16px 16px' }}>
              {[0, 1].map((i) => <ResultSkeleton key={`c${i}`} />)}
              {[0, 1].map((i) => <ResultSkeleton key={`d${i}`} isDoctor />)}
            </motion.div>
          )}

          {/* Results */}
          {!loading && searched && query.trim() && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: '16px 16px' }}>
              {totalCount === 0 ? (
                <div style={{ textAlign: 'center', paddingTop: 48 }}>
                  <div style={{ width: 72, height: 72, borderRadius: 22, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <HiSearch size={32} color="#FCA5A5" />
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', margin: '0 0 8px' }}>No results for "{query}"</p>
                  <p style={{ fontSize: 13, color: '#6B7C93', margin: 0 }}>Try a different name, specialty, or city</p>
                </div>
              ) : (
                <>
                  {/* Result count */}
                  <p style={{ fontSize: 13, color: '#A0AEC0', margin: '0 0 16px', fontWeight: 500 }}>
                    {totalCount} result{totalCount !== 1 ? 's' : ''} for &quot;{query}&quot;
                  </p>

                  {/* Clinics */}
                  {filteredClinics.length > 0 && (
                    <>
                      {activeFilter === 'All' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>🏥 Clinics</span>
                          <span style={{ fontSize: 11, fontWeight: 700, background: '#EBF2FF', color: '#2C6ED5', borderRadius: 20, padding: '2px 8px' }}>
                            {filteredClinics.length}
                          </span>
                        </div>
                      )}
                      {filteredClinics.map((clinic, i) => (
                        <motion.div key={clinic._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                          <ClinicResultCard clinic={clinic} onClick={() => handleClinicClick(clinic)} />
                        </motion.div>
                      ))}
                    </>
                  )}

                  {/* Divider between sections */}
                  {activeFilter === 'All' && filteredClinics.length > 0 && filteredDoctors.length > 0 && (
                    <div style={{ height: 1, background: '#EEF2F7', margin: '4px 0 16px' }} />
                  )}

                  {/* Doctors */}
                  {filteredDoctors.length > 0 && (
                    <>
                      {activeFilter === 'All' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>👨‍⚕️ Doctors</span>
                          <span style={{ fontSize: 11, fontWeight: 700, background: '#EBF2FF', color: '#2C6ED5', borderRadius: 20, padding: '2px 8px' }}>
                            {filteredDoctors.length}
                          </span>
                        </div>
                      )}
                      {filteredDoctors.map((doc, i) => (
                        <motion.div key={doc._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (filteredClinics.length + i) * 0.04 }}>
                          <DoctorResultCard
                            doctor={doc}
                            isFav={favIds.has(doc._id)}
                            onFavToggle={(e) => toggleFav(e, doc._id)}
                            onClick={() => handleDoctorClick(doc)}
                          />
                        </motion.div>
                      ))}
                    </>
                  )}
                </>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
