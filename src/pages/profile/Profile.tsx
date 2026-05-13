import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/store/app'
import { useAuthStore } from '@/store/auth'
import Icon from '@/components/ui/Icon'
import { toast } from '@/store/toast'
import api from '@/lib/axios'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'info' | 'contact' | 'preferences' | 'permissions' | 'security'

type ThemeOption   = 'Light' | 'Dark' | 'System'
type DensityOption = 'Compact' | 'Default' | 'Comfortable'

interface ProfileForm {
  firstName:  string
  lastName:   string
  phone:      string
  languages:  string[]
  timezone:   string
  theme:      ThemeOption
  density:    DensityOption
  notifEmail:   boolean
  notifSms:     boolean
  notifDesktop: boolean
  notifDigest:  boolean
}

interface Permission { module: string; granted: boolean }

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_LANGS: string[] = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Marathi', 'Bengali', 'Gujarati']
const TIMEZONES: string[] = [
  'Asia/Kolkata (IST, UTC+5:30)',
  'Asia/Dubai (GST, UTC+4)',
  'Asia/Singapore (SGT, UTC+8)',
  'Europe/London (BST, UTC+1)',
  'America/New_York (EDT, UTC-4)',
]
const THEMES:    ThemeOption[]    = ['Light', 'Dark', 'System']
const DENSITIES: DensityOption[]  = ['Compact', 'Default', 'Comfortable']

const ROLE_LABELS: Record<string, string> = {
  super_admin:  'Super Admin',
  clinic_admin: 'Clinic Admin',
  doctor:       'Doctor',
  nurse:        'Nurse',
  frontdesk:    'Front Desk',
  pharmacist:   'Pharmacist',
  lab_tech:     'Lab Tech',
}

const DEFAULT_PERMS: Permission[] = [
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

const TABS: { k: Tab; l: string; icon: string }[] = [
  { k: 'info',        l: 'Profile info',  icon: 'user'     },
  { k: 'contact',     l: 'Contact',       icon: 'bell'     },
  { k: 'preferences', l: 'Preferences',   icon: 'settings' },
  { k: 'permissions', l: 'Permissions',   icon: 'shield'   },
  { k: 'security',    l: 'Security',      icon: 'lock'     },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function splitName(full: string) {
  const parts = full.trim().split(/\s+/)
  const first = parts[0] ?? ''
  const last  = parts.slice(1).join(' ')
  return { first, last }
}

function RoVal({ v, muted = false }: { v?: string; muted?: boolean }) {
  return <span className="ro-val" style={muted ? { color: 'var(--fg-muted)' } : undefined}>{v || '—'}</span>
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="profile-field-row">
      <span className="profile-field-label">{label}</span>
      <div className="profile-field-value">{children}</div>
    </div>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="profile-section-title">
      <div className="profile-section-bar" />
      <span>{title}</span>
    </div>
  )
}

function Divider() { return <hr className="section-divider" /> }

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
          width: 38, height: 21, borderRadius: 999, border: 'none', cursor: 'pointer',
          background: checked ? 'var(--teal-600)' : 'var(--ink-200)',
          position: 'relative', transition: 'background 140ms', flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: 2.5, left: checked ? 19 : 2.5,
          width: 16, height: 16, borderRadius: '50%',
          background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          transition: 'left 140ms',
        }} />
      </button>
    </label>
  )
}

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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { setRoute }                        = useAppStore()
  const { user, fetchMe, updateProfile }    = useAuthStore()

  const [tab,     setTab]     = useState<Tab>('info')
  const [edit,    setEdit]    = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [perms,   setPerms]   = useState<Permission[]>(DEFAULT_PERMS)
  const [twoFa,   setTwoFa]   = useState(false)

  const [pwOld,   setPwOld]   = useState('')
  const [pwNew,   setPwNew]   = useState('')
  const [pwCnf,   setPwCnf]   = useState('')
  const [pwErr,   setPwErr]   = useState('')
  const [pwSaving,setPwSaving]= useState(false)

  const buildForm = useCallback((): ProfileForm => {
    const { first, last } = splitName(user?.name ?? '')
    return {
      firstName:    first,
      lastName:     last,
      phone:        user?.phone ?? '',
      languages:    ['English'],
      timezone:     'Asia/Kolkata (IST, UTC+5:30)',
      theme:        'Light',
      density:      'Default',
      notifEmail:   true,
      notifSms:     true,
      notifDesktop: false,
      notifDigest:  true,
    }
  }, [user])

  const [form,  setForm]  = useState<ProfileForm>(buildForm)
  const [draft, setDraft] = useState<ProfileForm>(buildForm)

  useEffect(() => { fetchMe() }, [fetchMe])
  useEffect(() => {
    const f = buildForm()
    setForm(f)
    setDraft(f)
  }, [buildForm])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && edit) cancelEdit() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [edit])

  const set = <K extends keyof ProfileForm>(k: K, v: ProfileForm[K]) =>
    setDraft(d => ({ ...d, [k]: v }))

  const startEdit  = () => { setDraft(form); setEdit(true) }
  const cancelEdit = () => { setDraft(form); setEdit(false) }

  const saveEdit = async () => {
    setSaving(true)
    try {
      const fullName = [draft.firstName.trim(), draft.lastName.trim()].filter(Boolean).join(' ')
      await updateProfile({ name: fullName, phone: draft.phone || undefined })
      setForm(draft)
      setEdit(false)
      toast.success('Profile updated')
    } catch (err: any) {
      toast.error(err.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const toggleLang = (lang: string) => {
    const cur = draft.languages
    setDraft(d => ({
      ...d,
      languages: cur.includes(lang) ? cur.filter(l => l !== lang) : [...cur, lang],
    }))
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwErr('')
    if (pwNew !== pwCnf) { setPwErr('New passwords do not match'); return }
    if (pwNew.length < 6) { setPwErr('Password must be at least 6 characters'); return }
    setPwSaving(true)
    try {
      await api.put('/auth/change-password', { oldPassword: pwOld, newPassword: pwNew })
      setPwOld(''); setPwNew(''); setPwCnf('')
      toast.success('Password changed successfully')
    } catch (err: any) {
      setPwErr(err.response?.data?.message || 'Failed to change password')
    } finally {
      setPwSaving(false)
    }
  }

  const fullName   = user?.name ?? 'Unknown User'
  const initials   = user ? getInitials(user.name) : '??'
  const roleLabel  = user ? (ROLE_LABELS[user.role] ?? user.role) : '—'
  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'

  // ── Render helpers ──────────────────────────────────────────────────────────

  const inp = (k: keyof ProfileForm, placeholder?: string) =>
    edit
      ? <input
          className="form-input"
          value={draft[k] as string}
          onChange={e => set(k, e.target.value as any)}
          placeholder={placeholder}
        />
      : <RoVal v={form[k] as string} />

  // ── Tab panels ──────────────────────────────────────────────────────────────

  function TabInfo() {
    return (
      <div className="profile-tab-content">
        <SectionTitle title="Identity" />

        {edit ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label required">First name</label>
              <input
                className="form-input"
                value={draft.firstName}
                onChange={e => set('firstName', e.target.value)}
                placeholder="First name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last name</label>
              <input
                className="form-input"
                value={draft.lastName}
                onChange={e => set('lastName', e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>
        ) : (
          <>
            <FieldRow label="First name"><RoVal v={form.firstName} /></FieldRow>
            <FieldRow label="Last name"><RoVal v={form.lastName} /></FieldRow>
          </>
        )}

        <FieldRow label="Full name"><RoVal v={fullName} /></FieldRow>

        <Divider />
        <SectionTitle title="Account" />

        <FieldRow label="User ID">
          <span className="ro-val" style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--fg-muted)', letterSpacing: '0.01em' }}>
            {user?.id ?? '—'}
          </span>
        </FieldRow>
        <FieldRow label="Role">
          <span className="badge info">{roleLabel}</span>
        </FieldRow>
        <FieldRow label="Status">
          <span className={`badge ${user?.status === 'active' ? 'success' : 'warning'}`}>
            <span className="d" />{user?.status ?? '—'}
          </span>
        </FieldRow>
        <FieldRow label="Joined">
          <RoVal v={joinedDate} />
        </FieldRow>
      </div>
    )
  }

  function TabContact() {
    return (
      <div className="profile-tab-content">
        <SectionTitle title="Contact details" />
        <FieldRow label="Email">
          <div>
            <RoVal v={user?.email} />
            <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 4 }}>
              Email cannot be changed here. Contact your administrator.
            </div>
          </div>
        </FieldRow>

        {edit ? (
          <div style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Phone number</label>
              <input
                className="form-input"
                value={draft.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="+91 98765 43210"
                style={{ maxWidth: 280 }}
              />
            </div>
          </div>
        ) : (
          <FieldRow label="Phone"><RoVal v={form.phone || undefined} /></FieldRow>
        )}
      </div>
    )
  }

  function TabPreferences() {
    return (
      <div className="profile-tab-content" style={{ maxWidth: 520 }}>
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
              <select className="form-select" value={draft.timezone} onChange={e => set('timezone', e.target.value)}>
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
          {([
            ['notifEmail',   'Email notifications'],
            ['notifSms',     'SMS notifications'],
            ['notifDesktop', 'Desktop push notifications'],
            ['notifDigest',  'Weekly digest email'],
          ] as [keyof ProfileForm, string][]).map(([k, l], i, arr) => (
            <div
              key={k}
              style={{ padding: '0 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}
            >
              {edit
                ? <Toggle checked={draft[k] as boolean} onChange={v => set(k, v)} label={l} />
                : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                    <span style={{ fontSize: 13.5, fontWeight: 500 }}>{l}</span>
                    <span className={`badge ${form[k] ? 'success' : 'muted'}`}>{form[k] ? 'On' : 'Off'}</span>
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
      <div className="profile-tab-content">
        <SectionTitle title="Module access" />
        <p style={{ fontSize: 13, color: 'var(--fg-secondary)', marginBottom: 16 }}>
          Role: <strong>{roleLabel}</strong>. Permissions are managed by your administrator.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {perms.map(p => (
            <button
              key={p.module}
              type="button"
              onClick={() => edit && setPerms(ps => ps.map(x => x.module === p.module ? { ...x, granted: !x.granted } : x))}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 10,
                border: `1.5px solid ${p.granted ? 'rgba(44,110,213,0.2)' : 'var(--border-soft)'}`,
                background: p.granted ? 'var(--brand-gradient-soft)' : 'var(--bg-section)',
                cursor: edit ? 'pointer' : 'default',
                transition: 'all 140ms',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: p.granted ? 'var(--teal-800)' : 'var(--fg-secondary)' }}>
                {p.module}
              </span>
              <span className={`badge ${p.granted ? 'success' : 'muted'}`} style={{ fontSize: 10.5, padding: '2px 7px' }}>
                {p.granted ? 'On' : 'Off'}
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  function TabSecurity() {
    return (
      <div className="profile-tab-content" style={{ maxWidth: 460 }}>
        <SectionTitle title="Change password" />
        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pwErr && (
            <div style={{ background: 'var(--danger-100)', color: 'var(--danger-500)', borderRadius: 10, padding: '9px 12px', fontSize: 13, border: '1px solid rgba(239,68,68,0.2)', fontWeight: 500 }}>
              {pwErr}
            </div>
          )}
          <div className="form-group">
            <label className="form-label required">Current password</label>
            <input type="password" className="form-input" value={pwOld} onChange={e => setPwOld(e.target.value)} placeholder="Enter current password" autoComplete="current-password" />
          </div>
          <div className="form-group">
            <label className="form-label required">New password</label>
            <input type="password" className="form-input" value={pwNew} onChange={e => setPwNew(e.target.value)} placeholder="Min 6 characters" autoComplete="new-password" />
          </div>
          <div className="form-group">
            <label className="form-label required">Confirm new password</label>
            <input type="password" className="form-input" value={pwCnf} onChange={e => setPwCnf(e.target.value)} placeholder="Repeat new password" autoComplete="new-password" />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} disabled={pwSaving || !pwOld || !pwNew || !pwCnf}>
            <Icon name="lock" size={13} />
            {pwSaving ? 'Changing…' : 'Change password'}
          </button>
        </form>

        <Divider />
        <SectionTitle title="Two-factor authentication" />

        <div style={{ borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
          <div style={{ padding: '0 16px' }}>
            <Toggle checked={twoFa} onChange={setTwoFa} label="Enable two-factor authentication (2FA)" />
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 8 }}>
          When enabled, you will be asked for a verification code on every login.
        </p>
      </div>
    )
  }

  // ── Layout ──────────────────────────────────────────────────────────────────

  return (
    <div className="df-shell">

      {/* ── Top action bar ── */}
      <div className="df-topbar">
        <button
          className="btn btn-ghost btn-sm"
          style={{ gap: 4, color: 'var(--fg-secondary)' }}
          onClick={() => setRoute('dashboard')}
        >
          <Icon name="chevL" size={15} />
          Back
        </button>

        <div className="df-topbar-title" style={{ marginLeft: 4 }}>My Profile</div>

        <span className={`badge ${user?.status === 'active' ? 'success' : 'warning'}`} style={{ fontSize: 11 }}>
          <span className="d" />{user?.status ?? 'unknown'}
        </span>

        <div style={{ flex: 1 }} />

        {tab !== 'security' && (
          edit ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge blue" style={{ padding: '4px 10px', fontWeight: 700, fontSize: 11 }}>Editing</span>
              <button className="btn btn-ghost btn-sm" onClick={cancelEdit} disabled={saving}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={saveEdit} disabled={saving}>
                <Icon name="check" size={13} />
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={startEdit}>
              <Icon name="edit" size={13} />
              Edit profile
            </button>
          )
        )}
      </div>

      {/* ── Hero banner ── */}
      <div className="profile-hero">
        {/* Gradient banner — absolutely positioned, no stacking conflict */}
        <div className="profile-hero-banner">
          <div className="profile-hero-overlay" />
        </div>

        {/* Avatar + info row — floats above banner via z-index */}
        <div className="profile-hero-body">
          <div className="profile-hero-avatar">
            {initials}
          </div>

          <div className="profile-hero-info">
            <div className="profile-hero-name-row">
              <h2 className="profile-hero-name">{fullName}</h2>
              <span className="badge brand" style={{ fontSize: 10.5, padding: '2px 9px' }}>{roleLabel}</span>
            </div>
            <div className="profile-hero-email">{user?.email}</div>
            <div className="profile-hero-meta">
              {user?.phone && (
                <span className="badge muted" style={{ fontSize: 11 }}>
                  <Icon name="user" size={10} /> {user.phone}
                </span>
              )}
              <span className="badge muted" style={{ fontSize: 11 }}>
                Joined {joinedDate}
              </span>
              <span className={`badge ${twoFa ? 'success' : 'warning'}`} style={{ fontSize: 11 }}>
                2FA {twoFa ? 'On' : 'Off'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="profile-tabs">
        {TABS.map(t => (
          <button
            key={t.k}
            type="button"
            className={`profile-tab ${tab === t.k ? 'active' : ''}`}
            onClick={() => { setTab(t.k); if (t.k === 'security') setEdit(false) }}
          >
            <Icon name={t.icon} size={14} />
            <span>{t.l}</span>
          </button>
        ))}
      </div>

      {/* ── Body ── */}
      <div className="df-body" style={{ background: 'var(--bg-app)' }}>
        <div className="df-panel" style={{ maxWidth: '100%', paddingTop: 20 }}>
          {tab === 'info'        && <TabInfo />}
          {tab === 'contact'     && <TabContact />}
          {tab === 'preferences' && <TabPreferences />}
          {tab === 'permissions' && <TabPermissions />}
          {tab === 'security'    && <TabSecurity />}
        </div>
      </div>

      {/* ── Sticky edit footer ── */}
      {edit && tab !== 'security' && (
        <div className="df-footer">
          <span style={{ flex: 1, fontSize: 12.5, color: 'var(--fg-secondary)' }}>
            Unsaved changes — press{' '}
            <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--bg-section)', border: '1px solid var(--border-soft)', borderRadius: 4, padding: '1px 5px' }}>Esc</kbd>
            {' '}to discard
          </span>
          <button className="btn btn-ghost btn-sm" onClick={cancelEdit} disabled={saving}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={saveEdit} disabled={saving}>
            <Icon name="check" size={13} />
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      )}
    </div>
  )
}
