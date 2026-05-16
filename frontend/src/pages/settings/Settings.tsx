import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import { useAuthStore } from '@/store/auth'
import { usePermissions } from '@/hooks/usePermissions'
import { clinicsService } from '@/services/clinics.service'
import { toast } from '@/store/toast'
import api from '@/lib/axios'

/* ── Types ──────────────────────────────────────────────────────────────── */
type SettingsTab = 'clinic' | 'hours' | 'notifications' | 'billing' | 'security' | 'terms' | 'privacy'

const TABS: { key: SettingsTab; label: string; sub: string; icon: string }[] = [
  { key: 'clinic',        label: 'Clinic profile',     sub: 'Name, address & contact',   icon: 'building'  },
  { key: 'hours',         label: 'Working hours',      sub: 'Schedule & open days',       icon: 'clock'     },
  { key: 'security',      label: 'Security',           sub: 'Password & access',          icon: 'shield'    },
  { key: 'notifications', label: 'Notifications',      sub: 'Alerts & preferences',       icon: 'bell'      },
  { key: 'billing',       label: 'Billing & taxes',    sub: 'GSTIN, fees & invoices',     icon: 'receipt'   },
  { key: 'terms',         label: 'Terms',              sub: 'Terms & conditions',         icon: 'clipboard' },
  { key: 'privacy',       label: 'Privacy',            sub: 'Privacy policy & GDPR',      icon: 'lock'      },
]

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const DEFAULT_HOURS = DAYS.map((day, i) => ({
  day,
  active: i < 6,
  start: '09:00',
  end: i < 5 ? '20:00' : '18:00',
}))

/* ── Toggle ─────────────────────────────────────────────────────────────── */
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        flexShrink: 0, width: 44, height: 24, borderRadius: 12,
        border: 'none', cursor: 'pointer',
        background: on ? 'var(--brand-gradient)' : 'var(--border-soft)',
        position: 'relative', transition: 'background 0.2s',
      }}
      role="switch"
      aria-checked={on}
    >
      <span style={{
        position: 'absolute', top: 2, left: on ? 22 : 2,
        width: 20, height: 20, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

/* ── Section heading ────────────────────────────────────────────────────── */
function SectionHead({ title, desc }: { title: string; desc?: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--fg-primary)' }}>{title}</div>
      {desc && <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 3 }}>{desc}</div>}
    </div>
  )
}

/* ── View-only notice ───────────────────────────────────────────────────── */
function ViewOnlyBanner() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 16px', borderRadius: 10, marginBottom: 20,
      background: 'var(--bg-section)', border: '1px solid var(--border-soft)',
      fontSize: 13, color: 'var(--fg-secondary)',
    }}>
      <Icon name="lock" size={14} />
      <span>View only — contact your administrator to make changes.</span>
    </div>
  )
}

/* ── Clinic Profile tab ─────────────────────────────────────────────────── */
function ClinicProfileTab({ clinic, clinicId, onSaved, readOnly }: { clinic: any; clinicId: string; onSaved: (c: any) => void; readOnly: boolean }) {
  const [form, setForm] = useState({
    name:    clinic.name    ?? '',
    code:    clinic.code    ?? '',
    address: clinic.address ?? '',
    city:    clinic.city    ?? '',
    state:   clinic.state   ?? '',
    pincode: clinic.pincode ?? '',
    phone:   clinic.phone   ?? '',
    email:   clinic.email   ?? '',
    type:    clinic.type    ?? '',
    about:   clinic.about   ?? '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    setSaving(true)
    try {
      const updated = await clinicsService.update(clinicId, form)
      onSaved(updated)
      toast.success('Clinic profile saved')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const initials = form.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'CL'

  const ro = readOnly
    ? { readOnly: true, style: { background: 'var(--bg-section)', cursor: 'default' } as React.CSSProperties }
    : {}

  return (
    <div>
      {readOnly && <ViewOnlyBanner />}

      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
        <div className="av blue" style={{ width: 64, height: 64, fontSize: 22, borderRadius: 16 }}>{initials}</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-primary)' }}>{form.name || 'Clinic name'}</div>
          <div style={{ fontSize: 12.5, color: 'var(--fg-secondary)', marginTop: 2 }}>{form.type || 'Type'} · {form.city || 'City'}</div>
        </div>
        {!readOnly && (
          <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>
            <Icon name="upload" size={14} /> Replace logo
          </button>
        )}
      </div>

      <div className="card">
        <SectionHead title="Basic information" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="form-group">
            <label className="form-label">Clinic name</label>
            <input className="form-input" value={form.name} onChange={set('name')} {...ro} />
          </div>
          <div className="form-group">
            <label className="form-label">Token prefix (code)</label>
            <input className="form-input" value={form.code} onChange={set('code')} maxLength={6} {...ro} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Address</label>
            <textarea className="form-textarea" rows={2} value={form.address} onChange={set('address')} {...ro} />
          </div>
          <div className="form-group">
            <label className="form-label">City</label>
            <input className="form-input" value={form.city} onChange={set('city')} {...ro} />
          </div>
          <div className="form-group">
            <label className="form-label">State</label>
            <input className="form-input" value={form.state} onChange={set('state')} {...ro} />
          </div>
          <div className="form-group">
            <label className="form-label">Pincode</label>
            <input className="form-input" value={form.pincode} onChange={set('pincode')} {...ro} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={form.phone} onChange={set('phone')} {...ro} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={set('email')} {...ro} />
          </div>
          <div className="form-group">
            <label className="form-label">Clinic type</label>
            <input className="form-input" value={form.type} onChange={set('type')} placeholder="e.g. Multi-specialty" {...ro} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">About</label>
            <textarea className="form-textarea" rows={3} value={form.about} onChange={set('about')} placeholder="Brief description…" {...ro} />
          </div>
        </div>
        {!readOnly && (
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" disabled={saving} onClick={save}>
              <Icon name="check" size={14} /> {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Working Hours tab ──────────────────────────────────────────────────── */
type DayRow = { day: string; active: boolean; start: string; end: string }

function initHours(clinic: any): DayRow[] {
  if (Array.isArray(clinic?.workingHours) && clinic.workingHours.length === 7) {
    return clinic.workingHours
  }
  return DEFAULT_HOURS
}

function WorkingHoursTab({ clinic, clinicId, onSaved, readOnly }: { clinic: any; clinicId: string; onSaved: (c: any) => void; readOnly: boolean }) {
  const [saved,  setSaved]  = useState<DayRow[]>(() => initHours(clinic))
  const [hours,  setHours]  = useState<DayRow[]>(() => initHours(clinic))
  const [saving, setSaving] = useState(false)

  // Sync when clinic data arrives from async fetch
  useEffect(() => {
    const h = initHours(clinic)
    setSaved(h)
    setHours(h)
  }, [clinic])

  const isDirty = JSON.stringify(hours) !== JSON.stringify(saved)

  const update = (i: number, patch: Partial<DayRow>) =>
    setHours(h => h.map((d, idx) => idx === i ? { ...d, ...patch } : d))

  const discard = () => setHours(saved)

  const save = async () => {
    setSaving(true)
    try {
      const updated = await clinicsService.update(clinicId, { workingHours: hours })
      onSaved(updated)
      setSaved(hours)
      toast.success('Working hours saved')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const roStyle: React.CSSProperties = { background: 'var(--bg-section)', cursor: 'default' }

  return (
    <div>
      {readOnly && <ViewOnlyBanner />}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--fg-primary)' }}>Weekly schedule</div>
            <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 3 }}>
              Clinic operating hours for each day of the week
            </div>
          </div>
          {!readOnly && isDirty && (
            <span style={{ fontSize: 11.5, color: 'var(--warning-500)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warning-500)', display: 'inline-block' }} />
              Unsaved changes
            </span>
          )}
        </div>

        {/* Summary chips (view mode) */}
        {readOnly && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {hours.map(d => (
              <span key={d.day} style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: d.active ? 'var(--brand-gradient-soft)' : 'var(--bg-section)',
                color: d.active ? 'var(--teal-700)' : 'var(--fg-muted)',
                border: `1px solid ${d.active ? 'rgba(31,163,168,0.2)' : 'var(--border-soft)'}`,
              }}>
                {d.day.slice(0, 3)}{d.active ? ` · ${d.start}–${d.end}` : ' · Closed'}
              </span>
            ))}
          </div>
        )}

        {/* Editable rows */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {hours.map((day, i) => (
            <div key={day.day} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '11px 0',
              borderBottom: i < hours.length - 1 ? '1px solid var(--border-light)' : 'none',
            }}>
              {/* Day name */}
              <div style={{ width: 100, fontSize: 13.5, fontWeight: 600, color: 'var(--fg-primary)', flexShrink: 0 }}>
                {day.day}
              </div>

              {/* Open/Closed toggle */}
              <Toggle on={day.active} onChange={readOnly ? () => {} : v => update(i, { active: v })} />

              {/* Status / time inputs */}
              {day.active ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <input
                    type="time" className="form-input"
                    style={{ width: 120, ...(readOnly ? roStyle : {}) }}
                    value={day.start}
                    onChange={e => update(i, { start: e.target.value })}
                    readOnly={readOnly}
                  />
                  <span style={{ fontSize: 13, color: 'var(--fg-muted)', flexShrink: 0 }}>to</span>
                  <input
                    type="time" className="form-input"
                    style={{ width: 120, ...(readOnly ? roStyle : {}) }}
                    value={day.end}
                    onChange={e => update(i, { end: e.target.value })}
                    readOnly={readOnly}
                  />
                  {!readOnly && (
                    <span style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginLeft: 4 }}>
                      {(() => {
                        const [sh, sm] = day.start.split(':').map(Number)
                        const [eh, em] = day.end.split(':').map(Number)
                        const mins = (eh * 60 + em) - (sh * 60 + sm)
                        if (mins <= 0) return ''
                        const h = Math.floor(mins / 60), m = mins % 60
                        return `${h}h${m ? ` ${m}m` : ''}`
                      })()}
                    </span>
                  )}
                </div>
              ) : (
                <span style={{ fontSize: 13, color: 'var(--fg-muted)', fontStyle: 'italic' }}>Closed</span>
              )}
            </div>
          ))}
        </div>

        {/* Action row */}
        {!readOnly && (
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
            {isDirty && (
              <button className="btn btn-ghost btn-sm" onClick={discard} disabled={saving}>
                Discard changes
              </button>
            )}
            <button className="btn btn-primary" disabled={saving || !isDirty} onClick={save}>
              <Icon name="check" size={14} /> {saving ? 'Saving…' : 'Save hours'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Notifications tab ──────────────────────────────────────────────────── */
const NOTIF_ROWS = [
  { key: 'sms',         title: 'SMS to staff',   subtitle: 'Send appointment and queue updates via SMS to staff members.' },
  { key: 'email',       title: 'Email digest',   subtitle: 'Daily summary email with patient stats and billing overview.' },
  { key: 'browser',     title: 'Browser push',   subtitle: 'Real-time browser notifications for new tokens and alerts.' },
  { key: 'queueAlerts', title: 'Queue alerts',   subtitle: 'Alert when queue exceeds threshold or token wait > 30 min.' },
] as const

function NotificationsTab({ clinic, clinicId, onSaved, readOnly }: { clinic: any; clinicId: string; onSaved: (c: any) => void; readOnly: boolean }) {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    sms:         clinic.notifications?.sms         ?? true,
    email:       clinic.notifications?.email       ?? true,
    browser:     clinic.notifications?.browser     ?? false,
    queueAlerts: clinic.notifications?.queueAlerts ?? true,
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const updated = await clinicsService.update(clinicId, { notifications: toggles })
      onSaved(updated)
      toast.success('Notification preferences saved')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {readOnly && <ViewOnlyBanner />}
      <div className="card">
        <SectionHead title="Notification preferences" desc="Control how the clinic and staff receive system notifications." />
        {NOTIF_ROWS.map((row, i) => (
          <div key={row.key} style={{
            display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0',
            borderBottom: i < NOTIF_ROWS.length - 1 ? '1px solid var(--border-light)' : 'none',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-primary)' }}>{row.title}</div>
              <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 3 }}>{row.subtitle}</div>
            </div>
            <Toggle on={toggles[row.key]} onChange={readOnly ? () => {} : v => setToggles(t => ({ ...t, [row.key]: v }))} />
          </div>
        ))}
        {!readOnly && (
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" disabled={saving} onClick={save}>
              <Icon name="check" size={14} /> {saving ? 'Saving…' : 'Save preferences'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Billing tab ────────────────────────────────────────────────────────── */
function BillingTab({ clinic, clinicId, onSaved, readOnly }: { clinic: any; clinicId: string; onSaved: (c: any) => void; readOnly: boolean }) {
  const [form, setForm] = useState({
    gstin:        clinic.gstin        ?? '',
    currency:     clinic.currency     ?? 'INR',
    defaultFee:   String(clinic.defaultFee  ?? '600'),
    taxRate:      String(clinic.taxRate     ?? '18'),
    invoiceNotes: clinic.invoiceNotes ?? '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    setSaving(true)
    try {
      const updated = await clinicsService.update(clinicId, {
        gstin:        form.gstin,
        currency:     form.currency,
        defaultFee:   Number(form.defaultFee)  || 0,
        taxRate:      Number(form.taxRate)      || 0,
        invoiceNotes: form.invoiceNotes,
      })
      onSaved(updated)
      toast.success('Billing settings saved')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const ro = readOnly
    ? { readOnly: true, style: { background: 'var(--bg-section)', cursor: 'default' } as React.CSSProperties }
    : {}

  return (
    <div>
      {readOnly && <ViewOnlyBanner />}
      <div className="card">
        <SectionHead title="Billing configuration" desc="GSTIN, default fees, and invoice preferences." />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="form-group">
            <label className="form-label">GSTIN</label>
            <input className="form-input" value={form.gstin} onChange={set('gstin')} placeholder="e.g. 29AABCS1429B1ZB" {...ro} />
          </div>
          <div className="form-group">
            <label className="form-label">Currency</label>
            <select className="form-input" value={form.currency} onChange={set('currency')} disabled={readOnly}
              style={readOnly ? { background: 'var(--bg-section)', cursor: 'default' } : {}}>
              <option value="INR">INR — Indian Rupee</option>
              <option value="USD">USD — US Dollar</option>
              <option value="AED">AED — UAE Dirham</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Default consult fee</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--fg-muted)', fontWeight: 600 }}>
                {form.currency === 'INR' ? '₹' : form.currency === 'USD' ? '$' : 'د.إ'}
              </span>
              <input className="form-input" type="number" value={form.defaultFee} onChange={set('defaultFee')}
                style={{ paddingLeft: 28, ...(readOnly ? { background: 'var(--bg-section)', cursor: 'default' } : {}) }}
                readOnly={readOnly} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Tax %</label>
            <input className="form-input" type="number" value={form.taxRate} onChange={set('taxRate')} placeholder="18" {...ro} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Invoice notes</label>
            <textarea className="form-textarea" rows={3} value={form.invoiceNotes} onChange={set('invoiceNotes')} placeholder="Notes printed on every invoice…" {...ro} />
          </div>
        </div>

        {/* Preview */}
        <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: 10, background: 'var(--bg-section)', border: '1px solid var(--border-soft)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-muted)', marginBottom: 10 }}>Invoice preview</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span>Consultation fee</span>
            <span>{form.currency} {form.defaultFee}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--fg-secondary)', marginTop: 6 }}>
            <span>GST ({form.taxRate}%)</span>
            <span>+ {form.currency} {(Number(form.defaultFee) * Number(form.taxRate) / 100).toFixed(0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-light)' }}>
            <span>Total</span>
            <span>{form.currency} {(Number(form.defaultFee) * (1 + Number(form.taxRate) / 100)).toFixed(0)}</span>
          </div>
        </div>

        {!readOnly && (
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" disabled={saving} onClick={save}>
              <Icon name="check" size={14} /> {saving ? 'Saving…' : 'Save billing'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Security tab ───────────────────────────────────────────────────────── */
/* ── Password strength helper ───────────────────────────────────────────── */
function pwStrength(pw: string): { score: 0|1|2|3|4; label: string; color: string; checks: { label: string; ok: boolean }[] } {
  const checks = [
    { label: 'At least 6 characters',      ok: pw.length >= 6   },
    { label: 'One uppercase letter (A–Z)',  ok: /[A-Z]/.test(pw) },
    { label: 'One lowercase letter (a–z)',  ok: /[a-z]/.test(pw) },
    { label: 'One number (0–9)',            ok: /[0-9]/.test(pw) },
    { label: 'One special character',       ok: /[^A-Za-z0-9]/.test(pw) },
  ]
  const passed = Math.min(4, checks.filter(c => c.ok).length) as 0|1|2|3|4
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', 'var(--danger-500)', 'var(--warning-500)', 'var(--info-500)', 'var(--success-500)']
  return { score: passed, label: labels[passed], color: colors[passed], checks }
}

function SecurityTab({ userId: _userId }: { userId: string }) {
  const [pwd,      setPwd]      = useState({ cur: '', nxt: '', confirm: '' })
  const [show,     setShow]     = useState({ cur: false, nxt: false, confirm: false })
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)

  const strength = pwStrength(pwd.nxt)
  const pwMatch  = pwd.nxt.length > 0 && pwd.confirm.length > 0 && pwd.nxt === pwd.confirm
  const canSubmit = pwd.cur.length > 0 && pwd.nxt.length >= 6 && pwMatch && !saving

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!pwd.cur)              { setError('Current password is required.'); return }
    if (pwd.nxt.length < 6)   { setError('New password must be at least 6 characters.'); return }
    if (pwd.nxt !== pwd.confirm) { setError('New passwords do not match.'); return }
    if (pwd.cur === pwd.nxt)  { setError('New password must differ from the current password.'); return }

    setSaving(true)
    try {
      await api.put('/auth/change-password', {
        oldPassword: pwd.cur,
        newPassword: pwd.nxt,
      })
      setPwd({ cur: '', nxt: '', confirm: '' })
      setShow({ cur: false, nxt: false, confirm: false })
      setSuccess(true)
      toast.success('Password changed successfully')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const eyeBtn = (field: 'cur' | 'nxt' | 'confirm') => (
    <button
      type="button"
      tabIndex={-1}
      onClick={() => setShow(s => ({ ...s, [field]: !s[field] }))}
      style={{
        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--fg-muted)', lineHeight: 0, padding: 2,
      }}
      title={show[field] ? 'Hide' : 'Show'}
    >
      <Icon name="eye" size={16} />
    </button>
  )

  return (
    <div>
      <div className="card">
        <SectionHead title="Change password" desc="Use a strong password you haven't used before." />

        {/* Error banner */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--danger-100)', color: 'var(--danger-500)',
            borderRadius: 10, padding: '10px 14px', fontSize: 13,
            border: '1px solid rgba(239,68,68,0.2)', fontWeight: 500, marginBottom: 18,
          }}>
            <Icon name="x" size={14} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Success banner */}
        {success && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--success-100)', color: 'var(--success-500)',
            borderRadius: 10, padding: '10px 14px', fontSize: 13,
            border: '1px solid rgba(34,197,94,0.2)', fontWeight: 500, marginBottom: 18,
          }}>
            <Icon name="check" size={14} style={{ flexShrink: 0 }} />
            Password changed successfully. Keep it safe!
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Current password */}
          <div className="form-group">
            <label className="form-label required">Current password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={show.cur ? 'text' : 'password'}
                style={{ paddingRight: 38 }}
                value={pwd.cur}
                onChange={e => { setPwd(p => ({ ...p, cur: e.target.value })); setError(''); setSuccess(false) }}
                autoComplete="current-password"
                placeholder="Enter current password"
              />
              {eyeBtn('cur')}
            </div>
          </div>

          {/* New password */}
          <div className="form-group">
            <label className="form-label required">New password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={show.nxt ? 'text' : 'password'}
                style={{ paddingRight: 38 }}
                value={pwd.nxt}
                onChange={e => { setPwd(p => ({ ...p, nxt: e.target.value })); setError(''); setSuccess(false) }}
                autoComplete="new-password"
                placeholder="Min 6 characters"
              />
              {eyeBtn('nxt')}
            </div>

            {/* Strength bar */}
            {pwd.nxt.length > 0 && (
              <>
                <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                  {[1,2,3,4].map(n => (
                    <div key={n} style={{
                      flex: 1, height: 4, borderRadius: 4,
                      background: n <= strength.score ? strength.color : 'var(--border-soft)',
                      transition: 'background 0.2s',
                    }} />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {strength.checks.map(c => (
                      <span key={c.label} style={{ fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 5, color: c.ok ? 'var(--success-500)' : 'var(--fg-muted)' }}>
                        <span style={{ fontWeight: 700 }}>{c.ok ? '✓' : '·'}</span> {c.label}
                      </span>
                    ))}
                  </div>
                  {strength.score > 0 && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: strength.color, alignSelf: 'flex-start' }}>
                      {strength.label}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Confirm password */}
          <div className="form-group">
            <label className="form-label required">Confirm new password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={show.confirm ? 'text' : 'password'}
                style={{
                  paddingRight: 38,
                  borderColor: pwd.confirm.length > 0
                    ? (pwMatch ? 'var(--success-500)' : 'var(--danger-500)')
                    : undefined,
                }}
                value={pwd.confirm}
                onChange={e => { setPwd(p => ({ ...p, confirm: e.target.value })); setError('') }}
                autoComplete="new-password"
                placeholder="Re-enter new password"
              />
              {eyeBtn('confirm')}
            </div>
            {pwd.confirm.length > 0 && (
              <div style={{ fontSize: 12, marginTop: 5, fontWeight: 500, color: pwMatch ? 'var(--success-500)' : 'var(--danger-500)' }}>
                {pwMatch ? '✓ Passwords match' : 'Passwords do not match'}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
              <Icon name="lock" size={14} />
              {saving ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Terms tab ──────────────────────────────────────────────────────────── */
function TermsTab() {
  const toc = ['1. Acceptance of terms','2. Use of services','3. Account responsibilities','4. Appointments & bookings','5. Payments & refunds','6. Limitation of liability','7. Termination','8. Governing law']
  const ids = ['acceptance','use','account','appointments','payments','liability','termination','governing']

  return (
    <article className="legal-doc" style={{ maxWidth: '100%', width: '100%' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
        {[
          { label: 'Version', val: '3.2' },
          { label: 'Effective', val: '1 May 2026' },
          { label: 'Jurisdiction', val: 'India · Karnataka' },
          { label: 'Accepted on', val: '4 May 2026', green: true },
        ].map(m => (
          <div key={m.label} style={{ padding: '6px 14px', borderRadius: 8, background: 'var(--bg-section)', border: '1px solid var(--border-soft)', fontSize: 12.5 }}>
            <span style={{ color: 'var(--fg-muted)' }}>{m.label}: </span>
            <span style={{ fontWeight: 600, color: m.green ? 'var(--success-500)' : 'var(--fg-primary)' }}>{m.val}</span>
          </div>
        ))}
      </div>
      <div className="card" style={{ marginBottom: 28, padding: '16px 20px' }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: 'var(--fg-primary)' }}>Table of contents</div>
        <ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 32px' }}>
          {toc.map((t, i) => (
            <li key={i} style={{ fontSize: 13 }}>
              <a href={`#${ids[i]}`} style={{ color: 'var(--teal-600)', textDecoration: 'none' }}>{t}</a>
            </li>
          ))}
        </ol>
      </div>
      <section id="acceptance"><h3>1. Acceptance of terms</h3><p>By accessing or using the NoQ Health platform ("Platform"), you ("Clinic", "User") agree to be bound by these Terms and Conditions. If you do not agree to these Terms, you must immediately cease using the Platform. These Terms constitute a legally binding agreement between you and NoQ Health Pvt. Ltd. ("Company").</p></section>
      <section id="use"><h3>2. Use of services</h3><p>The Platform is provided exclusively for lawful healthcare administration purposes, including appointment scheduling, patient queue management, billing, and clinical record keeping. You may not reverse-engineer, copy, sublicense, or distribute any part of the Platform without prior written consent.</p></section>
      <section id="account"><h3>3. Account responsibilities</h3><p>You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. Notify us immediately at <a href="mailto:security@noq.health" style={{ color: 'var(--teal-600)' }}>security@noq.health</a> upon any unauthorized use.</p></section>
      <section id="appointments"><h3>4. Appointments & bookings</h3><p>The Platform facilitates appointment bookings between clinics and patients. The clinic is solely responsible for confirming, rescheduling, or cancelling appointments and for ensuring accurate availability. The Company is not a healthcare provider.</p></section>
      <section id="payments"><h3>5. Payments & refunds</h3><p>Subscription fees are billed in advance monthly or annually. All fees are exclusive of applicable taxes. Refunds for unused subscription periods are not provided except as required by law. Billing disputes must be raised within 30 days to <a href="mailto:billing@noq.health" style={{ color: 'var(--teal-600)' }}>billing@noq.health</a>.</p></section>
      <section id="liability"><h3>6. Limitation of liability</h3><p>The Company shall not be liable for any indirect, incidental, special, consequential, or punitive damages. The Company's total liability shall not exceed fees paid in the three months preceding the event giving rise to the claim.</p></section>
      <section id="termination"><h3>7. Termination</h3><p>Either party may terminate with 30 days' written notice. The Company may suspend access immediately for material breach. Upon termination, you may request a data export within 30 days.</p></section>
      <section id="governing"><h3>8. Governing law</h3><p>These Terms are governed by the laws of India. Disputes are subject to the exclusive jurisdiction of courts in Bengaluru, Karnataka. Contact: <a href="mailto:legal@noq.health" style={{ color: 'var(--teal-600)' }}>legal@noq.health</a>.</p></section>
      <div style={{ display: 'flex', gap: 12, marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border-light)' }}>
        <button className="btn btn-secondary"><Icon name="download" size={14} /> Download PDF</button>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }}><Icon name="check" size={14} /> I accept</button>
      </div>
    </article>
  )
}

/* ── Privacy tab ────────────────────────────────────────────────────────── */
function PrivacyTab() {
  const toc = ['1. Information we collect','2. How we use information','3. Sharing of information','4. Data retention','5. Your rights (GDPR & DPDPA)','6. Security','7. Cookies','8. Contact us']
  const ids = ['collect','use','sharing','retention','rights','security','cookies','contact']

  return (
    <article className="legal-doc" style={{ maxWidth: '100%', width: '100%' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
        {[
          { label: 'Version', val: '2.4' },
          { label: 'Effective', val: '1 May 2026' },
          { label: 'Data controller', val: 'NoQ Health Pvt. Ltd.' },
          { label: 'DPO', val: 'dpo@noq.health' },
        ].map(m => (
          <div key={m.label} style={{ padding: '6px 14px', borderRadius: 8, background: 'var(--bg-section)', border: '1px solid var(--border-soft)', fontSize: 12.5 }}>
            <span style={{ color: 'var(--fg-muted)' }}>{m.label}: </span>
            <span style={{ fontWeight: 600, color: 'var(--fg-primary)' }}>{m.val}</span>
          </div>
        ))}
      </div>
      <div className="card" style={{ marginBottom: 28, padding: '16px 20px' }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: 'var(--fg-primary)' }}>Table of contents</div>
        <ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 32px' }}>
          {toc.map((t, i) => (
            <li key={i} style={{ fontSize: 13 }}>
              <a href={`#${ids[i]}`} style={{ color: 'var(--teal-600)', textDecoration: 'none' }}>{t}</a>
            </li>
          ))}
        </ol>
      </div>
      <section id="collect"><h3>1. Information we collect</h3><p>We collect information you provide directly, including clinic name, registration details, staff profiles, and billing information. We also collect patient information entered on your behalf. We automatically collect usage data, log files, and IP addresses.</p></section>
      <section id="use"><h3>2. How we use information</h3><p>We use collected information to provide and improve the Platform, process transactions, send administrative messages, and monitor usage patterns. We do not sell or rent personal data to third parties.</p></section>
      <section id="sharing"><h3>3. Sharing of information</h3><p>We share information with third-party service providers (cloud hosting, payment processing, SMS delivery) under confidentiality agreements. We may disclose information to comply with applicable law or to protect rights and safety.</p></section>
      <section id="retention"><h3>4. Data retention</h3><p>Clinic data is retained for the duration of your subscription and 30 days after termination. Backup copies may be retained up to 90 days for disaster recovery before secure destruction.</p></section>
      <section id="rights"><h3>5. Your rights (GDPR & DPDPA)</h3><p>Under applicable law you have rights of access, correction, erasure, restriction, portability, and objection. Contact our DPO at <a href="mailto:dpo@noq.health" style={{ color: 'var(--teal-600)' }}>dpo@noq.health</a>.</p></section>
      <section id="security"><h3>6. Security</h3><p>We implement AES-256 encryption at rest, TLS 1.3 in transit, role-based access controls, and regular penetration testing. In the event of a data breach we will notify affected parties within 72 hours.</p></section>
      <section id="cookies"><h3>7. Cookies</h3><p>The Platform uses strictly necessary cookies for authentication and first-party analytics cookies. We do not use third-party advertising cookies. You can configure your browser to refuse cookies.</p></section>
      <section id="contact"><h3>8. Contact us</h3><p><strong>NoQ Health Pvt. Ltd.</strong><br />12, 6th Main Rd, Koramangala 6th Block, Bengaluru 560095, India<br />Email: <a href="mailto:dpo@noq.health" style={{ color: 'var(--teal-600)' }}>dpo@noq.health</a></p></section>
      <div style={{ display: 'flex', gap: 12, marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border-light)', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary"><Icon name="download" size={14} /> Download PDF</button>
        <button className="btn btn-secondary"><Icon name="user" size={14} /> Request my data</button>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }}><Icon name="check" size={14} /> Acknowledge</button>
      </div>
    </article>
  )
}

/* ── Settings page ──────────────────────────────────────────────────────── */
export default function Settings() {
  const { user } = useAuthStore()
  const { isRole } = usePermissions()
  const [tab,     setTab]     = useState<SettingsTab>('clinic')
  const [clinic,  setClinic]  = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const canEdit  = isRole('super_admin', 'clinic_admin')
  const clinicId = user?.clinicId ?? ''

  // If billing tab is active but user can't see it, fall back to clinic tab
  useEffect(() => {
    if (tab === 'billing' && !canEdit) setTab('clinic')
  }, [tab, canEdit])

  useEffect(() => {
    if (!clinicId) { setLoading(false); return }
    clinicsService.get(clinicId)
      .then(setClinic)
      .catch(() => toast.error('Failed to load clinic settings'))
      .finally(() => setLoading(false))
  }, [clinicId])

  /* Tabs that need clinic data */
  const needsClinic = ['clinic', 'hours', 'notifications', 'billing'].includes(tab)

  let content: React.ReactNode

  if (needsClinic && loading) {
    content = (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--fg-muted)', fontSize: 14 }}>
        Loading…
      </div>
    )
  } else if (needsClinic && !clinic) {
    content = (
      <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--fg-muted)' }}>
        <Icon name="building" size={32} />
        <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600 }}>No clinic associated</div>
        <div style={{ fontSize: 12.5, marginTop: 4 }}>Your account is not linked to a clinic. Contact your administrator.</div>
      </div>
    )
  } else {
    switch (tab) {
      case 'clinic':
        content = <ClinicProfileTab clinic={clinic} clinicId={clinicId} onSaved={setClinic} readOnly={!canEdit} />
        break
      case 'hours':
        content = <WorkingHoursTab clinic={clinic} clinicId={clinicId} onSaved={setClinic} readOnly={!canEdit} />
        break
      case 'notifications':
        content = <NotificationsTab clinic={clinic} clinicId={clinicId} onSaved={setClinic} readOnly={!canEdit} />
        break
      case 'billing':
        content = <BillingTab clinic={clinic} clinicId={clinicId} onSaved={setClinic} readOnly={!canEdit} />
        break
      case 'security':
        content = <SecurityTab userId={user?.id ?? ''} />
        break
      case 'terms':
        content = <TermsTab />
        break
      case 'privacy':
        content = <PrivacyTab />
        break
    }
  }

  return (
    <>
      <Header title="Settings" crumbs="Account · Settings" />
      <div className="main">
        {/* Horizontal underline tab bar */}
        <div style={{
          display: 'flex', gap: 0, marginBottom: 0,
          borderBottom: '1px solid var(--border-soft)',
          background: 'var(--bg-surface)',
          borderRadius: '12px 12px 0 0',
          padding: '0 4px',
        }}>
          {TABS.filter(t => t.key !== 'billing' || canEdit).map(t => {
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: active ? '2px solid var(--brand-500, #3b82f6)' : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                <Icon name={t.icon as any} size={16} style={{ color: active ? 'var(--brand-500, #3b82f6)' : 'var(--fg-muted)' }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: active ? 'var(--brand-500, #3b82f6)' : 'var(--fg-secondary)', lineHeight: 1.2 }}>{t.label}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', fontWeight: 400, marginTop: 1 }}>{t.sub}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Content area */}
        <div style={{
          background: 'var(--bg-surface)',
          borderRadius: '0 0 12px 12px',
          border: '1px solid var(--border-soft)',
          borderTop: 'none',
          padding: 24,
        }}>
          {content}
        </div>
      </div>
    </>
  )
}
