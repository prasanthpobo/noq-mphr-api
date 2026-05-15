import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Icon from '@/components/ui/Icon'
import Badge, { UserStatusBadge } from '@/components/ui/Badge'
import { useAppStore } from '@/store/app'
import { clinicsService } from '@/services/clinics.service'
import { toast } from '@/store/toast'

type FormData = {
  name: string
  type: string
  shortCode: string
  estYear: string
  status: string
  regNum: string
  gstin: string
  openTime: string
  closeTime: string
  lunchStart: string
  lunchEnd: string
  phone: string
  altPhone: string
  email: string
  website: string
  street: string
  area: string
  city: string
  state: string
  pin: string
  mapLink: string
  desc: string
  policies: string
  notes: string
}

interface Props { id?: string; onClose?: () => void }

const TYPES      = ['Multi-specialty','Hospital','Specialty','Polyclinic','Diagnostic centre','Dental clinic']
const FACILITIES = ['OPD','IPD','ICU','ER','OT','Lab','Pharmacy','Radiology','Dental','Physiotherapy','Dialysis','Cafeteria']
const DAYS       = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const INSURERS   = ['Star Health','HDFC Ergo','Bajaj Allianz','ICICI Lombard','Niva Bupa','Apollo Munich','Aditya Birla']

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

function seg(opts:string[], val:string, set:(v:string)=>void) {
  return <div className="seg-ctrl">{opts.map(o=><button key={o} type="button" className={val===o?'active':''} onClick={()=>set(o)}>{o}</button>)}</div>
}

function chipSet(opts:string[], sel:string[], toggle:(v:string)=>void) {
  return <div className="chip-lib">{opts.map(o=><button key={o} type="button" className={`tag${sel.includes(o)?' selected':''}`} onClick={()=>toggle(o)}>{o}</button>)}</div>
}

export default function ClinicForm({ id, onClose }: Props) {
  const { setRoute } = useAppStore()
  const isEdit = Boolean(id)

  const [tab, setTab] = useState(0)
  const [status, setStatus] = useState('active')
  const [all24, setAll24] = useState(false)
  const [daysSel, setDaysSel] = useState<string[]>(['Mon','Tue','Wed','Thu','Fri','Sat'])
  const [facilSel, setFacilSel] = useState<string[]>(['OPD','Lab','Pharmacy'])
  const [insurSel, setInsurSel] = useState<string[]>([])
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      type: 'Multi-specialty',
      status: 'active',
      openTime: '09:00',
      closeTime: '20:00',
      lunchStart: '13:00',
      lunchEnd: '14:00',
    }
  })

  const clinicName = watch('name') || ''
  const type = watch('type') || 'Multi-specialty'
  const phone = watch('phone') || ''
  const email = watch('email') || ''
  const city = watch('city') || ''
  const state = watch('state') || ''
  const regNum = watch('regNum') || ''
  const openTime = watch('openTime') || '09:00'
  const closeTime = watch('closeTime') || '20:00'

  const initials = clinicName.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || '??'

  useEffect(() => {
    if (isEdit && id) {
      clinicsService.get(id)
        .then(data => {
          reset(data)
          if (data.status)   setStatus(data.status)
          if (data.all24 !== undefined) setAll24(data.all24)
          if (data.daysSel)  setDaysSel(data.daysSel)
          if (data.facilSel) setFacilSel(data.facilSel)
          if (data.insurSel) setInsurSel(data.insurSel)
        })
        .catch(() => { setServerError('Failed to load clinic data'); toast.error('Failed to load record') })
    }
  }, [id])

  const toggleDay   = (v:string) => setDaysSel(s=>s.includes(v)?s.filter(x=>x!==v):[...s,v])
  const toggleFacil = (v:string) => setFacilSel(s=>s.includes(v)?s.filter(x=>x!==v):[...s,v])
  const toggleInsur = (v:string) => setInsurSel(s=>s.includes(v)?s.filter(x=>x!==v):[...s,v])

  const onSubmit = async (data: FormData) => {
    try {
      setServerError(null)
      const payload = { ...data, status, all24, daysSel, facilSel, insurSel }
      if (isEdit) {
        await clinicsService.update(id!, payload)
        toast.success('Updated successfully')
      } else {
        await clinicsService.create(payload)
        toast.success('Created successfully')
      }
      if (onClose) onClose()
      else setRoute('clinics')
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Save failed')
      toast.error(err.response?.data?.message || 'Save failed')
    }
  }

  const TABS = [
    { label:'Profile',  sub:'Identity, type & registration', icon:'building' },
    { label:'Hours',    sub:'Working days & timings',         icon:'clock'    },
    { label:'Contact',  sub:'Phone, email & address',         icon:'phone'    },
    { label:'About',    sub:'Description & policies',         icon:'eye'      },
  ]

  const errorCount = Object.keys(errors).length

  return (
    <form className="df-shell" onSubmit={handleSubmit(onSubmit)}>
      <div className="df-topbar">
        <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setRoute('clinics')}>
          <Icon name="chevL" size={14}/> Back to clinics
        </button>
        <div style={{flex:1,marginLeft:8}}>
          <div className="df-topbar-title">{!isEdit?'Add clinic':`Edit clinic`}</div>
          <div style={{fontSize:11.5,color:'var(--fg-muted)',marginTop:1,fontWeight:500}}>
            {!isEdit?'New clinic · all required fields marked':(clinicName||'Untitled')}
          </div>
        </div>
        {!isEdit && <span className="badge info" style={{fontSize:11,letterSpacing:'0.04em',fontWeight:700}}>CREATING</span>}
        {isEdit && <UserStatusBadge status={status}/>}
      </div>

      <div className="df-tabs">
        {TABS.map((t,i)=>(
          <button key={t.label} type="button" className={`df-tab${tab===i?' active':''}`} onClick={()=>setTab(i)}>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <Icon name={t.icon} size={13} style={{opacity: tab===i ? 1 : 0.55}}/>
              <span className="tab-title">{t.label}</span>
            </div>
            <span className="tab-sub">{t.sub}</span>
          </button>
        ))}
      </div>

      <div className="df-body">
        <div className="df-panel">
          {tab===0 && (
            <div style={{display:'flex',flexDirection:'column',gap:20}}>
              {/* Identity section */}
              <div>
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:13.5,fontWeight:700,color:'var(--fg-primary)'}}>Identity</div>
                  <div style={{fontSize:12,color:'var(--fg-secondary)',marginTop:2}}>Required for booking &amp; directory listing.</div>
                </div>
                <div className="grid-2" style={{gap:14}}>
                  <div className="form-group">
                    <label className="form-label">CLINIC NAME <span style={{color:'var(--danger-500)'}}>*</span></label>
                    <input className={`form-input${errors.name?' error':''}`} placeholder="e.g. Sunshine Clinic" {...register('name', { required: 'Clinic name is required' })}/>
                    {errors.name && <span className="form-error">{errors.name.message}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">CLINIC TYPE <span style={{color:'var(--danger-500)'}}>*</span></label>
                    <select className="form-select" {...register('type')}>
                      {TYPES.map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1.4fr',gap:14,marginTop:14}}>
                  <div className="form-group">
                    <label className="form-label" style={{display:'flex',alignItems:'center',gap:6}}>
                      LOGO / SHORT CODE
                      <span className="badge muted" style={{fontSize:9.5,padding:'1px 5px',letterSpacing:'0.02em'}}>2 LETTERS</span>
                    </label>
                    <input className="form-input" placeholder="SC" maxLength={2} style={{textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:700}} {...register('shortCode')}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{display:'flex',alignItems:'center',gap:6}}>
                      ESTABLISHED
                      <span className="badge muted" style={{fontSize:9.5,padding:'1px 5px'}}>YEAR</span>
                    </label>
                    <input className="form-input" placeholder="2014" {...register('estYear')}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">STATUS</label>
                    <div className="seg-ctrl">
                      {['active','pending','inactive'].map(o=>(
                        <button key={o} type="button" className={status===o?'active':''} onClick={()=>setStatus(o)}
                          style={{textTransform:'capitalize'}}>{o}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{borderTop:'1px solid var(--border-light)'}}/>

              {/* Registration section */}
              <div>
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:13.5,fontWeight:700,color:'var(--fg-primary)'}}>Registration</div>
                  <div style={{fontSize:12,color:'var(--fg-secondary)',marginTop:2}}>Required for billing &amp; insurance claims.</div>
                </div>
                <div className="grid-2" style={{gap:14}}>
                  <div className="form-group">
                    <label className="form-label">REGISTRATION NUMBER</label>
                    <input className="form-input" placeholder="KA-CLN-009-2014" {...register('regNum')}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{display:'flex',alignItems:'center',gap:6}}>
                      GSTIN
                      <span className="badge muted" style={{fontSize:9.5,padding:'1px 5px'}}>OPTIONAL</span>
                    </label>
                    <input className="form-input" placeholder="29ABCDE1234F1Z5" {...register('gstin')}/>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab===1 && (
            <div style={{display:'flex',flexDirection:'column',gap:24}}>
              <div>
                <SectionHead title="Operation hours" />
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', background: 'var(--bg-section)',
                  borderRadius: 10, border: '1px solid var(--border-soft)', marginBottom: 16,
                }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-primary)' }}>Open 24×7</div>
                    <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>Clinic operates 24 hours, 7 days</div>
                  </div>
                  <Toggle on={all24} onChange={setAll24} />
                </div>
              </div>
              {!all24 && (
                <>
                  <div className="form-group">
                    <label className="form-label">Open days</label>
                    <div className="day-pips">
                      {DAYS.map(d=>(
                        <button key={d} type="button" className={`day-pip${daysSel.includes(d)?' active':''}`}
                          onClick={()=>toggleDay(d)}>{d}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid-2" style={{gap:16}}>
                    <div className="form-group">
                      <label className="form-label">Opening time</label>
                      <input className="form-input" type="time" {...register('openTime')}/>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Closing time</label>
                      <input className="form-input" type="time" {...register('closeTime')}/>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Lunch break start</label>
                      <input className="form-input" type="time" {...register('lunchStart')}/>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Lunch break end</label>
                      <input className="form-input" type="time" {...register('lunchEnd')}/>
                    </div>
                  </div>
                </>
              )}
              <div style={{marginTop:8}}>
                <SectionHead title="Facilities" />
                {chipSet(FACILITIES,facilSel,toggleFacil)}
              </div>
            </div>
          )}

          {tab===2 && (
            <div style={{display:'flex',flexDirection:'column',gap:28}}>
              <div>
                <SectionHead title="Contact details" />
                <div className="grid-2" style={{gap:16}}>
              <div className="form-group">
                <label className="form-label">Primary phone *</label>
                <input className="form-input" placeholder="+91 80 XXXX XXXX" {...register('phone', { required: 'Phone is required' })}/>
                {errors.phone && <span className="form-error">{errors.phone.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Alt phone</label>
                <input className="form-input" placeholder="Alternate number" {...register('altPhone')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="clinic@email.com" {...register('email')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Website</label>
                <input className="form-input" placeholder="https://" {...register('website')}/>
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Street</label>
                <input className="form-input" placeholder="Street / building" {...register('street')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Area</label>
                <input className="form-input" placeholder="Area / locality" {...register('area')}/>
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-input" placeholder="City" {...register('city')}/>
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input className="form-input" placeholder="State" {...register('state')}/>
              </div>
              <div className="form-group">
                <label className="form-label">PIN code</label>
                <input className="form-input" placeholder="6-digit PIN" {...register('pin')}/>
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Google Maps link</label>
                <input className="form-input" placeholder="https://maps.google.com/…" {...register('mapLink')}/>
              </div>
                </div>
              </div>
            </div>
          )}

          {tab===3 && (
            <div style={{display:'flex',flexDirection:'column',gap:28}}>
              <div>
                <SectionHead title="About" />
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" rows={4} maxLength={600} placeholder="Clinic overview…" {...register('desc')}/>
                </div>
              </div>
              <div>
                <SectionHead title="Insurance partners" />
                {chipSet(INSURERS,insurSel,toggleInsur)}
              </div>
              <div>
                <SectionHead title="Policies & notes" />
                <div style={{display:'flex',flexDirection:'column',gap:16}}>
                  <div className="form-group">
                    <label className="form-label">Policies</label>
                    <textarea className="form-textarea" rows={3} placeholder="Cancellation, refund policies…" {...register('policies')}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Internal notes</label>
                    <textarea className="form-textarea" rows={3} placeholder="Staff-only notes…" {...register('notes')}/>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="df-preview">
          <div style={{fontSize:11,fontWeight:700,color:'var(--fg-muted)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:14}}>
            Live preview
          </div>
          <div className="preview-card" style={{marginBottom:12}}>
            <div style={{height:52,background:'var(--brand-gradient)',borderRadius:'14px 14px 0 0'}}/>
            <div style={{display:'flex',justifyContent:'center',marginTop:-28}}>
              <div className="av xl blue" style={{border:'3px solid var(--bg-surface)',fontSize:16,fontWeight:800,borderRadius:16}}>{initials}</div>
            </div>
            <div style={{padding:'8px 14px 14px',textAlign:'center'}}>
              <div style={{fontWeight:700,fontSize:15,marginTop:2,color:'var(--fg-primary)'}}>{clinicName||'Unnamed clinic'}</div>
              <div style={{fontSize:12,color:'var(--fg-secondary)',marginTop:2}}>{type}</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginTop:12}}>
                {[{l:'Doctors',v:'—'},{l:'Rooms',v:'—'},{l:'Rating',v:'★—'}].map(k=>(
                  <div key={k.l} style={{background:'var(--bg-section)',borderRadius:8,padding:'6px 8px',textAlign:'center'}}>
                    <div style={{fontSize:12,fontWeight:800,color:'var(--fg-primary)'}}>{k.v}</div>
                    <div style={{fontSize:10,color:'var(--fg-muted)',marginTop:1}}>{k.l}</div>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:10,justifyContent:'center'}}>
                <UserStatusBadge status={status.toLowerCase()}/>
                {facilSel.slice(0,3).map(f=><span key={f} className="badge blue" style={{fontSize:10}}>{f}</span>)}
                {facilSel.length>3&&<span className="badge muted" style={{fontSize:10}}>+{facilSel.length-3}</span>}
              </div>
            </div>
          </div>

          <div className="preview-card" style={{marginBottom:12}}>
            <div style={{display:'flex',alignItems:'center',gap:6,padding:'10px 14px 6px',borderBottom:'1px solid var(--border-light)',color:'var(--fg-secondary)'}}>
              <Icon name="clock" size={13}/><span style={{fontSize:11.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em'}}>Hours</span>
            </div>
            <div style={{padding:'8px 14px',fontSize:12}}>
              {all24 ? <div style={{fontWeight:600}}>Open 24×7</div> : (
                <>
                  <div className="day-pips" style={{marginBottom:6}}>
                    {DAYS.map(d=><span key={d} className={`day-pip${daysSel.includes(d)?' active':''}`}>{d}</span>)}
                  </div>
                  <div style={{fontWeight:600,color:'var(--fg-primary)'}}>{openTime} – {closeTime}</div>
                </>
              )}
            </div>
          </div>

          <div className="preview-card" style={{marginBottom:12}}>
            <div style={{display:'flex',alignItems:'center',gap:6,padding:'10px 14px 6px',borderBottom:'1px solid var(--border-light)',color:'var(--fg-secondary)'}}>
              <Icon name="phone" size={13}/><span style={{fontSize:11.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em'}}>Contact</span>
            </div>
            <div style={{padding:'8px 14px',fontSize:12,display:'flex',flexDirection:'column',gap:4}}>
              {phone ? <div style={{fontWeight:500}}>{phone}</div> : <div style={{color:'var(--fg-muted)'}}>No phone</div>}
              {email ? <div style={{color:'var(--fg-secondary)'}}>{email}</div> : <div style={{color:'var(--fg-muted)'}}>No email</div>}
              {city&&<div style={{color:'var(--fg-muted)'}}>{city}{state?`, ${state}`:''}</div>}
            </div>
          </div>

          {insurSel.length>0 && (
            <div className="preview-card">
              <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderBottom:'1px solid var(--border-light)'}}>
                <Icon name="shield" size={13}/>
                <span style={{fontSize:12.5,fontWeight:600,color:'var(--fg-primary)'}}>Insurance</span>
              </div>
              <div style={{padding:'10px 14px',display:'flex',flexWrap:'wrap',gap:4}}>
                {insurSel.map(i=><span key={i} className="badge brand" style={{fontSize:10}}>{i}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="df-footer">
        {serverError && (
          <div style={{fontSize:12,color:'var(--danger-500)',display:'flex',alignItems:'center',gap:6}}>
            <Icon name="alert" size={14}/> {serverError}
          </div>
        )}
        {errorCount > 0 && !serverError && (
          <div style={{fontSize:12,color:'var(--danger-500)',display:'flex',alignItems:'center',gap:5,fontWeight:600}}>
            <Icon name="x" size={13}/> {errorCount} field{errorCount>1?'s':''} need attention
          </div>
        )}
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <button type="button" className="btn btn-secondary" onClick={()=>setRoute('clinics')}>Cancel</button>
          {!isEdit && (
            <button type="button" className="btn btn-secondary" disabled={isSubmitting}>
              <Icon name="plus" size={13}/> Save &amp; add another
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            <Icon name="check" size={13}/>
            {isSubmitting ? 'Saving…' : isEdit ? 'Update clinic' : 'Create clinic'}
          </button>
        </div>
      </div>
    </form>
  )
}
