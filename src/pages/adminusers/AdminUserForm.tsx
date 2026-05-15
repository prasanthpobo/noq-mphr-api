import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import Badge, { UserStatusBadge } from '@/components/ui/Badge'
import { useAppStore } from '@/store/app'
import { adminusersService } from '@/services/adminusers.service'
import { toast } from '@/store/toast'

type FormData = {
  firstName: string
  lastName:  string
  email:     string
  phone:     string
  role:      string
  scope:     string
  clinic:    string
  joined:    string
  status:    string
  username:  string
  password:  string
  ipList:    string
}

interface Props { id?: string; onClose?: () => void }

const ROLES   = ['Super admin','Clinic admin','Billing admin','Operations','Compliance','Reports analyst','Support admin','Read-only']
const MODULES = ['Bookings','Tokens','Patients','Doctors','Clinics','Billing','Reports','Pharmacy','Master data','Settings','Users','Audit']

const AUDIT_ROWS = [
  { action: 'Updated patient P-1042 record',    when: 'Today · 10:22',      kind: 'edit'   },
  { action: 'Created appointment APT-892',       when: 'Today · 09:41',      kind: 'create' },
  { action: 'Logged in from 192.168.1.10',       when: 'Today · 09:40',      kind: 'login'  },
  { action: 'Exported billing report Q1-2025',   when: 'Yesterday · 16:05',  kind: 'export' },
  { action: 'Changed status of Clinic C-005',    when: 'Yesterday · 14:22',  kind: 'edit'   },
]

const ROLE_VARIANTS: Record<string, string> = {
  'Super admin':'danger','Clinic admin':'blue','Billing admin':'amber',
  Operations:'mint',Compliance:'indigo','Reports analyst':'plum',
  'Support admin':'brand','Read-only':'gray',
}

const AUDIT_DOT: Record<string, string> = {
  login: 'var(--success-500, #22c55e)',
  edit:  'var(--warning-500, #f59e0b)',
  create:'var(--info-500,    #3b82f6)',
  export:'var(--fg-muted)',
}

function seg(opts: string[], val: string, set: (v: string) => void) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {opts.map(o => (
        <button
          key={o} type="button"
          onClick={() => set(o)}
          style={{
            padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
            background: val === o ? 'var(--brand-gradient)' : 'var(--bg-section)',
            color: val === o ? 'white' : 'var(--fg-secondary)',
          }}
        >
          {o.charAt(0).toUpperCase() + o.slice(1)}
        </button>
      ))}
    </div>
  )
}

const TABS = [
  { label: 'Profile',  sub: 'Personal & role info',       icon: 'user'     },
  { label: 'Access',   sub: 'Credentials & permissions',  icon: 'shield'   },
  { label: 'Activity', sub: 'Login & audit trail',        icon: 'activity' },
]

export default function AdminUserForm({ id, onClose }: Props) {
  const { setRoute } = useAppStore()
  const isEdit = Boolean(id)

  const [tab,         setTab]         = useState(0)
  const [status,      setStatus]      = useState('active')
  const [twoFA,       setTwoFA]       = useState(false)
  const [modSel,      setModSel]      = useState<string[]>([])
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: { role: 'Clinic admin', status: 'active' },
  })

  const firstName = watch('firstName') || ''
  const lastName  = watch('lastName')  || ''
  const email     = watch('email')     || ''
  const phone     = watch('phone')     || ''
  const role      = watch('role')      || 'Clinic admin'
  const scope     = watch('scope')     || ''
  const name      = `${firstName} ${lastName}`.trim() || 'New User'
  const av        = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  useEffect(() => {
    if (isEdit && id) {
      adminusersService.get(id)
        .then(data => {
          reset(data)
          if (data.status !== undefined) setStatus(data.status)
          if (data.twoFA  !== undefined) setTwoFA(data.twoFA)
          if (data.modSel)               setModSel(data.modSel)
        })
        .catch(() => { setServerError('Failed to load user data'); toast.error('Failed to load record') })
    }
  }, [id])

  const toggleMod = (v: string) => setModSel(s => s.includes(v) ? s.filter(x => x !== v) : [...s, v])

  const onSubmit = async (data: FormData) => {
    try {
      setServerError(null)
      const payload = { ...data, status, twoFA, modSel }
      if (!isEdit && !data.password) {
        setServerError('Password is required when creating a user')
        return
      }
      if (isEdit) {
        await adminusersService.update(id!, payload)
        toast.success('Updated successfully')
      } else {
        await adminusersService.create(payload)
        toast.success('Created successfully')
      }
      if (onClose) onClose()
      else setRoute('admin-users')
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Save failed')
      toast.error(err.response?.data?.message || 'Save failed')
    }
  }

  const goBack = () => { if (onClose) onClose(); else setRoute('admin-users') }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Header
        title={isEdit ? `Editing ${name}` : 'Create user'}
        crumbs={isEdit ? `Manage · Users · ${name}` : 'Manage · Users · New user'}
      />

      <div className="main">

        {/* Topbar actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={goBack}>
            <Icon name="chevL" size={13} /> Back
          </button>
          {isEdit && <Badge variant={(ROLE_VARIANTS[role] ?? 'muted') as any}>{role}</Badge>}
          {isEdit && <UserStatusBadge status={status} />}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {serverError && (
              <span style={{ fontSize: 12, color: 'var(--danger-500, #ef4444)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="alert" size={13} /> {serverError}
              </span>
            )}
            <button type="button" className="btn btn-secondary btn-sm" onClick={goBack}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
              <Icon name="check" size={13} /> {isSubmitting ? 'Saving…' : isEdit ? 'Update user' : 'Create user'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 0, marginBottom: 0,
          borderBottom: '1px solid var(--border-soft)',
          background: 'var(--bg-surface)',
          borderRadius: '12px 12px 0 0',
          padding: '0 4px',
        }}>
          {TABS.map((t, i) => {
            const active = tab === i
            return (
              <button
                key={t.label} type="button"
                onClick={() => setTab(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 20px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: active ? '2px solid var(--brand-500, #3b82f6)' : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                <Icon
                  name={t.icon as any}
                  size={16}
                  style={{ color: active ? 'var(--brand-500, #3b82f6)' : 'var(--fg-muted)' }}
                />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: active ? 'var(--brand-500, #3b82f6)' : 'var(--fg-secondary)', lineHeight: 1.2 }}>
                    {t.label}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', fontWeight: 400, marginTop: 1 }}>
                    {t.sub}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* ── Tab 0: Profile ── */}
        {tab === 0 && (
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

            {/* Form columns */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Identity card */}
              <div className="card" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-muted)', marginBottom: 16 }}>
                  Personal information
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">First name *</label>
                    <input className="form-input" placeholder="First name" {...register('firstName', { required: 'First name is required' })} />
                    {errors.firstName && <span className="form-error">{errors.firstName.message}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last name *</label>
                    <input className="form-input" placeholder="Last name" {...register('lastName', { required: 'Last name is required' })} />
                    {errors.lastName && <span className="form-error">{errors.lastName.message}</span>}
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Email *</label>
                    <input className="form-input" type="email" placeholder="user@noq.health" {...register('email', { required: 'Email is required' })} />
                    {errors.email && <span className="form-error">{errors.email.message}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" placeholder="+91 XXXXX XXXXX" {...register('phone')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Joined date</label>
                    <input className="form-input" type="date" {...register('joined')} />
                  </div>
                </div>
              </div>

              {/* Role card */}
              <div className="card">
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-muted)', marginBottom: 16 }}>
                  Role & access
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-select" {...register('role')}>
                      {ROLES.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Scope / access level</label>
                    <input className="form-input" placeholder="e.g. All clinics, North zone" {...register('scope')} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Clinic (if clinic-specific)</label>
                    <input className="form-input" placeholder="Clinic name or leave blank" {...register('clinic')} />
                  </div>
                </div>
              </div>

              {/* Status card */}
              <div className="card">
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-muted)', marginBottom: 16 }}>
                  Account status
                </div>
                {seg(['active', 'on-leave', 'inactive'], status, setStatus)}
              </div>
            </div>

            {/* Live preview */}
            <div className="card" style={{ width: 260, flexShrink: 0, position: 'sticky', top: 20, borderTopLeftRadius: 0, borderTopRightRadius: 0, padding: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '10px 14px 0' }}>
                Live preview
              </div>
              <div style={{ height: 60, background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)', margin: '6px 0 0' }} />
              <div style={{ padding: '0 14px', marginTop: -24 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'var(--bg-section)', border: '2px solid var(--bg-surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 800, color: '#6366f1',
                }}>
                  {av}
                </div>
              </div>
              <div style={{ padding: '8px 14px 14px' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)', marginBottom: 2 }}>{name}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{role}{scope ? ` · ${scope}` : ''}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, margin: '10px 0' }}>
                  {[
                    { l: 'Modules', v: modSel.length > 0 ? String(modSel.length) : '—' },
                    { l: 'Scope',   v: scope ? scope.split(' ')[0] : '—' },
                    { l: '2FA',     v: twoFA ? 'On' : 'Off' },
                  ].map(k => (
                    <div key={k.l} style={{ background: 'var(--bg-section)', borderRadius: 8, padding: '6px 4px', textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--fg-primary)' }}>{k.v}</div>
                      <div style={{ fontSize: 10, color: 'var(--fg-muted)', marginTop: 1 }}>{k.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  <UserStatusBadge status={status} />
                  <Badge variant={(ROLE_VARIANTS[role] ?? 'muted') as any} style={{ fontSize: 10 }}>{role}</Badge>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Icon name="phone" size={13} style={{ color: 'var(--fg-muted)' }} />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-primary)' }}>Contact</span>
                </div>
                {email
                  ? <div style={{ fontSize: 12, color: 'var(--brand-500, #3b82f6)' }}>{email}</div>
                  : <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>—</div>
                }
                {phone && <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 2 }}>{phone}</div>}
              </div>

              {modSel.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border-light)', padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Icon name="shield" size={13} style={{ color: 'var(--fg-muted)' }} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-primary)' }}>Permissions</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {modSel.map(m => <span key={m} className="badge brand" style={{ fontSize: 10 }}>{m}</span>)}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── Tab 1: Access ── */}
        {tab === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Credentials card */}
            <div className="card" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-muted)', marginBottom: 16 }}>
                Credentials
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input className="form-input" placeholder="username" {...register('username')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password{!isEdit && ' *'}</label>
                  <input className="form-input" type="password" placeholder={isEdit ? 'Leave blank to keep current' : 'Set password'} {...register('password')} />
                  {!isEdit && <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 4 }}>Required for new users</div>}
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 8 }}>
                <label className="form-label">Two-factor authentication</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={twoFA} onChange={e => setTwoFA(e.target.checked)} style={{ width: 16, height: 16 }} />
                  <span style={{ fontSize: 13 }}>{twoFA ? 'Enabled' : 'Disabled'}</span>
                </label>
              </div>
            </div>

            {/* Module permissions card */}
            <div className="card">
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-muted)', marginBottom: 16 }}>
                Module permissions
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {MODULES.map(m => (
                  <button
                    key={m} type="button"
                    onClick={() => toggleMod(m)}
                    style={{
                      padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 600,
                      background: modSel.includes(m) ? 'var(--brand-gradient)' : 'var(--bg-section)',
                      color: modSel.includes(m) ? 'white' : 'var(--fg-secondary)',
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* IP whitelist card */}
            <div className="card">
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-muted)', marginBottom: 16 }}>
                IP whitelist
              </div>
              <div className="form-group">
                <label className="form-label">Allowed IPs (one per line)</label>
                <textarea className="form-textarea" rows={4} placeholder="One IP per line. Leave blank to allow all." {...register('ipList')} />
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 2: Activity ── */}
        {tab === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Last login card */}
            <div className="card" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-muted)', marginBottom: 16 }}>
                Last login
              </div>
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                {[
                  { label: 'Last seen',   value: 'Today · 09:42',  mono: false },
                  { label: 'IP address',  value: '192.168.1.10',   mono: true  },
                  { label: 'Device',      value: 'Chrome · macOS', mono: false },
                ].map(({ label, value, mono }) => (
                  <div key={label}>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', fontWeight: 500, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-primary)', fontFamily: mono ? 'var(--font-mono)' : undefined }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent activity card */}
            <div className="table-card">
              <div className="table-toolbar">
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)' }}>Recent activity</div>
              </div>
              <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {AUDIT_ROWS.map((row, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 8,
                      background: i % 2 === 0 ? 'var(--bg-section)' : 'transparent',
                    }}
                  >
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: AUDIT_DOT[row.kind] ?? 'var(--fg-muted)', flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: 13, color: 'var(--fg-primary)' }}>{row.action}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', whiteSpace: 'nowrap' }}>{row.when}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </form>
  )
}
