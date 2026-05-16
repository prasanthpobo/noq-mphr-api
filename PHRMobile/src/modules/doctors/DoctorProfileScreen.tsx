import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiArrowLeft,
  HiShare,
  HiHeart,
  HiStar,
  HiUsers,
  HiBadgeCheck,
  HiVideoCamera,
  HiOfficeBuilding,
} from 'react-icons/hi'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

// ── Types ─────────────────────────────────────────────────────────────────────

interface TimeSlot {
  id: string
  time: string
  available: boolean
}

interface DaySlots {
  day: string
  shortDay: string
  date: number
  slots: TimeSlot[]
}

interface DoctorDetail {
  id: string
  name: string
  specialty: string
  hospital: string
  patients: string
  experience: string
  rating: number
  reviewCount: number
  bio: string
  consultationFee: number
  initials: string
  availability: DaySlots[]
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const generateSlots = (available: boolean[]): TimeSlot[] => {
  const times = ['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM']
  return times.map((time, i) => ({
    id: `slot-${i}`,
    time,
    available: available[i] ?? true,
  }))
}

const MOCK_DOCTORS: Record<string, DoctorDetail> = {
  d1: {
    id: 'd1',
    name: 'Dr. Priya Sharma',
    specialty: 'Cardiologist',
    hospital: 'Apollo Clinic, Banjara Hills',
    patients: '5,200+',
    experience: '12 Years',
    rating: 4.9,
    reviewCount: 284,
    bio: 'Dr. Priya Sharma is a senior consultant cardiologist with over 12 years of experience in interventional cardiology. She completed her MD from AIIMS Delhi and fellowship from Cleveland Clinic, USA. She specialises in complex coronary interventions, heart failure management, and preventive cardiology. Patients appreciate her compassionate care and clear communication style.',
    consultationFee: 800,
    initials: 'PS',
    availability: [
      { day: 'Monday',    shortDay: 'Mon', date: 19, slots: generateSlots([true,true,false,true,true,false,true,false,true,true,false,true]) },
      { day: 'Tuesday',   shortDay: 'Tue', date: 20, slots: generateSlots([false,true,true,true,false,true,true,true,false,true,true,false]) },
      { day: 'Wednesday', shortDay: 'Wed', date: 21, slots: generateSlots([true,false,true,false,true,true,false,true,true,false,true,true]) },
      { day: 'Thursday',  shortDay: 'Thu', date: 22, slots: generateSlots([true,true,true,false,false,true,true,false,true,true,true,false]) },
      { day: 'Friday',    shortDay: 'Fri', date: 23, slots: generateSlots([false,true,false,true,true,false,true,true,false,true,false,true]) },
      { day: 'Saturday',  shortDay: 'Sat', date: 24, slots: generateSlots([true,true,false,false,true,true,true,false,true,false,true,true]) },
      { day: 'Sunday',    shortDay: 'Sun', date: 25, slots: generateSlots([false,false,false,false,false,false,false,false,false,false,false,false]) },
    ],
  },
  d2: {
    id: 'd2',
    name: 'Dr. Rohan Mehta',
    specialty: 'Dermatologist',
    hospital: 'Care Hospitals, Jubilee Hills',
    patients: '3,800+',
    experience: '8 Years',
    rating: 4.7,
    reviewCount: 196,
    bio: 'Dr. Rohan Mehta is a board-certified dermatologist with 8 years of clinical experience. He completed his MBBS and MD (Dermatology) from Osmania Medical College and has advanced training in cosmetic dermatology and laser procedures. He is known for treating complex skin conditions and providing evidence-based skincare advice.',
    consultationFee: 600,
    initials: 'RM',
    availability: [
      { day: 'Monday',    shortDay: 'Mon', date: 19, slots: generateSlots([true,true,true,false,true,true,false,true,false,true,true,false]) },
      { day: 'Tuesday',   shortDay: 'Tue', date: 20, slots: generateSlots([false,true,false,true,true,false,true,true,false,true,false,true]) },
      { day: 'Wednesday', shortDay: 'Wed', date: 21, slots: generateSlots([true,false,true,true,false,true,false,true,true,false,true,false]) },
      { day: 'Thursday',  shortDay: 'Thu', date: 22, slots: generateSlots([true,true,false,true,true,true,false,false,true,true,false,true]) },
      { day: 'Friday',    shortDay: 'Fri', date: 23, slots: generateSlots([false,false,true,true,false,true,true,true,false,true,true,false]) },
      { day: 'Saturday',  shortDay: 'Sat', date: 24, slots: generateSlots([true,true,true,false,true,false,true,false,true,true,false,true]) },
      { day: 'Sunday',    shortDay: 'Sun', date: 25, slots: generateSlots([false,false,false,false,false,false,false,false,false,false,false,false]) },
    ],
  },
  d3: {
    id: 'd3',
    name: 'Dr. Sneha Reddy',
    specialty: 'Pediatrician',
    hospital: 'Yashoda Hospitals, Secunderabad',
    patients: '6,100+',
    experience: '10 Years',
    rating: 4.8,
    reviewCount: 321,
    bio: 'Dr. Sneha Reddy is a dedicated pediatrician with 10 years of experience caring for newborns, infants, children, and adolescents. She trained at Nizam\'s Institute of Medical Sciences and completed a fellowship in neonatal care. She is particularly skilled at creating a comfortable environment for young patients and guiding parents through developmental milestones.',
    consultationFee: 500,
    initials: 'SR',
    availability: [
      { day: 'Monday',    shortDay: 'Mon', date: 19, slots: generateSlots([true,false,true,true,false,true,true,false,true,false,true,true]) },
      { day: 'Tuesday',   shortDay: 'Tue', date: 20, slots: generateSlots([false,true,true,false,true,true,false,true,true,false,true,false]) },
      { day: 'Wednesday', shortDay: 'Wed', date: 21, slots: generateSlots([true,true,false,true,false,true,true,true,false,true,false,true]) },
      { day: 'Thursday',  shortDay: 'Thu', date: 22, slots: generateSlots([false,true,true,true,false,false,true,false,true,true,true,false]) },
      { day: 'Friday',    shortDay: 'Fri', date: 23, slots: generateSlots([true,false,true,false,true,false,true,true,false,true,false,true]) },
      { day: 'Saturday',  shortDay: 'Sat', date: 24, slots: generateSlots([true,true,true,false,false,true,false,true,true,false,true,false]) },
      { day: 'Sunday',    shortDay: 'Sun', date: 25, slots: generateSlots([false,false,false,false,false,false,false,false,false,false,false,false]) },
    ],
  },
}

const FALLBACK_DOCTOR: DoctorDetail = MOCK_DOCTORS['d1']

// ── Component ─────────────────────────────────────────────────────────────────

export default function DoctorProfileScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isFavorite, setIsFavorite] = useState(false)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [appointmentType, setAppointmentType] = useState<'inperson' | 'video'>('inperson')

  const doctor = (id && MOCK_DOCTORS[id]) ? MOCK_DOCTORS[id] : FALLBACK_DOCTOR
  const selectedDay = doctor.availability[selectedDayIndex]

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#F5F8FC',
        fontFamily: 'Roboto, system-ui, sans-serif',
        overflowX: 'hidden',
        paddingBottom: '120px',
      }}
    >
      {/* ── Gradient Header ─────────────────────────────────────────────────── */}
      <div
        style={{
          height: '208px',
          background: BRAND_GRADIENT,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: '-30px', left: '20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', position: 'relative', zIndex: 1 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Go back"
          >
            <HiArrowLeft size={20} color="#FFFFFF" />
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {}}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              aria-label="Share"
            >
              <HiShare size={18} color="#FFFFFF" />
            </button>
            <button
              onClick={() => setIsFavorite((v) => !v)}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: isFavorite ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.2)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              aria-label={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
            >
              <HiHeart size={18} color={isFavorite ? '#EF4444' : '#FFFFFF'} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Doctor Avatar + Name ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '-40px', position: 'relative', zIndex: 5, padding: '0 16px' }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: BRAND_GRADIENT,
            border: '4px solid #FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '26px',
            fontWeight: 700,
            color: '#FFFFFF',
            boxShadow: '0 4px 20px rgba(30,79,163,0.25)',
          }}
        >
          {doctor.initials}
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1A1A1A', margin: '12px 0 4px', textAlign: 'center' }}>
          {doctor.name}
        </h1>
        <p style={{ fontSize: '15px', color: '#2C6ED5', fontWeight: 600, margin: '0 0 4px' }}>{doctor.specialty}</p>
        <p style={{ fontSize: '13px', color: '#6B7C93', margin: '0 0 16px', textAlign: 'center' }}>{doctor.hospital}</p>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            background: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(30,79,163,0.08)',
            overflow: 'hidden',
            width: '100%',
            marginBottom: '16px',
          }}
        >
          <StatBox icon={<HiUsers size={18} color="#2C6ED5" />} value={doctor.patients} label="Patients" />
          <StatBox icon={<HiBadgeCheck size={18} color="#1FA3A8" />} value={doctor.experience} label="Experience" borderX />
          <StatBox
            icon={<HiStar size={18} color="#F59E0B" />}
            value={`${doctor.rating}`}
            label={`${doctor.reviewCount} reviews`}
          />
        </div>
      </div>

      {/* ── About ───────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        style={{ padding: '0 16px 16px' }}
      >
        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 12px rgba(30,79,163,0.08)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 10px' }}>About</h3>
          <p style={{ fontSize: '14px', color: '#6B7C93', margin: 0, lineHeight: 1.7 }}>{doctor.bio}</p>
        </div>
      </motion.div>

      {/* ── Appointment Type ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
        style={{ padding: '0 16px 16px' }}
      >
        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 12px rgba(30,79,163,0.08)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 12px' }}>Appointment Type</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setAppointmentType('inperson')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '12px',
                border: '1.5px solid',
                borderColor: appointmentType === 'inperson' ? '#2C6ED5' : '#E3EAF2',
                background: appointmentType === 'inperson' ? '#EBF2FF' : '#FFFFFF',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <HiOfficeBuilding size={18} color={appointmentType === 'inperson' ? '#2C6ED5' : '#A0AEC0'} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: appointmentType === 'inperson' ? '#2C6ED5' : '#6B7C93' }}>
                In-person
              </span>
            </button>
            <button
              onClick={() => setAppointmentType('video')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '12px',
                border: '1.5px solid',
                borderColor: appointmentType === 'video' ? '#1FA3A8' : '#E3EAF2',
                background: appointmentType === 'video' ? '#E6F6F6' : '#FFFFFF',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <HiVideoCamera size={18} color={appointmentType === 'video' ? '#1FA3A8' : '#A0AEC0'} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: appointmentType === 'video' ? '#1FA3A8' : '#6B7C93' }}>
                Video
              </span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Availability ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35 }}
        style={{ padding: '0 16px 16px' }}
      >
        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 12px rgba(30,79,163,0.08)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 14px' }}>Availability</h3>

          {/* Day chips */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              marginBottom: '16px',
              paddingBottom: '4px',
            }}
          >
            {doctor.availability.map((dayData, index) => {
              const isSelected = selectedDayIndex === index
              const hasSlots = dayData.slots.some((s) => s.available)
              return (
                <button
                  key={dayData.day}
                  onClick={() => {
                    setSelectedDayIndex(index)
                    setSelectedSlot(null)
                  }}
                  style={{
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    border: '1.5px solid',
                    borderColor: isSelected ? '#2C6ED5' : '#E3EAF2',
                    background: isSelected ? '#2C6ED5' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    opacity: hasSlots ? 1 : 0.45,
                  }}
                  disabled={!hasSlots}
                >
                  <span style={{ fontSize: '11px', fontWeight: 500, color: isSelected ? 'rgba(255,255,255,0.8)' : '#A0AEC0' }}>
                    {dayData.shortDay}
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: isSelected ? '#FFFFFF' : '#1A1A1A' }}>
                    {dayData.date}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Time slots grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {selectedDay.slots.map((slot) => {
              const isSelected = selectedSlot === slot.id
              return (
                <button
                  key={slot.id}
                  onClick={() => slot.available && setSelectedSlot(isSelected ? null : slot.id)}
                  disabled={!slot.available}
                  style={{
                    padding: '9px 4px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: isSelected ? 700 : 500,
                    border: '1.5px solid',
                    borderColor: isSelected ? '#2C6ED5' : slot.available ? '#E3EAF2' : '#F5F8FC',
                    background: isSelected ? '#2C6ED5' : slot.available ? '#FFFFFF' : '#F5F8FC',
                    color: isSelected ? '#FFFFFF' : slot.available ? '#3D4A5B' : '#C4CDD6',
                    cursor: slot.available ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s',
                    textAlign: 'center',
                  }}
                >
                  {slot.time}
                </button>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* ── Consultation Fee ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35 }}
        style={{ padding: '0 16px 16px' }}
      >
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '14px 16px',
            boxShadow: '0 4px 12px rgba(30,79,163,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p style={{ fontSize: '12px', color: '#A0AEC0', margin: '0 0 2px' }}>Consultation Fee</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
              ₹{doctor.consultationFee}
            </p>
          </div>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#16A34A',
              background: '#ECFDF5',
              borderRadius: '20px',
              padding: '4px 12px',
            }}
          >
            Pay at clinic
          </span>
        </div>
      </motion.div>

      {/* ── Fixed Book Button ────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          bottom: '80px',
          left: 0,
          right: 0,
          padding: '0 16px',
          zIndex: 40,
        }}
      >
        <button
          onClick={() => navigate('/app/book')}
          disabled={!selectedSlot}
          style={{
            width: '100%',
            height: '52px',
            borderRadius: '14px',
            border: 'none',
            background: selectedSlot ? BRAND_GRADIENT : '#C4CDD6',
            color: '#FFFFFF',
            fontSize: '16px',
            fontWeight: 700,
            cursor: selectedSlot ? 'pointer' : 'not-allowed',
            boxShadow: selectedSlot ? '0 8px 20px rgba(44,110,213,0.32)' : 'none',
            transition: 'all 0.2s',
            letterSpacing: '0.2px',
          }}
        >
          {selectedSlot ? 'Book Appointment' : 'Select a Time Slot'}
        </button>
      </div>
    </div>
  )
}

// ── Helper components ─────────────────────────────────────────────────────────

function StatBox({
  icon,
  value,
  label,
  borderX,
}: {
  icon: React.ReactNode
  value: string
  label: string
  borderX?: boolean
}) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '14px 8px',
        borderLeft: borderX ? '1px solid #EEF2F7' : undefined,
        borderRight: borderX ? '1px solid #EEF2F7' : undefined,
      }}
    >
      {icon}
      <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', margin: '6px 0 2px', textAlign: 'center' }}>{value}</p>
      <p style={{ fontSize: '11px', color: '#A0AEC0', margin: 0, textAlign: 'center', lineHeight: 1.3 }}>{label}</p>
    </div>
  )
}
