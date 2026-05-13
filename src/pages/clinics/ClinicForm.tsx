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

  const TABS = ['Profile','Hours','Contact','About']

  return (
    <form className="df-shell" onSubmit={handleSubmit(onSubmit)}>
      <div className="df-topbar">
        <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setRoute('clinics')}>
          <Icon name="chevL" size={14}/> Back
        </button>
        <div className="df-topbar-title">
          {!isEdit?'Create clinic':`Editing ${clinicName}`}
        </div>
        {isEdit && <UserStatusBadge status={status}/>}
      </div>

      <div className="df-tabs">
        {TABS.map((t,i)=><button key={t} type="button" className={`df-tab${tab===i?' active':''}`} onClick={()=>setTab(i)}>{t}</button>)}
      </div>

      <div className="df-body">
        <div className="df-panel">
          {tab===0 && (
            <div className="grid-2" style={{gap:16}}>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Clinic name *</label>
                <input className="form-input" placeholder="Clinic name" {...register('name', { required: 'Clinic name is required' })}/>
                {errors.name && <span className="form-error">{errors.name.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" {...register('type')}>
                  {TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Established year</label>
                <input className="form-input" placeholder="e.g. 2014" {...register('estYear')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                {seg(['active','pending','inactive'],status,setStatus)}
              </div>
              <div className="form-group">
                <label className="form-label">Registration #</label>
                <input className="form-input" placeholder="Registration number" {...register('regNum')}/>
              </div>
              <div className="form-group">
                <label className="form-label">GSTIN</label>
                <input className="form-input" placeholder="GST number" {...register('gstin')}/>
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Logo</label>
                <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',border:'1px dashed var(--border)',borderRadius:8}}>
                  <div className="av xl blue" style={{fontSize:16,fontWeight:800}}>{initials}</div>
                  <div>
                    <button type="button" className="btn btn-secondary btn-sm"><Icon name="plus" size={12}/>Upload logo</button>
                    <div style={{fontSize:11,color:'var(--fg-muted)',marginTop:4}}>PNG or SVG, 1:1 ratio recommended</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab===1 && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div className="form-group">
                <label className="form-label">24×7 operation</label>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                  <input type="checkbox" checked={all24} onChange={e=>setAll24(e.target.checked)} style={{width:16,height:16}}/>
                  <span style={{fontSize:13}}>Open 24 hours, 7 days</span>
                </label>
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
              <div className="form-group">
                <label className="form-label">Facilities</label>
                {chipSet(FACILITIES,facilSel,toggleFacil)}
              </div>
            </div>
          )}

          {tab===2 && (
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
          )}

          {tab===3 && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={4} maxLength={600} placeholder="Clinic overview…" {...register('desc')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Insurance partners</label>
                {chipSet(INSURERS,insurSel,toggleInsur)}
              </div>
              <div className="form-group">
                <label className="form-label">Policies</label>
                <textarea className="form-textarea" rows={3} placeholder="Cancellation, refund policies…" {...register('policies')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Internal notes</label>
                <textarea className="form-textarea" rows={3} placeholder="Staff-only notes…" {...register('notes')}/>
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="df-preview">
          <div className="preview-card" style={{marginBottom:12}}>
            <div style={{height:52,background:'linear-gradient(135deg,var(--tone-blue-bg) 0%,var(--tone-indigo-bg) 100%)',borderRadius:'8px 8px 0 0'}}/>
            <div style={{padding:'0 14px 14px',marginTop:-22}}>
              <div className="av xl blue" style={{border:'3px solid var(--bg-card)',fontSize:14,fontWeight:800}}>{initials}</div>
              <div style={{marginTop:8,fontWeight:700,fontSize:15}}>{clinicName||'Clinic name'}</div>
              <div style={{fontSize:12,color:'var(--fg-secondary)'}}>{type}</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginTop:10}}>
                {[{l:'Doctors',v:'—'},{l:'Rooms',v:'—'},{l:'Rating',v:'—'}].map(k=>(
                  <div key={k.l} style={{background:'var(--bg-section)',borderRadius:6,padding:'6px 8px',textAlign:'center'}}>
                    <div style={{fontSize:13,fontWeight:800}}>{k.v}</div>
                    <div style={{fontSize:10,color:'var(--fg-secondary)'}}>{k.l}</div>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:10}}>
                <UserStatusBadge status={status}/>
                {regNum&&<span className="badge muted" style={{fontSize:10}}>{regNum}</span>}
                {facilSel.slice(0,3).map(f=><span key={f} className="badge blue" style={{fontSize:10}}>{f}</span>)}
                {facilSel.length>3&&<span className="badge muted" style={{fontSize:10}}>+{facilSel.length-3}</span>}
              </div>
            </div>
          </div>

          <div className="preview-card" style={{marginBottom:12}}>
            <div className="card-h"><Icon name="calendar" size={14}/><span>Hours</span></div>
            <div style={{padding:'8px 14px',fontSize:12}}>
              {all24 ? <div style={{fontWeight:600}}>Open 24×7</div> : (
                <>
                  <div className="day-pips" style={{marginBottom:6}}>
                    {DAYS.map(d=><span key={d} className={`day-pip${daysSel.includes(d)?' active':''}`}>{d}</span>)}
                  </div>
                  <div style={{color:'var(--fg-secondary)'}}>{openTime} – {closeTime}</div>
                </>
              )}
            </div>
          </div>

          {(phone||email) && (
            <div className="preview-card" style={{marginBottom:12}}>
              <div className="card-h"><Icon name="user" size={14}/><span>Contact</span></div>
              <div style={{padding:'8px 14px',fontSize:12,display:'flex',flexDirection:'column',gap:4}}>
                {phone&&<div>{phone}</div>}
                {email&&<div style={{color:'var(--fg-secondary)'}}>{email}</div>}
                {city&&<div style={{color:'var(--fg-muted)'}}>{city}{state?`, ${state}`:''}</div>}
              </div>
            </div>
          )}

          {insurSel.length>0 && (
            <div className="preview-card">
              <div className="card-h"><Icon name="shield" size={14}/><span>Insurance</span></div>
              <div style={{padding:'8px 14px',display:'flex',flexWrap:'wrap',gap:4}}>
                {insurSel.map(i=><span key={i} className="badge brand" style={{fontSize:10}}>{i}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="df-footer">
        {serverError && (
          <div style={{fontSize:12,color:'var(--danger)',display:'flex',alignItems:'center',gap:6}}>
            <Icon name="alert" size={14}/> {serverError}
          </div>
        )}
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <button type="button" className="btn btn-secondary" onClick={()=>setRoute('clinics')}>Cancel</button>
          {!isEdit && (
            <button type="button" className="btn btn-secondary" disabled={isSubmitting}>Save &amp; add another</button>
          )}
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Update clinic' : 'Create clinic'}
          </button>
        </div>
      </div>
    </form>
  )
}
