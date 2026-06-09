import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import Badge from '@/components/ui/Badge'
import { useAppStore } from '@/store/app'
import { useAuthStore } from '@/store/auth'
import { doctorsService } from '@/services/doctors.service'
import { toast } from '@/store/toast'

/** Doctor record → flat form data. */
function doctorToForm(d: any): any {
  const split = (full?: string) => {
    if (!full) return { firstName: '', lastName: '' }
    const parts = full.trim().split(/\s+/)
    return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') }
  }
  const fn = d.firstName ?? split(d.name).firstName
  const ln = d.lastName  ?? split(d.name).lastName
  const wh = d.workingHours?.[0] ?? {}
  const pad = (n?: number) => n != null ? String(n).padStart(2, '0') + ':00' : ''
  const dob = d.dob ? new Date(d.dob).toISOString().slice(0, 10) : ''
  return {
    firstName: fn, lastName: ln, gender: d.gender || 'F', dob,
    qual:       d.qualification    || '',
    exp:        d.experience != null ? String(d.experience) : '',
    consultFee: d.consultationFee != null ? String(d.consultationFee) : '',
    followFee:  d.followUpFee     != null ? String(d.followUpFee) : '',
    mobile:     d.phone    || '',
    email:      d.email    || '',
    clinic:     d.clinicId?._id   || d.clinicId || '',
    address:    d.address  || '',
    bio:        d.bio      || '',
    achieve:    d.achievements || '',
    notes:      d.notes    || '',
    startTime:  pad(wh.start) || '09:00',
    endTime:    pad(wh.end)   || '18:00',
    slotDur:    d.slotDuration != null ? String(d.slotDuration) : '15',
    maxTokens:  d.maxTokens != null ? String(d.maxTokens) : '30',
    breakStart: d.breakStart || '13:00',
    breakEnd:   d.breakEnd   || '14:00',
  }
}

/** Form data + tab-local state → server payload. */
function formToDoctorPayload(data: any, extras: { gender: string; specSel: string[]; langSel: string[]; daysSel: string[]; schedActive: boolean; clinicId?: string }) {
  const hr = (t: string) => Number((t || '').slice(0, 2)) || 0
  const start = hr(data.startTime)
  const end   = hr(data.endTime)
  const shift: 'morning' | 'evening' | 'night' =
    start < 12 ? 'morning' : start < 17 ? 'evening' : 'night'
  const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim()
  return {
    name:       fullName || data.firstName || data.lastName || 'Unnamed Doctor',
    firstName:  data.firstName, lastName: data.lastName,
    gender:     extras.gender, dob: data.dob || undefined,
    email:      data.email, phone: data.mobile, address: data.address,
    specialization:  extras.specSel[0] || 'General medicine',
    specializations: extras.specSel,
    qualification:   data.qual,
    experience:      data.exp ? Number(data.exp) : undefined,
    consultationFee: data.consultFee ? Number(data.consultFee) : undefined,
    followUpFee:     data.followFee ? Number(data.followFee) : undefined,
    languages:       extras.langSel,
    availableDays:   extras.daysSel,
    shift,
    workingHours:    end > start ? [{ start, end }] : undefined,
    slotDuration:    data.slotDur   ? Number(data.slotDur)   : undefined,
    maxTokens:       data.maxTokens ? Number(data.maxTokens) : undefined,
    breakStart:      data.breakStart, breakEnd: data.breakEnd,
    scheduleActive:  extras.schedActive,
    bio:             data.bio, achievements: data.achieve, notes: data.notes,
    status:          extras.schedActive ? 'active' : 'inactive',
    ...(extras.clinicId ? { clinicId: extras.clinicId } : {}),
  }
}

type FormData = {
  firstName: string; lastName: string; gender: string; dob: string
  qual: string; exp: string; consultFee: string; followFee: string
  mobile: string; email: string; clinic: string; address: string
  bio: string; achieve: string; notes: string
  startTime: string; endTime: string; slotDur: string
  maxTokens: string; breakStart: string; breakEnd: string
}

interface Props { id?: string; viewOnly?: boolean; onClose?: () => void }

const SPECS = ['General medicine','Cardiology','Dermatology','Pediatrics','Gynecology','Orthopedics','Neurology','Psychiatry','ENT','Ophthalmology','Dentistry','Oncology']
const LANGS = ['English','Hindi','Tamil','Telugu','Kannada','Malayalam','Bengali']
const DAYS  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const SLOTS = ['5','10','15','20']

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

function chips(opts: string[], sel: string[], toggle: (v: string) => void) {
  return <div className="chip-lib">{opts.map(o => <button key={o} type="button" className={`tag${sel.includes(o) ? ' selected' : ''}`} onClick={() => toggle(o)}>{o}</button>)}</div>
}

const TABS = [
  { label: 'Profile',      sub: 'Identity & specialization',  icon: 'user'     },
  { label: 'Schedule',     sub: 'Working days & timing',      icon: 'calendar' },
  { label: 'Contact info', sub: 'Phone, email & location',    icon: 'phone'    },
  { label: 'About',        sub: 'Bio, achievements & notes',  icon: 'edit'     },
]

export default function DoctorForm({ id, viewOnly = false, onClose }: Props) {
  const { setRoute } = useAppStore()
  const user = useAuthStore((s) => s.user)
  const isEdit = Boolean(id) && !viewOnly
  const isView = viewOnly

  const [tab, setTab]               = useState(0)
  const [gender, setGender]         = useState('F')
  const [specSel, setSpecSel]       = useState<string[]>([])
  const [langSel, setLangSel]       = useState<string[]>([])
  const [daysSel, setDaysSel]       = useState<string[]>(['Mon','Tue','Wed','Thu','Fri'])
  const [schedActive, setSchedActive] = useState(true)
  const [slotDur, setSlotDur]       = useState('15')
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: { gender: 'F', startTime: '09:00', endTime: '18:00', slotDur: '15', maxTokens: '30', breakStart: '13:00', breakEnd: '14:00' }
  })

  const firstName  = watch('firstName')  || ''
  const lastName   = watch('lastName')   || ''
  const consultFee = watch('consultFee') || ''
  const exp        = watch('exp')        || ''
  const mobile     = watch('mobile')     || ''
  const email      = watch('email')      || ''
  const clinic     = watch('clinic')     || ''
  const startTime  = watch('startTime')  || '09:00'
  const endTime    = watch('endTime')    || '18:00'
  const name = `${firstName} ${lastName}`.trim() || 'New Doctor'
  const av   = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  useEffect(() => {
    if (!id) return
    doctorsService.get(id)
      .then((data: any) => {
        reset(doctorToForm(data) as FormData)
        if (data.gender)          setGender(data.gender)
        if (Array.isArray(data.specializations) && data.specializations.length) setSpecSel(data.specializations)
        else if (data.specialization)                                            setSpecSel([data.specialization])
        if (Array.isArray(data.languages))     setLangSel(data.languages)
        if (Array.isArray(data.availableDays)) setDaysSel(data.availableDays)
        if (data.scheduleActive !== undefined) setSchedActive(Boolean(data.scheduleActive))
        if (data.slotDuration) setSlotDur(String(data.slotDuration))
      })
      .catch(() => { setServerError('Failed to load doctor data'); toast.error('Failed to load record') })
  }, [id, reset])

  const toggleSpec = (v: string) => setSpecSel(s => s.includes(v) ? s.filter(x => x !== v) : [...s, v])
  const toggleLang = (v: string) => setLangSel(s => s.includes(v) ? s.filter(x => x !== v) : [...s, v])
  const toggleDay  = (v: string) => setDaysSel(s => s.includes(v) ? s.filter(x => x !== v) : [...s, v])

  const onSubmit = async (data: FormData) => {
    try {
      setServerError(null)
      const payload = formToDoctorPayload(data, {
        gender, specSel, langSel, daysSel, schedActive,
        clinicId: isEdit ? undefined : user?.clinicId,
      })
      if (isEdit) {
        await doctorsService.update(id!, payload); toast.success('Doctor updated successfully')
      } else {
        if (!payload.clinicId) { toast.error('No clinic on session — cannot create doctor'); return }
        await doctorsService.create(payload);     toast.success('Doctor created successfully')
      }
      if (onClose) onClose(); else setRoute('doctors')
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Save failed')
      toast.error(err.response?.data?.message || 'Save failed')
    }
  }

  const goBack = () => { if (onClose) onClose(); else setRoute('doctors') }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Header
        title={isView ? `Viewing Dr. ${name}` : isEdit ? `Editing Dr. ${name}` : 'Create doctor'}
        crumbs={isView ? `Doctors · Dr. ${name} · View` : isEdit ? `Doctors · Dr. ${name}` : 'Doctors · New doctor'}
      />

      <div className="main">

        {/* Action bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={goBack}>
            <Icon name="chevL" size={13} /> Back
          </button>
          {isView && <Badge variant="blue" dot>View only</Badge>}
          {isEdit && <Badge variant="warning" dot>Editing</Badge>}
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
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setRoute('doctor-edit')}>
                <Icon name="edit" size={13} /> Edit doctor
              </button>
            ) : (
              <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
                <Icon name="check" size={13} /> {isSubmitting ? 'Saving…' : isEdit ? 'Update doctor' : 'Create doctor'}
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
                    <div className="form-group" style={{ gridColumn: '1/-1' }}>
                      <label className="form-label required">Qualification</label>
                      <input className="form-input" placeholder="e.g. MBBS, MD" {...register('qual', { required: 'Qualification is required' })} />
                      {errors.qual && <span className="form-error">{errors.qual.message}</span>}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <SectionHead title="Specialization" />
                  <div className="form-group">
                    <label className="form-label required">Select specializations</label>
                    {chips(SPECS, specSel, toggleSpec)}
                    {specSel.length === 0 && (
                      <span className="form-error" style={{ marginTop: 6, display: 'block' }}>Select at least one specialization</span>
                    )}
                  </div>
                </div>

                <div className="card">
                  <SectionHead title="Professional details" />
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label required">Experience (years)</label>
                      <input className="form-input" type="number" min="0" placeholder="e.g. 12" {...register('exp', { required: 'Experience is required' })} />
                      {errors.exp && <span className="form-error">{errors.exp.message}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label required">Consultation fee (₹)</label>
                      <input className="form-input" type="number" min="0" placeholder="e.g. 400" {...register('consultFee', { required: 'Consultation fee is required' })} />
                      {errors.consultFee && <span className="form-error">{errors.consultFee.message}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Follow-up fee (₹)</label>
                      <input className="form-input" type="number" min="0" placeholder="e.g. 250" {...register('followFee')} />
                    </div>
                  </div>
                </div>

                <div className="card">
                  <SectionHead title="Languages spoken" />
                  {chips(LANGS, langSel, toggleLang)}
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
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)', marginBottom: 2 }}>
                    {firstName || lastName ? `Dr. ${name}` : 'New Doctor'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{specSel[0] || 'Specialization'}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, margin: '10px 0' }}>
                    {[
                      { l: 'Fee',   v: consultFee ? `₹${consultFee}` : '—' },
                      { l: 'Exp',   v: exp ? `${exp} yr` : '—' },
                      { l: 'Langs', v: langSel.length > 0 ? String(langSel.length) : '—' },
                    ].map(k => (
                      <div key={k.l} style={{ background: 'var(--bg-section)', borderRadius: 8, padding: '6px 4px', textAlign: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--fg-primary)' }}>{k.v}</div>
                        <div style={{ fontSize: 10, color: 'var(--fg-muted)', marginTop: 1 }}>{k.l}</div>
                      </div>
                    ))}
                  </div>
                  {specSel.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {specSel.map(s => <span key={s} className="badge brand" style={{ fontSize: 10 }}>{s}</span>)}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border-light)', padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Icon name="calendar" size={13} style={{ color: 'var(--fg-muted)' }} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-primary)' }}>Schedule</span>
                    <span className={`badge ${schedActive ? 'success' : 'gray'}`} style={{ fontSize: 10, marginLeft: 'auto' }}>{schedActive ? 'Active' : 'Off'}</span>
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
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>{slotDur} min slots</div>
                </div>

                {(mobile || email || clinic) && (
                  <div style={{ borderTop: '1px solid var(--border-light)', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Icon name="phone" size={13} style={{ color: 'var(--fg-muted)' }} />
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-primary)' }}>Contact</span>
                    </div>
                    {mobile && <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>{mobile}</div>}
                    {email  && <div style={{ fontSize: 12, color: 'var(--brand-500, #3b82f6)', marginTop: 2 }}>{email}</div>}
                    {clinic && <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>{clinic}</div>}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ─── Schedule ─── */}
          {tab === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                <SectionHead title="Schedule status" />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-primary)' }}>Schedule active</div>
                    <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>Doctor is available for appointments</div>
                  </div>
                  <Toggle on={schedActive} onChange={setSchedActive} />
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

              <div className="card">
                <SectionHead title="Slot configuration" />
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Slot duration (min)</label>
                    {seg(SLOTS, slotDur, setSlotDur)}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max tokens per day</label>
                    <input className="form-input" type="number" min="1" {...register('maxTokens')} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Contact info ─── */}
          {tab === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                <SectionHead title="Contact details" />
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Mobile</label>
                    <input className="form-input" placeholder="+91 XXXXX XXXXX" {...register('mobile')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" placeholder="doctor@noq.health" {...register('email')} />
                  </div>
                </div>
              </div>

              <div className="card">
                <SectionHead title="Clinic & location" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Clinic name</label>
                    <input className="form-input" placeholder="Clinic name" {...register('clinic')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <textarea className="form-textarea" rows={3} placeholder="Full address" {...register('address')} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── About ─── */}
          {tab === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                <SectionHead title="Biography" />
                <div className="form-group">
                  <label className="form-label">Professional bio</label>
                  <textarea className="form-textarea" rows={5} maxLength={600} placeholder="Brief professional bio…" {...register('bio')} />
                </div>
              </div>

              <div className="card">
                <SectionHead title="Achievements" />
                <div className="form-group">
                  <label className="form-label">Awards & publications</label>
                  <textarea className="form-textarea" rows={3} placeholder="Awards, publications, milestones…" {...register('achieve')} />
                </div>
              </div>

              <div className="card">
                <SectionHead title="Internal notes" />
                <div className="form-group">
                  <label className="form-label">Staff notes</label>
                  <textarea className="form-textarea" rows={3} placeholder="Staff-only notes (not visible to patients)" {...register('notes')} />
                </div>
              </div>
            </div>
          )}

        </fieldset>
      </div>
    </form>
  )
}
