import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import { UserStatusBadge } from '@/components/ui/Badge'
import { useAppStore } from '@/store/app'
import { useAuthStore } from '@/store/auth'
import { nursesService } from '@/services/nurses.service'
import { toast } from '@/store/toast'

function nurseToForm(n: any): any {
  const split = (full?: string) => {
    if (!full) return { firstName: '', lastName: '' }
    const parts = full.trim().split(/\s+/)
    return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') }
  }
  const fn = n.firstName ?? split(n.name).firstName
  const ln = n.lastName  ?? split(n.name).lastName
  const dob    = n.dob      ? new Date(n.dob).toISOString().slice(0, 10) : ''
  const joined = n.joinedAt ? new Date(n.joinedAt).toISOString().slice(0, 10) : ''
  return {
    firstName: fn, lastName: ln, gender: n.gender || 'F', dob,
    bg:        n.bloodGroup || 'O+',
    exp:       n.experience != null ? String(n.experience) : '',
    empId:     n.employeeId || '',
    regNum:    n.registrationNumber || '',
    joined,
    role:      n.role || 'Staff nurse',
    clinic:    n.clinicId?._id || n.clinicId || '',
    status:    n.status || 'active',
    ward:      n.ward || '',
    startTime: n.startTime || '07:00',
    endTime:   n.endTime   || '15:00',
    breakStart:n.breakStart|| '12:00',
    breakEnd:  n.breakEnd  || '13:00',
    mobile:    n.phone     || '',
    altPhone:  n.altPhone  || '',
    email:     n.email     || '',
    address:   n.address   || '',
    emgName:   n.emergencyContact?.name     || '',
    emgRel:    n.emergencyContact?.relation || '',
    emgPhone:  n.emergencyContact?.phone    || '',
    username:  n.username  || '',
    password:  '',
    notes:     n.notes     || '',
  }
}

function formToNursePayload(data: any, extras: { gender: string; status: string; shiftType: string; deptSel: string[]; daysSel: string[]; certSel: string[]; rotational: boolean; onCall: boolean; clinicId?: string }) {
  const start = Number((data.startTime || '').slice(0, 2)) || 0
  const shift: 'morning' | 'evening' | 'night' = start < 12 ? 'morning' : start < 17 ? 'evening' : 'night'
  const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim()
  return {
    name:        fullName || data.firstName || 'Unnamed Nurse',
    firstName:   data.firstName, lastName: data.lastName,
    gender:      extras.gender, dob: data.dob || undefined,
    bloodGroup:  data.bg,
    email:       data.email, phone: data.mobile, altPhone: data.altPhone, address: data.address,
    qualification: data.regNum || 'B.Sc Nursing',
    experience:    data.exp ? Number(data.exp) : undefined,
    employeeId:    data.empId, registrationNumber: data.regNum,
    joinedAt:      data.joined || undefined,
    role:          data.role,
    shift,
    shiftType:     extras.shiftType,
    departments:   extras.deptSel,
    availableDays: extras.daysSel,
    startTime:     data.startTime, endTime: data.endTime,
    breakStart:    data.breakStart, breakEnd: data.breakEnd,
    rotational:    extras.rotational, onCall: extras.onCall,
    certifications:extras.certSel,
    ward:          data.ward,
    emergencyContact: { name: data.emgName, relation: data.emgRel, phone: data.emgPhone },
    username:      data.username,
    notes:         data.notes,
    status:        extras.status,
    ...(extras.clinicId ? { clinicId: extras.clinicId } : {}),
  }
}

type FormData = {
  firstName: string; lastName: string; gender: string; dob: string
  bg: string; exp: string; empId: string; regNum: string; joined: string
  role: string; clinic: string; status: string; ward: string
  startTime: string; endTime: string; breakStart: string; breakEnd: string
  mobile: string; altPhone: string; email: string; address: string
  emgName: string; emgRel: string; emgPhone: string
  username: string; password: string; notes: string
}

interface Props { id?: string; viewOnly?: boolean; onClose?: () => void }

const ROLES   = ['Trainee','Staff nurse','Senior nurse','Charge nurse','Head nurse','Nurse manager']
const DEPTS   = ['ICU','ER','Surgery','Pediatrics','Maternity','Cardiology','OPD','General','Oncology','Admin']
const SHIFTS  = ['Morning','Afternoon','Evening','Night','Rotational']
const BG_OPTS = ['A+','A-','B+','B-','AB+','AB-','O+','O-']
const DAYS    = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const CERTS   = ['BLS','ACLS','PALS','NRP','IV Therapy','Wound Care','Critical Care','Phlebotomy','Triage','Infection Control']

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

function ToggleRow({ label, desc, on, onChange }: { label: string; desc?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-section)', borderRadius: 10, border: '1px solid var(--border-soft)' }}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-primary)' }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>{desc}</div>}
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  )
}

const TABS = [
  { label: 'Profile',      sub: 'Identity & employment',    icon: 'user'     },
  { label: 'Shift & ward', sub: 'Working days & timing',    icon: 'calendar' },
  { label: 'Contact',      sub: 'Phone, email & emergency', icon: 'phone'    },
  { label: 'Skills',       sub: 'Certs, access & notes',    icon: 'activity' },
]

export default function NurseForm({ id, viewOnly = false, onClose }: Props) {
  const { setRoute } = useAppStore()
  const user = useAuthStore((s) => s.user)
  const isEdit = Boolean(id) && !viewOnly
  const isView = viewOnly

  const [tab, setTab]           = useState(0)
  const [gender, setGender]     = useState('F')
  const [status, setStatus]     = useState('active')
  const [shiftType, setShiftType] = useState('Morning')
  const [deptSel, setDeptSel]   = useState<string[]>([])
  const [daysSel, setDaysSel]   = useState<string[]>(['Mon','Tue','Wed','Thu','Fri'])
  const [certSel, setCertSel]   = useState<string[]>([])
  const [rotational, setRotational] = useState(false)
  const [onCall, setOnCall]     = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: { bg: 'O+', role: 'Staff nurse', startTime: '07:00', endTime: '15:00', breakStart: '12:00', breakEnd: '13:00' }
  })

  const firstName = watch('firstName') || ''
  const lastName  = watch('lastName')  || ''
  const exp       = watch('exp')       || ''
  const ward      = watch('ward')      || ''
  const mobile    = watch('mobile')    || ''
  const email     = watch('email')     || ''
  const clinic    = watch('clinic')    || ''
  const role      = watch('role')      || 'Staff nurse'
  const startTime = watch('startTime') || '07:00'
  const endTime   = watch('endTime')   || '15:00'
  const name = `${firstName} ${lastName}`.trim() || 'New Nurse'
  const av   = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  useEffect(() => {
    if (!id) return
    nursesService.get(id)
      .then((data: any) => {
        reset(nurseToForm(data) as FormData)
        if (data.gender)                       setGender(data.gender)
        if (data.status)                       setStatus(data.status)
        if (data.shiftType)                    setShiftType(data.shiftType)
        if (Array.isArray(data.departments))   setDeptSel(data.departments)
        if (Array.isArray(data.availableDays)) setDaysSel(data.availableDays)
        if (Array.isArray(data.certifications))setCertSel(data.certifications)
        if (data.rotational !== undefined)     setRotational(Boolean(data.rotational))
        if (data.onCall !== undefined)         setOnCall(Boolean(data.onCall))
      })
      .catch(() => { setServerError('Failed to load nurse data'); toast.error('Failed to load record') })
  }, [id, reset])

  const toggleDept = (v: string) => setDeptSel(s => s.includes(v) ? s.filter(x => x !== v) : [...s, v])
  const toggleDay  = (v: string) => setDaysSel(s => s.includes(v) ? s.filter(x => x !== v) : [...s, v])
  const toggleCert = (v: string) => setCertSel(s => s.includes(v) ? s.filter(x => x !== v) : [...s, v])

  const onSubmit = async (data: FormData) => {
    try {
      setServerError(null)
      const payload = formToNursePayload(data, {
        gender, status, shiftType, deptSel, daysSel, certSel, rotational, onCall,
        clinicId: isEdit ? undefined : user?.clinicId,
      })
      if (isEdit) {
        await nursesService.update(id!, payload); toast.success('Nurse updated successfully')
      } else {
        if (!payload.clinicId) { toast.error('No clinic on session — cannot create nurse'); return }
        await nursesService.create(payload);      toast.success('Nurse created successfully')
      }
      if (onClose) onClose(); else setRoute('nurses')
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Save failed')
      toast.error(err.response?.data?.message || 'Save failed')
    }
  }

  const goBack = () => { if (onClose) onClose(); else setRoute('nurses') }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Header
        title={isView ? `Viewing ${name}` : isEdit ? `Editing ${name}` : 'Create nurse'}
        crumbs={isView ? `Nurses · ${name} · View` : isEdit ? `Nurses · ${name}` : 'Nurses · New nurse'}
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
            <button type="button" className="btn btn-secondary btn-sm" onClick={goBack}>
              {isView ? 'Close' : 'Cancel'}
            </button>
            {isView ? (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setRoute('nurse-edit')}>
                <Icon name="edit" size={13} /> Edit nurse
              </button>
            ) : (
              <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
                <Icon name="check" size={13} /> {isSubmitting ? 'Saving…' : isEdit ? 'Update nurse' : 'Create nurse'}
              </button>
            )}
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

        <fieldset disabled={isView} style={{ border: 'none', padding: 0, margin: 0, opacity: 1 }}>

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
                    <div className="form-group">
                      <label className="form-label">Blood group</label>
                      <select className="form-select" {...register('bg')}>
                        {BG_OPTS.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Experience (years)</label>
                      <input className="form-input" type="number" min="0" placeholder="Years of experience" {...register('exp')} />
                    </div>
                  </div>
                </div>

                <div className="card">
                  <SectionHead title="Employment" />
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Employee ID</label>
                      <input className="form-input" placeholder="NR-XXX" {...register('empId')} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nursing council reg #</label>
                      <input className="form-input" placeholder="Registration number" {...register('regNum')} />
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
                    <div className="form-group" style={{ gridColumn: '1/-1' }}>
                      <label className="form-label">Department(s)</label>
                      {chipSet(DEPTS, deptSel, toggleDept)}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <SectionHead title="Photo" />
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: 16,
                    border: '1.5px dashed var(--border-soft)', borderRadius: 12, background: 'var(--bg-section)',
                  }}>
                    <div className="av lg pink" style={{ flexShrink: 0 }}>
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
                <div style={{ height: 60, background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', margin: '6px 0 0' }} />
                <div style={{ padding: '0 14px', marginTop: -24 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: 'var(--bg-section)', border: '2px solid var(--bg-surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 800, color: '#ec4899',
                  }}>
                    {av}
                  </div>
                </div>
                <div style={{ padding: '8px 14px 14px' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)', marginBottom: 2 }}>{name}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{role}{clinic ? ` · ${clinic}` : ''}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, margin: '10px 0' }}>
                    {[
                      { l: 'Exp',   v: exp ? `${exp} yr` : '—' },
                      { l: 'Ward',  v: ward || '—' },
                      { l: 'Certs', v: certSel.length > 0 ? String(certSel.length) : '—' },
                    ].map(k => (
                      <div key={k.l} style={{ background: 'var(--bg-section)', borderRadius: 8, padding: '6px 4px', textAlign: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--fg-primary)' }}>{k.v}</div>
                        <div style={{ fontSize: 10, color: 'var(--fg-muted)', marginTop: 1 }}>{k.l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    <UserStatusBadge status={status} />
                    {deptSel.map(d => <span key={d} className="badge pink" style={{ fontSize: 10 }}>{d}</span>)}
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
                        background: daysSel.includes(d) ? '#ec4899' : 'var(--bg-section)',
                        color: daysSel.includes(d) ? '#fff' : 'var(--fg-muted)',
                      }}>{d}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>{startTime} – {endTime}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>{shiftType}</div>
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

                {certSel.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-light)', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Icon name="activity" size={13} style={{ color: 'var(--fg-muted)' }} />
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-primary)' }}>Certifications</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {certSel.map(c => <span key={c} className="badge pink" style={{ fontSize: 10 }}>{c}</span>)}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ─── Shift & ward ─── */}
          {tab === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                <SectionHead title="Shift type" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Shift</label>
                    {seg(SHIFTS, shiftType, setShiftType)}
                  </div>
                  <div className="grid-2">
                    <ToggleRow label="Rotational shift" desc="Shift rotates across periods" on={rotational} onChange={setRotational} />
                    <ToggleRow label="On-call eligible" desc="Available for emergency calls" on={onCall} onChange={setOnCall} />
                  </div>
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
                  <div className="form-group">
                    <label className="form-label">Ward / room</label>
                    <input className="form-input" placeholder="Ward or room ID" {...register('ward')} />
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
                    <input className="form-input" type="email" placeholder="nurse@noq.health" {...register('email')} />
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

          {/* ─── Skills ─── */}
          {tab === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                <SectionHead title="System access" />
                <div className="grid-2">
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
              </div>

              <div className="card">
                <SectionHead title="Certifications" />
                {chipSet(CERTS, certSel, toggleCert)}
              </div>

              <div className="card">
                <SectionHead title="Internal notes" />
                <div className="form-group">
                  <textarea className="form-textarea" rows={3} placeholder="Staff-only notes…" {...register('notes')} />
                </div>
              </div>
            </div>
          )}

        </fieldset>
      </div>
    </form>
  )
}
