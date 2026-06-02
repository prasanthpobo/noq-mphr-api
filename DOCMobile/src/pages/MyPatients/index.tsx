import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { usePatientStore } from '@/stores/patientStore'
import { patientService } from '@/services/patientService'
import { useDebounce } from '@/hooks/useDebounce'
import { unwrapList, clinicId } from '@/services/api'
import { calcAge } from '@/utils/formatters'
import type { Patient } from '@/types'

const AVATAR_COLORS = ['#EC4899', '#1E4FA3', '#A855F7', '#14B8A6', '#F59E0B', '#0EA5E9', '#22C55E']

// Server response shape differs slightly from the UI's Patient type.
interface ServerPatient {
  _id: string
  name: string
  email?: string
  phone: string
  dob?: string
  gender: 'M' | 'F' | 'Other'
  bloodGroup?: string
  address?: string
  tag?: 'active' | 'new' | 'follow-up' | 'critical'
  createdAt: string
}

function mapPatient(p: ServerPatient): Patient & { tag?: string } {
  return {
    id: p._id,
    name: p.name,
    phone: p.phone,
    dob: p.dob ?? '',
    gender: p.gender === 'M' ? 'male' : p.gender === 'F' ? 'female' : 'other',
    bloodGroup: p.bloodGroup,
    address: p.address,
    createdAt: p.createdAt,
    tag: p.tag,
  }
}

export function MyPatients() {
  const navigate = useNavigate()
  const clinic = useAuthStore((s) => s.selectedClinic)
  const cid = clinicId(clinic)
  const { selectPatient } = usePatientStore()
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search)
  const [patients, setPatients] = useState<(Patient & { tag?: string })[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const refresh = () => {
    if (!cid) return
    setLoading(true)
    patientService.list(cid, debounced)
      .then((res) => {
        const list = unwrapList<ServerPatient>(res.data).map(mapPatient)
        setPatients(list)
        if (!debounced) setTotal(list.length)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { refresh() }, [cid, debounced])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100%', background: '#F5F8FC' }}>
      {/* Header (light, not gradient) */}
      <div style={{ background: '#FFFFFF', padding: '52px 20px 12px', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ width: 38, height: 38, borderRadius: 12, background: '#F1F5F9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 700, margin: 0 }}>Records</p>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: '4px 0 0' }}>My Patients</h1>
          </div>
          <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, paddingTop: 8 }}>{patients.length} / {total}</span>
        </div>

        <div style={{ marginTop: 14, position: 'relative', display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name / mobile"
              style={{ width: '100%', borderRadius: 12, border: 'none', background: '#F1F5F9', padding: '12px 12px 12px 38px', fontSize: 13, color: '#1E293B', outline: 'none', fontFamily: 'inherit' }} />
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></svg>
            </span>
          </div>
          <button style={{ width: 44, height: 44, borderRadius: 12, background: '#F1F5F9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6" /><line x1="7" y1="12" x2="17" y2="12" /><line x1="10" y1="18" x2="14" y2="18" /></svg>
          </button>
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : patients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>👥</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: 0 }}>{search ? 'No patients found' : 'No patients yet'}</p>
          </div>
        ) : patients.map((p, i) => {
          const initials = p.name.split(' ').map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
          const color = AVATAR_COLORS[i % AVATAR_COLORS.length]
          const status = pickStatus(p)
          const ageGender = [p.dob ? `${calcAge(p.dob)} yrs` : null, genderLabel(p.gender)].filter(Boolean).join(' · ')
          return (
            <button key={p.id}
              onClick={() => { selectPatient(p); navigate(`/patients/${p.id}`) }}
              style={{
                all: 'unset', cursor: 'pointer', background: '#FFFFFF',
                borderRadius: 16, padding: '14px 14px', display: 'flex',
                alignItems: 'center', gap: 14,
                boxShadow: '0 2px 8px rgba(30,79,163,0.06)',
              }}
            >
              {/* Avatar */}
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.5px' }}>{initials}</span>
              </div>

              {/* Identity */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </p>
                  {status && (
                    <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 800, color: status.fg, background: status.bg, borderRadius: 999, padding: '3px 8px', letterSpacing: '0.4px' }}>
                      {status.label}
                    </span>
                  )}
                </div>

                {ageGender && (
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 4px', fontWeight: 500 }}>{ageGender}</p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#475569', fontWeight: 600 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1E4FA3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.72 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0122 16.92z" />
                    </svg>
                    {formatPhone(p.phone)}
                  </span>
                  <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>
                    {formatJoined(p.createdAt)}
                  </span>
                </div>
              </div>

              {/* Chevron */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )
        })}
      </div>

      {/* FAB — anchored to mobile-shell (max 430px) right edge */}
      <div style={{ position: 'fixed', bottom: 96, left: 0, right: 0, pointerEvents: 'none', zIndex: 30, display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 430 }}>
          <button
            onClick={() => setCreateOpen(true)}
            aria-label="Create patient"
            style={{
              pointerEvents: 'auto',
              position: 'absolute', right: 16, bottom: 0,
              width: 56, height: 56, borderRadius: '50%', background: '#1E4FA3',
              border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(30,79,163,0.4)',
              color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {createOpen && (
        <CreatePatientSheet
          clinicId={cid}
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); refresh() }}
        />
      )}
    </motion.div>
  )
}

function genderLabel(g?: string): string {
  if (!g) return ''
  if (g === 'male') return 'Male'
  if (g === 'female') return 'Female'
  return 'Other'
}

/** Render a 10-digit Indian number as "98765 43210". */
function formatPhone(phone: string): string {
  const d = (phone ?? '').replace(/\D/g, '')
  if (d.length === 10) return `${d.slice(0, 5)} ${d.slice(5)}`
  if (d.length === 12 && d.startsWith('91')) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`
  return phone
}

/** Render the createdAt date as "Joined 5 May" or "Joined 5 May 2025" when older. */
function formatJoined(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const sameYear = d.getFullYear() === now.getFullYear()
  const dayMonth = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return sameYear ? `Joined ${dayMonth}` : `Joined ${dayMonth} ${d.getFullYear()}`
}

/**
 * Validate an Indian mobile number (10 digits, must start with 6/7/8/9,
 * cannot be all the same digit). Returns `null` when valid, otherwise the
 * human-readable error to render inline.
 */
function validatePhone(digits: string): string | null {
  if (digits.length === 0) return 'Mobile number is required'
  if (digits.length < 10)  return `Enter all 10 digits (${digits.length}/10)`
  if (digits.length > 10)  return 'Mobile number cannot exceed 10 digits'
  if (!/^[6-9]/.test(digits)) return 'Indian mobile must start with 6, 7, 8 or 9'
  if (/^(\d)\1{9}$/.test(digits)) return 'That doesn’t look like a real number'
  return null
}

// ─── Create-patient bottom sheet ────────────────────────────────────────

function CreatePatientSheet({ clinicId, onClose, onCreated }: { clinicId: string; onClose: () => void; onCreated: () => void }) {
  const [name, setName]     = useState('')
  const [phone, setPhone]   = useState('')
  const [email, setEmail]   = useState('')
  const [gender, setGender] = useState<'M' | 'F' | 'Other'>('M')
  const [dob, setDob]       = useState('')
  const [tag, setTag]       = useState<'new' | 'active' | 'follow-up' | 'critical'>('new')
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState<string | null>(null)

  const emailValid = !email || /^\S+@\S+\.\S+$/.test(email.trim())
  const phoneDigits = phone.replace(/\D/g, '')
  const phoneError = validatePhone(phoneDigits)
  const phoneValid = phoneError === null
  const valid = name.trim().length >= 2 && phoneValid && emailValid

  const submit = async () => {
    if (!valid || !clinicId) return
    setSaving(true); setErr(null)
    try {
      await patientService.create({
        name: name.trim(),
        phone: phone.replace(/\D/g, ''),
        gender,
        clinicId,
        email: email.trim() || undefined,
        dob: dob || undefined,
        tag,
      })
      onCreated()
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } }; message?: string })
      setErr(msg?.response?.data?.message || msg?.message || 'Failed to create patient')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{
          width: '100%', maxWidth: 430, background: '#FFFFFF',
          borderRadius: '28px 28px 0 0', padding: '14px 20px 28px',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E3EAF2', margin: '0 auto 16px' }} />

        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1E293B', margin: '0 0 4px' }}>New patient</h2>
        <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 18px' }}>Added to {clinicId ? 'this clinic' : 'your clinic'}</p>

        <Field label="Full name" required>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Ramesh" style={inputStyle} />
        </Field>

        <Field label="Mobile" required>
          <div style={{
            display: 'flex', alignItems: 'center',
            border: `1.5px solid ${phoneDigits.length > 0 && !phoneValid ? '#EF4444' : '#E3EAF2'}`,
            background: '#F5F8FC', borderRadius: 12, overflow: 'hidden',
          }}>
            <span style={{ padding: '0 10px 0 12px', fontSize: 13, fontWeight: 700, color: '#3D4A5B', borderRight: '1.5px solid #E3EAF2', alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}>+91</span>
            <input
              type="tel" inputMode="numeric" maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile"
              style={{ ...inputStyle, border: 'none', background: 'transparent', borderRadius: 0 }}
            />
            <span style={{ fontSize: 11, color: '#C8D4E0', paddingRight: 12, flexShrink: 0 }}>{phoneDigits.length}/10</span>
          </div>
          {phoneDigits.length > 0 && phoneError && (
            <p style={{ fontSize: 11, color: '#EF4444', margin: '4px 0 0 2px' }}>{phoneError}</p>
          )}
        </Field>

        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="optional"
            autoCapitalize="none"
            style={{
              ...inputStyle,
              borderColor: email && !emailValid ? '#EF4444' : '#E3EAF2',
            }}
          />
          {email && !emailValid && (
            <p style={{ fontSize: 11, color: '#EF4444', margin: '4px 0 0 2px' }}>Enter a valid email or leave blank</p>
          )}
        </Field>

        <Field label="Gender">
          <div style={{ display: 'flex', gap: 6 }}>
            {(['M', 'F', 'Other'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                style={{
                  flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                  border: gender === g ? '1.5px solid #1E4FA3' : '1.5px solid #E3EAF2',
                  background: gender === g ? '#EBF2FF' : '#FFFFFF',
                  color: gender === g ? '#1E4FA3' : '#475569',
                  fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                }}
              >
                {g === 'M' ? 'Male' : g === 'F' ? 'Female' : 'Other'}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Date of birth">
          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} style={inputStyle} />
        </Field>

        <Field label="Tag">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['new', 'active', 'follow-up', 'critical'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTag(t)}
                style={{
                  padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
                  border: tag === t ? '1.5px solid #1E4FA3' : '1.5px solid #E3EAF2',
                  background: tag === t ? '#EBF2FF' : '#FFFFFF',
                  color: tag === t ? '#1E4FA3' : '#475569',
                  fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                  textTransform: 'capitalize',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>

        {err && (
          <div style={{ marginTop: 6, fontSize: 12, color: '#B91C1C', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '8px 12px' }}>
            ⚠️ {err}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: 14, borderRadius: 14, background: '#FFFFFF', color: '#475569', border: '1.5px solid #E3EAF2', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
          <button onClick={submit} disabled={!valid || saving}
            style={{
              flex: 1.2, padding: 14, borderRadius: 14,
              background: !valid || saving ? '#C8D9F5' : '#1E4FA3',
              color: '#FFFFFF', border: 'none', fontSize: 13, fontWeight: 700,
              cursor: !valid || saving ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}>
            {saving ? 'Saving…' : 'Create patient'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', borderRadius: 12, border: '1.5px solid #E3EAF2', background: '#F5F8FC',
  padding: '12px 14px', fontSize: 14, fontWeight: 600, color: '#1E293B',
  outline: 'none', fontFamily: 'inherit',
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.4px', marginBottom: 6, textTransform: 'uppercase' }}>
        {label}{required && <span style={{ color: '#EF4444', marginLeft: 4 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

function pickStatus(p: Patient & { tag?: string }): { label: string; fg: string; bg: string } | null {
  if (p.tag === 'new')        return { label: 'NEW',       fg: '#D97706', bg: '#FEF3C7' }
  if (p.tag === 'follow-up')  return { label: 'FOLLOW-UP', fg: '#1E4FA3', bg: '#EBF2FF' }
  if (p.tag === 'critical')   return { label: 'CRITICAL',  fg: '#DC2626', bg: '#FEE2E2' }
  const ageDays = (Date.now() - new Date(p.createdAt).getTime()) / 86400000
  if (ageDays < 7) return { label: 'NEW', fg: '#D97706', bg: '#FEF3C7' }
  return null
}
