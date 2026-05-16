import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import { UserStatusBadge } from '@/components/ui/Badge'
import { useAppStore } from '@/store/app'
import { frontdeskService } from '@/services/frontdesk.service'
import { toast } from '@/store/toast'

type FormData = {
  firstName: string; lastName: string; gender: string; dob: string
  empId: string; joined: string; role: string; clinic: string; status: string
  startTime: string; endTime: string; breakStart: string; breakEnd: string
  mobile: string; altPhone: string; email: string; address: string
  emgName: string; emgRel: string; emgPhone: string
  username: string; password: string; notes: string
}

interface Props { id?: string; onClose?: () => void }

const ROLES   = ['Trainee','Receptionist','Senior receptionist','Lead receptionist','Front desk admin']
const SHIFTS  = ['Morning','Afternoon','Evening','Night','Split']
const MODULES = ['Bookings','Tokens','Patients','Doctors','Clinics','Billing','Reports','Pharmacy']
const DAYS    = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)} role="switch" aria-checked={on} style={{
      flexShrink: 0, width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
      background: on ? 'var(--brand-gradient)' : 'var(--border-soft)', position: 'relative', transition: 'background 0.2s',
    }}>
      <span style={{
        position: 'absolute', top: 2, left: on ? 22 : 2, width: 20, height: 20,
        borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

function SectionHead({ title }: { title: string }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase',
      letterSpacing: '0.06em', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border-light)',
    }}>
      {title}
    </div>
  )
}

function seg(opts: string[], val: string, set: (v: string) => void) {
  return <div className="seg-ctrl">{opts.map(o => <button key={o} type="button" className={val === o ? 'active' : ''} onClick={() => set(o)}>{o}</button>)}</div>
}

function chipSet(opts: string[], sel: string[], toggle: (v: string) => void) {
  return <div className="chip-lib">{opts.map(o => <button key={o} type="button" className={`tag${sel.includes(o) ? ' selected' : ''}`} onClick={() => toggle(o)}>{o}</button>)}</div>
}

const TABS = [
  { label: 'Profile', sub: 'Identity & employment',  icon: 'user'     },
  { label: 'Shift',   sub: 'Working days & timing',   icon: 'calendar' },
  { label: 'Contact', sub: 'Phone, email & address',  icon: 'phone'    },
  { label: 'Access',  sub: 'Permissions & system',    icon: 'shield'   },
]

export default function FrontDeskForm({ id, onClose }: Props) {
  const { setRoute } = useAppStore()
  const isEdit = Boolean(id)

  const [tab, setTab]             = useState(0)
  const [gender, setGender]       = useState('F')
  const [status, setStatus]       = useState('active')
  const [shiftType, setShiftType] = useState('Morning')
  const [daysSel, setDaysSel]     = useState<string[]>(['Mon','Tue','Wed','Thu','Fri'])
  const [modSel, setModSel]       = useState<string[]>(['Bookings','Tokens','Patients'])
  const [twoFA, setTwoFA]         = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: { role: 'Receptionist', startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00' }
  })

  const firstName = watch('firstName') || ''
  const lastName  = watch('lastName')  || ''
  const mobile    = watch('mobile')    || ''
  const email     = watch('email')     || ''
  const clinic    = watch('clinic')    || ''
  const empId     = watch('empId')     || ''
  const role      = watch('role')      || 'Receptionist'
  const startTime = watch('startTime') || '09:00'
  const endTime   = watch('endTime')   || '18:00'
  const name = `${firstName} ${lastName}`.trim() || 'New Staff'
  const av   = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  useEffect(() => {
    if (isEdit && id) {
      frontdeskService.get(id)
        .then(data => {
          reset(data)
          if (data.gender)              setGender(data.gender)
          if (data.status)              setStatus(data.status)
          if (data.shiftType)           setShiftType(data.shiftType)
          if (data.daysSel)             setDaysSel(data.daysSel)
          if (data.modSel)              setModSel(data.modSel)
          if (data.twoFA !== undefined) setTwoFA(data.twoFA)
        })
        .catch(() => { setServerError('Failed to load staff data'); toast.error('Failed to load record') })
    }
  }, [id])

  const toggleDay = (v: string) => setDaysSel(s => s.includes(v) ? s.filter(x => x !== v) : [...s, v])
  const toggleMod = (v: string) => setModSel(s => s.includes(v) ? s.filter(x => x !== v) : [...s, v])

  const onSubmit = async (data: FormData) => {
    try {
      setServerError(null)
      const payload = { ...data, gender, status, shiftType, daysSel, modSel, twoFA }
      if (isEdit) { await frontdeskService.update(id!, payload); toast.success('Updated successfully') }
      else        { await frontdeskService.create(payload);      toast.success('Staff created successfully') }
      if (onClose) onClose(); else setRoute('frontdesk')
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Save failed')
      toast.error(err.response?.data?.message || 'Save failed')
    }
  }

  const goBack = () => { if (onClose) onClose(); else setRoute('frontdesk') }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Header
        title={isEdit ? `Editing ${name}` : 'Create staff'}
        crumbs={isEdit ? `Front desk · ${name}` : 'Front desk · New staff'}
      />

      <div className="main">

        {/* Action bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={goBack}>
            <Icon name="chevL" size={13} /> Back
          </button>
          {isEdit && <UserStatusBadge status={status} />}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {serverError && (
              <span style={{ fontSize: 12, color: 'var(--danger-500, #ef4444)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="alert" size={13} /> {serverError}
              </span>
            )}
            <button type="button" className="btn btn-secondary btn-sm" onClick={goBack}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
              <Icon name="check" size={13} /> {isSubmitting ? 'Saving…' : isEdit ? 'Update staff' : 'Create staff'}
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
              <button key={t.label} type="button" onClick={() => setTab(i)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: active ? '2px solid var(--brand-500, #3b82f6)' : '2px solid transparent',
                marginBottom: -1,
              }}>
                <Icon name={t.icon as any} size={16} style={{ color: active ? 'var(--brand-500, #3b82f6)' : 'var(--fg-muted)' }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: active ? 'var(--brand-500, #3b82f6)' : 'var(--fg-secondary)', lineHeight: 1.2 }}>{t.label}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', fontWeight: 400, marginTop: 1 }}>{t.sub}</div>
                </div>
              </button>
            )
          })}
        </div>

        <div>

          {/* ─── Profile ─── */}
          {tab === 0 && (
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

              {/* Form columns */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="card" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                  <SectionHead title="Basic information" />
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label required">First name</label>
                      <input className="form-input" placeholder="First name" {...register('firstName', { required: 'First name is required' })} />
                      {errors.firstName && <span className="form-error">{errors.firstName.message}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label required">Last name</label>
                      <input className="form-input" placeholder="Last name" {...register('lastName', { required: 'Last name is required' })} />
                      {errors.lastName && <span className="form-error">{errors.lastName.message}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Gender</label>
                      {seg(['M', 'F', 'Other'], gender, setGender)}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Date of birth</label>
                      <input className="form-input" type="date" {...register('dob')} />
                    </div>
                  </div>
                </div>

                <div className="card">
                  <SectionHead title="Employment" />
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Employee ID</label>
                      <input className="form-input" placeholder="FD-XXX" {...register('empId')} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Joined date</label>
                      <input className="form-input" type="date" {...register('joined')} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Role</label>
                      <select className="form-select" {...register('role')}>
                        {ROLES.map(r => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Clinic</label>
                      <input className="form-input" placeholder="Clinic name" {...register('clinic')} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      {seg(['active', 'on-leave', 'inactive'], status, setStatus)}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <SectionHead title="Photo" />
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: 16,
                    border: '1.5px dashed var(--border-soft)', borderRadius: 12, background: 'var(--bg-section)',
                  }}>
                    <div className="av lg blue" style={{ flexShrink: 0 }}>
                      {firstName ? firstName[0].toUpperCase() : '?'}{lastName ? lastName[0].toUpperCase() : ''}
                    </div>
                    <div>
                      <button type="button" className="btn btn-secondary btn-sm">
                        <Icon name="upload" size={13} /> Upload photo
                      </button>
                      <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 5 }}>JPG or PNG · up to 2 MB · square recommended</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live preview */}
              <div className="card" style={{ width: 260, flexShrink: 0, position: 'sticky', top: 20, borderTopLeftRadius: 0, borderTopRightRadius: 0, padding: 0, overflow: 'hidden' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '10px 14px 0' }}>
                  Live preview
                </div>
                <div style={{ height: 60, background: 'linear-gradient(135deg, #3b82f6 0%, #14b8a6 100%)', margin: '6px 0 0' }} />
                <div style={{ padding: '0 14px', marginTop: -24 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: 'var(--bg-section)', border: '2px solid var(--bg-surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 800, color: 'var(--brand-500, #3b82f6)',
                  }}>
                    {av}
                  </div>
                </div>
                <div style={{ padding: '8px 14px 14px' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)', marginBottom: 2 }}>{name}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{role}{clinic ? ` · ${clinic}` : ''}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, margin: '10px 0' }}>
                    {[
                      { l: 'Modules', v: modSel.length > 0 ? String(modSel.length) : '—' },
                      { l: 'Days',    v: String(daysSel.length) },
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
                    {empId && <span className="badge muted" style={{ fontSize: 10 }}>{empId}</span>}
                    <span className="badge blue" style={{ fontSize: 10 }}>{shiftType}</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-light)', padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Icon name="calendar" size={13} style={{ color: 'var(--fg-muted)' }} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-primary)' }}>Shift</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                    {DAYS.map(d => (
                      <span key={d} style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 5,
                        background: daysSel.includes(d) ? 'var(--brand-500, #3b82f6)' : 'var(--bg-section)',
                        color: daysSel.includes(d) ? '#fff' : 'var(--fg-muted)',
                      }}>{d}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>{startTime} – {endTime}</div>
                </div>

                {(mobile || email) && (
                  <div style={{ borderTop: '1px solid var(--border-light)', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Icon name="phone" size={13} style={{ color: 'var(--fg-muted)' }} />
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-primary)' }}>Contact</span>
                    </div>
                    {mobile && <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>{mobile}</div>}
                    {email  && <div style={{ fontSize: 12, color: 'var(--brand-500, #3b82f6)', marginTop: 2 }}>{email}</div>}
                  </div>
                )}

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

          {/* ─── Shift ─── */}
          {tab === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                <SectionHead title="Shift type" />
                <div className="form-group">
                  {seg(SHIFTS, shiftType, setShiftType)}
                </div>
              </div>

              <div className="card">
                <SectionHead title="Working days" />
                <div className="day-pips">
                  {DAYS.map(d => (
                    <button key={d} type="button" className={`day-pip${daysSel.includes(d) ? ' active' : ''}`} onClick={() => toggleDay(d)}>{d}</button>
                  ))}
                </div>
              </div>

              <div className="card">
                <SectionHead title="Timing" />
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Start time</label>
                    <input className="form-input" type="time" {...register('startTime')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End time</label>
                    <input className="form-input" type="time" {...register('endTime')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Break start</label>
                    <input className="form-input" type="time" {...register('breakStart')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Break end</label>
                    <input className="form-input" type="time" {...register('breakEnd')} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Contact ─── */}
          {tab === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                <SectionHead title="Contact details" />
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label required">Mobile</label>
                    <input className="form-input" placeholder="+91 XXXXX XXXXX" {...register('mobile', { required: 'Mobile is required' })} />
                    {errors.mobile && <span className="form-error">{errors.mobile.message}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Alt phone</label>
                    <input className="form-input" {...register('altPhone')} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" placeholder="staff@noq.health" {...register('email')} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Address</label>
                    <textarea className="form-textarea" rows={3} placeholder="Full address" {...register('address')} />
                  </div>
                </div>
              </div>

              <div className="card">
                <SectionHead title="Emergency contact" />
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input className="form-input" placeholder="Contact name" {...register('emgName')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Relation</label>
                    <input className="form-input" placeholder="e.g. Spouse" {...register('emgRel')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" placeholder="+91 XXXXX XXXXX" {...register('emgPhone')} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Access ─── */}
          {tab === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                <SectionHead title="System access" />
                <div className="grid-2" style={{ marginBottom: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input className="form-input" placeholder="username" {...register('username')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Temp password</label>
                    <input className="form-input" type="password" placeholder="Temporary password" {...register('password')} />
                    <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 4 }}>User resets on first login</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-primary)' }}>Two-factor authentication</div>
                    <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>Extra login security via OTP</div>
                  </div>
                  <Toggle on={twoFA} onChange={setTwoFA} />
                </div>
              </div>

              <div className="card">
                <SectionHead title="Module permissions" />
                {chipSet(MODULES, modSel, toggleMod)}
              </div>

              <div className="card">
                <SectionHead title="Internal notes" />
                <div className="form-group">
                  <textarea className="form-textarea" rows={3} placeholder="Staff-only notes…" {...register('notes')} />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </form>
  )
}
