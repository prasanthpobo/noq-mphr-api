import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import Badge, { PatientTagBadge } from '@/components/ui/Badge'
import { useAppStore } from '@/store/app'
import { patientsService } from '@/services/patients.service'
import { toast } from '@/store/toast'

type FormData = {
  firstName: string; lastName: string; gender: string; dob: string
  bg: string; marital: string; occ: string; ptag: string
  mobile: string; altPhone: string; email: string
  street: string; city: string; state: string; pin: string
  emgName: string; emgRel: string; emgPhone: string
  govType: string; govNum: string
  meds: string; surgeries: string; medNotes: string
  insurer: string; policy: string; validTill: string; cashless: boolean
}

interface Props { id?: string; onClose?: () => void }

const ALLERGIES  = ['Penicillin','Sulfa','Aspirin','Ibuprofen','Latex','Peanuts','Shellfish','Dust','Pollen','Mold']
const CONDITIONS = ['Hypertension','Diabetes','Asthma','Hypothyroid','COPD','Arthritis','Anemia','Depression','Obesity','CAD']
const BG_OPTS    = ['A+','A-','B+','B-','AB+','AB-','O+','O-']
const GOV_IDS    = ['Aadhaar','PAN','Passport','Voter ID','Driving Licence']

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

function PreviewCardHead({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--border-light)' }}>
      <Icon name={icon} size={13} />
      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-primary)' }}>{title}</span>
    </div>
  )
}

function seg(opts: string[], val: string, set: (v: string) => void) {
  return <div className="seg-ctrl">{opts.map(o => <button key={o} type="button" className={val === o ? 'active' : ''} onClick={() => set(o)}>{o}</button>)}</div>
}

function chipSet(opts: string[], sel: string[], toggle: (v: string) => void) {
  return <div className="chip-lib">{opts.map(o => <button key={o} type="button" className={`tag${sel.includes(o) ? ' selected' : ''}`} onClick={() => toggle(o)}>{o}</button>)}</div>
}

function calcAge(dob: string) {
  if (!dob) return ''
  return String(Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000)))
}

export default function PatientForm({ id, onClose }: Props) {
  const { setRoute } = useAppStore()
  const isEdit = Boolean(id)

  const [tab, setTab]           = useState(0)
  const [gender, setGender]     = useState('M')
  const [marital, setMarital]   = useState('Single')
  const [ptag, setPtag]         = useState('active')
  const [allergies, setAllergies]   = useState<string[]>([])
  const [conditions, setConditions] = useState<string[]>([])
  const [cashlessOn, setCashlessOn] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: { bg: 'O+', govType: 'Aadhaar', cashless: false }
  })

  const firstName = watch('firstName') || ''
  const lastName  = watch('lastName')  || ''
  const dob       = watch('dob')       || ''
  const bg        = watch('bg')        || 'O+'
  const mobile    = watch('mobile')    || ''
  const email     = watch('email')     || ''
  const insurer   = watch('insurer')   || ''
  const policy    = watch('policy')    || ''
  const age  = calcAge(dob)
  const name = `${firstName} ${lastName}`.trim() || 'New Patient'
  const av   = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  useEffect(() => {
    if (isEdit && id) {
      patientsService.get(id)
        .then(data => {
          reset(data)
          if (data.gender)              setGender(data.gender)
          if (data.marital)             setMarital(data.marital)
          if (data.ptag)                setPtag(data.ptag)
          if (data.allergies)           setAllergies(data.allergies)
          if (data.conditions)          setConditions(data.conditions)
          if (data.cashless !== undefined) setCashlessOn(data.cashless)
        })
        .catch(() => { setServerError('Failed to load patient data'); toast.error('Failed to load record') })
    }
  }, [id])

  const toggleA = (v: string) => setAllergies(s => s.includes(v) ? s.filter(x => x !== v) : [...s, v])
  const toggleC = (v: string) => setConditions(s => s.includes(v) ? s.filter(x => x !== v) : [...s, v])

  const onSubmit = async (data: FormData) => {
    try {
      setServerError(null)
      const payload = { ...data, gender, marital, ptag, allergies, conditions, cashless: cashlessOn }
      if (isEdit) { await patientsService.update(id!, payload); toast.success('Updated successfully') }
      else        { await patientsService.create(payload);      toast.success('Patient created successfully') }
      if (onClose) onClose(); else setRoute('patients')
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Save failed')
      toast.error(err.response?.data?.message || 'Save failed')
    }
  }

  const TABS = [
    { label: 'Profile',          sub: 'Identity, type & registration', icon: 'user'      },
    { label: 'Contact & ID',     sub: 'Phone, email & address',        icon: 'phone'     },
    { label: 'Medical history',  sub: 'Allergies & conditions',        icon: 'heart'     },
    { label: 'Insurance',        sub: 'Coverage & policy',             icon: 'shield'    },
  ]

  const goBack = () => { if (onClose) onClose(); else setRoute('patients') }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>

      <Header
        title={isEdit ? `Editing ${name}` : 'Create patient'}
        crumbs={isEdit ? `Patients · ${name}` : 'Patients · New patient'}
      />

      <div className="main">

        {/* Action bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={goBack}>
            <Icon name="chevL" size={13} /> Back
          </button>
          {isEdit && <PatientTagBadge tag={ptag} />}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {serverError && (
              <span style={{ fontSize: 12, color: 'var(--danger-500, #ef4444)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="alert" size={13} /> {serverError}
              </span>
            )}
            <button type="button" className="btn btn-secondary btn-sm" onClick={goBack}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
              <Icon name="check" size={13} /> {isSubmitting ? 'Saving…' : isEdit ? 'Update patient' : 'Create patient'}
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
                      <label className="form-label">Date of birth{age ? ` · ${age} yrs` : ''}</label>
                      <input className="form-input" type="date" {...register('dob')} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Blood group</label>
                      <select className="form-select" {...register('bg')}>
                        {BG_OPTS.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Marital status</label>
                      {seg(['Single', 'Married', 'Other'], marital, setMarital)}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <SectionHead title="Status" />
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Occupation</label>
                      <input className="form-input" placeholder="Occupation" {...register('occ')} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Patient tag</label>
                      {seg(['active', 'new', 'follow-up', 'critical'], ptag, setPtag)}
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
                      <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 5 }}>
                        JPG or PNG · up to 2 MB · square recommended
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live preview */}
              <div className="card" style={{ width: 260, flexShrink: 0, position: 'sticky', top: 20, borderTopLeftRadius: 0, borderTopRightRadius: 0, padding: 0, overflow: 'hidden' }}>

                {/* LIVE PREVIEW label */}
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '10px 14px 0' }}>
                  Live preview
                </div>

                {/* Gradient hero */}
                <div style={{ height: 60, background: 'linear-gradient(135deg, #3b82f6 0%, #14b8a6 100%)', margin: '6px 0 0' }} />

                {/* Avatar overlapping gradient */}
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

                {/* Name + meta + stats */}
                <div style={{ padding: '8px 14px 14px' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)', marginBottom: 2 }}>{name}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                    {age ? `${age} yrs · ` : ''}{gender}{bg ? ` · ${bg}` : ''}
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, margin: '10px 0' }}>
                    {[
                      { l: 'Allergies',  v: allergies.length  > 0 ? String(allergies.length)  : '—' },
                      { l: 'Conditions', v: conditions.length > 0 ? String(conditions.length) : '—' },
                      { l: '2FA',        v: 'Off' },
                    ].map(k => (
                      <div key={k.l} style={{ background: 'var(--bg-section)', borderRadius: 8, padding: '6px 4px', textAlign: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--fg-primary)' }}>{k.v}</div>
                        <div style={{ fontSize: 10, color: 'var(--fg-muted)', marginTop: 1 }}>{k.l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Tag badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <PatientTagBadge tag={ptag} />
                  </div>
                </div>

                {/* Contact section */}
                <div style={{ borderTop: '1px solid var(--border-light)', padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Icon name="phone" size={13} style={{ color: 'var(--fg-muted)' }} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-primary)' }}>Contact</span>
                  </div>
                  {mobile
                    ? <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>{mobile}</div>
                    : <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>—</div>
                  }
                  {email && <div style={{ fontSize: 12, color: 'var(--brand-500, #3b82f6)', marginTop: 2 }}>{email}</div>}
                </div>

                {/* Allergies section */}
                {allergies.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-light)', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Icon name="alert" size={13} style={{ color: 'var(--fg-muted)' }} />
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-primary)' }}>Allergies</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {allergies.map(a => <span key={a} className="badge red" style={{ fontSize: 10 }}>{a}</span>)}
                    </div>
                  </div>
                )}

                {/* Conditions section */}
                {conditions.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-light)', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Icon name="heart" size={13} style={{ color: 'var(--fg-muted)' }} />
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-primary)' }}>Conditions</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {conditions.map(c => <span key={c} className="badge warning" style={{ fontSize: 10 }}>{c}</span>)}
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}

          {/* ─── Contact & ID ─── */}
          {tab === 1 && (
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
                    <input className="form-input" placeholder="Alternate number" {...register('altPhone')} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" placeholder="patient@email.com" {...register('email')} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Street address</label>
                    <input className="form-input" placeholder="Street address" {...register('street')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input className="form-input" placeholder="City" {...register('city')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input className="form-input" placeholder="State" {...register('state')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PIN code</label>
                    <input className="form-input" placeholder="6-digit PIN" {...register('pin')} />
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

              <div className="card">
                <SectionHead title="Government ID" />
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">ID type</label>
                    <select className="form-select" {...register('govType')}>
                      {GOV_IDS.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">ID number</label>
                    <input className="form-input" placeholder="ID number" {...register('govNum')} />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ─── Medical history ─── */}
          {tab === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              <div className="card" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                <SectionHead title="Drug allergies" />
                {chipSet(ALLERGIES, allergies, toggleA)}
              </div>

              <div className="card">
                <SectionHead title="Chronic conditions" />
                {chipSet(CONDITIONS, conditions, toggleC)}
              </div>

              <div className="card">
                <SectionHead title="Medical records" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Current medications</label>
                    <textarea className="form-textarea" rows={3} placeholder="List medications and dosage…" {...register('meds')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Past surgeries</label>
                    <textarea className="form-textarea" rows={3} placeholder="Surgical history…" {...register('surgeries')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Internal notes</label>
                    <textarea className="form-textarea" rows={3} maxLength={500} placeholder="Notes visible only to staff…" {...register('medNotes')} />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ─── Insurance ─── */}
          {tab === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              <div className="card" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                <SectionHead title="Insurance details" />
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Insurer</label>
                    <input className="form-input" placeholder="Insurance company" {...register('insurer')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Policy number</label>
                    <input className="form-input" placeholder="Policy number" {...register('policy')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Valid till</label>
                    <input className="form-input" type="date" {...register('validTill')} />
                  </div>
                </div>
              </div>

              <div className="card">
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-primary)' }}>Cashless billing</div>
                    <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>Direct insurance settlement</div>
                  </div>
                  <Toggle on={cashlessOn} onChange={setCashlessOn} />
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </form>
  )
}
