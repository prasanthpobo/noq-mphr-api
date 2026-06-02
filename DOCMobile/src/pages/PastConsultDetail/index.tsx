import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useHistoryStore } from '@/stores/historyStore'
import { historyService } from '@/services/historyService'
import { unwrapOne } from '@/services/api'
import { usePrint } from '@/hooks/usePrint'
import type { Consultation } from '@/types'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

type Tab = 'summary' | 'vitals' | 'assessment' | 'rx' | 'follow'

export function PastConsultDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const stored = useHistoryStore((s) => s.selectedConsult)
  const [consult, setConsult] = useState<Consultation | null>(stored && stored.id === id ? stored : null)
  const [tab, setTab] = useState<Tab>('summary')
  const { print } = usePrint('rx-print-area')

  useEffect(() => {
    if (consult || !id) return
    historyService.get(id).then((res) => setConsult(unwrapOne<Consultation>(res.data)))
  }, [id])

  if (!consult) {
    return (
      <div style={{ minHeight: '100%', background: '#F5F8FC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 13, color: '#94A3B8' }}>Loading consultation…</p>
      </div>
    )
  }

  const date = new Date(consult.createdAt)
  const dayLabel = formatDay(date)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100%', background: '#F5F8FC', paddingBottom: 100 }}>
      {/* Hero */}
      <div style={{ background: BRAND_GRADIENT, padding: '52px 20px 26px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 700, margin: 0 }}>Consultation record</p>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', margin: '4px 0 0' }}>{dayLabel}</h1>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#FFFFFF', background: 'rgba(34,197,94,0.25)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 999, padding: '5px 10px' }}>
            ✓ COMPLETED
          </span>
        </div>

        {/* Patient card */}
        <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.2)' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF' }}>A-{(consult.id.slice(-3) || '022').toUpperCase()}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>{consult.patientName}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', margin: '2px 0 0' }}>{consult.diagnosis || 'Consult'}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700, margin: 0 }}>Duration</p>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF', margin: '2px 0 0' }}>⏱ ~14 min</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '14px 16px 0', overflowX: 'auto' }} className="scrollbar-hide">
        {(['summary', 'vitals', 'assessment', 'rx', 'follow'] as Tab[]).map((t) => {
          const active = tab === t
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              flexShrink: 0, padding: '8px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: active ? BRAND_GRADIENT : '#FFFFFF',
              color: active ? '#FFFFFF' : '#475569',
              fontSize: 12, fontWeight: 700,
              boxShadow: '0 2px 6px rgba(30,79,163,0.06)',
            }}>
              {tabLabel(t)}{t === 'rx' && consult.rxLines.length > 0 ? ` · ${consult.rxLines.length}` : ''}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tab === 'summary' && (
          <>
            <Section title="Clinical notes">
              <p style={{ fontSize: 13, color: '#1E293B', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{consult.notes || '—'}</p>
            </Section>
            <Section title="Diagnosis">
              <p style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: 0 }}>{consult.diagnosis || '—'}</p>
              {consult.complaints && <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0' }}>Chief complaint · {consult.complaints}</p>}
            </Section>
          </>
        )}
        {tab === 'vitals' && (
          <Section title="Vital signs">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <VitalCell label="BP" value={consult.vitals?.bp} unit="mmHg" />
              <VitalCell label="Pulse" value={consult.vitals?.pulse} unit="bpm" />
              <VitalCell label="Temperature" value={consult.vitals?.temp} unit="°C" />
              <VitalCell label="SpO₂" value={consult.vitals?.spo2} unit="%" />
              <VitalCell label="Weight" value={consult.vitals?.weight} unit="kg" />
              <VitalCell label="Height" value={consult.vitals?.height} unit="cm" />
            </div>
          </Section>
        )}
        {tab === 'assessment' && (
          <Section title="Assessment">
            <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 4px' }}>Chief complaint</p>
            <p style={{ fontSize: 13, color: '#1E293B', margin: 0 }}>{consult.complaints || '—'}</p>
            <p style={{ fontSize: 12, color: '#64748B', margin: '12px 0 4px' }}>Working diagnosis</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', margin: 0 }}>{consult.diagnosis || '—'}</p>
          </Section>
        )}
        {tab === 'rx' && (
          <div id="rx-print-area">
            <Section title={`Prescription · ${consult.rxLines.length}`}>
              {consult.rxLines.length === 0 ? (
                <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>No prescription written.</p>
              ) : consult.rxLines.map((line, i) => (
                <div key={line.id} style={{ background: '#F8FAFC', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', margin: 0 }}>{i + 1}. {line.medicine}</p>
                  <p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0' }}>{[line.dose, line.frequency, line.duration].filter(Boolean).join(' · ')}</p>
                </div>
              ))}
            </Section>
          </div>
        )}
        {tab === 'follow' && (
          <Section title="Follow-up advice">
            <p style={{ fontSize: 13, color: '#1E293B', margin: 0, lineHeight: 1.5 }}>{consult.notes || 'No specific advice recorded.'}</p>
          </Section>
        )}
      </div>

      {/* Footer */}
      <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, padding: '10px 16px', display: 'flex', gap: 8, zIndex: 40 }}>
        <button onClick={print} style={iconActionStyle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E4FA3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
        </button>
        <button style={iconActionStyle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E4FA3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>
        </button>
        <button style={{ flex: 1, padding: 14, borderRadius: 14, background: BRAND_GRADIENT, color: '#FFFFFF', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          ⬆ Share with patient
        </button>
      </div>
    </motion.div>
  )
}

const iconActionStyle: React.CSSProperties = { width: 48, height: 48, borderRadius: 14, background: '#FFFFFF', border: '1.5px solid #DBE7F8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }

function tabLabel(t: Tab) {
  return t === 'summary' ? 'Summary' : t === 'vitals' ? 'Vitals' : t === 'assessment' ? 'Assessment' : t === 'rx' ? 'Rx' : 'Follow'
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 14, boxShadow: '0 2px 8px rgba(30,79,163,0.06)' }}>
      <p style={{ fontSize: 10, fontWeight: 800, color: '#1E4FA3', letterSpacing: '1px', margin: '0 0 8px', textTransform: 'uppercase' }}>{title}</p>
      {children}
    </div>
  )
}

function VitalCell({ label, value, unit }: { label: string; value?: string | number; unit: string }) {
  return (
    <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 10 }}>
      <p style={{ fontSize: 10, color: '#64748B', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</p>
      <p style={{ fontSize: 16, fontWeight: 800, color: '#1E293B', margin: '4px 0 0' }}>
        {value ?? '—'}<span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, marginLeft: 4 }}>{unit}</span>
      </p>
    </div>
  )
}

function formatDay(d: Date) {
  const now = new Date()
  const diff = Math.round((now.setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400000)
  const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  if (diff === 0) return `Today · ${dateStr}`
  if (diff === 1) return `Yesterday · ${dateStr}`
  return dateStr
}
