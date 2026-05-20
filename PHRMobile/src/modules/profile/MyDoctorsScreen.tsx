import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiArrowLeft, HiHeart, HiCalendar, HiStar, HiOfficeBuilding } from 'react-icons/hi'
import { getFavouriteDoctors, toggleFavouriteDoctor, formatDoctorName, type Doctor } from '../../services/doctorService'

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

function clinicName(doc: Doctor): string {
  if (!doc.clinicId) return ''
  if (typeof doc.clinicId === 'string') return ''
  return doc.clinicId.name ?? ''
}

export default function MyDoctorsScreen() {
  const navigate = useNavigate()

  const [doctors,  setDoctors]  = useState<Doctor[]>([])
  const [loading,  setLoading]  = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    getFavouriteDoctors()
      .then((r) => setDoctors(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleUnfavourite = async (doc: Doctor) => {
    setRemoving(doc._id)
    try {
      await toggleFavouriteDoctor(doc._id)
      setDoctors((prev) => prev.filter((d) => d._id !== doc._id))
    } catch { /* silent */ } finally {
      setRemoving(null)
    }
  }

  return (
    <div style={{
      minHeight: '100%', flex: 1, width: '100%',
      display: 'flex', flexDirection: 'column',
      background: '#F5F8FC',
      fontFamily: 'Roboto, system-ui, sans-serif',
    }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{
        background: BRAND_GRADIENT,
        padding: '16px 20px 24px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />

        <button
          onClick={() => navigate(-1)}
          style={{
            width: 40, height: 40, borderRadius: 12, border: 'none',
            background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', marginBottom: 20,
          }}
        >
          <HiArrowLeft size={20} color="#FFFFFF" />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 16,
            background: 'rgba(255,255,255,0.20)', border: '1.5px solid rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <HiHeart size={24} color="#FFFFFF" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: -0.4 }}>
              My Doctors
            </h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)', margin: '2px 0 0', fontWeight: 500 }}>
              {loading ? '…' : `${doctors.length} favourite${doctors.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, padding: '20px 16px', overflowY: 'auto' }}>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[1, 2, 3].map((n) => (
              <div key={n} style={{ background: '#FFFFFF', borderRadius: 18, height: 140, boxShadow: '0 2px 12px rgba(30,79,163,0.07)', opacity: 0.5 }} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && doctors.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '60px 24px' }}
          >
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: '#FFF0F0', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <HiHeart size={36} color="#E05B5B" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', margin: '0 0 8px' }}>
              No favourites yet
            </h2>
            <p style={{ fontSize: 14, color: '#6B7C93', margin: '0 0 28px', lineHeight: 1.5 }}>
              Tap the ❤️ on any doctor in the Search screen to save them here.
            </p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/app/search')}
              style={{
                background: BRAND_GRADIENT, color: '#FFFFFF',
                fontSize: 15, fontWeight: 700, border: 'none',
                borderRadius: 14, padding: '14px 32px',
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 8px 20px rgba(44,110,213,0.28)',
              }}
            >
              Find Doctors
            </motion.button>
          </motion.div>
        )}

        {/* Doctor cards */}
        <AnimatePresence>
          {doctors.map((doc) => {
            const color   = avatarColor(doc._id)
            const clinic  = clinicName(doc)
            const isGoing = removing === doc._id

            return (
              <motion.div
                key={doc._id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40, transition: { duration: 0.22 } }}
                style={{ marginBottom: 14 }}
              >
                <div style={{
                  background: '#FFFFFF', borderRadius: 18,
                  boxShadow: '0 2px 12px rgba(30,79,163,0.08)',
                  overflow: 'hidden',
                }}>
                  {/* Accent bar */}
                  <div style={{ height: 4, background: BRAND_GRADIENT }} />

                  <div style={{ padding: '14px 14px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                      {/* Avatar */}
                      <div style={{
                        width: 58, height: 58, borderRadius: '50%', flexShrink: 0,
                        background: color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 4px 14px ${color}44`,
                      }}>
                        {doc.avatar
                          ? <img src={doc.avatar} alt={doc.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>{initials(doc.name)}</span>
                        }
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <p style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A', margin: '0 0 4px', lineHeight: 1.2 }}>
                            {formatDoctorName(doc.name)}
                          </p>
                          {/* Unfavourite button */}
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => handleUnfavourite(doc)}
                            disabled={isGoing}
                            style={{
                              background: '#FFF0F0', border: 'none', borderRadius: 10,
                              width: 36, height: 36, flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: isGoing ? 'not-allowed' : 'pointer',
                              opacity: isGoing ? 0.5 : 1,
                            }}
                          >
                            <HiHeart size={18} color="#E05B5B" />
                          </motion.button>
                        </div>

                        {/* Specialty chip */}
                        <span style={{
                          display: 'inline-block', fontSize: 11, fontWeight: 700,
                          background: '#EBF2FF', color: '#2C6ED5',
                          borderRadius: 6, padding: '2px 9px', marginBottom: 6,
                        }}>
                          {doc.specialization}
                        </span>

                        {/* Chips row */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {doc.experience != null && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, background: '#F5F8FC', color: '#3D4A5B', borderRadius: 6, padding: '3px 8px' }}>
                              <HiStar size={11} color="#D97706" /> {doc.experience} yr{doc.experience !== 1 ? 's' : ''}
                            </span>
                          )}
                          {doc.consultationFee != null && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, background: '#F5F8FC', color: '#3D4A5B', borderRadius: 6, padding: '3px 8px' }}>
                              ₹{doc.consultationFee}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Clinic row */}
                    {clinic && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                        <div style={{ width: 22, height: 22, borderRadius: 7, background: '#F5F8FC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <HiOfficeBuilding size={12} color="#2C6ED5" />
                        </div>
                        <span style={{ fontSize: 12, color: '#6B7C93', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {clinic}
                        </span>
                      </div>
                    )}

                    {/* Divider */}
                    <div style={{ height: 1, background: '#F0F4F8', marginBottom: 12 }} />

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 8, paddingBottom: 14 }}>
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => navigate(`/app/doctor/${doc._id}`)}
                        style={{
                          flex: 1, height: 40, borderRadius: 12,
                          background: '#F5F8FC', border: '1.5px solid #E3EAF2',
                          color: '#3D4A5B', fontSize: 13, fontWeight: 700,
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        View Profile
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => navigate(`/app/doctor/${doc._id}`, { state: { openBooking: true } })}
                        style={{
                          flex: 2, height: 40, borderRadius: 12,
                          background: BRAND_GRADIENT, border: 'none',
                          color: '#FFFFFF', fontSize: 13, fontWeight: 700,
                          cursor: 'pointer', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          boxShadow: '0 4px 12px rgba(44,110,213,0.28)',
                        }}
                      >
                        <HiCalendar size={15} />
                        Book Appointment
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
