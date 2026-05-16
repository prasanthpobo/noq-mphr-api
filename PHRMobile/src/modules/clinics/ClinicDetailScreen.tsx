import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiArrowLeft, HiPhone, HiClock, HiLocationMarker } from 'react-icons/hi'
import { getClinicById, getDoctorsByClinic, type Clinic, type ClinicDoctor } from '../../services/clinicService'

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

type TabKey = 'doctors' | 'about'

// ── Doctor card ───────────────────────────────────────────────────────────────

function DoctorCard({ doctor, onBook }: { doctor: ClinicDoctor; onBook: () => void }) {
  const color = avatarColor(doctor._id)
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 16, padding: 14,
      boxShadow: '0 4px 12px rgba(30,79,163,0.08)',
      display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
    }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#FFFFFF', flexShrink: 0 }}>
        {initials(doctor.name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', margin: '0 0 2px' }}>Dr. {doctor.name}</p>
        <p style={{ fontSize: 13, color: '#2C6ED5', fontWeight: 500, margin: '0 0 6px' }}>{doctor.specialization}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {doctor.experience !== undefined && (
            <span style={{ fontSize: 11, background: '#F0F5FF', color: '#2C6ED5', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{doctor.experience} yrs exp</span>
          )}
          {doctor.consultationFee !== undefined && (
            <span style={{ fontSize: 11, background: '#F0FFF4', color: '#059669', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>₹{doctor.consultationFee}</span>
          )}
        </div>
      </div>
      <button onClick={onBook} style={{
        background: BRAND_GRADIENT, color: '#FFFFFF', border: 'none',
        borderRadius: 20, padding: '8px 16px', fontSize: 13, fontWeight: 700,
        cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 8px rgba(44,110,213,0.3)',
      }}>
        Book
      </button>
    </div>
  )
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, display: 'flex', gap: 12 }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#E8EEF7', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ width: '60%', height: 14, borderRadius: 6, background: '#E8EEF7', marginBottom: 8 }} />
        <div style={{ width: '40%', height: 12, borderRadius: 6, background: '#E8EEF7', marginBottom: 6 }} />
        <div style={{ width: '50%', height: 12, borderRadius: 6, background: '#E8EEF7' }} />
      </div>
    </div>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{ marginTop: 1, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 11, color: '#A0AEC0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, color: '#3D4A5B', fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ClinicDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [doctors, setDoctors] = useState<ClinicDoctor[]>([])
  const [loading, setLoading] = useState(true)
  const [doctorsLoading, setDoctorsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('doctors')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    getClinicById(id)
      .then((r) => setClinic(r.data))
      .catch(() => setError('Failed to load clinic details'))
      .finally(() => setLoading(false))

    setDoctorsLoading(true)
    getDoctorsByClinic(id, { status: 'active' })
      .then((r) => setDoctors(r.data))
      .catch(() => setDoctors([]))
      .finally(() => setDoctorsLoading(false))
  }, [id])

  const isOpen = clinic?.status === 'active'
  const timing = clinic?.openTime ? `${clinic.openTime} – ${clinic.closeTime ?? ''}` : null

  const handleBookDoctor = (doctor: ClinicDoctor) => {
    const enriched = {
      ...doctor,
      clinicId: clinic
        ? { _id: clinic._id, name: clinic.name, city: clinic.city }
        : doctor.clinicId,
    }
    navigate('/app/booking', { state: { doctor: enriched } })
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F5F8FC', fontFamily: 'Roboto, system-ui, sans-serif' }}>

      {/* Gradient header */}
      <div style={{ height: 160, background: BRAND_GRADIENT, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ padding: 16, position: 'relative', zIndex: 1 }}>
          <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HiArrowLeft size={20} color="#FFFFFF" />
          </button>
        </div>
      </div>

      {/* Clinic info */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -36, position: 'relative', zIndex: 5, paddingBottom: 16 }}>
        {loading ? (
          <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#E8EEF7', border: '4px solid #FFFFFF' }} />
            <div style={{ width: 160, height: 18, borderRadius: 8, background: '#E8EEF7' }} />
            <div style={{ width: 120, height: 13, borderRadius: 6, background: '#E8EEF7' }} />
          </div>
        ) : (
          <>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: BRAND_GRADIENT, border: '4px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#FFFFFF', boxShadow: '0 4px 16px rgba(30,79,163,0.2)' }}>
              {clinic ? initials(clinic.name) : '?'}
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', margin: '10px 0 4px', textAlign: 'center', padding: '0 16px' }}>
              {clinic?.name ?? 'Clinic'}
            </h1>
            {clinic && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10, padding: '0 16px' }}>
                <HiLocationMarker size={13} color="#A0AEC0" />
                <span style={{ fontSize: 13, color: '#6B7C93', textAlign: 'center' }}>{clinic.address}, {clinic.city}</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', padding: '0 16px', marginBottom: 10 }}>
              {clinic?.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F5F8FC', border: '1px solid #E3EAF2', borderRadius: 20, padding: '5px 12px' }}>
                  <HiPhone size={12} color="#6B7C93" />
                  <span style={{ fontSize: 12, color: '#6B7C93' }}>{clinic.phone}</span>
                </div>
              )}
              {timing && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F5F8FC', border: '1px solid #E3EAF2', borderRadius: 20, padding: '5px 12px' }}>
                  <HiClock size={12} color="#6B7C93" />
                  <span style={{ fontSize: 12, color: '#6B7C93' }}>{timing}</span>
                </div>
              )}
            </div>
            {!loading && clinic && (
              <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 14px', borderRadius: 20, background: isOpen ? '#ECFDF5' : '#FEF2F2', color: isOpen ? '#16A34A' : '#DC2626' }}>
                {isOpen ? 'Open Now' : 'Closed'}
              </span>
            )}
          </>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <p style={{ fontSize: 16, color: '#EF4444', marginBottom: 8 }}>{error}</p>
          <button onClick={() => navigate(-1)} style={{ color: '#2C6ED5', background: 'none', border: 'none', fontSize: 14, cursor: 'pointer' }}>Go back</button>
        </div>
      )}

      {/* Tabs */}
      {!error && (
        <>
          <div style={{ display: 'flex', borderBottom: '1px solid #EEF2F7', background: '#FFFFFF', position: 'sticky', top: 0, zIndex: 30 }}>
            {(['doctors', 'about'] as TabKey[]).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                flex: 1, padding: '13px 0', fontSize: 14,
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? '#2C6ED5' : '#6B7C93',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: activeTab === tab ? '2.5px solid #2C6ED5' : '2.5px solid transparent',
              }}>
                {tab === 'doctors'
                  ? `Doctors${!doctorsLoading && doctors.length > 0 ? ` (${doctors.length})` : ''}`
                  : 'About'}
              </button>
            ))}
          </div>

          <div style={{ paddingBottom: 96 }}>
            <AnimatePresence mode="wait">

              {activeTab === 'doctors' && (
                <motion.div key="doctors" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: 16 }}>
                  {doctorsLoading
                    ? [0, 1, 2].map((i) => <CardSkeleton key={i} />)
                    : doctors.length === 0
                      ? <div style={{ textAlign: 'center', padding: '48px 0', color: '#A0AEC0', fontSize: 14 }}>No doctors found for this clinic</div>
                      : doctors.map((doc, i) => (
                        <motion.div key={doc._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                          <DoctorCard doctor={doc} onBook={() => handleBookDoctor(doc)} />
                        </motion.div>
                      ))
                  }
                </motion.div>
              )}

              {activeTab === 'about' && (
                <motion.div key="about" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: 16 }}>
                  {loading ? (
                    <div style={{ background: '#FFFFFF', borderRadius: 14, height: 160, boxShadow: '0 4px 12px rgba(30,79,163,0.08)' }} />
                  ) : clinic ? (
                    <>
                      <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 16, boxShadow: '0 4px 12px rgba(30,79,163,0.08)', marginBottom: 12 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', margin: '0 0 10px' }}>About</h3>
                        <p style={{ fontSize: 14, color: '#6B7C93', margin: 0, lineHeight: 1.65 }}>
                          {clinic.about ?? `${clinic.name} is a ${clinic.type} clinic located in ${clinic.city}.`}
                        </p>
                      </div>
                      <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 16, boxShadow: '0 4px 12px rgba(30,79,163,0.08)' }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', margin: '0 0 12px' }}>Details</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <DetailRow icon={<HiLocationMarker size={15} color="#2C6ED5" />} label="Address" value={`${clinic.address}, ${clinic.city}, ${clinic.state} ${clinic.pincode}`} />
                          <DetailRow icon={<HiPhone size={15} color="#2C6ED5" />} label="Phone" value={clinic.phone} />
                          {timing && <DetailRow icon={<HiClock size={15} color="#2C6ED5" />} label="Hours" value={timing} />}
                          {clinic.openDays.length > 0 && (
                            <DetailRow icon={<HiClock size={15} color="#2C6ED5" />} label="Open Days" value={clinic.openDays.join(', ')} />
                          )}
                        </div>
                      </div>
                    </>
                  ) : null}
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  )
}
