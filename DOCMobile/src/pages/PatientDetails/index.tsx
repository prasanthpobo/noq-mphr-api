import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePatientStore } from '@/stores/patientStore'
import { useAuthStore } from '@/stores/authStore'
import { patientService } from '@/services/patientService'
import { historyService } from '@/services/historyService'
import { unwrapOne, unwrapList, clinicId } from '@/services/api'
import { calcAge, formatDate } from '@/utils/formatters'
import type { Patient, Consultation } from '@/types'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

type Tab = 'details' | 'history'

export function PatientDetails() {
  const navigate = useNavigate()
  const { id } = useParams()
  const stored = usePatientStore((s) => s.selectedPatient)
  const clinic = useAuthStore((s) => s.selectedClinic)
  const [patient, setPatient] = useState<Patient | null>(stored && stored.id === id ? stored : null)
  const [history, setHistory] = useState<Consultation[]>([])
  const [tab, setTab] = useState<Tab>('details')

  useEffect(() => {
    if (!patient && id) {
      patientService.get(id).then((res) => setPatient(unwrapOne<Patient>(res.data)))
    }
  }, [id])

  useEffect(() => {
    const cid = clinicId(clinic)
    if (!cid || !id) return
    historyService.list(cid, id).then((res) => setHistory(unwrapList<Consultation>(res.data)))
  }, [clinic?.id, id])

  if (!patient) {
    return (
      <div style={{ minHeight: '100%', background: '#F5F8FC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 13, color: '#94A3B8' }}>Loading patient…</p>
      </div>
    )
  }

  const initials = patient.name.split(' ').map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100%', background: '#F5F8FC', paddingBottom: 90 }}>
      {/* Hero */}
      <div style={{ background: BRAND_GRADIENT, padding: '52px 20px 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 700, margin: 0 }}>Patient record</p>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', margin: '4px 0 0' }}>{patient.name}</h1>
          </div>
        </div>
      </div>

      {/* Patient card overlapping */}
      <div style={{ position: 'relative', zIndex: 2, margin: '-44px 16px 0', background: '#FFFFFF', borderRadius: 16, padding: 14, boxShadow: '0 6px 20px rgba(30,79,163,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#EC4899', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>{initials}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#1E293B', margin: 0 }}>{patient.name}</p>
            <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>
              {calcAge(patient.dob)}{patient.gender?.[0]?.toUpperCase()} · Blood {patient.bloodGroup ?? '—'}
            </p>
            <p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0' }}>📞 {patient.phone}</p>
          </div>
        </div>
        {patient.address && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #E2E8F0' }}>
            <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>📍 {patient.address}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '14px 16px 0' }}>
        {(['details', 'history'] as Tab[]).map((t) => {
          const active = tab === t
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: active ? BRAND_GRADIENT : '#FFFFFF',
              color: active ? '#FFFFFF' : '#475569',
              fontSize: 12, fontWeight: 700,
              boxShadow: '0 2px 6px rgba(30,79,163,0.06)',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              {t === 'details' ? 'Details' : `Appointment history · ${history.length}`}
            </button>
          )
        })}
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tab === 'details' ? (
          <>
            <Section title="Personal info">
              <KV label="Full name" value={patient.name} />
              <KV label="Age / Gender" value={`${calcAge(patient.dob)}${patient.gender?.[0]?.toUpperCase() ?? ''}`} />
              <KV label="Blood group" value={patient.bloodGroup ?? '—'} />
              <KV label="Mobile" value={patient.phone} />
              <KV label="Address" value={patient.address ?? '—'} last />
            </Section>
            <Section title="Medical info">
              <p style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 6px' }}>Allergies</p>
              <Pill tone="warn">⚠ None recorded</Pill>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '14px 0 6px' }}>Chronic conditions</p>
              <Pill tone="info">None recorded</Pill>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '14px 0 6px' }}>Clinical notes</p>
              <p style={{ fontSize: 13, color: '#1E293B', margin: 0, lineHeight: 1.5 }}>
                {history[0]?.notes || 'No notes yet.'}
              </p>
            </Section>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.length === 0 ? (
              <p style={{ textAlign: 'center', fontSize: 13, color: '#94A3B8', padding: '20px 0' }}>No past visits</p>
            ) : history.map((c) => (
              <button key={c.id} onClick={() => navigate(`/history/${c.id}`)}
                style={{ all: 'unset', cursor: 'pointer', background: '#FFFFFF', borderRadius: 14, padding: 12, boxShadow: '0 2px 8px rgba(30,79,163,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', margin: 0 }}>{formatDate(c.createdAt)}</p>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#1E4FA3', background: '#EBF2FF', borderRadius: 999, padding: '3px 8px' }}>{c.rxLines.length} Rx</span>
                </div>
                {c.diagnosis && <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0' }}>{c.diagnosis}</p>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, padding: '10px 16px', zIndex: 40 }}>
        <button onClick={() => navigate('/consultation', { state: { patientId: patient.id } })}
          style={{ width: '100%', padding: 14, borderRadius: 14, background: BRAND_GRADIENT, color: '#FFFFFF', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          🩺 Start new consultation
        </button>
      </div>
    </motion.div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 14, boxShadow: '0 2px 8px rgba(30,79,163,0.06)' }}>
      <p style={{ fontSize: 10, fontWeight: 800, color: '#1E4FA3', letterSpacing: '1px', margin: '0 0 10px', textTransform: 'uppercase' }}>{title}</p>
      {children}
    </div>
  )
}

function KV({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8px 0', borderBottom: last ? 'none' : '1px solid #F1F5F9', gap: 12 }}>
      <span style={{ fontSize: 12, color: '#64748B' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word', textTransform: label === 'Gender' || label === 'Age / Gender' ? 'capitalize' : undefined }}>{value}</span>
    </div>
  )
}

function Pill({ tone, children }: { tone: 'warn' | 'info'; children: React.ReactNode }) {
  const styles = tone === 'warn'
    ? { bg: '#FEF2F2', fg: '#DC2626' }
    : { bg: '#EBF2FF', fg: '#1E4FA3' }
  return (
    <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, background: styles.bg, color: styles.fg, borderRadius: 999, padding: '4px 10px' }}>{children}</span>
  )
}
