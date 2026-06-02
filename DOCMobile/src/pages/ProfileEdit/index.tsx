import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

type Tab = 'doctor' | 'working' | 'experience' | 'about'

export function ProfileEdit() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const clinic = useAuthStore((s) => s.selectedClinic)
  const [tab, setTab] = useState<Tab>('doctor')
  const [accepting, setAccepting] = useState(true)

  const cleanName = (user?.name ?? '').replace(/^Dr\.\s*/i, '') || 'Doctor'
  const initials = cleanName.split(' ').map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
  const completion = profileCompleteness(user)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100%', background: '#F5F8FC' }}>
      {/* Hero */}
      <div style={{ background: BRAND_GRADIENT, padding: '52px 20px 26px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 700, margin: 0 }}>Create profile</p>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', margin: '4px 0 0' }}>My profile</h1>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#FFFFFF', background: 'rgba(34,197,94,0.25)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 999, padding: '6px 10px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
            {completion}% COMPLETE
          </span>
        </div>

        {/* Identity */}
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#1E4FA3' }}>{initials}</span>
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: '50%', background: '#1E4FA3', border: '2px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Dr. {cleanName}</h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', margin: '2px 0 0' }}>{user?.specialization || 'Specialization'}</p>
            {clinic && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', margin: '2px 0 0' }}>📍 {clinic.name}</p>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '14px 16px 0', overflowX: 'auto' }} className="scrollbar-hide">
        {(['doctor', 'working', 'experience', 'about'] as Tab[]).map((t) => {
          const active = tab === t
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              flexShrink: 0, padding: '8px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: active ? BRAND_GRADIENT : '#FFFFFF',
              color: active ? '#FFFFFF' : '#475569',
              fontSize: 12, fontWeight: 700,
              boxShadow: '0 2px 6px rgba(30,79,163,0.06)',
            }}>{tabLabel(t)}</button>
          )
        })}
      </div>

      <div style={{ padding: '14px 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tab === 'doctor' && (
          <>
            {/* Accepting patients */}
            <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(30,79,163,0.06)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 12 7 12 9 6 11 18 13 10 15 14 17 12 21 12" /></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: 0 }}>Accepting patients</p>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>Tokens flow automatically to your queue</p>
              </div>
              <Toggle on={accepting} onChange={setAccepting} />
            </div>

            <SectionCard title="Credentials" badge="Current">
              <KV label="Registration" value={user?.mciNumber || 'NMC-…'} />
              <KV label="Qualifications" value="MBBS, MD" />
              <KV label="Super-specialty" value={user?.specialization || '—'} />
              <KV label="Council" value="Medical Council" last />
            </SectionCard>

            <SectionCard title="Doctor info" editable>
              <KV label="Full name" value={`Dr. ${cleanName}`} />
              <KV label="Mobile" value={user?.phone ? `+91 ${user.phone}` : '—'} hint="read-only" />
              <KV label="Email" value={user?.email || '—'} last />
            </SectionCard>

            <SectionCard title="Clinic info" editable>
              <KV label="Clinic name" value={clinic?.name || '—'} />
              <KV label="Address" value={clinic?.address || '—'} last />
            </SectionCard>
          </>
        )}

        {tab === 'working' && <Placeholder text="Working hours per clinic" />}
        {tab === 'experience' && <Placeholder text="Past roles and tenure" />}
        {tab === 'about' && <Placeholder text="Bio, languages, special interests" />}
      </div>
    </motion.div>
  )
}

function tabLabel(t: Tab) {
  return t === 'doctor' ? 'Doctor info' : t === 'working' ? 'Working time' : t === 'experience' ? 'Experience' : 'About'
}

function profileCompleteness(u: { name?: string; email?: string; phone?: string; specialization?: string; mciNumber?: string; avatarUrl?: string; dob?: string; gender?: string } | null): number {
  if (!u) return 0
  const fields = [u.name, u.email, u.phone, u.specialization, u.mciNumber, u.avatarUrl, u.dob, u.gender]
  return Math.round(fields.filter((v) => v && String(v).trim().length > 0).length / fields.length * 100)
}

function SectionCard({ title, badge, editable, children }: { title: string; badge?: string; editable?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 14, boxShadow: '0 2px 8px rgba(30,79,163,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <p style={{ fontSize: 10, fontWeight: 800, color: '#1E4FA3', letterSpacing: '1px', margin: 0, textTransform: 'uppercase' }}>{title}</p>
        {badge && (
          <span style={{ fontSize: 10, fontWeight: 700, color: '#059669', background: '#D1FAE5', borderRadius: 999, padding: '3px 8px' }}>{badge}</span>
        )}
        {editable && (
          <button style={{ fontSize: 11, fontWeight: 700, color: '#1E4FA3', background: '#EBF2FF', border: 'none', borderRadius: 999, padding: '5px 10px', cursor: 'pointer' }}>
            ✎ Edit
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function KV({ label, value, hint, last }: { label: string; value: string; hint?: string; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8px 0', borderBottom: last ? 'none' : '1px solid #F1F5F9', gap: 12 }}>
      <span style={{ fontSize: 12, color: '#64748B' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>
        {value}{hint && <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500, marginLeft: 6 }}>· {hint}</span>}
      </span>
    </div>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      width: 44, height: 26, borderRadius: 999, border: 'none', cursor: 'pointer',
      background: on ? '#1E4FA3' : '#CBD5E1',
      padding: 3, display: 'flex', alignItems: 'center',
      justifyContent: on ? 'flex-end' : 'flex-start',
      transition: 'all 0.2s',
    }}>
      <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </button>
  )
}

function Placeholder({ text }: { text: string }) {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 24, textAlign: 'center', boxShadow: '0 2px 8px rgba(30,79,163,0.06)' }}>
      <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>{text}</p>
      <p style={{ fontSize: 11, color: '#CBD5E1', margin: '4px 0 0' }}>Coming soon</p>
    </div>
  )
}
