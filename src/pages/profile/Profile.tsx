import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/app'
import Icon from '@/components/ui/Icon'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'info' | 'contact' | 'preferences' | 'permissions' | 'activity'
type ThemeOption = 'Light' | 'Dark' | 'System'
type DensityOption = 'Compact' | 'Default' | 'Comfortable'

interface ProfileData {
  // Identity
  firstName: string
  lastName: string
  dob: string
  gender: string
  bloodGroup: string
  // Employment
  employeeId: string
  designation: string
  role: string
  joined: string
  clinic: string
  shift: string
  // About
  bio: string
  // Contact
  email: string
  mobile: string
  altPhone: string
  street: string
  city: string
  state: string
  pin: string
  emergencyName: string
  emergencyPhone: string
  emergencyRel: string
  // Preferences
  languages: string[]
  timezone: string
  theme: ThemeOption
  density: DensityOption
  notifEmail: boolean
  notifSms: boolean
  notifDesktop: boolean
  notifDigest: boolean
}

interface Permission {
  module: string
  granted: boolean
}

interface ActivityRow {
  time: string
  event: string
  device: string
  ip: string
}

// ─── Static seed data ─────────────────────────────────────────────────────────

const INITIAL: ProfileData = {
  firstName: 'Reena',
  lastName: 'Aggarwal',
  dob: '1992-03-14',
  gender: 'F',
  bloodGroup: 'B+',
  employeeId: 'FD-001',
  designation: 'Lead Receptionist',
  role: 'Reception',
  joined: '2022-03-01',
  clinic: 'Sunshine Clinic',
  shift: 'Morning',
  bio: 'Experienced front-desk professional with 4+ years in clinic administration. Specialises in patient intake, token management and scheduling.',
  email: 'reena.aggarwal@sunshine.clinic',
  mobile: '+91 98765 43210',
  altPhone: '+91 11 2345 6789',
  street: '12-B, Sector 18, Noida',
  city: 'Noida',
  state: 'Uttar Pradesh',
  pin: '201301',
  emergencyName: 'Amit Aggarwal',
  emergencyPhone: '+91 98100 00001',
  emergencyRel: 'Spouse',
  languages: ['English', 'Hindi'],
  timezone: 'Asia/Kolkata (IST, UTC+5:30)',
  theme: 'Light',
  density: 'Default',
  notifEmail: true,
  notifSms: true,
  notifDesktop: false,
  notifDigest: true,
}

const INITIAL_PERMS: Permission[] = [
  { module: 'Bookings',    granted: true  },
  { module: 'Tokens',      granted: true  },
  { module: 'Patients',    granted: true  },
  { module: 'Doctors',     granted: false },
  { module: 'Clinics',     granted: false },
  { module: 'Billing',     granted: true  },
  { module: 'Reports',     granted: false },
  { module: 'Pharmacy',    granted: true  },
  { module: 'Lab',         granted: true  },
  { module: 'Support',     granted: true  },
  { module: 'Settings',    granted: false },
  { module: 'Master Data', granted: false },
]

const ACTIVITY: ActivityRow[] = [
  { time: '13 May 2026, 09:14 AM', event: 'Signed in from Chrome / Windows',          device: 'Chrome 124 · Windows 11',    ip: '103.21.45.200' },
  { time: '12 May 2026, 05:32 PM', event: 'Updated patient record #PAT-2891',           device: 'Chrome 124 · Windows 11',    ip: '103.21.45.200' },
  { time: '12 May 2026, 11:00 AM', event: 'Issued token T-042 for Dr Sharma',           device: 'Chrome 124 · Windows 11',    ip: '103.21.45.200' },
  { time: '10 May 2026, 02:15 PM', event: 'Profile info updated',                       device: 'Safari · iPhone 15 Pro',     ip: '49.36.100.12'  },
  { time: '09 May 2026, 09:01 AM', event: 'Signed in from Safari / iOS',                device: 'Safari · iPhone 15 Pro',     ip: '49.36.100.12'  },
  { time: '07 May 2026, 04:44 PM', event: 'Password changed',                           device: 'Chrome 124 · Windows 11',    ip: '103.21.45.200' },
  { time: '06 May 2026, 10:30 AM', event: 'Billing entry #INV-7821 raised',             device: 'Chrome 124 · Windows 11',    ip: '103.21.45.200' },
  { time: '01 May 2026, 08:55 AM', event: '2FA enabled for account',                   device: 'Chrome 124 · Windows 11',    ip: '103.21.45.200' },
]

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
const GENDERS      = [{ v: 'M', l: 'Male' }, { v: 'F', l: 'Female' }, { v: 'Other', l: 'Other' }]
const SHIFTS       = ['Morning', 'Afternoon', 'Evening', 'Night', 'Rotational']
const ALL_LANGS    = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Marathi', 'Bengali', 'Gujarati']
const TIMEZONES    = ['Asia/Kolkata (IST, UTC+5:30)', 'Asia/Dubai (GST, UTC+4)', 'Asia/Singapore (SGT, UTC+8)', 'Europe/London (BST, UTC+1)', 'America/New_York (EDT, UTC-4)']
const THEMES: ThemeOption[]    = ['Light', 'Dark', 'System']
const DENSITIES: DensityOption[] = ['Compact', 'Default', 'Comfortable']

// ─── Small helpers ────────────────────────────────────────────────────────────

function RoVal({ v, muted = false }: { v: string; muted?: boolean }) {
  return <span className="ro-val" style={muted ? { color: 'var(--fg-muted)' } : undefined}>{v || '—'}</span>
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, alignItems: 'flex-start', paddingBottom: 14 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-secondary)', paddingTop: 6, letterSpacing: '0.02em' }}>
        {label}
      </span>
      <div>{children}</div>
    </div>
  )
}

function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, marginTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 3, height: 16, borderRadius: 2, background: 'var(--brand-gradient)' }} />
        <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--fg-secondary)' }}>
          {title}
        </span>
      </div>
      {action}
    </div>
  )
}

function Divider() {
  return <hr className="section-divider" />
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', cursor: 'pointer' }}>
      <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--fg-primary)' }}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: 40, height: 22, borderRadius: 999, border: 'none', cursor: 'pointer',
          background: checked ? 'var(--teal-600)' : 'var(--ink-200)',
          position: 'relative', transition: 'background 140ms',
          flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: checked ? 21 : 3,
          width: 16, height: 16, borderRadius: '50%',
          background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          transition: 'left 140ms',
        }} />
      </button>
    </label>
  )
}

// ─── Segmented control ────────────────────────────────────────────────────────

function Seg<T extends string>({ options, value, onChange }: { options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="seg-ctrl">
      {options.map(o => (
        <button key={o} type="button" className={value === o ? 'active' : ''} onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  )
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS: { k: Tab; l: string; sub: string }[] = [
  { k: 'info',        l: 'Profile info',    sub: 'Identity & employment'  },
  { k: 'contact',     l: 'Contact',         sub: 'Phone, address & emergency' },
  { k: 'preferences', l: 'Preferences',     sub: 'Language, theme & notifications' },
  { k: 'permissions', l: 'Permissions',     sub: 'Module access & 2FA' },
  { k: 'activity',    l: 'Recent activity', sub: 'Login history & audit' },
]

// ─── Profile page ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { setRoute } = useAppStore()
  const [tab, setTab]   = useState<Tab>('info')
  const [edit, setEdit] = useState(false)
  const [form, setForm] = useState<ProfileData>(INITIAL)
  const [draft, setDraft] = useState<ProfileData>(INITIAL)
  const [perms, setPerms] = useState<Permission[]>(INITIAL_PERMS)
  const [twoFa, setTwoFa] = useState(true)

  const fullName = `${form.firstName} ${form.lastName}`

  // Patch a single field in draft
  const set = <K extends keyof ProfileData>(k: K, v: ProfileData[K]) =>
    setDraft(d => ({ ...d, [k]: v }))

  const startEdit = () => { setDraft(form); setEdit(true) }
  const cancelEdit = () => { setDraft(form); setEdit(false) }
  const saveEdit = () => { setForm(draft); setEdit(false) }

  // Escape to cancel
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && edit) cancelEdit() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [edit])

  const toggleLang = (lang: string) => {
    const cur = draft.languages
    setDraft(d => ({
      ...d,
      languages: cur.includes(lang) ? cur.filter(l => l !== lang) : [...cur, lang],
    }))
  }

  const togglePerm = (module: string) => {
    setPerms(ps => ps.map(p => p.module === module ? { ...p, granted: !p.granted } : p))
  }

  // ── Render helpers ──────────────────────────────────────────────────────────

  const inp = (k: keyof ProfileData, placeholder?: string) => (
    edit
      ? <input
          className="form-input"
          value={draft[k] as string}
          onChange={e => set(k, e.target.value as ProfileData[typeof k])}
          placeholder={placeholder}
          style={{ fontSize: 13.5 }}
        />
      : <RoVal v={form[k] as string} />
  )

  const ta = (k: keyof ProfileData) => (
    edit
      ? <textarea
          className="form-input form-textarea"
          value={draft[k] as string}
          onChange={e => set(k, e.target.value as ProfileData[typeof k])}
          style={{ fontSize: 13.5 }}
        />
      : <RoVal v={form[k] as string} />
  )

  // ── Tab content ─────────────────────────────────────────────────────────────

  function TabInfo() {
    return (
      <div style={{ maxWidth: 660, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Identity */}
        <SectionTitle title="Identity" />
        <FieldRow label="First name">{inp('firstName')}</FieldRow>
        <FieldRow label="Last name">{inp('lastName')}</FieldRow>
        <FieldRow label="Date of birth">{inp('dob', 'YYYY-MM-DD')}</FieldRow>
        <FieldRow label="Gender">
          {edit
            ? (
              <div style={{ display: 'flex', gap: 8 }}>
                {GENDERS.map(g => (
                  <button
                    key={g.v}
                    type="button"
                    className="chip"
                    style={draft.gender === g.v ? { background: 'var(--brand-gradient)', color: 'white', borderColor: 'transparent' } : {}}
                    onClick={() => set('gender', g.v)}
                  >{g.l}</button>
                ))}
              </div>
            )
            : <RoVal v={GENDERS.find(g => g.v === form.gender)?.l ?? form.gender} />
          }
        </FieldRow>
        <FieldRow label="Blood group">
          {edit
            ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {BLOOD_GROUPS.map(bg => (
                  <button
                    key={bg}
                    type="button"
                    className="chip"
                    style={draft.bloodGroup === bg ? { background: 'var(--brand-gradient)', color: 'white', borderColor: 'transparent' } : {}}
                    onClick={() => set('bloodGroup', bg)}
                  >{bg}</button>
                ))}
              </div>
            )
            : <span className="badge red"><span className="d" />  {form.bloodGroup}</span>
          }
        </FieldRow>

        <Divider />

        {/* Employment */}
        <SectionTitle title="Employment" />
        <FieldRow label="Employee ID"><RoVal v={form.employeeId} /></FieldRow>
        <FieldRow label="Designation">{inp('designation')}</FieldRow>
        <FieldRow label="Role">{inp('role')}</FieldRow>
        <FieldRow label="Joined">
          {edit
            ? <input className="form-input" type="date" value={draft.joined} onChange={e => set('joined', e.target.value)} style={{ fontSize: 13.5 }} />
            : <RoVal v={new Date(form.joined).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
          }
        </FieldRow>
        <FieldRow label="Clinic">{inp('clinic')}</FieldRow>
        <FieldRow label="Shift">
          {edit
            ? (
              <select className="form-select" value={draft.shift} onChange={e => set('shift', e.target.value)} style={{ fontSize: 13.5 }}>
                {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )
            : <span className="badge info">{form.shift}</span>
          }
        </FieldRow>

        <Divider />

        {/* About */}
        <SectionTitle title="About" />
        <FieldRow label="Bio">{ta('bio')}</FieldRow>
      </div>
    )
  }

  function TabContact() {
    return (
      <div style={{ maxWidth: 660, display: 'flex', flexDirection: 'column', gap: 0 }}>
        <SectionTitle title="Contact details" />
        <FieldRow label="Email">{inp('email', 'work@clinic.in')}</FieldRow>
        <FieldRow label="Mobile">{inp('mobile', '+91 ...')}</FieldRow>
        <FieldRow label="Alt phone">{inp('altPhone', 'Optional')}</FieldRow>

        <Divider />

        <SectionTitle title="Address" />
        <FieldRow label="Street">{inp('street')}</FieldRow>
        <FieldRow label="City">{inp('city')}</FieldRow>
        <FieldRow label="State">{inp('state')}</FieldRow>
        <FieldRow label="PIN code">{inp('pin')}</FieldRow>

        <Divider />

        <SectionTitle title="Emergency contact" />
        <FieldRow label="Full name">{inp('emergencyName')}</FieldRow>
        <FieldRow label="Phone">{inp('emergencyPhone')}</FieldRow>
        <FieldRow label="Relation">{inp('emergencyRel')}</FieldRow>
      </div>
    )
  }

  function TabPreferences() {
    return (
      <div style={{ maxWidth: 540, display: 'flex', flexDirection: 'column', gap: 0 }}>
        <SectionTitle title="Language" />
        <FieldRow label="Languages">
          {edit
            ? (
              <div className="chip-lib">
                {ALL_LANGS.map(l => (
                  <button
                    key={l}
                    type="button"
                    className={`tag ${draft.languages.includes(l) ? 'selected' : ''}`}
                    onClick={() => toggleLang(l)}
                  >{l}</button>
                ))}
              </div>
            )
            : (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {form.languages.map(l => <span key={l} className="badge blue">{l}</span>)}
              </div>
            )
          }
        </FieldRow>
        <FieldRow label="Timezone">
          {edit
            ? (
              <select className="form-select" value={draft.timezone} onChange={e => set('timezone', e.target.value)} style={{ fontSize: 13 }}>
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            )
            : <RoVal v={form.timezone} />
          }
        </FieldRow>

        <Divider />

        <SectionTitle title="Appearance" />
        <FieldRow label="Theme">
          {edit ? <Seg options={THEMES} value={draft.theme} onChange={v => set('theme', v)} /> : <RoVal v={form.theme} />}
        </FieldRow>
        <FieldRow label="Density">
          {edit ? <Seg options={DENSITIES} value={draft.density} onChange={v => set('density', v)} /> : <RoVal v={form.density} />}
        </FieldRow>

        <Divider />

        <SectionTitle title="Notifications" />
        <div style={{ borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
          {[
            { k: 'notifEmail'   as const, l: 'Email notifications' },
            { k: 'notifSms'     as const, l: 'SMS notifications' },
            { k: 'notifDesktop' as const, l: 'Desktop push notifications' },
            { k: 'notifDigest'  as const, l: 'Weekly digest email' },
          ].map(({ k, l }, i, arr) => (
            <div
              key={k}
              style={{
                padding: '0 16px',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}
            >
              {edit
                ? <Toggle checked={draft[k] as boolean} onChange={v => set(k, v)} label={l} />
                : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                    <span style={{ fontSize: 13.5, fontWeight: 500 }}>{l}</span>
                    <span className={`badge ${form[k] ? 'success' : 'muted'}`}>
                      {form[k] ? 'On' : 'Off'}
                    </span>
                  </div>
                )
              }
            </div>
          ))}
        </div>
      </div>
    )
  }

  function TabPermissions() {
    return (
      <div style={{ maxWidth: 660 }}>
        <SectionTitle title="Module access" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
          {perms.map(p => (
            <button
              key={p.module}
              type="button"
              onClick={() => edit && togglePerm(p.module)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 12,
                border: `1.5px solid ${p.granted ? 'rgba(44,110,213,0.25)' : 'var(--border-soft)'}`,
                background: p.granted ? 'var(--brand-gradient-soft)' : 'var(--bg-section)',
                cursor: edit ? 'pointer' : 'default',
                transition: 'all 140ms',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: p.granted ? 'var(--teal-800)' : 'var(--fg-secondary)' }}>
                {p.module}
              </span>
              <span className={`badge ${p.granted ? 'success' : 'muted'}`} style={{ fontSize: 10.5, padding: '2px 7px' }}>
                {p.granted ? 'Granted' : 'Restricted'}
              </span>
            </button>
          ))}
        </div>

        <Divider />

        <SectionTitle title="Security" />
        <div style={{ borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
          <div style={{ padding: '0 16px', borderBottom: '1px solid var(--border-light)' }}>
            {edit
              ? <Toggle checked={twoFa} onChange={setTwoFa} label="Two-factor authentication (2FA)" />
              : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>Two-factor authentication (2FA)</span>
                  <span className={`badge ${twoFa ? 'success' : 'warning'}`}>{twoFa ? 'Enabled' : 'Disabled'}</span>
                </div>
              )
            }
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>Password</div>
              <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 2 }}>Last changed 7 May 2026</div>
            </div>
            {edit && (
              <button className="btn btn-secondary btn-sm">
                <Icon name="lock" size={13} />
                Change password
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  function TabActivity() {
    return (
      <div style={{ maxWidth: 740 }}>
        {/* Current session */}
        <SectionTitle title="Current session" />
        <div style={{ background: 'var(--brand-gradient-soft)', border: '1px solid rgba(44,110,213,0.2)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { l: 'Last login',  v: '13 May 2026, 09:14 AM' },
              { l: 'Device',      v: 'Chrome 124 · Windows 11' },
              { l: 'IP address',  v: '103.21.45.200' },
              { l: '2FA used',    v: twoFa ? 'Yes — TOTP' : 'No' },
            ].map(({ l, v }) => (
              <div key={l}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-secondary)', marginBottom: 3 }}>{l}</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-primary)' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit trail */}
        <SectionTitle title="Audit trail" />
        <div className="table-card">
          <table className="data">
            <thead>
              <tr>
                <th>Time</th>
                <th>Event</th>
                <th>Device</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {ACTIVITY.map((row, i) => (
                <tr key={i}>
                  <td style={{ whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-secondary)' }}>
                    {row.time}
                  </td>
                  <td style={{ fontSize: 13, fontWeight: 500 }}>{row.event}</td>
                  <td style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>{row.device}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-secondary)' }}>{row.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ── Layout ──────────────────────────────────────────────────────────────────

  return (
    <div className="df-shell">
      {/* ── Top strip ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 24px', background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-soft)', flexShrink: 0,
        minHeight: 54,
      }}>
        <button
          className="btn btn-ghost btn-sm"
          style={{ gap: 4, color: 'var(--fg-secondary)', padding: '5px 8px' }}
          onClick={() => setRoute('dashboard')}
        >
          <Icon name="chevL" size={15} />
          Back
        </button>

        <span className="badge success"><span className="d" />Active</span>

        <div style={{ flex: 1 }} />

        {edit ? (
          <>
            <span className="badge blue" style={{ padding: '5px 12px', fontWeight: 700 }}>
              Editing
            </span>
            <button className="btn btn-ghost btn-sm" onClick={cancelEdit}>
              Cancel
            </button>
            <button className="btn btn-primary btn-sm" onClick={saveEdit}>
              <Icon name="check" size={13} />
              Update profile
            </button>
          </>
        ) : (
          <button className="btn btn-secondary btn-sm" onClick={startEdit}>
            <Icon name="edit" size={13} />
            Edit profile
          </button>
        )}
      </div>

      {/* ── Hero card ── */}
      <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-soft)', flexShrink: 0 }}>
        {/* Gradient cover */}
        <div style={{ height: 56, background: 'var(--brand-gradient-dark)', position: 'relative' }} />

        {/* Avatar + info strip */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, padding: '0 24px 16px', marginTop: -32 }}>
          <div
            className="av blue xxl"
            style={{
              width: 80, height: 80, fontSize: 28, fontWeight: 800,
              border: '3px solid var(--bg-surface)',
              boxShadow: 'var(--sh-card)',
              borderRadius: 20,
              flexShrink: 0,
            }}
          >
            RA
          </div>

          <div style={{ flex: 1, paddingBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--fg-primary)' }}>{fullName}</h2>
            </div>
            <div style={{ fontSize: 13, color: 'var(--fg-secondary)', marginTop: 2, fontWeight: 500 }}>
              {form.designation} · {form.clinic}
            </div>
            {/* Meta badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              <span className="badge muted" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                <Icon name="user" size={11} /> {form.employeeId}
              </span>
              <span className="badge muted" style={{ fontSize: 11 }}>
                <Icon name="calendar" size={11} /> Joined {new Date(form.joined).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </span>
              <span className={`badge ${twoFa ? 'success' : 'warning'}`} style={{ fontSize: 11 }}>
                <Icon name="shield" size={11} /> 2FA {twoFa ? 'Enabled' : 'Disabled'}
              </span>
              <span className="badge info" style={{ fontSize: 11 }}>
                <Icon name="clock" size={11} /> {form.shift} shift
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="df-tabs">
        {TABS.map(t => (
          <button
            key={t.k}
            type="button"
            className={`df-tab ${tab === t.k ? 'active' : ''}`}
            onClick={() => setTab(t.k)}
          >
            <span className="tab-title">{t.l}</span>
            <span className="tab-sub">{t.sub}</span>
          </button>
        ))}
      </div>

      {/* ── Body ── */}
      <div className="df-body">
        <div className="df-panel" style={{ maxWidth: '100%' }}>
          {tab === 'info'        && <TabInfo />}
          {tab === 'contact'     && <TabContact />}
          {tab === 'preferences' && <TabPreferences />}
          {tab === 'permissions' && <TabPermissions />}
          {tab === 'activity'    && <TabActivity />}
        </div>
      </div>

      {/* ── Sticky footer (edit mode only) ── */}
      {edit && (
        <div className="df-footer">
          <span style={{ flex: 1, fontSize: 12.5, color: 'var(--fg-secondary)' }}>
            Unsaved changes — press <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--bg-section)', border: '1px solid var(--border-soft)', borderRadius: 4, padding: '1px 5px' }}>Esc</kbd> to discard
          </span>
          <button className="btn btn-ghost" onClick={cancelEdit}>Cancel</button>
          <button className="btn btn-primary" onClick={saveEdit}>
            <Icon name="check" size={15} />
            Update profile
          </button>
        </div>
      )}
    </div>
  )
}
