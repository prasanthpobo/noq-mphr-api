import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiArrowLeft, HiSearch, HiClock, HiLocationMarker, HiX, HiChevronRight } from 'react-icons/hi'
import { getClinics, type Clinic } from '../../services/clinicService'
import { getDoctors, type Doctor } from '../../services/doctorService'

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

const SPECIALTIES = ['General', 'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics', 'ENT', 'Dental', 'Gynecology']

// ── Result cards ──────────────────────────────────────────────────────────────

function ClinicResultCard({ clinic, onClick }: { clinic: Clinic; onClick: () => void }) {
  const color = avatarColor(clinic._id)
  const isOpen = clinic.status === 'active'
  return (
    <div onClick={onClick} style={{
      background: '#fff', borderRadius: 14, padding: 14,
      boxShadow: '0 4px 12px rgba(30,79,163,0.08)',
      display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
      border: '1px solid #EEF2F7', marginBottom: 10,
    }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
        {initials(clinic.name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clinic.name}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
          <HiLocationMarker size={11} color="#A0AEC0" />
          <span style={{ fontSize: 12, color: '#6B7C93', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clinic.address}, {clinic.city}</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '2px 8px', background: isOpen ? '#DCFCE7' : '#FEE2E2', color: isOpen ? '#15803D' : '#DC2626' }}>
          {isOpen ? '● Open' : '● Closed'}
        </span>
      </div>
      <HiChevronRight size={16} color="#A0AEC0" />
    </div>
  )
}

function DoctorResultCard({ doctor, onClick }: { doctor: Doctor; onClick: () => void }) {
  const color = avatarColor(doctor._id)
  const clinicName = typeof doctor.clinicId === 'object' ? doctor.clinicId.name : ''
  return (
    <div onClick={onClick} style={{
      background: '#fff', borderRadius: 14, padding: 14,
      boxShadow: '0 4px 12px rgba(30,79,163,0.08)',
      display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
      border: '1px solid #EEF2F7', marginBottom: 10,
    }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
        {initials(doctor.name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A', margin: '0 0 2px' }}>Dr. {doctor.name}</p>
        <p style={{ fontSize: 12, color: '#2C6ED5', fontWeight: 500, margin: '0 0 2px' }}>{doctor.specialization}</p>
        <p style={{ fontSize: 12, color: '#6B7C93', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {clinicName}{doctor.experience !== undefined ? ` · ${doctor.experience} yrs` : ''}
        </p>
      </div>
      {doctor.consultationFee !== undefined && (
        <div style={{ fontSize: 13, fontWeight: 700, color: '#059669', flexShrink: 0 }}>₹{doctor.consultationFee}</div>
      )}
    </div>
  )
}

function ResultSkeleton() {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #EEF2F7', marginBottom: 10, display: 'flex', gap: 12 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F0F4F8', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ width: '60%', height: 14, borderRadius: 6, background: '#F0F4F8', marginBottom: 8 }} />
        <div style={{ width: '40%', height: 12, borderRadius: 6, background: '#F0F4F8', marginBottom: 6 }} />
        <div style={{ width: '30%', height: 12, borderRadius: 6, background: '#F0F4F8' }} />
      </div>
    </div>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery]         = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterChip>('All')
  const [clinics, setClinics]     = useState<Clinic[]>([])
  const [doctors, setDoctors]     = useState<Doctor[]>([])
  const [loading, setLoading]     = useState(false)
  const [searched, setSearched]   = useState(false)

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 150) }, [])

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

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 350)
    return () => clearTimeout(t)
  }, [query, doSearch])

  const filteredClinics = activeFilter === 'Doctors' ? [] : clinics
  const filteredDoctors = activeFilter === 'Clinics' ? [] : doctors
  const totalCount = filteredClinics.length + filteredDoctors.length

  const handleDoctorClick = (doctor: Doctor) => {
    navigate('/app/booking', {
      state: {
        doctor,
        fromSearch: true,
      },
    })
  }

  const handleClinicClick = (clinic: Clinic) => {
    navigate(`/app/clinic/${clinic._id}`)
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#fff', fontFamily: 'Roboto, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: '#fff', borderBottom: '1px solid #EEF2F7', padding: '12px 16px', boxShadow: '0 1px 4px rgba(30,79,163,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: '50%', background: '#F5F8FC', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#1E4FA3' }}>
            <HiArrowLeft size={20} />
          </button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#F5F8FC', borderRadius: 12, padding: '0 12px', height: 44, border: `1.5px solid ${query ? '#2C6ED5' : '#E3EAF2'}`, transition: 'border-color 0.15s' }}>
            <HiSearch size={17} color={query ? '#2C6ED5' : '#A0AEC0'} />
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
                <HiX size={16} color="#A0AEC0" />
              </button>
            )}
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {FILTER_CHIPS.map((chip) => (
            <button key={chip} onClick={() => setActiveFilter(chip)} style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
              border: `1.5px solid ${activeFilter === chip ? '#2C6ED5' : '#E3EAF2'}`,
              background: activeFilter === chip ? '#EBF2FF' : '#fff',
              color: activeFilter === chip ? '#2C6ED5' : '#6B7C93', cursor: 'pointer',
            }}>
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 96 }}>
        <AnimatePresence mode="wait">

          {/* Empty / idle state */}
          {!query.trim() && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>Popular Specialties</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {SPECIALTIES.map((s) => (
                  <button key={s} onClick={() => setQuery(s)} style={{
                    padding: '8px 16px', borderRadius: 20,
                    border: '1.5px solid #E3EAF2', background: '#F5F8FC',
                    fontSize: 13, fontWeight: 500, color: '#3D4A5B', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <HiSearch size={13} color="#A0AEC0" /> {s}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 28, textAlign: 'center', padding: '24px 0' }}>
                <HiSearch size={48} color="#E3EAF2" style={{ marginBottom: 12 }} />
                <p style={{ color: '#A0AEC0', fontSize: 14 }}>Search for clinics or doctors</p>
              </div>
            </motion.div>
          )}

          {/* Loading skeletons */}
          {loading && query.trim() && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: 16 }}>
              {[0, 1, 2, 3].map((i) => <ResultSkeleton key={i} />)}
            </motion.div>
          )}

          {/* Results */}
          {!loading && searched && query.trim() && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: 16 }}>
              {totalCount === 0 ? (
                <div style={{ textAlign: 'center', paddingTop: 48 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', margin: '0 0 8px' }}>No results for "{query}"</p>
                  <p style={{ fontSize: 13, color: '#6B7C93' }}>Try a different name, specialty, or city</p>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: '#A0AEC0', margin: '0 0 12px' }}>{totalCount} result{totalCount !== 1 ? 's' : ''}</p>

                  {/* Clinics section */}
                  {filteredClinics.length > 0 && (
                    <>
                      {activeFilter === 'All' && (
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                          🏥 Clinics <span style={{ fontSize: 11, color: '#A0AEC0', fontWeight: 500 }}>({filteredClinics.length})</span>
                        </p>
                      )}
                      {filteredClinics.map((clinic, i) => (
                        <motion.div key={clinic._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                          <ClinicResultCard clinic={clinic} onClick={() => handleClinicClick(clinic)} />
                        </motion.div>
                      ))}
                    </>
                  )}

                  {/* Doctors section */}
                  {filteredDoctors.length > 0 && (
                    <>
                      {activeFilter === 'All' && filteredClinics.length > 0 && (
                        <div style={{ height: 1, background: '#EEF2F7', margin: '8px 0 16px' }} />
                      )}
                      {activeFilter === 'All' && (
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                          👨‍⚕️ Doctors <span style={{ fontSize: 11, color: '#A0AEC0', fontWeight: 500 }}>({filteredDoctors.length})</span>
                        </p>
                      )}
                      {filteredDoctors.map((doc, i) => (
                        <motion.div key={doc._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (filteredClinics.length + i) * 0.04 }}>
                          <DoctorResultCard doctor={doc} onClick={() => handleDoctorClick(doc)} />
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
