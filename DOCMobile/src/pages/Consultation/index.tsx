import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useConsultationStore } from '@/stores/consultationStore'
import { consultationService } from '@/services/consultationService'
import { useAuthStore } from '@/stores/authStore'
import { clinicId } from '@/services/api'
import type { Appointment, RxLine } from '@/types'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

type Tab = 'phr' | 'vitals' | 'assessment' | 'summary' | 'rx' | 'followup'
const TAB_ORDER: Tab[] = ['phr', 'vitals', 'assessment', 'summary', 'rx', 'followup']

const TAB_LABEL: Record<Tab, string> = {
  phr:        'PHR',
  vitals:     'Vitals',
  assessment: 'Assessment',
  summary:    'Doctor Summary',
  rx:         'Rx Pad',
  followup:   'Follow-up',
}

export function Consultation() {
  const navigate = useNavigate()
  const location = useLocation()
  const appt = (location.state as { appointment?: Appointment } | null)?.appointment ?? null
  const clinic = useAuthStore((s) => s.selectedClinic)
  const user = useAuthStore((s) => s.user)
  const { vitals, notes, rxLines, setVitals, setNotes, addRxLine, updateRxLine, removeRxLine, clearConsultation } = useConsultationStore()

  const [tab, setTab] = useState<Tab>('phr')
  const [elapsed, setElapsed] = useState(0)

  // Local fields not yet in the store
  const [complaints, setComplaints]       = useState(appt?.notes ?? '')
  const [diagnosis, setDiagnosis]         = useState('')
  const [observations, setObservations]   = useState('')
  const [advice, setAdvice]               = useState('')
  const [followupDate, setFollowupDate]   = useState<string>('')
  const [followupNotes, setFollowupNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Raw string mirrors for numeric vitals so the user can type "12." or clear the field
  // without ever seeing "NaN" — only finite numbers ever reach the store.
  const [tempStr, setTempStr]     = useState(vitals?.temp   != null ? String(vitals.temp)   : '')
  const [pulseStr, setPulseStr]   = useState(vitals?.pulse  != null ? String(vitals.pulse)  : '')
  const [weightStr, setWeightStr] = useState(vitals?.weight != null ? String(vitals.weight) : '')
  const [spo2Str, setSpo2Str]     = useState(vitals?.spo2   != null ? String(vitals.spo2)   : '')

  const writeNumeric = (
    raw: string,
    setStr: (v: string) => void,
    commit: (n: number | undefined) => void,
    allowDecimal: boolean,
  ) => {
    const filtered = raw.replace(allowDecimal ? /[^0-9.]/g : /[^0-9]/g, '')
    // Collapse multiple dots: keep only the first one
    const cleaned = allowDecimal ? filtered.replace(/(\..*?)\./g, '$1') : filtered
    setStr(cleaned)
    const n = parseFloat(cleaned)
    commit(Number.isFinite(n) ? n : undefined)
  }

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const completed: Record<Tab, boolean> = {
    phr:        true, // read-only reference data
    vitals:     !!(vitals?.bp || vitals?.pulse || vitals?.temp),
    assessment: complaints.length > 0 || diagnosis.length > 0 || observations.length > 0,
    summary:    notes.length > 0 || advice.length > 0,
    rx:         rxLines.some((r) => r.medicine),
    followup:   !!followupDate || followupNotes.length > 0,
  }

  const goNext = (current: Tab) => {
    const next = TAB_ORDER[TAB_ORDER.indexOf(current) + 1]
    if (next) setTab(next)
  }

  const setFollowupRelative = (days: number) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    setFollowupDate(d.toISOString().slice(0, 10))
  }

  const onComplete = async (status: 'draft' | 'complete') => {
    if (!appt || !clinic || !user) { navigate('/appointments'); return }
    setSaving(true)
    try {
      const combinedNotes = [
        notes.trim(),
        observations.trim() && `Observations: ${observations.trim()}`,
        advice.trim() && `Advice: ${advice.trim()}`,
        followupDate && `Follow-up: ${followupDate}`,
        followupNotes.trim() && `Follow-up notes: ${followupNotes.trim()}`,
      ].filter(Boolean).join('\n\n')

      const payload = {
        patientId: appt.patientId,
        patientName: appt.patientName,
        doctorId: user.id,
        clinicId: clinicId(clinic),
        appointmentId: appt.id,
        vitals: vitals ?? undefined,
        complaints,
        diagnosis,
        notes: combinedNotes,
        rxLines,
        status: status === 'complete' ? ('completed' as const) : ('active' as const),
      }
      const res = await consultationService.create(payload)
      if (status === 'complete' && res.data?.id) {
        await consultationService.complete(res.data.id)
      }
      clearConsultation()
      navigate(status === 'complete' ? '/appointments' : '/history')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100%', background: '#F5F8FC', paddingBottom: 160 }}>
      {/* Hero */}
      <div style={{
        background: BRAND_GRADIENT,
        padding: '48px 16px 18px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '0 0 24px 24px',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
          <button onClick={() => navigate(-1)} aria-label="Back" style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <h1 style={{ flex: 1, fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '0.3px', textAlign: 'center' }}>
            Consultation
          </h1>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.18)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 999, padding: '6px 12px', height: 38, boxSizing: 'border-box' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
            <span style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.5px' }}>{formatTimer(elapsed)}</span>
          </div>
        </div>
      </div>

      {/* Patient pill */}
      {appt && (
        <div style={{ margin: '12px 16px 0', background: '#FFFFFF', borderRadius: 14, padding: 12, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(30,79,163,0.06)' }}>
          <div style={{ minWidth: 56, padding: '6px 8px', borderRadius: 8, background: '#EBF2FF', textAlign: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#1E4FA3' }}>A-{String(appt.token).padStart(3, '0')}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', margin: 0 }}>{appt.patientName}</p>
            <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>{appt.notes || 'Consult'}</p>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#059669', background: '#D1FAE5', borderRadius: 999, padding: '3px 8px' }}>● IN PROGRESS</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, margin: '14px 16px 0', overflowX: 'auto' }} className="scrollbar-hide">
        {TAB_ORDER.map((t) => {
          const active = tab === t
          const done = completed[t]
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: active ? BRAND_GRADIENT : '#FFFFFF',
              color: active ? '#FFFFFF' : '#475569',
              fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(30,79,163,0.06)',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              {done && <span style={{ color: active ? '#FFFFFF' : '#22C55E' }}>✓</span>}
              {TAB_LABEL[t]}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div style={{ margin: '14px 16px 0' }}>
        {tab === 'phr' && (
          <PhrTab
            patientName={appt?.patientName ?? 'Patient'}
            onContinue={() => goNext('phr')}
          />
        )}

        {tab === 'vitals' && (
          <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 14, boxShadow: '0 2px 8px rgba(30,79,163,0.06)' }}>
            <p style={sectionTitle}>VITAL SIGNS</p>
            <VitalRow
              label="BLOOD PRESSURE"
              unit="mmHg"
              placeholder="120/80"
              value={vitals?.bp ?? ''}
              onChange={(v) => setVitals({ ...vitals, bp: v })}
              error={validateBP(vitals?.bp ?? '')}
              inputMode="numeric"
            />
            <VitalRow
              label="TEMPERATURE" unit="°F" placeholder="98.6" inputMode="decimal"
              value={tempStr}
              onChange={(v) => writeNumeric(v, setTempStr, (n) => setVitals({ ...vitals, temp: n }), true)}
              error={validateTemp(tempStr)}
            />
            <VitalRow
              label="PULSE" unit="bpm" placeholder="72" inputMode="numeric"
              value={pulseStr}
              onChange={(v) => writeNumeric(v, setPulseStr, (n) => setVitals({ ...vitals, pulse: n }), false)}
              error={validatePulse(pulseStr)}
            />
            <VitalRow
              label="WEIGHT" unit="kg" placeholder="70" inputMode="decimal"
              value={weightStr}
              onChange={(v) => writeNumeric(v, setWeightStr, (n) => setVitals({ ...vitals, weight: n }), true)}
              error={validateWeight(weightStr)}
            />
            <VitalRow
              label="SPO₂" unit="%" placeholder="98" inputMode="numeric"
              value={spo2Str}
              onChange={(v) => writeNumeric(v, setSpo2Str, (n) => setVitals({ ...vitals, spo2: n }), false)}
              error={validateSpo2(spo2Str)}
              last
            />
            <ContinueButton label="Save & continue to Assessment" onClick={() => goNext('vitals')} />
          </div>
        )}

        {tab === 'assessment' && (
          <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 14, boxShadow: '0 2px 8px rgba(30,79,163,0.06)' }}>
            <p style={sectionTitle}>CLINICAL ASSESSMENT</p>
            <SubLabel>Chief complaint</SubLabel>
            <textarea rows={2} value={complaints} onChange={(e) => setComplaints(e.target.value)} placeholder="e.g. Chest tightness on exertion · 3 days" style={textareaStyle} />

            <SubLabel style={{ marginTop: 14 }}>Diagnosis</SubLabel>
            <input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Stable angina · suspected" style={inputStyle} />

            <SubLabel style={{ marginTop: 14 }}>Observations</SubLabel>
            <textarea rows={3} value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="On-exam findings" style={textareaStyle} />

            <ContinueButton label="Save & continue to Summary" onClick={() => goNext('assessment')} />
          </div>
        )}

        {tab === 'summary' && (
          <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 14, boxShadow: '0 2px 8px rgba(30,79,163,0.06)' }}>
            <p style={sectionTitle}>DOCTOR SUMMARY</p>
            <SubLabel>Clinical notes</SubLabel>
            <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="History, examination, plan" style={textareaStyle} />

            <SubLabel style={{ marginTop: 14 }}>Advice / instructions</SubLabel>
            <textarea rows={3} value={advice} onChange={(e) => setAdvice(e.target.value)} placeholder="Lifestyle advice, red flags, when to return" style={textareaStyle} />

            <ContinueButton label="Save & continue to Rx Pad" onClick={() => goNext('summary')} />
          </div>
        )}

        {tab === 'rx' && (
          <RxPad
            lines={rxLines}
            onAdd={(line) => { addRxLine(); /* fill the freshly-added line */ updateRxLine(rxLines.length, line) }}
            onUpdate={updateRxLine}
            onRemove={removeRxLine}
            onContinue={() => goNext('rx')}
          />
        )}

        {tab === 'followup' && (
          <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 14, boxShadow: '0 2px 8px rgba(30,79,163,0.06)' }}>
            <p style={sectionTitle}>FOLLOW-UP</p>
            <SubLabel>Next visit date</SubLabel>
            <input
              type="date"
              value={followupDate}
              onChange={(e) => setFollowupDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              style={inputStyle}
            />

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {([
                { label: '1 week',   days: 7 },
                { label: '2 weeks',  days: 14 },
                { label: '1 month',  days: 30 },
                { label: '3 months', days: 90 },
              ] as const).map((q) => (
                <button key={q.label} type="button" onClick={() => setFollowupRelative(q.days)} style={{
                  padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
                  border: '1.5px solid #E3EAF2', background: '#FFFFFF',
                  color: '#475569', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                }}>{q.label}</button>
              ))}
            </div>

            <SubLabel style={{ marginTop: 14 }}>Follow-up notes</SubLabel>
            <textarea rows={3} value={followupNotes} onChange={(e) => setFollowupNotes(e.target.value)} placeholder="e.g. Bring stress-test report and updated BP log." style={textareaStyle} />

            <ContinueButton label="Save" onClick={() => onComplete('draft')} />
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div style={{
        position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430, padding: '10px 16px',
        display: 'flex', gap: 10, zIndex: 40,
        background: 'linear-gradient(to top, rgba(245,248,252,1) 70%, rgba(245,248,252,0))',
      }}>
        <button onClick={() => onComplete('draft')} disabled={saving} style={footerBtnSecondary}>
          Save draft
        </button>
        <button onClick={() => onComplete('complete')} disabled={saving} style={footerBtnPrimary}>
          <span style={{ whiteSpace: 'nowrap' }}>Complete</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </button>
      </div>
    </motion.div>
  )
}

// ─── Patient PHR tab ─────────────────────────────────────────────────────

// TODO: replace with `/api/patients/:id/phr` once the endpoint is live.
const MOCK_PHR = {
  metrics: {
    heartRate: { value: 68,    unit: 'bpm',    label: 'Heart Rate', tone: 'rose'  as const, hint: 'Resting' },
    sleep:     { value: '7h 45m', unit: '',    label: 'Sleep',      tone: 'indigo' as const, hint: 'Optimal' },
    activity:  { value: 'Low',  unit: '',      label: 'Activity',   tone: 'amber' as const, hint: 'Today' },
    steps:     { value: 5820,   unit: 'steps', label: 'Steps',      tone: 'emerald' as const, hint: 'Goal 10k' },
  },
  insights: [
    { icon: '🌙', text: 'Sleep quality: Excellent. Keep up the good rest!' },
    { icon: '🧘', text: 'Suggested: Try a 20-minute meditation today.' },
    { icon: '💧', text: 'Hydration steady — 6/8 glasses logged this week.' },
  ],
  devices: [
    { name: 'Smartwatch',   status: 'Synced',  icon: 'watch'  as const },
    { name: 'Fitness Band', status: 'Synced',  icon: 'band'   as const },
    { name: 'Smart Scale',  status: 'Linked',  icon: 'scale'  as const },
    { name: 'Earbuds',      status: 'Linked',  icon: 'earbud' as const },
  ],
  trend: {
    // 7-day series for the dual line chart
    heart:    [62, 64, 70, 66, 72, 68, 71],
    activity: [40, 55, 48, 60, 50, 58, 52],
    labels:   ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
}

function PhrTab({ patientName, onContinue }: { patientName: string; onContinue: () => void }) {
  const { metrics, insights, devices, trend } = MOCK_PHR
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Hero / greeting */}
      <div style={{
        background: 'linear-gradient(135deg, #102E63 0%, #1E4FA3 60%, #0F766E 100%)',
        borderRadius: 18, padding: 16, color: '#FFFFFF',
        boxShadow: '0 8px 24px rgba(15,46,99,0.25)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" /><path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>AI Health Dashboard</p>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: '2px 0 0' }}>{patientName}'s last 7 days</h2>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#A7F3D0', background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 999, padding: '4px 10px' }}>● LIVE</span>
      </div>

      {/* 4 metric circles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <MetricCircle {...metrics.heartRate} icon="heart" />
        <MetricCircle {...metrics.sleep}     icon="moon"  />
        <MetricCircle {...metrics.activity}  icon="wave"  />
        <MetricCircle {...metrics.steps}     icon="shoe"  />
      </div>

      {/* AI Insights */}
      <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 14, boxShadow: '0 2px 8px rgba(30,79,163,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: '#1E293B', margin: 0 }}>Health Insights</h3>
          <span style={{ fontSize: 9, fontWeight: 800, color: '#1E4FA3', background: '#EBF2FF', borderRadius: 999, padding: '3px 8px', letterSpacing: '0.4px' }}>AI</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {insights.map((i, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#F8FAFC', borderRadius: 10, padding: '8px 10px' }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{i.icon}</span>
              <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.5 }}>{i.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Synced devices */}
      <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 14, boxShadow: '0 2px 8px rgba(30,79,163,0.06)' }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, color: '#1E293B', margin: '0 0 10px' }}>Synced Devices</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {devices.map((d) => <DeviceTile key={d.name} {...d} />)}
        </div>
      </div>

      {/* Activity & Heart trend */}
      <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 14, boxShadow: '0 2px 8px rgba(30,79,163,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: '#1E293B', margin: 0 }}>Activity &amp; Heart Trends</h3>
          <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>7-day</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4, marginBottom: 8 }}>
          <Legend color="#EF4444" label="Heart rate" />
          <Legend color="#1E4FA3" label="Activity" />
        </div>
        <TrendChart heart={trend.heart} activity={trend.activity} labels={trend.labels} />
      </div>

      <ContinueButton label="Continue to Vitals" onClick={onContinue} />
    </div>
  )
}

const METRIC_TONES = {
  rose:    { ring: '#EF4444', bg: '#FEE2E2', fg: '#B91C1C' },
  indigo:  { ring: '#6366F1', bg: '#E0E7FF', fg: '#3730A3' },
  amber:   { ring: '#F59E0B', bg: '#FEF3C7', fg: '#92400E' },
  emerald: { ring: '#10B981', bg: '#D1FAE5', fg: '#065F46' },
}

function MetricCircle({
  value, unit, label, tone, hint, icon,
}: {
  value: string | number; unit: string; label: string;
  tone: keyof typeof METRIC_TONES; hint?: string;
  icon: 'heart' | 'moon' | 'wave' | 'shoe';
}) {
  const t = METRIC_TONES[tone]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        width: '100%', aspectRatio: '1 / 1', maxWidth: 80,
        borderRadius: '50%',
        background: t.bg,
        border: `2px solid ${t.ring}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 4,
      }}>
        <MetricIcon kind={icon} color={t.fg} />
        <p style={{ fontSize: 12, fontWeight: 800, color: t.fg, margin: '2px 0 0', lineHeight: 1, textAlign: 'center' }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {unit && <p style={{ fontSize: 7, color: t.fg, opacity: 0.75, margin: '1px 0 0', fontWeight: 700 }}>{unit}</p>}
      </div>
      <p style={{ fontSize: 9, fontWeight: 800, color: '#64748B', margin: 0, letterSpacing: '0.4px', textAlign: 'center' }}>{label.toUpperCase()}</p>
      {hint && <p style={{ fontSize: 8, color: '#94A3B8', margin: 0, fontWeight: 600 }}>{hint}</p>}
    </div>
  )
}

function MetricIcon({ kind, color }: { kind: 'heart' | 'moon' | 'wave' | 'shoe'; color: string }) {
  const common = { fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (kind === 'heart')
    return <svg width="14" height="14" viewBox="0 0 24 24" {...common}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
  if (kind === 'moon')
    return <svg width="14" height="14" viewBox="0 0 24 24" {...common}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
  if (kind === 'wave')
    return <svg width="14" height="14" viewBox="0 0 24 24" {...common}><polyline points="3 12 7 12 9 6 11 18 13 10 15 14 17 12 21 12" /></svg>
  return <svg width="14" height="14" viewBox="0 0 24 24" {...common}><path d="M3 12a4 4 0 014-4h4l2 3h6a3 3 0 013 3v3H3z" /><line x1="3" y1="17" x2="3" y2="20" /><line x1="21" y1="17" x2="21" y2="20" /></svg>
}

function DeviceTile({ name, status, icon }: { name: string; status: string; icon: 'watch' | 'band' | 'scale' | 'earbud' }) {
  const synced = /sync|linked/i.test(status)
  return (
    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <DeviceIcon kind={icon} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#1E293B', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</p>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.4px',
          color: synced ? '#059669' : '#64748B',
          background: synced ? '#D1FAE5' : '#E2E8F0',
          borderRadius: 999, padding: '2px 7px',
          display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 3,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: synced ? '#22C55E' : '#94A3B8' }} />
          {status.toUpperCase()}
        </span>
      </div>
    </div>
  )
}

function DeviceIcon({ kind }: { kind: 'watch' | 'band' | 'scale' | 'earbud' }) {
  const common = { fill: 'none', stroke: '#1E4FA3', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (kind === 'watch')
    return <svg width="18" height="18" viewBox="0 0 24 24" {...common}><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9 6V3h6v3M9 18v3h6v-3" /></svg>
  if (kind === 'band')
    return <svg width="18" height="18" viewBox="0 0 24 24" {...common}><rect x="3" y="9" width="18" height="6" rx="2" /><line x1="9" y1="12" x2="15" y2="12" /></svg>
  if (kind === 'scale')
    return <svg width="18" height="18" viewBox="0 0 24 24" {...common}><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M9 16l3-6 3 6" /></svg>
  return <svg width="18" height="18" viewBox="0 0 24 24" {...common}><circle cx="7" cy="14" r="3" /><circle cx="17" cy="14" r="3" /><path d="M4 14V9a8 8 0 0116 0v5" /></svg>
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#475569', fontWeight: 600 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      {label}
    </span>
  )
}

function TrendChart({ heart, activity, labels }: { heart: number[]; activity: number[]; labels: string[] }) {
  const W = 300, H = 110, P = 8
  const max = Math.max(...heart, ...activity, 80)
  const min = Math.min(...heart, ...activity, 30)
  const scaleX = (i: number) => P + (i * (W - 2 * P)) / (Math.max(heart.length, activity.length) - 1)
  const scaleY = (v: number) => H - P - ((v - min) / Math.max(1, max - min)) * (H - 2 * P)
  const toPath = (arr: number[]) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(v)}`).join(' ')
  return (
    <div style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block' }}>
        {/* baseline grid */}
        {[0, 0.5, 1].map((g) => (
          <line key={g} x1={P} x2={W - P} y1={P + g * (H - 2 * P)} y2={P + g * (H - 2 * P)} stroke="#F1F5F9" />
        ))}
        <path d={toPath(activity)} fill="none" stroke="#1E4FA3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d={toPath(heart)}    fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {heart.map((v, i)    => <circle key={`h${i}`} cx={scaleX(i)} cy={scaleY(v)} r="3" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.5" />)}
        {activity.map((v, i) => <circle key={`a${i}`} cx={scaleX(i)} cy={scaleY(v)} r="2.5" fill="#1E4FA3" />)}
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${labels.length}, 1fr)`, marginTop: 4 }}>
        {labels.map((l) => <span key={l} style={{ fontSize: 9, color: '#94A3B8', textAlign: 'center', fontWeight: 600 }}>{l}</span>)}
      </div>
    </div>
  )
}

// ─── Small helpers ────────────────────────────────────────────────────────

const footerBtnBase: React.CSSProperties = {
  flex: 1, height: 48, borderRadius: 14, cursor: 'pointer',
  fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '0 16px',
}
const footerBtnSecondary: React.CSSProperties = {
  ...footerBtnBase,
  background: '#FFFFFF', color: '#1E4FA3',
  border: '1.5px solid #DBE7F8',
}
const footerBtnPrimary: React.CSSProperties = {
  ...footerBtnBase,
  background: BRAND_GRADIENT, color: '#FFFFFF',
  border: 'none',
  boxShadow: '0 8px 20px rgba(30,79,163,0.32)',
}

const sectionTitle: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: '#1E4FA3', letterSpacing: '1px', margin: '0 0 12px' }
const labelStyleBase: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }
const inputStyle: React.CSSProperties = { width: '100%', borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC', padding: '10px 12px', fontSize: 13, color: '#1E293B', outline: 'none', fontFamily: 'inherit' }
const textareaStyle: React.CSSProperties = { ...inputStyle, resize: 'vertical' }

function SubLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <label style={{ ...labelStyleBase, ...style }}>{children}</label>
}

function ContinueButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      marginTop: 16, width: '100%', height: 44, borderRadius: 12,
      background: BRAND_GRADIENT, color: '#FFFFFF', border: 'none',
      cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    }}>
      {label}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
    </button>
  )
}

function VitalRow({
  label, unit, value, placeholder, onChange, last, error, inputMode,
}: {
  label: string; unit: string; value: string; placeholder: string;
  onChange: (v: string) => void; last?: boolean; error?: string | null;
  inputMode?: 'numeric' | 'decimal' | 'text'
}) {
  const isError = !!(value && error)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: last ? 'none' : '1px solid #F1F5F9' }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: isError ? '#FEF2F2' : '#EBF2FF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 2,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isError ? '#DC2626' : '#1E4FA3'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 12 7 12 9 6 11 18 13 10 15 14 17 12 21 12" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#64748B', letterSpacing: '0.6px', margin: 0 }}>{label}</p>
        <input
          value={value}
          placeholder={placeholder}
          inputMode={inputMode}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%', border: 'none', outline: 'none', background: 'transparent',
            fontSize: 16, fontWeight: 700,
            color: isError ? '#DC2626' : '#1E293B',
            padding: '2px 0', fontFamily: 'inherit',
          }}
        />
        {isError && (
          <p style={{ fontSize: 11, color: '#DC2626', margin: '2px 0 0', fontWeight: 500 }}>{error}</p>
        )}
      </div>
      <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginTop: 14 }}>{unit}</span>
    </div>
  )
}

/**
 * Validate blood pressure in "systolic/diastolic" form.
 * - systolic  60–250 mmHg
 * - diastolic 40–130 mmHg
 * - systolic > diastolic by at least 20 mmHg (pulse pressure sanity)
 * Returns null when value is empty (BP is optional) or valid; otherwise the error string.
 */
function validateBP(value: string): string | null {
  const v = value.trim()
  if (!v) return null
  const m = v.match(/^(\d{2,3})\s*\/\s*(\d{2,3})$/)
  if (!m) return 'Use format 120/80'
  const sys = parseInt(m[1], 10)
  const dia = parseInt(m[2], 10)
  if (sys < 60 || sys > 250)  return 'Systolic must be 60–250'
  if (dia < 40 || dia > 130)  return 'Diastolic must be 40–130'
  if (sys - dia < 20)         return 'Systolic must be at least 20 above diastolic'
  return null
}

/** Generic numeric validator with min / max range. Empty input is valid (optional). */
function validateRange(value: string, min: number, max: number, label: string, unit: string): string | null {
  const v = value.trim()
  if (!v) return null
  if (!/^\d+(\.\d+)?$/.test(v)) return `${label} must be a number`
  const n = parseFloat(v)
  if (Number.isNaN(n)) return `${label} must be a number`
  if (n < min || n > max) return `${label} must be ${min}–${max} ${unit}`
  return null
}

const validateTemp   = (v: string) => validateRange(v, 95,  108, 'Temperature', '°F')
const validatePulse  = (v: string) => validateRange(v, 30,  220, 'Pulse',       'bpm')
const validateWeight = (v: string) => validateRange(v, 0.5, 300, 'Weight',      'kg')
const validateSpo2   = (v: string) => validateRange(v, 50,  100, 'SpO₂',        '%')

// ─── Rx Pad — composer + numbered list ──────────────────────────────────

const RX_TYPES = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops']
const DURATION_UNITS = ['days', 'weeks', 'months']
const RX_TEAL = '#1FA3A8'
const RX_TEAL_DARK = '#157A7D'
const RX_TEAL_TINT = '#E6F4F4'

function RxPad({
  lines, onAdd, onUpdate, onRemove, onContinue,
}: {
  lines: RxLine[]
  onAdd: (line: Partial<RxLine>) => void
  onUpdate: (index: number, patch: Partial<RxLine>) => void
  onRemove: (index: number) => void
  onContinue: () => void
}) {
  const [medicine, setMedicine]   = useState('')
  const [rxType, setRxType]       = useState('Tablet')
  const [morning, setMorning]     = useState(false)
  const [afternoon, setAfternoon] = useState(false)
  const [night, setNight]         = useState(false)
  const [durationN, setDurationN] = useState('7')
  const [durationU, setDurationU] = useState('days')
  const [instructions, setInstructions] = useState('')

  const filled = lines.filter((l) => l.medicine.trim().length > 0)
  const canAdd = medicine.trim().length > 0

  const reset = () => {
    setMedicine(''); setRxType('Tablet')
    setMorning(false); setAfternoon(false); setNight(false)
    setDurationN('7'); setDurationU('days'); setInstructions('')
  }

  const handleAdd = () => {
    if (!canAdd) return
    onAdd({
      medicine: medicine.trim(),
      type: rxType,
      schedule: { morning, afternoon, night },
      duration: `${durationN} ${durationU}`,
      instructions: instructions.trim(),
      // Keep legacy fields populated so anything reading dose/frequency still works:
      dose: [morning ? '1' : '0', afternoon ? '1' : '0', night ? '1' : '0'].join('-'),
      frequency: instructions.trim(),
    })
    reset()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Composer */}
      <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 14, boxShadow: '0 2px 8px rgba(30,79,163,0.06)' }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1E293B', margin: '0 0 2px' }}>Add medicine</h3>
        <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 12px' }}>Search a medicine, set type, schedule, duration &amp; instructions</p>

        <div style={{ background: RX_TEAL_TINT, borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Medicine search */}
          <div>
            <RxLabel>Medicine</RxLabel>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></svg>
              </span>
              <input value={medicine} onChange={(e) => setMedicine(e.target.value)}
                placeholder="Type to search e.g. Paracetamol 500mg"
                style={{ ...rxInputStyle, paddingLeft: 34 }} />
            </div>
          </div>

          {/* Type */}
          <div>
            <RxLabel>Type</RxLabel>
            <select value={rxType} onChange={(e) => setRxType(e.target.value)} style={rxInputStyle}>
              {RX_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Schedule chips */}
          <div>
            <RxLabel>Schedule</RxLabel>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <ScheduleChip label="Morning"   icon="☀" active={morning}   onClick={() => setMorning(!morning)} />
              <ScheduleChip label="Afternoon" icon="☼" active={afternoon} onClick={() => setAfternoon(!afternoon)} />
              <ScheduleChip label="Night"     icon="☾" active={night}     onClick={() => setNight(!night)} />
            </div>
          </div>

          {/* Duration */}
          <div>
            <RxLabel>Duration</RxLabel>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={durationN} onChange={(e) => setDurationN(e.target.value.replace(/\D/g, '').slice(0, 3))}
                inputMode="numeric"
                style={{ ...rxInputStyle, flex: 1 }} />
              <select value={durationU} onChange={(e) => setDurationU(e.target.value)}
                style={{ ...rxInputStyle, width: 110, flexShrink: 0 }}>
                {DURATION_UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <RxLabel>Instructions</RxLabel>
            <input value={instructions} onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. After food, with water"
              style={rxInputStyle} />
          </div>

          <button onClick={handleAdd} disabled={!canAdd} style={{
            marginTop: 4, padding: '12px 14px', borderRadius: 12,
            background: canAdd ? RX_TEAL : '#C7E4E5',
            color: '#FFFFFF', border: 'none',
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
            cursor: canAdd ? 'pointer' : 'not-allowed',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add to prescription
          </button>
        </div>
      </div>

      {/* Prescribed list */}
      <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 14, boxShadow: '0 2px 8px rgba(30,79,163,0.06)' }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1E293B', margin: '0 0 2px' }}>Prescribed medicines</h3>
        <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 12px' }}>
          {filled.length} medicine{filled.length === 1 ? '' : 's'} on this Rx
        </p>

        {filled.length === 0 ? (
          <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '16px 0' }}>
            No medicines yet — add one above.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filled.map((line, idx) => {
              const realIdx = lines.indexOf(line)
              return (
                <PrescribedRow
                  key={line.id}
                  index={idx + 1}
                  line={line}
                  onToggle={(slot) => onUpdate(realIdx, {
                    schedule: { ...(line.schedule ?? {}), [slot]: !(line.schedule?.[slot]) },
                  })}
                  onRemove={() => onRemove(realIdx)}
                />
              )
            })}
          </div>
        )}

        <ContinueButton label="Save & continue to Follow-up" onClick={onContinue} />
      </div>
    </div>
  )
}

const rxInputStyle: React.CSSProperties = {
  width: '100%', borderRadius: 10, border: '1px solid #D6E9EA',
  background: '#FFFFFF', padding: '10px 12px',
  fontSize: 13, fontWeight: 600, color: '#1E293B',
  outline: 'none', fontFamily: 'inherit',
}

function RxLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: RX_TEAL_DARK, letterSpacing: '1px', marginBottom: 6, textTransform: 'uppercase' }}>
      {children}
    </label>
  )
}

function ScheduleChip({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
      border: active ? `1.5px solid ${RX_TEAL}` : '1.5px solid #D6E9EA',
      background: active ? RX_TEAL : '#FFFFFF',
      color: active ? '#FFFFFF' : RX_TEAL_DARK,
      fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
    }}>
      <span style={{ fontSize: 13 }}>{icon}</span>
      {label}
    </button>
  )
}

function PrescribedRow({
  index, line, onToggle, onRemove,
}: {
  index: number
  line: RxLine
  onToggle: (slot: 'morning' | 'afternoon' | 'night') => void
  onRemove: () => void
}) {
  const meta = [line.type, line.duration, line.instructions].filter(Boolean).join(' · ')
  return (
    <div style={{
      border: '1px solid #E2E8F0', borderRadius: 12, padding: 12,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{ minWidth: 36, height: 36, borderRadius: 10, background: RX_TEAL_TINT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: RX_TEAL_DARK, letterSpacing: '0.5px' }}>{String(index).padStart(2, '0')}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {line.medicine}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
          {line.type && (
            <span style={{ fontSize: 9, fontWeight: 800, color: RX_TEAL_DARK, background: RX_TEAL_TINT, borderRadius: 999, padding: '2px 8px', letterSpacing: '0.4px' }}>
              {line.type.toUpperCase()}
            </span>
          )}
          <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>{meta.replace(line.type ?? '', '').replace(/^ · /, '')}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <SlotPill letter="M" active={!!line.schedule?.morning}   onClick={() => onToggle('morning')} />
        <SlotPill letter="A" active={!!line.schedule?.afternoon} onClick={() => onToggle('afternoon')} />
        <SlotPill letter="N" active={!!line.schedule?.night}     onClick={() => onToggle('night')} />
      </div>
      <button onClick={onRemove} aria-label="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#CBD5E1', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}

function SlotPill({ letter, active, onClick }: { letter: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={`Toggle ${letter}`} style={{
      width: 26, height: 26, borderRadius: 8, cursor: 'pointer',
      border: active ? `1.5px solid ${RX_TEAL}` : '1.5px solid #E2E8F0',
      background: active ? RX_TEAL : '#FFFFFF',
      color: active ? '#FFFFFF' : '#CBD5E1',
      fontSize: 11, fontWeight: 800, fontFamily: 'inherit',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {letter}
    </button>
  )
}

function formatTimer(s: number) {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')} : ${String(r).padStart(2, '0')}`
}
