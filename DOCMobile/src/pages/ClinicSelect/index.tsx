import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useClinicStore } from '@/stores/clinicStore'
import { clinicService } from '@/services/clinicService'
import { doctorService } from '@/services/doctorService'
import { unwrapList, unwrapOne, clinicId } from '@/services/api'
import type { Clinic } from '@/types'

const BRAND_GRADIENT = 'linear-gradient(135deg, #102E63 0%, #1E4FA3 55%, #1FA3A8 100%)'

export function ClinicSelect() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setClinic = useAuthStore((s) => s.setClinic)
  const { clinics, setClinics, isLoading, setLoading } = useClinicStore()

  useEffect(() => {
    setLoading(true)
    clinicService.list()
      .then((res) => setClinics(unwrapList<Clinic>(res.data)))
      .finally(() => setLoading(false))
  }, [])

  const cleanName = (user?.name ?? '').replace(/^Dr\.\s*/i, '') || 'Doctor'
  const initials = cleanName.split(' ').map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()

  const setDoctorId = useAuthStore((s) => s.setDoctorId)

  const handleStart = async (clinic: Clinic) => {
    setClinic(clinic)
    // Resolve the Doctor record for this logged-in user so dashboards can filter by doctorId.
    try {
      const res = await doctorService.me()
      const doc = unwrapOne<{ _id: string }>(res.data)
      if (doc?._id) setDoctorId(String(doc._id))
    } catch {
      // No Doctor record found — dashboard will fall back to clinic-wide stats.
      setDoctorId(null)
    }
    navigate('/', { replace: true })
  }

  return (
    <div style={{ flex: 1, minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#F5F8FC', fontFamily: 'Roboto, system-ui, sans-serif' }}>
      {/* Hero */}
      <div style={{ background: BRAND_GRADIENT, padding: '52px 20px 28px', position: 'relative', overflow: 'hidden', borderRadius: '0 0 28px 28px' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <p style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.85)', letterSpacing: '1.5px', fontWeight: 700, margin: 0 }}>STEP 3 OF 3</p>
          <div style={{ width: 38 }} />
        </div>

        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>{initials || 'D'}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: 0, fontWeight: 500 }}>Welcome back,</p>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', margin: '2px 0 0' }}>Dr. {cleanName}</h1>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', margin: '4px 0 0' }}>
              {user?.specialization || 'General Practice'}
              {user?.mciNumber && ` · ${user.mciNumber}`}
            </p>
          </div>
        </div>
      </div>

      {/* List header */}
      <div style={{ padding: '20px 20px 12px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1E293B', margin: 0 }}>Pick today's clinic</h2>
        <span style={{ fontSize: 12, color: '#1E4FA3', fontWeight: 700 }}>{clinics.length} assigned</span>
      </div>

      {/* Clinic list */}
      <div style={{ flex: 1, padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : clinics.length === 0 ? (
          <p style={{ textAlign: 'center', fontSize: 13, color: '#94A3B8', padding: '40px 0' }}>No clinics linked to your account</p>
        ) : clinics.map((c, i) => <ClinicRow key={clinicId(c)} clinic={c} variant={i} onClick={() => handleStart(c)} />)}

        <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', margin: '12px 0 0', lineHeight: 1.5 }}>
          You can switch clinics any time from the dashboard.
        </p>
      </div>
    </div>
  )
}

function ClinicRow({ clinic, variant, onClick }: { clinic: Clinic; variant: number; onClick: () => void }) {
  // PDF shows three variants: primary (live now, highlighted), afternoon (starts soon), visiting (off today)
  const isPrimary = variant === 0
  const isAfternoon = variant === 1
  const tone = isPrimary
    ? { bg: '#1E4FA3', fg: '#FFFFFF', subFg: 'rgba(255,255,255,0.85)', muted: 'rgba(255,255,255,0.7)', iconBg: 'rgba(255,255,255,0.18)', iconFg: '#FFFFFF', chipBg: 'rgba(255,255,255,0.22)', chipFg: '#FFFFFF', divider: 'rgba(255,255,255,0.25)' }
    : { bg: '#FFFFFF', fg: '#1E293B', subFg: '#64748B', muted: '#94A3B8', iconBg: '#EBF2FF', iconFg: '#1E4FA3', chipBg: '#EBF2FF', chipFg: '#1E4FA3', divider: '#E2E8F0' }
  const statusLabel = isPrimary ? 'PRIMARY' : isAfternoon ? 'AFTERNOON' : 'VISITING'
  const statusSub = isPrimary ? '● Live now' : isAfternoon ? '● Starts in 3h' : 'Off today'
  const queueCount = isPrimary ? 12 : isAfternoon ? 6 : 0

  return (
    <button onClick={onClick} style={{ all: 'unset', cursor: 'pointer', background: tone.bg, borderRadius: 16, padding: 14, boxShadow: isPrimary ? '0 8px 24px rgba(30,79,163,0.28)' : '0 2px 8px rgba(30,79,163,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: tone.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={tone.iconFg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21V10l9-6 9 6v11" /><path d="M9 21v-6h6v6" /><path d="M12 8v4M10 10h4" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: tone.chipFg, background: tone.chipBg, borderRadius: 999, padding: '2px 7px', letterSpacing: '0.5px' }}>{statusLabel}</span>
            <span style={{ fontSize: 10, color: tone.muted, fontWeight: 600 }}>{statusSub}</span>
          </div>
          <p style={{ fontSize: 14, fontWeight: 800, color: tone.fg, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{clinic.name}</p>
          <p style={{ fontSize: 11, color: tone.subFg, margin: '2px 0 0' }}>Room 204 · 09:00 – 13:00</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: tone.fg, margin: 0, lineHeight: 1 }}>{queueCount}</p>
          <p style={{ fontSize: 9, fontWeight: 700, color: tone.muted, letterSpacing: '0.8px', margin: '4px 0 0' }}>IN QUEUE</p>
        </div>
      </div>

      {isPrimary && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${tone.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 12, color: tone.subFg, margin: 0 }}>Next: A-008 · Priya R.</p>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#FFFFFF', fontWeight: 700 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
            avg 12 min
          </span>
        </div>
      )}

      {isPrimary && (
        <div style={{ marginTop: 14 }}>
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#1E4FA3' }}>Start OPD session</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1E4FA3" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </div>
        </div>
      )}
    </button>
  )
}
