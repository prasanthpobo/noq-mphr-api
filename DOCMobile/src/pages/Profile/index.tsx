import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { clinicService } from '@/services/clinicService'
import { patientService } from '@/services/patientService'
import { historyService } from '@/services/historyService'
import type { Clinic, Patient, Consultation } from '@/types'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

function unwrap<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  const wrapped = payload as { data?: T[] } | null
  return Array.isArray(wrapped?.data) ? (wrapped!.data as T[]) : []
}

function profileCompleteness(u: {
  name?: string; email?: string; phone?: string; specialization?: string;
  mciNumber?: string; avatarUrl?: string; dob?: string; gender?: string
} | null): number {
  if (!u) return 0
  const fields = [u.name, u.email, u.phone, u.specialization, u.mciNumber, u.avatarUrl, u.dob, u.gender]
  const filled = fields.filter((v) => !!v && String(v).trim().length > 0).length
  return Math.round((filled / fields.length) * 100)
}

function yearsFromDob(dob?: string): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (isNaN(d.getTime())) return null
  const diff = Date.now() - d.getTime()
  return Math.max(0, Math.floor(diff / (365.25 * 24 * 3600 * 1000)))
}

export function Profile() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const clinic = useAuthStore((s) => s.selectedClinic)
  const logout = useAuthStore((s) => s.logout)

  const [clinicCount, setClinicCount] = useState<number | null>(null)
  const [patientCount, setPatientCount] = useState<number | null>(null)
  const [consultCount, setConsultCount] = useState<number | null>(null)

  useEffect(() => {
    clinicService.list()
      .then((res) => setClinicCount(unwrap<Clinic>(res.data).length))
      .catch(() => setClinicCount(0))
  }, [])

  useEffect(() => {
    if (!clinic?.id) { setPatientCount(0); setConsultCount(0); return }
    patientService.list(clinic.id)
      .then((res) => setPatientCount(unwrap<Patient>(res.data).length))
      .catch(() => setPatientCount(0))
    historyService.list(clinic.id)
      .then((res) => setConsultCount(unwrap<Consultation>(res.data).length))
      .catch(() => setConsultCount(0))
  }, [clinic?.id])

  const cleanName = (user?.name ?? '').replace(/^Dr\.\s*/i, '') || 'Doctor'
  const initials = cleanName
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const completion = profileCompleteness(user)
  const experience = yearsFromDob(user?.dob)
  const subtitle = [user?.specialization, experience != null ? `${experience} yrs experience` : null]
    .filter(Boolean)
    .join(' · ')

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ minHeight: '100%', background: '#F5F8FC' }}
    >
      {/* ── Header (blue gradient) ───────────────────────────────────────── */}
      <div style={{ background: BRAND_GRADIENT, padding: '52px 20px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            Profile
          </span>
          <button
            onClick={() => navigate('/profile/edit')}
            aria-label="Settings"
            style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'rgba(255,255,255,0.18)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H2a2 2 0 010-4h.09A1.65 1.65 0 004.6 8a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V2a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H22a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </div>

        {/* Avatar + identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 84, height: 84, borderRadius: 22,
              background: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
              flexShrink: 0,
            }}
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={cleanName}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 22 }}
              />
            ) : (
              <span style={{ fontSize: 24, fontWeight: 800, color: '#1E4FA3', letterSpacing: '0.5px' }}>{initials}</span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', margin: 0, lineHeight: 1.2, letterSpacing: '-0.3px' }}>
              Dr. {cleanName}
            </h1>
            {subtitle && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', margin: '4px 0 0', fontWeight: 500 }}>
                {subtitle}
              </p>
            )}
            {user?.mciNumber && (
              <div
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  marginTop: 8,
                  background: 'rgba(255,255,255,0.18)',
                  borderRadius: 999,
                  padding: '4px 10px',
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.3px' }}>NMC verified</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats card (overlaps the header) ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        style={{
          position: 'relative',
          zIndex: 2,
          margin: '-32px 16px 0',
          background: '#FFFFFF',
          borderRadius: 18,
          padding: '18px 12px',
          boxShadow: '0 6px 24px rgba(30,79,163,0.12)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Stat value={consultCount ?? '—'} label="CONSULTS" />
        <Divider />
        <Stat
          value={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              4.9
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1">
                <polygon points="12,2 15,9 22,9.5 17,14.5 18.5,22 12,18 5.5,22 7,14.5 2,9.5 9,9" />
              </svg>
            </span>
          }
          label="RATING"
        />
        <Divider />
        <Stat value={clinicCount ?? '—'} label="CLINICS" />
      </motion.div>

      {/* ── Account ──────────────────────────────────────────────────────── */}
      <SectionTitle>Account</SectionTitle>
      <div style={{ margin: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Row
          icon={<UserIcon />}
          title="My Profile"
          badge={`${completion}%`}
          subtitle="Doctor info · Working time · Experience · About"
          onClick={() => navigate('/profile/edit')}
        />
        <Row
          icon={<UsersIcon />}
          title="My Patients"
          badge={patientCount != null ? String(patientCount) : undefined}
          subtitle="Roster, records & appointment history"
          onClick={() => navigate('/patients')}
        />
        <Row
          icon={<ClinicIcon />}
          title="Your Clinics"
          badge={clinicCount != null ? String(clinicCount) : undefined}
          subtitle="Manage clinic details & timings"
          onClick={() => navigate('/clinics')}
        />
        <Row
          icon={<ConsentIcon />}
          title="Consent Requests"
          subtitle="DPDP-compliant patient access"
          onClick={() => navigate('/consent')}
        />
      </div>

      {/* ── Settings ─────────────────────────────────────────────────────── */}
      <SectionTitle>Settings</SectionTitle>
      <div style={{ margin: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Row
          icon={<BellIcon />}
          title="Notifications"
          subtitle="SMS, push, emergency alerts"
          onClick={() => {}}
          iconBg="#F1F5F9"
          iconColor="#475569"
        />
        <Row
          icon={<ShieldIcon />}
          title="Privacy & security"
          subtitle="2-factor, session log"
          onClick={() => {}}
          iconBg="#F1F5F9"
          iconColor="#475569"
        />
        <Row
          icon={<LogoutIcon />}
          title="Sign out"
          subtitle="End this session"
          onClick={handleLogout}
          iconBg="#FEF2F2"
          iconColor="#EF4444"
          titleColor="#EF4444"
        />
      </div>
    </motion.div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 20, fontWeight: 800, color: '#1E293B', lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '1px' }}>{label}</span>
    </div>
  )
}

function Divider() {
  return <div style={{ width: 1, alignSelf: 'stretch', background: '#E2E8F0', margin: '4px 0' }} />
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: '20px 20px 10px',
        fontSize: 15,
        fontWeight: 800,
        color: '#1E293B',
      }}
    >
      {children}
    </p>
  )
}

function Row({
  icon, title, subtitle, badge, onClick,
  iconBg = '#E8F1FD', iconColor = '#1E4FA3', titleColor = '#1E293B',
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  badge?: string
  onClick: () => void
  iconBg?: string
  iconColor?: string
  titleColor?: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        all: 'unset',
        cursor: 'pointer',
        background: '#FFFFFF',
        borderRadius: 16,
        padding: '14px 14px',
        boxShadow: '0 2px 8px rgba(30,79,163,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: 'auto',
      }}
    >
      <div
        style={{
          width: 40, height: 40, borderRadius: 12,
          background: iconBg, color: iconColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: titleColor }}>{title}</span>
          {badge && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#1E4FA3',
                background: '#EBF2FF',
                borderRadius: 999,
                padding: '2px 8px',
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {subtitle}
        </p>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  )
}

// ─── Icons ───────────────────────────────────────────────────────────────

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6" />
      <path d="M16 4a3.5 3.5 0 010 7" />
      <path d="M18 20c0-2.5-1.5-4.5-4-5.5" />
    </svg>
  )
}

function ConsentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

function ClinicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21V10l9-6 9 6v11" />
      <path d="M9 21v-6h6v6" />
      <path d="M12 8v4M10 10h4" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
