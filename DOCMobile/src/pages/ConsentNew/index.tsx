import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useConsentStore, SCOPE_LABELS } from '@/stores/consentStore'
import type { ScopeKey, NewRequestPayload } from '@/stores/consentStore'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

// ─── Step config ──────────────────────────────────────────────────────────

type Step = 'patient' | 'scopes' | 'details' | 'review'
const STEP_ORDER: Step[] = ['patient', 'scopes', 'details', 'review']

const STEP_TITLE: Record<Step, string> = {
  patient: 'Choose patient',
  scopes:  'Pick data scopes',
  details: 'Purpose & duration',
  review:  'Review & send',
}
const STEP_HINT: Record<Step, string> = {
  patient: 'Search a recent patient or enter a new mobile.',
  scopes:  'Select exactly what you need — DPDP §6 minimum data principle.',
  details: 'Tell the patient why you need access and for how long.',
  review:  'A signed copy of this request will be sent to the patient.',
}

interface RecentPatient { name: string; phone: string; lastVisit?: string }
const RECENT_PATIENTS: RecentPatient[] = [
  { name: 'Rohan Verma',  phone: '9902044117', lastVisit: 'Today' },
  { name: 'Priya Ramesh', phone: '9845021287', lastVisit: 'Yesterday' },
  { name: 'Ananya Iyer',  phone: '9886255910', lastVisit: '3 days ago' },
  { name: 'Vikram Iyer',  phone: '9988776655', lastVisit: '1 week ago' },
]

interface ScopePreset { label: string; scopes: ScopeKey[] }
const SCOPE_PRESETS: ScopePreset[] = [
  { label: 'All clinical data', scopes: ['lab-reports', 'prescriptions', 'imaging', 'vitals', 'medications', 'allergies'] },
  { label: 'Lab + Rx only',     scopes: ['lab-reports', 'prescriptions'] },
  { label: 'Vitals only',       scopes: ['vitals'] },
  { label: 'ABHA full link',    scopes: ['abha-link'] },
]

const PURPOSE_PRESETS = [
  'Follow-up consultation',
  'Pre-op screening',
  'Routine check-up',
  'Specialist referral',
  'Emergency review',
]

// ─── Page ─────────────────────────────────────────────────────────────────

export function ConsentNew() {
  const navigate    = useNavigate()
  const addRequest  = useConsentStore((s) => s.addRequest)

  const [step, setStep] = useState<Step>('patient')
  const [patientName, setPatientName]   = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [scopes, setScopes]             = useState<ScopeKey[]>(['lab-reports', 'prescriptions'])
  const [purpose, setPurpose]           = useState('')
  const [duration, setDuration]         = useState('180')
  const [acknowledged, setAcknowledged] = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [sent, setSent]                 = useState(false)

  const phoneDigits = patientPhone.replace(/\D/g, '')
  const phoneValid  = phoneDigits.length === 10 && /^[6-9]/.test(phoneDigits)

  const stepValid: Record<Step, boolean> = {
    patient: patientName.trim().length >= 2 && phoneValid,
    scopes:  scopes.length > 0,
    details: purpose.trim().length >= 3 && parseInt(duration, 10) > 0,
    review:  acknowledged,
  }

  const stepIdx = STEP_ORDER.indexOf(step)
  const goNext = () => { const n = STEP_ORDER[stepIdx + 1]; if (n) setStep(n) }
  const goBack = () => {
    if (stepIdx === 0) { navigate('/consent'); return }
    const p = STEP_ORDER[stepIdx - 1]
    if (p) setStep(p)
  }

  const expiresOn = useMemo(
    () => duration ? new Date(Date.now() + parseInt(duration, 10) * 86400000).toISOString().slice(0, 10) : undefined,
    [duration],
  )

  const finalPayload = (): NewRequestPayload => ({
    patientName:  patientName.trim(),
    patientPhone: `+91 ${phoneDigits.slice(0, 5)} ${phoneDigits.slice(5)}`,
    scopes,
    purpose:      purpose.trim(),
    expiresOn,
  })

  const submit = async () => {
    if (!stepValid.review) return
    setSubmitting(true)
    try {
      // TODO: POST /api/consents/request — { patientPhone, scopes, purpose, durationDays }
      await new Promise((r) => setTimeout(r, 600))
      addRequest(finalPayload())
      setSent(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ minHeight: '100%', background: '#F5F8FC', display: 'flex', flexDirection: 'column' }}
    >
      {/* Hero — cleaner header, stepper moved below */}
      <div style={{
        background: BRAND_GRADIENT, padding: '48px 16px 22px',
        position: 'relative', overflow: 'hidden', borderRadius: '0 0 24px 24px',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
          <button onClick={goBack} aria-label="Back" style={iconChip}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 700, margin: 0 }}>
              Patient access
            </p>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', margin: '4px 0 0' }}>
              {sent ? 'Request sent' : 'New consent request'}
            </h1>
          </div>
          {!sent && (
            <div style={{
              padding: '6px 12px', borderRadius: 999,
              background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)',
            }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.4px' }}>
                {stepIdx + 1} / {STEP_ORDER.length}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Numbered stepper — clear visual progress */}
      {!sent && (
        <div style={{ margin: '-18px 16px 0', position: 'relative', zIndex: 2 }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 14, padding: '14px 12px',
            boxShadow: '0 6px 18px rgba(30,79,163,0.10)',
          }}>
            <NumberedStepper step={step} order={STEP_ORDER} labels={STEP_TITLE} />
          </div>
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, padding: '16px 16px 130px' }}>
        {sent ? (
          <SuccessScreen
            patientName={patientName}
            scopes={scopes}
            expiresOn={expiresOn}
            onDone={() => navigate('/consent')}
          />
        ) : (
          <Card>
            <StepHeader title={STEP_TITLE[step]} hint={STEP_HINT[step]} />
            {step === 'patient' ? (
              <PatientStep
                name={patientName} phone={patientPhone}
                phoneDigits={phoneDigits} phoneValid={phoneValid}
                setName={setPatientName} setPhone={setPatientPhone}
              />
            ) : step === 'scopes' ? (
              <ScopesStep scopes={scopes} setScopes={setScopes} />
            ) : step === 'details' ? (
              <DetailsStep
                purpose={purpose} setPurpose={setPurpose}
                duration={duration} setDuration={setDuration}
                expiresOn={expiresOn}
              />
            ) : (
              <ReviewStep
                patientName={patientName}
                patientPhone={`+91 ${phoneDigits.slice(0, 5)} ${phoneDigits.slice(5)}`}
                scopes={scopes}
                purpose={purpose}
                duration={duration}
                expiresOn={expiresOn}
                acknowledged={acknowledged}
                setAcknowledged={setAcknowledged}
                jumpTo={setStep}
              />
            )}
          </Card>
        )}
      </div>

      {/* Sticky footer */}
      {!sent && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 430, padding: '10px 16px',
          background: 'linear-gradient(to top, rgba(245,248,252,1) 70%, rgba(245,248,252,0))',
          display: 'flex', gap: 10, zIndex: 40,
        }}>
          <button onClick={goBack} style={footerBtnSecondary}>
            {stepIdx === 0 ? 'Cancel' : 'Back'}
          </button>
          {step !== 'review' ? (
            <button onClick={goNext} disabled={!stepValid[step]} style={{
              ...footerBtnPrimary,
              background: stepValid[step] ? BRAND_GRADIENT : '#C8D9F5',
              cursor: stepValid[step] ? 'pointer' : 'not-allowed',
              boxShadow: stepValid[step] ? '0 8px 18px rgba(30,79,163,0.28)' : 'none',
            }}>
              Continue
            </button>
          ) : (
            <button onClick={submit} disabled={!stepValid.review || submitting} style={{
              ...footerBtnPrimary,
              background: !stepValid.review || submitting ? '#C8D9F5' : BRAND_GRADIENT,
              cursor: !stepValid.review || submitting ? 'not-allowed' : 'pointer',
              boxShadow: stepValid.review && !submitting ? '0 8px 18px rgba(30,79,163,0.28)' : 'none',
            }}>
              {submitting ? 'Sending…' : 'Send request'}
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ─── Steps ────────────────────────────────────────────────────────────────

function PatientStep({
  name, phone, phoneDigits, phoneValid, setName, setPhone,
}: {
  name: string; phone: string; phoneDigits: string; phoneValid: boolean
  setName: (v: string) => void; setPhone: (v: string) => void
}) {
  const [query, setQuery] = useState('')
  const matched = useMemo(() => {
    if (!query.trim()) return RECENT_PATIENTS
    const q = query.toLowerCase()
    return RECENT_PATIENTS.filter((p) => p.name.toLowerCase().includes(q) || p.phone.includes(q))
  }, [query])

  const hasSelection = name.trim().length >= 2 && phoneValid
  const clearSelection = () => { setName(''); setPhone('') }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Selected-patient confirmation */}
      {hasSelection && (
        <motion.div
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, #EBF2FF 0%, #DBEAFE 100%)',
            border: '1.5px solid #1E4FA3',
            borderRadius: 12, padding: 12,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#1E4FA3', color: '#FFFFFF', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {name.split(' ').map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: '#1E4FA3', letterSpacing: '0.6px', margin: 0, textTransform: 'uppercase' }}>Selected</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: '2px 0 0' }}>{name}</p>
            <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>+91 {phoneDigits.slice(0, 5)} {phoneDigits.slice(5)}</p>
          </div>
          <button onClick={clearSelection} aria-label="Clear"
            style={{ background: '#FFFFFF', border: '1.5px solid #DBE7F8', borderRadius: 999, padding: '5px 10px', fontSize: 11, fontWeight: 700, color: '#1E4FA3', cursor: 'pointer', fontFamily: 'inherit' }}>
            Change
          </button>
        </motion.div>
      )}

      {/* Search */}
      <div>
        <Label>Search recent patients</Label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></svg>
          </span>
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a name or mobile"
            style={{ ...inputStyle, paddingLeft: 34 }} />
        </div>
      </div>

      {/* Recent list */}
      {matched.length > 0 ? (
        <div>
          <Label>{query ? 'Matches' : 'Recent patients'}</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {matched.map((p) => {
              const selected = p.phone === phoneDigits
              return (
                <button key={p.phone}
                  onClick={() => { setName(p.name); setPhone(p.phone) }}
                  style={{
                    all: 'unset', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 12,
                    borderRadius: 12, padding: '12px',
                    background: selected ? '#EBF2FF' : '#FFFFFF',
                    border: selected ? '1.5px solid #1E4FA3' : '1px solid #E2E8F0',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#1E4FA3', color: '#FFFFFF', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {p.name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>+91 {p.phone.slice(0, 5)} {p.phone.slice(5)}</span>
                      {p.lastVisit && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', background: '#F1F5F9', borderRadius: 999, padding: '2px 7px' }}>
                          {p.lastVisit}
                        </span>
                      )}
                    </div>
                  </div>
                  {selected ? (
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#1E4FA3', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </span>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#64748B', margin: 0, fontWeight: 600 }}>No patients match “{query}”</p>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>Add them as a new patient below.</p>
        </div>
      )}

      <Divider label="OR ADD A NEW PATIENT" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <Label>Patient name</Label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rohan Verma" style={inputStyle} />
        </div>

        <div>
          <Label>Patient mobile</Label>
          <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${phoneDigits.length > 0 && !phoneValid ? '#EF4444' : '#E3EAF2'}`, background: '#F5F8FC', borderRadius: 12, overflow: 'hidden' }}>
            <span style={{ padding: '0 10px 0 12px', fontSize: 13, fontWeight: 700, color: '#3D4A5B', borderRight: '1.5px solid #E3EAF2', alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}>
              🇮🇳 +91
            </span>
            <input
              type="tel" inputMode="numeric" maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile"
              style={{ ...inputStyle, border: 'none', background: 'transparent', borderRadius: 0 }}
            />
            <span style={{ fontSize: 11, color: '#C8D4E0', paddingRight: 12, flexShrink: 0 }}>
              {phoneDigits.length}/10
            </span>
          </div>
          {phoneDigits.length > 0 && !phoneValid && (
            <p style={{ fontSize: 11, color: '#EF4444', margin: '4px 0 0 2px' }}>
              Enter a valid 10-digit Indian mobile (starting 6/7/8/9)
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function ScopesStep({ scopes, setScopes }: { scopes: ScopeKey[]; setScopes: (s: ScopeKey[]) => void }) {
  const allKeys = Object.keys(SCOPE_LABELS) as ScopeKey[]
  const toggle = (k: ScopeKey) => setScopes(scopes.includes(k) ? scopes.filter((s) => s !== k) : [...scopes, k])
  const matchesPreset = (preset: ScopeKey[]) => sameSet(preset, scopes)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <Label>Quick presets</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {SCOPE_PRESETS.map((p) => (
            <button key={p.label} onClick={() => setScopes(p.scopes)} style={togglePill(matchesPreset(p.scopes))}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <Label style={{ marginBottom: 0 }}>Pick exactly what you need</Label>
          <span style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>{scopes.length}/{allKeys.length}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {allKeys.map((k) => {
            const on = scopes.includes(k)
            return (
              <button key={k} onClick={() => toggle(k)} style={{
                all: 'unset', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10,
                background: on ? '#EBF2FF' : '#F8FAFC',
                border: on ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: on ? '#1E4FA3' : '#FFFFFF',
                  border: on ? '1.5px solid #1E4FA3' : '1.5px solid #CBD5E1',
                  color: '#FFFFFF',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {on && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <p style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#1E293B', margin: 0 }}>{SCOPE_LABELS[k]}</p>
              </button>
            )
          })}
        </div>
      </div>

      {scopes.length === 0 && (
        <p style={{ fontSize: 11, color: '#DC2626', margin: 0 }}>Pick at least one scope to continue.</p>
      )}
    </div>
  )
}

function DetailsStep({
  purpose, setPurpose, duration, setDuration, expiresOn,
}: {
  purpose: string; setPurpose: (v: string) => void
  duration: string; setDuration: (v: string) => void
  expiresOn?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <Label>Purpose</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {PURPOSE_PRESETS.map((p) => (
            <button key={p} onClick={() => setPurpose(p)} style={togglePill(purpose === p)}>{p}</button>
          ))}
        </div>
        <textarea rows={2} value={purpose} onChange={(e) => setPurpose(e.target.value)}
          placeholder="Or describe the purpose…"
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
      </div>

      <div>
        <Label>Duration</Label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { d: '30',  label: '1 month' },
            { d: '90',  label: '3 months' },
            { d: '180', label: '6 months' },
            { d: '365', label: '1 year' },
          ].map((q) => (
            <button key={q.d} onClick={() => setDuration(q.d)} style={togglePill(duration === q.d)}>{q.label}</button>
          ))}
        </div>
        {expiresOn && (
          <p style={{ fontSize: 11, color: '#64748B', margin: '8px 0 0' }}>
            Access auto-expires on <b style={{ color: '#1E293B' }}>{formatDate(expiresOn)}</b>. Patient can revoke earlier.
          </p>
        )}
      </div>
    </div>
  )
}

function ReviewStep({
  patientName, patientPhone, scopes, purpose, duration, expiresOn,
  acknowledged, setAcknowledged, jumpTo,
}: {
  patientName: string; patientPhone: string
  scopes: ScopeKey[]; purpose: string; duration: string; expiresOn?: string
  acknowledged: boolean; setAcknowledged: (v: boolean) => void
  jumpTo: (s: Step) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <ReviewRow label="Patient" onEdit={() => jumpTo('patient')}>
        <p style={reviewValueStyle}>{patientName}</p>
        <p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0' }}>{patientPhone}</p>
      </ReviewRow>

      <ReviewRow label="Scopes" onEdit={() => jumpTo('scopes')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {scopes.map((s) => (
            <span key={s} style={{ fontSize: 10, fontWeight: 700, color: '#1E4FA3', background: '#EBF2FF', borderRadius: 999, padding: '3px 8px' }}>
              {SCOPE_LABELS[s]}
            </span>
          ))}
        </div>
      </ReviewRow>

      <ReviewRow label="Purpose" onEdit={() => jumpTo('details')}>
        <p style={reviewValueStyle}>{purpose}</p>
      </ReviewRow>

      <ReviewRow label="Duration" onEdit={() => jumpTo('details')}>
        <p style={reviewValueStyle}>
          {durationLabel(duration)}
          {expiresOn && <span style={{ fontWeight: 500, color: '#64748B' }}> · until {formatDate(expiresOn)}</span>}
        </p>
      </ReviewRow>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: 12, cursor: 'pointer' }}>
        <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)}
          style={{ marginTop: 3, width: 16, height: 16, accentColor: '#1E4FA3', flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>
          I confirm this request follows the DPDP Act principle of data minimisation. The patient will be notified via WhatsApp / SMS and a signed audit entry will be created.
        </span>
      </label>
    </div>
  )
}

function ReviewRow({ label, children, onEdit }: { label: string; children: React.ReactNode; onEdit: () => void }) {
  return (
    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <p style={{ fontSize: 10, fontWeight: 800, color: '#1E4FA3', letterSpacing: '0.6px', margin: 0, textTransform: 'uppercase' }}>{label}</p>
        <button onClick={onEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#1E4FA3', padding: 0, fontFamily: 'inherit' }}>
          Edit
        </button>
      </div>
      {children}
    </div>
  )
}

function SuccessScreen({
  patientName, scopes, expiresOn, onDone,
}: { patientName: string; scopes: ScopeKey[]; expiresOn?: string; onDone: () => void }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 16, padding: 20, marginTop: 8,
      boxShadow: '0 2px 8px rgba(30,79,163,0.06)', textAlign: 'center',
    }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ECFDF5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1E293B', margin: 0 }}>Sent to {patientName}</h3>
      <p style={{ fontSize: 12, color: '#64748B', margin: '6px 0 16px', lineHeight: 1.5 }}>
        We've delivered the request via WhatsApp. You'll be notified when {patientName} responds.
      </p>

      <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 12, textAlign: 'left' }}>
        <p style={{ fontSize: 10, fontWeight: 800, color: '#1E4FA3', letterSpacing: '0.6px', margin: '0 0 6px', textTransform: 'uppercase' }}>What happens next</p>
        <ul style={{ margin: 0, paddingLeft: 18, color: '#475569', fontSize: 12, lineHeight: 1.7 }}>
          <li>Patient receives a notification with the {scopes.length} scope{scopes.length === 1 ? '' : 's'}</li>
          <li>They can approve, restrict to fewer scopes, or deny</li>
          {expiresOn && <li>If approved, access auto-expires on {formatDate(expiresOn)}</li>}
          <li>Request expires automatically after 7 days without response</li>
        </ul>
      </div>

      <button onClick={onDone} style={{
        marginTop: 16, width: '100%', padding: 14, borderRadius: 14,
        background: BRAND_GRADIENT, color: '#FFFFFF', border: 'none',
        fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        boxShadow: '0 8px 18px rgba(30,79,163,0.28)',
      }}>
        Back to consents
      </button>
    </div>
  )
}

// ─── Atoms ────────────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(30,79,163,0.06)' }}>
      {children}
    </div>
  )
}

function StepHeader({ title, hint }: { title: string; hint: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1E293B', margin: 0, letterSpacing: '-0.2px' }}>{title}</h2>
      <p style={{ fontSize: 12, color: '#94A3B8', margin: '4px 0 0', lineHeight: 1.5 }}>{hint}</p>
    </div>
  )
}

function NumberedStepper({
  step, order, labels,
}: {
  step: Step
  order: Step[]
  labels: Record<Step, string>
}) {
  const idx = order.indexOf(step)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
      {order.map((s, i) => {
        const done   = i < idx
        const active = i === idx
        const label  = labels[s].split(' ')[0] // short label: Choose / Pick / Purpose / Review
        const dotBg  = done ? '#1E4FA3' : active ? '#FFFFFF' : '#F1F5F9'
        const dotFg  = done ? '#FFFFFF' : active ? '#1E4FA3' : '#94A3B8'
        const ring   = active ? '2px solid #1E4FA3' : done ? '2px solid #1E4FA3' : '2px solid #E2E8F0'
        return (
          <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            {/* Connecting line (drawn to the LEFT) */}
            {i > 0 && (
              <div style={{
                position: 'absolute', top: 13, right: '50%', width: '100%', height: 2,
                background: i <= idx ? '#1E4FA3' : '#E2E8F0',
              }} />
            )}
            {/* Dot */}
            <div style={{
              position: 'relative', zIndex: 1,
              width: 28, height: 28, borderRadius: '50%',
              background: dotBg, color: dotFg, border: ring,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800,
            }}>
              {done ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: active ? '#1E4FA3' : done ? '#1E293B' : '#94A3B8',
              marginTop: 6, letterSpacing: '0.2px',
            }}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}

function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#1E4FA3', letterSpacing: '0.6px', marginBottom: 6, textTransform: 'uppercase', ...style }}>
      {children}
    </label>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
      <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.4px' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
    </div>
  )
}

const iconChip: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 12,
  background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}
const inputStyle: React.CSSProperties = {
  width: '100%', borderRadius: 12, border: '1.5px solid #E3EAF2', background: '#F5F8FC',
  padding: '12px 14px', fontSize: 13, fontWeight: 600, color: '#1E293B',
  outline: 'none', fontFamily: 'inherit',
}
const footerBtnBase: React.CSSProperties = {
  flex: 1, height: 48, borderRadius: 14, cursor: 'pointer',
  fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '0 16px',
}
const footerBtnSecondary: React.CSSProperties = {
  ...footerBtnBase,
  background: '#FFFFFF', color: '#1E4FA3', border: '1.5px solid #DBE7F8',
}
const footerBtnPrimary: React.CSSProperties = {
  ...footerBtnBase,
  background: BRAND_GRADIENT, color: '#FFFFFF', border: 'none',
}
const reviewValueStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: '#1E293B', margin: 0,
}

function togglePill(on: boolean): React.CSSProperties {
  return {
    padding: '7px 12px', borderRadius: 999, cursor: 'pointer',
    border: on ? '1.5px solid #1E4FA3' : '1.5px solid #E3EAF2',
    background: on ? '#EBF2FF' : '#FFFFFF',
    color: on ? '#1E4FA3' : '#475569',
    fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
  }
}

function sameSet(a: ScopeKey[], b: ScopeKey[]): boolean {
  if (a.length !== b.length) return false
  const set = new Set(a)
  for (const x of b) if (!set.has(x)) return false
  return true
}

function durationLabel(days: string): string {
  switch (days) {
    case '30':  return '1 month'
    case '90':  return '3 months'
    case '180': return '6 months'
    case '365': return '1 year'
    default:    return `${days} days`
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
