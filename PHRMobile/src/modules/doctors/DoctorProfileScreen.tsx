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

  const doctor = (id && MOCK_DOCTORS[id]) ? MOCK_DOCTORS[id] : FALLBACK_DOCTOR
  const selectedDay = doctor.availability[selectedDayIndex]

  return (
    <div style={{ height: '100%', background: '#F5F8FC', fontFamily: 'Roboto, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* ── White nav bar ───────────────────────────────────────────────────── */}
      <div style={{
        background: '#FFFFFF', padding: '12px 16px 10px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #F0F4F8',
      }}>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F8FC', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HiArrowLeft size={18} color="#1A1A1A" />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>Doctor Profile</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => {}} style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F8FC', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HiShare size={17} color="#6B7C93" />
          </button>
          <button onClick={() => setIsFavorite((v) => !v)} style={{ width: 36, height: 36, borderRadius: 10, background: isFavorite ? '#FFF0F0' : '#F5F8FC', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HiHeart size={17} color={isFavorite ? '#E05B5B' : '#6B7C93'} />
          </button>
        </div>
      </div>

      {/* ── Merged hero card ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}
        style={{ borderRadius: '0 0 24px 24px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(30,79,163,0.13)', marginBottom: 16, flexShrink: 0 }}
      >
        {/* Gradient section */}
        <div style={{ background: BRAND_GRADIENT, padding: '20px 18px 22px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.09)' }} />
          <div style={{ position: 'absolute', bottom: -24, left: -24, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
            {/* Avatar */}
            <div style={{
              width: 68, height: 68, borderRadius: 22, flexShrink: 0,
              background: 'rgba(255,255,255,0.22)', border: '2.5px solid rgba(255,255,255,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, color: '#FFFFFF',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            }}>
              {doctor.initials}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', marginBottom: 2, lineHeight: 1.2 }}>{doctor.name}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginBottom: 10 }}>{doctor.specialty}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '3px 10px', background: 'rgba(255,255,255,0.18)', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <HiStar size={10} /> {doctor.rating} ({doctor.reviewCount})
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '3px 10px', background: 'rgba(255,255,255,0.18)', color: '#FFFFFF' }}>
                  {doctor.hospital}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* White — stats row */}
        <div style={{ background: '#FFFFFF', display: 'flex', overflow: 'hidden' }}>
          <StatBox icon={<HiUsers size={18} color="#2C6ED5" />} value={doctor.patients} label="Patients" />
          <StatBox icon={<HiBadgeCheck size={18} color="#1FA3A8" />} value={doctor.experience} label="Experience" borderX />
          <StatBox icon={<HiStar size={18} color="#F59E0B" />} value={`${doctor.rating}`} label={`${doctor.reviewCount} reviews`} />
        </div>
      </motion.div>

      {/* ── Scrollable content ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>

      {/* ── About ───────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        style={{ marginBottom: 16 }}
      >
        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 12px rgba(30,79,163,0.08)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 10px' }}>About</h3>
          <p style={{ fontSize: '14px', color: '#6B7C93', margin: 0, lineHeight: 1.7 }}>{doctor.bio}</p>
        </div>
      </motion.div>

      {/* ── Availability ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35 }}
        style={{ marginBottom: 16 }}
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
        style={{ marginBottom: 16 }}
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

      </div>{/* end scrollable content */}

      {/* ── Book Button ─────────────────────────────────────────────────────── */}
      <div
        style={{
          flexShrink: 0,
          padding: '12px 16px 16px',
          background: '#FFFFFF',
          borderTop: '1px solid #F0F4F8',
          boxShadow: '0 -4px 20px rgba(30,79,163,0.08)',
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
