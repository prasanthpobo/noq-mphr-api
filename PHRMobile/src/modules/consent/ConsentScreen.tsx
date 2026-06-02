import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiShieldCheck,
  HiArrowLeft,
  HiX,
  HiCheckCircle,
  HiClock,
  HiBan,
  HiOutlineDocumentText,
} from 'react-icons/hi'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

// ─── Types ────────────────────────────────────────────────────────────────

type ScopeKey =
  | 'lab-reports'
  | 'prescriptions'
  | 'imaging'
  | 'vitals'
  | 'medications'
  | 'allergies'
  | 'abha-link'

const SCOPE_LABELS: Record<ScopeKey, string> = {
  'lab-reports':   'Lab reports',
  prescriptions:   'Prescriptions',
  imaging:         'Imaging / scans',
  vitals:          'Vitals & device data',
  medications:     'Medication history',
  allergies:       'Allergies',
  'abha-link':     'ABHA consent link',
}

interface ActiveConsent {
  id: string
  grantee: string         // Doctor name or facility
  granteeRole: string     // Specialty or facility type
  scopes: ScopeKey[]
  grantedOn: string       // ISO date
  expiresOn?: string      // ISO date (omit = open-ended)
  purpose: string
}

type HistoryAction = 'granted' | 'withdrawn' | 'expired' | 'denied'

interface HistoryEntry {
  id: string
  action: HistoryAction
  grantee: string
  scopes: ScopeKey[]
  date: string          // ISO date
  note?: string
}

// ─── Mock data (replace with /api/consents once available) ────────────────

const ACTIVE_CONSENTS: ActiveConsent[] = [
  {
    id: 'c1',
    grantee: 'Dr. Suresh Reddy',
    granteeRole: 'Cardiologist · Apollo Clinic',
    scopes: ['lab-reports', 'prescriptions', 'vitals'],
    grantedOn: '2026-04-12',
    expiresOn: '2026-10-12',
    purpose: 'Ongoing cardiac follow-up',
  },
  {
    id: 'c2',
    grantee: 'City Imaging Center',
    granteeRole: 'Diagnostic facility',
    scopes: ['imaging', 'lab-reports'],
    grantedOn: '2026-05-02',
    purpose: 'Chest X-Ray report sharing',
  },
  {
    id: 'c3',
    grantee: 'ABHA Consent Mechanism',
    granteeRole: 'National Health Stack',
    scopes: ['abha-link'],
    grantedOn: '2026-01-04',
    expiresOn: '2027-01-04',
    purpose: 'Cross-facility record access',
  },
]

const HISTORY: HistoryEntry[] = [
  { id: 'h1', action: 'granted',   grantee: 'Dr. Suresh Reddy',    scopes: ['lab-reports', 'prescriptions', 'vitals'], date: '2026-04-12' },
  { id: 'h2', action: 'withdrawn', grantee: 'HealthFirst Polyclinic', scopes: ['lab-reports'], date: '2026-03-28', note: 'No longer a patient' },
  { id: 'h3', action: 'expired',   grantee: 'Dr. Priya Iyer',      scopes: ['allergies'],   date: '2026-02-15' },
  { id: 'h4', action: 'granted',   grantee: 'ABHA Consent Mechanism', scopes: ['abha-link'], date: '2026-01-04' },
]

// ─── Component ────────────────────────────────────────────────────────────

type Tab = 'active' | 'new' | 'history'

export default function ConsentScreen() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('active')

  const activeCount = ACTIVE_CONSENTS.length

  return (
    <div style={{ minHeight: '100%', background: '#F5F8FC', paddingBottom: 100, fontFamily: 'Roboto, system-ui, sans-serif' }}>
      {/* Hero */}
      <div style={{
        background: BRAND_GRADIENT,
        padding: '52px 20px 22px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '0 0 28px 28px',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} aria-label="Back" style={iconChip}>
            <HiArrowLeft size={18} color="#FFFFFF" />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 700, margin: 0 }}>
              Privacy &amp; consent
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', margin: '4px 0 0' }}>Consent Manager</h1>
          </div>
          <div style={iconChip}><HiShieldCheck size={20} color="#FFFFFF" /></div>
        </div>

        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', margin: '12px 0 0', lineHeight: 1.5 }}>
          Under the DPDP Act, you can grant, restrict, or revoke access to your health data at any time.
        </p>

        {/* Stat strip */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <HeroStat value={activeCount} label="ACTIVE" />
          <HeroStat value={HISTORY.filter((h) => h.action === 'withdrawn').length} label="WITHDRAWN" />
          <HeroStat value={HISTORY.filter((h) => h.action === 'expired').length}   label="EXPIRED" />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '14px 16px 0', overflowX: 'auto' }}>
        {(['active', 'new', 'history'] as Tab[]).map((t) => {
          const active = tab === t
          const label  = t === 'active' ? `Active · ${activeCount}` : t === 'new' ? 'New request' : `History · ${HISTORY.length}`
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              flexShrink: 0, padding: '8px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: active ? BRAND_GRADIENT : '#FFFFFF',
              color: active ? '#FFFFFF' : '#475569',
              fontSize: 12, fontWeight: 700,
              boxShadow: '0 2px 6px rgba(30,79,163,0.06)',
              fontFamily: 'inherit',
            }}>
              {label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div style={{ padding: '14px 16px' }}>
        {tab === 'active'  && <ActiveTab onRevoke={() => setTab('new')} />}
        {tab === 'new'     && <NewRequestTab onSubmit={() => setTab('history')} />}
        {tab === 'history' && <HistoryTab />}
      </div>
    </div>
  )
}

const iconChip: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 12,
  background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <div style={{
      flex: 1, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)',
      borderRadius: 14, padding: '10px 8px', textAlign: 'center',
    }}>
      <p style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', margin: 0, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.8px', margin: '6px 0 0' }}>{label}</p>
    </div>
  )
}

// ─── Active tab ───────────────────────────────────────────────────────────

function ActiveTab({ onRevoke }: { onRevoke: () => void }) {
  if (ACTIVE_CONSENTS.length === 0) {
    return <EmptyState icon="🛡️" title="No active consents" hint="You haven't shared your health data with anyone yet." />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {ACTIVE_CONSENTS.map((c) => <ActiveCard key={c.id} consent={c} onRevoke={onRevoke} />)}
    </div>
  )
}

function ActiveCard({ consent, onRevoke }: { consent: ActiveConsent; onRevoke: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: '#FFFFFF', borderRadius: 16, padding: 14, boxShadow: '0 2px 8px rgba(30,79,163,0.06)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: '#EBF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <HiShieldCheck size={22} color="#1E4FA3" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: 0 }}>{consent.grantee}</p>
          <p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0' }}>{consent.granteeRole}</p>
        </div>
        <span style={statusPill('granted')}>● Active</span>
      </div>

      {/* Scopes */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        {consent.scopes.map((s) => (
          <span key={s} style={{
            fontSize: 10, fontWeight: 700, color: '#1E4FA3',
            background: '#EBF2FF', borderRadius: 999, padding: '4px 9px',
          }}>{SCOPE_LABELS[s]}</span>
        ))}
      </div>

      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #E2E8F0', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <KV label="Purpose"  value={consent.purpose} />
        <KV label="Granted"  value={formatDate(consent.grantedOn)} />
        {consent.expiresOn && <KV label="Expires" value={formatDate(consent.expiresOn)} />}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={onRevoke} style={primaryBtn}>
          <HiBan size={15} /> Withdraw
        </button>
        <button style={secondaryBtn}>
          <HiOutlineDocumentText size={15} /> View record
        </button>
      </div>
    </motion.div>
  )
}

// ─── New request tab ──────────────────────────────────────────────────────

function NewRequestTab({ onSubmit }: { onSubmit: () => void }) {
  const [grantee, setGrantee]         = useState('')
  const [scopes, setScopes]           = useState<ScopeKey[]>([])
  const [effectiveDate, setEffective] = useState<string>(new Date().toISOString().slice(0, 10))
  const [immediate, setImmediate]     = useState(true)
  const [reason, setReason]           = useState('')
  const [acknowledged, setAck]        = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [submitted, setSubmitted]     = useState(false)

  const toggleScope = (k: ScopeKey) => {
    setScopes((curr) => curr.includes(k) ? curr.filter((s) => s !== k) : [...curr, k])
  }

  const valid = grantee.trim().length >= 2 && scopes.length > 0 && acknowledged

  const submit = async () => {
    if (!valid) return
    setSubmitting(true)
    try {
      // TODO: POST /api/consents/withdraw — payload: { grantee, scopes, effectiveDate, immediate, reason }
      await new Promise((r) => setTimeout(r, 600))
      setSubmitted(true)
      setTimeout(onSubmit, 1200)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 24, textAlign: 'center', boxShadow: '0 2px 8px rgba(30,79,163,0.06)' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ECFDF5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <HiCheckCircle size={36} color="#10B981" />
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1E293B', margin: 0 }}>Request submitted</h3>
        <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0', lineHeight: 1.5 }}>
          Your withdrawal request has been recorded. The recipient will be notified and access revoked on the effective date.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Legal callout */}
      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14, padding: 12, display: 'flex', gap: 10 }}>
        <span style={{ fontSize: 18 }}>⚖️</span>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#92400E', margin: 0 }}>DPDP Act · Withdrawal of Consent</p>
          <p style={{ fontSize: 11, color: '#92400E', margin: '2px 0 0', lineHeight: 1.5, opacity: 0.85 }}>
            Submit a written request listing exactly what to revoke and when it should take effect.
          </p>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 14, boxShadow: '0 2px 8px rgba(30,79,163,0.06)' }}>
        <SectionLabel>Recipient</SectionLabel>
        <input value={grantee} onChange={(e) => setGrantee(e.target.value)}
          placeholder="Doctor / hospital / ABHA"
          style={inputStyle} />

        <SectionLabel style={{ marginTop: 14 }}>Revoke access to</SectionLabel>
        <p style={hintStyle}>Pick at least one. These permissions will be withdrawn from the recipient above.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {(Object.keys(SCOPE_LABELS) as ScopeKey[]).map((k) => {
            const on = scopes.includes(k)
            return (
              <button key={k} type="button" onClick={() => toggleScope(k)} style={{
                padding: '7px 11px', borderRadius: 999, cursor: 'pointer',
                border: on ? '1.5px solid #1E4FA3' : '1.5px solid #E3EAF2',
                background: on ? '#EBF2FF' : '#FFFFFF',
                color: on ? '#1E4FA3' : '#475569',
                fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}>
                {on && <HiCheckCircle size={13} />} {SCOPE_LABELS[k]}
              </button>
            )
          })}
        </div>

        <SectionLabel style={{ marginTop: 14 }}>Effective from</SectionLabel>
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <button type="button" onClick={() => { setImmediate(true);  setEffective(new Date().toISOString().slice(0,10)) }} style={togglePill(immediate)}>
            Immediately
          </button>
          <button type="button" onClick={() => setImmediate(false)} style={togglePill(!immediate)}>
            Pick date
          </button>
        </div>
        {!immediate && (
          <input
            type="date" value={effectiveDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setEffective(e.target.value)}
            style={{ ...inputStyle, marginTop: 8 }}
          />
        )}

        <SectionLabel style={{ marginTop: 14 }}>Reason (optional)</SectionLabel>
        <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. No longer a patient at this clinic"
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={acknowledged} onChange={(e) => setAck(e.target.checked)}
            style={{ marginTop: 3, width: 16, height: 16, accentColor: '#1E4FA3' }} />
          <span style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
            I confirm I understand that withdrawing consent may affect ongoing treatment and that this written request will be logged for legal record.
          </span>
        </label>

        <button onClick={submit} disabled={!valid || submitting} style={{
          marginTop: 14, width: '100%', height: 48, borderRadius: 14,
          background: !valid || submitting ? '#C8D9F5' : BRAND_GRADIENT,
          color: '#FFFFFF', border: 'none',
          fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
          cursor: !valid || submitting ? 'not-allowed' : 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: !valid || submitting ? 'none' : '0 8px 20px rgba(30,79,163,0.32)',
        }}>
          {submitting ? 'Submitting…' : 'Submit withdrawal request'}
        </button>
      </div>
    </div>
  )
}

// ─── History tab ──────────────────────────────────────────────────────────

function HistoryTab() {
  // Sort newest first
  const sorted = useMemo(() => [...HISTORY].sort((a, b) => b.date.localeCompare(a.date)), [])

  if (sorted.length === 0) {
    return <EmptyState icon="📜" title="No history yet" hint="Your consent grants and withdrawals will appear here." />
  }

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {sorted.map((h, i) => <HistoryRow key={h.id} entry={h} isLast={i === sorted.length - 1} />)}
    </div>
  )
}

function HistoryRow({ entry, isLast }: { entry: HistoryEntry; isLast: boolean }) {
  const meta = actionMeta(entry.action)
  return (
    <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
      {/* Timeline rail */}
      <div style={{ width: 28, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', background: meta.bg,
          color: meta.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          border: `2px solid ${meta.fg}`,
        }}>
          {meta.icon}
        </div>
        {!isLast && <div style={{ width: 2, flex: 1, background: '#E2E8F0', marginTop: 2 }} />}
      </div>

      {/* Card */}
      <div style={{ flex: 1, background: '#FFFFFF', borderRadius: 14, padding: 12, boxShadow: '0 2px 8px rgba(30,79,163,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', margin: 0 }}>{entry.grantee}</p>
          <span style={statusPill(entry.action)}>{meta.label}</span>
        </div>
        <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>{formatDate(entry.date)}</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
          {entry.scopes.map((s) => (
            <span key={s} style={{ fontSize: 10, color: '#64748B', background: '#F1F5F9', borderRadius: 999, padding: '3px 7px', fontWeight: 600 }}>
              {SCOPE_LABELS[s]}
            </span>
          ))}
        </div>
        {entry.note && (
          <p style={{ fontSize: 11, color: '#64748B', fontStyle: 'italic', margin: '8px 0 0' }}>“{entry.note}”</p>
        )}
      </div>
    </div>
  )
}

// ─── Shared bits ──────────────────────────────────────────────────────────

function EmptyState({ icon, title, hint }: { icon: string; title: string; hint: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 16px' }}>
      <p style={{ fontSize: 36, marginBottom: 8 }}>{icon}</p>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: 0 }}>{title}</p>
      <p style={{ fontSize: 12, color: '#94A3B8', margin: '4px 0 0' }}>{hint}</p>
    </div>
  )
}

function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#1E4FA3', letterSpacing: '0.6px', marginBottom: 6, textTransform: 'uppercase', ...style }}>
      {children}
    </label>
  )
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12 }}>
      <span style={{ color: '#94A3B8', fontWeight: 600 }}>{label}</span>
      <span style={{ color: '#1E293B', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  )
}

function statusPill(action: HistoryAction): React.CSSProperties {
  const m = actionMeta(action)
  return {
    fontSize: 10, fontWeight: 800, letterSpacing: '0.4px',
    color: m.fg, background: m.bg, borderRadius: 999, padding: '3px 9px',
  }
}

function actionMeta(action: HistoryAction): { label: string; fg: string; bg: string; icon: React.ReactElement } {
  switch (action) {
    case 'granted':   return { label: 'GRANTED',   fg: '#059669', bg: '#D1FAE5', icon: <HiCheckCircle size={14} /> }
    case 'withdrawn': return { label: 'WITHDRAWN', fg: '#DC2626', bg: '#FEE2E2', icon: <HiBan size={14} /> }
    case 'expired':   return { label: 'EXPIRED',   fg: '#475569', bg: '#E2E8F0', icon: <HiClock size={14} /> }
    case 'denied':    return { label: 'DENIED',    fg: '#92400E', bg: '#FEF3C7', icon: <HiX size={14} /> }
  }
}

function togglePill(on: boolean): React.CSSProperties {
  return {
    padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
    border: on ? '1.5px solid #1E4FA3' : '1.5px solid #E3EAF2',
    background: on ? '#EBF2FF' : '#FFFFFF',
    color: on ? '#1E4FA3' : '#475569',
    fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
  }
}

const inputStyle: React.CSSProperties = {
  width: '100%', borderRadius: 12, border: '1.5px solid #E3EAF2', background: '#F5F8FC',
  padding: '12px 14px', fontSize: 13, fontWeight: 600, color: '#1E293B',
  outline: 'none', fontFamily: 'inherit',
}
const hintStyle: React.CSSProperties = { fontSize: 11, color: '#94A3B8', margin: '0 0 6px' }

const primaryBtn: React.CSSProperties = {
  flex: 1, padding: '10px 14px', borderRadius: 12, background: '#FEE2E2', color: '#B91C1C',
  border: '1.5px solid #FCA5A5', fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer',
}
const secondaryBtn: React.CSSProperties = {
  flex: 1, padding: '10px 14px', borderRadius: 12, background: '#FFFFFF', color: '#1E4FA3',
  border: '1.5px solid #DBE7F8', fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer',
}

// formatter helper
function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

