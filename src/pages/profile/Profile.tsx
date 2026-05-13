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
  // Preferences (local only — no backend model for these yet)
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

const TABS: { k: Tab; l: string; sub: string }[] = [
  { k: 'info',        l: 'Profile info',    sub: 'Name & identity'            },
  { k: 'contact',     l: 'Contact',         sub: 'Phone & account details'    },
  { k: 'preferences', l: 'Preferences',     sub: 'Language, theme & alerts'   },
  { k: 'permissions', l: 'Permissions',     sub: 'Module access'              },
  { k: 'security',    l: 'Security',        sub: 'Password & 2FA'             },
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
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, alignItems: 'flex-start', paddingBottom: 14 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-secondary)', paddingTop: 6, letterSpacing: '0.02em' }}>
        {label}
      </span>
      <div>{children}</div>
    </div>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, marginTop: 4 }}>
      <div style={{ width: 3, height: 16, borderRadius: 2, background: 'var(--brand-gradient)' }} />
      <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--fg-secondary)' }}>
        {title}
      </span>
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
          width: 40, height: 22, borderRadius: 999, border: 'none', cursor: 'pointer',
          background: checked ? 'var(--teal-600)' : 'var(--ink-200)',
          position: 'relative', transition: 'background 140ms', flexShrink: 0,
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
  const { setRoute }             = useAppStore()
  const { user, fetchMe, updateProfile } = useAuthStore()

  const [tab,  setTab]  = useState<Tab>('info')
  const [edit, setEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [perms, setPerms]   = useState<Permission[]>(DEFAULT_PERMS)
  const [twoFa, setTwoFa]   = useState(false)

  // Password change
  const [pwOld, setPwOld] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwCnf, setPwCnf] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [pwSaving, setPwSaving] = useState(false)

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

  // Refresh user from server on mount and re-sync form when user changes
  useEffect(() => { fetchMe() }, [fetchMe])
  useEffect(() => {
    const f = buildForm()
    setForm(f)
    setDraft(f)
  }, [buildForm])

  // Escape to cancel edit
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
          style={{ fontSize: 13.5 }}
        />
      : <RoVal v={form[k] as string} />

  // ── Tab panels ──────────────────────────────────────────────────────────────

  function TabInfo() {
    return (
      <div style={{ maxWidth: 660, display: 'flex', flexDirection: 'column', gap: 0 }}>
        <SectionTitle title="Identity" />
        <FieldRow label="First name">{inp('firstName', 'First name')}</FieldRow>
        <FieldRow label="Last name">{inp('lastName', 'Last name')}</FieldRow>
        <FieldRow label="Full name"><RoVal v={fullName} /></FieldRow>

        <Divider />

        <SectionTitle title="Account" />
        <FieldRow label="User ID">
          <span className="ro-val" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>
            {user?.id ?? '—'}
          </span>
        </FieldRow>
        <FieldRow label="Role">
          <span className="badge info">{roleLabel}</span>
        </FieldRow>
        <FieldRow label="Status">
          <span className={`badge ${user?.status === 'active' ? 'success' : 'warning'}`}>
            <span className="d" />
            {user?.status ?? '—'}
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
      <div style={{ maxWidth: 660, display: 'flex', flexDirection: 'column', gap: 0 }}>
        <SectionTitle title="Contact details" />
        <FieldRow label="Email">
          <RoVal v={user?.email} />
          <span style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 4, display: 'block' }}>
            Email cannot be changed here. Contact your administrator.
          </span>
        </FieldRow>
        <FieldRow label="Phone">{inp('phone', '+91 ...')}</FieldRow>
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
      <div style={{ maxWidth: 660 }}>
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
      </div>
    )
  }

  function TabSecurity() {
    return (
      <div style={{ maxWidth: 480 }}>
        <SectionTitle title="Change password" />
        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {pwErr && (
            <div style={{ background: 'var(--danger-100)', color: 'var(--danger-500)', borderRadius: 10, padding: '9px 12px', fontSize: 13, border: '1px solid rgba(239,68,68,0.2)', fontWeight: 500 }}>
              {pwErr}
            </div>
          )}
          <div className="form-group">
            <label className="form-label required">Current password</label>
            <input
              type="password"
              className="form-input"
              value={pwOld}
              onChange={e => setPwOld(e.target.value)}
              placeholder="Enter current password"
              autoComplete="current-password"
            />
          </div>
          <div className="form-group">
            <label className="form-label required">New password</label>
            <input
              type="password"
              className="form-input"
              value={pwNew}
              onChange={e => setPwNew(e.target.value)}
              placeholder="Min 6 characters"
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label className="form-label required">Confirm new password</label>
            <input
              type="password"
              className="form-input"
              value={pwCnf}
              onChange={e => setPwCnf(e.target.value)}
              placeholder="Repeat new password"
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ alignSelf: 'flex-start' }}
            disabled={pwSaving || !pwOld || !pwNew || !pwCnf}
          >
            <Icon name="lock" size={13} />
            {pwSaving ? 'Changing…' : 'Change password'}
          </button>
        </form>

        <Divider />

        <SectionTitle title="Two-factor authentication" />
        <div style={{ borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
          <div style={{ padding: '0 16px' }}>
            <Toggle checked={twoFa} onChange={setTwoFa} label="Two-factor authentication (2FA)" />
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 10 }}>
          2FA adds an extra layer of security. When enabled, you will be asked for a verification code on login.
        </p>
      </div>
    )
  }

  // ── Layout ──────────────────────────────────────────────────────────────────

  return (
    <div className="df-shell">
      {/* Top action bar */}
      <div className="df-topbar">
        <button
          className="btn btn-ghost btn-sm"
          style={{ gap: 4, color: 'var(--fg-secondary)', padding: '5px 8px' }}
          onClick={() => setRoute('dashboard')}
        >
          <Icon name="chevL" size={15} />
          Back
        </button>

        <span className={`badge ${user?.status === 'active' ? 'success' : 'warning'}`}>
          <span className="d" />{user?.status ?? 'unknown'}
        </span>

        <div style={{ flex: 1 }} />

        {tab !== 'security' && (
          edit ? (
            <>
              <span className="badge blue" style={{ padding: '5px 12px', fontWeight: 700 }}>Editing</span>
              <button className="btn btn-ghost btn-sm" onClick={cancelEdit} disabled={saving}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={saveEdit} disabled={saving}>
                <Icon name="check" size={13} />
                {saving ? 'Saving…' : 'Update profile'}
              </button>
            </>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={startEdit}>
              <Icon name="edit" size={13} />
              Edit profile
            </button>
          )
        )}
      </div>

      {/* Hero banner */}
      <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-soft)', flexShrink: 0 }}>
        {/* Gradient cover */}
        <div style={{
          height: 110,
          background: 'var(--brand-gradient-dark)',
          position: 'relative',
        }}>
          {/* Subtle pattern overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle at 80% 50%, rgba(31,163,168,0.35) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(44,110,213,0.25) 0%, transparent 50%)',
          }} />
        </div>

        {/* Avatar + info row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, padding: '0 28px 20px', marginTop: -44 }}>
          {/* Avatar */}
          <div style={{
            width: 88, height: 88,
            borderRadius: 22,
            background: 'var(--brand-gradient)',
            color: 'white',
            fontSize: 30,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '4px solid var(--bg-surface)',
            boxShadow: '0 6px 20px rgba(30,79,163,0.22)',
            letterSpacing: '-0.02em',
          }}>
            {initials}
          </div>

          {/* User info */}
          <div style={{ flex: 1, minWidth: 0, paddingBottom: 2 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--fg-primary)', letterSpacing: '-0.02em', marginBottom: 2 }}>
              {fullName}
            </h2>
            <div style={{ fontSize: 13, color: 'var(--fg-secondary)', fontWeight: 500, marginBottom: 10 }}>
              {user?.email}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span className="badge brand" style={{ fontSize: 11, padding: '3px 9px' }}>
                <Icon name="shield" size={10} /> {roleLabel}
              </span>
              {user?.phone && (
                <span className="badge muted" style={{ fontSize: 11 }}>
                  {user.phone}
                </span>
              )}
              <span className="badge muted" style={{ fontSize: 11 }}>
                <Icon name="calendar" size={10} /> Joined {joinedDate}
              </span>
              <span className={`badge ${twoFa ? 'success' : 'warning'}`} style={{ fontSize: 11 }}>
                2FA {twoFa ? 'On' : 'Off'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="df-tabs">
        {TABS.map(t => (
          <button
            key={t.k}
            type="button"
            className={`df-tab ${tab === t.k ? 'active' : ''}`}
            onClick={() => { setTab(t.k); if (t.k === 'security') setEdit(false) }}
          >
            <span className="tab-title">{t.l}</span>
            <span className="tab-sub">{t.sub}</span>
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="df-body" style={{ background: 'var(--bg-app)' }}>
        <div className="df-panel" style={{ maxWidth: '100%' }}>
          {tab === 'info'        && <TabInfo />}
          {tab === 'contact'     && <TabContact />}
          {tab === 'preferences' && <TabPreferences />}
          {tab === 'permissions' && <TabPermissions />}
          {tab === 'security'    && <TabSecurity />}
        </div>
      </div>

      {/* Sticky footer (edit mode only) */}
      {edit && tab !== 'security' && (
        <div className="df-footer">
          <span style={{ flex: 1, fontSize: 12.5, color: 'var(--fg-secondary)' }}>
            Unsaved changes — press{' '}
            <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--bg-section)', border: '1px solid var(--border-soft)', borderRadius: 4, padding: '1px 5px' }}>Esc</kbd>
            {' '}to discard
          </span>
          <button className="btn btn-ghost" onClick={cancelEdit} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
            <Icon name="check" size={15} />
            {saving ? 'Saving…' : 'Update profile'}
          </button>
        </div>
      )}
    </div>
  )
}
