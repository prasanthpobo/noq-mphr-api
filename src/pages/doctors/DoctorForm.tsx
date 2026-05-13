import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Icon from '@/components/ui/Icon'
import Badge from '@/components/ui/Badge'
import { useAppStore } from '@/store/app'
import { doctorsService } from '@/services/doctors.service'
import { toast } from '@/store/toast'

type FormData = {
  firstName: string
  lastName: string
  gender: string
  dob: string
  qual: string
  exp: string
  consultFee: string
  followFee: string
  mobile: string
  email: string
  clinic: string
  address: string
  bio: string
  achieve: string
  notes: string
  // schedule fields
  startTime: string
  endTime: string
  slotDur: string
  maxTokens: string
  breakStart: string
  breakEnd: string
}

interface Props { id?: string; onClose?: () => void }

const SPECS = ['General medicine','Cardiology','Dermatology','Pediatrics','Gynecology','Orthopedics','Neurology','Psychiatry','ENT','Ophthalmology','Dentistry','Oncology']
const LANGS = ['English','Hindi','Tamil','Telugu','Kannada','Malayalam','Bengali']
const DAYS  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const SLOTS = ['5','10','15','20']

function seg(opts: string[], val: string, set: (v:string)=>void, ro: boolean) {
  if (ro) return <span className="ro-val">{val}</span>
  return (
    <div className="seg-ctrl">
      {opts.map(o => <button key={o} type="button" className={val===o?'active':''} onClick={()=>set(o)}>{o}</button>)}
    </div>
  )
}

function chips(opts: string[], sel: string[], toggle: (v:string)=>void, ro: boolean) {
  if (ro) return (
    <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
      {sel.map(s=><span key={s} className="badge brand">{s}</span>)}
      {sel.length===0&&<span className="ro-val">—</span>}
    </div>
  )
  return (
    <div className="chip-lib">
      {opts.map(o=>(
        <button key={o} type="button" className={`tag${sel.includes(o)?' selected':''}`} onClick={()=>toggle(o)}>{o}</button>
      ))}
    </div>
  )
}

export default function DoctorForm({ id, onClose }: Props) {
  const { setRoute } = useAppStore()
  const isEdit = Boolean(id)
  const ro = false

  const [tab, setTab] = useState(0)
  const [gender, setGender] = useState('F')
  const [specSel, setSpecSel] = useState<string[]>([])
  const [langSel, setLangSel] = useState<string[]>([])
  const [daysSel, setDaysSel] = useState<string[]>(['Mon','Tue','Wed','Thu','Fri'])
  const [schedActive, setSchedActive] = useState(true)
  const [slotDur, setSlotDur] = useState('15')
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      gender: 'F',
      startTime: '09:00',
      endTime: '18:00',
      slotDur: '15',
      maxTokens: '30',
      breakStart: '13:00',
      breakEnd: '14:00',
    }
  })

  const firstName = watch('firstName') || ''
  const lastName  = watch('lastName')  || ''
  const consultFee = watch('consultFee') || ''
  const exp = watch('exp') || ''
  const clinic = watch('clinic') || ''
  const startTime = watch('startTime') || '09:00'
  const endTime = watch('endTime') || '18:00'

  useEffect(() => {
    if (isEdit && id) {
      doctorsService.get(id)
        .then(data => {
          reset(data)
          if (data.specSel)  setSpecSel(data.specSel)
          if (data.langSel)  setLangSel(data.langSel)
          if (data.daysSel)  setDaysSel(data.daysSel)
          if (data.gender)   setGender(data.gender)
        })
        .catch(() => { setServerError('Failed to load doctor data'); toast.error('Failed to load record') })
    }
  }, [id])

  const toggleSpec = (v: string) => setSpecSel(s => s.includes(v) ? s.filter(x=>x!==v) : [...s,v])
  const toggleLang = (v: string) => setLangSel(s => s.includes(v) ? s.filter(x=>x!==v) : [...s,v])
  const toggleDay  = (v: string) => setDaysSel(s => s.includes(v) ? s.filter(x=>x!==v) : [...s,v])

  const onSubmit = async (data: FormData) => {
    try {
      setServerError(null)
      const payload = { ...data, gender, specSel, langSel, daysSel, schedActive }
      if (isEdit) {
        await doctorsService.update(id!, payload)
        toast.success('Updated successfully')
      } else {
        await doctorsService.create(payload)
        toast.success('Created successfully')
      }
      if (onClose) onClose()
      else setRoute('doctors')
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Save failed')
      toast.error(err.response?.data?.message || 'Save failed')
    }
  }

  const titleName = !isEdit ? 'Create doctor' : `Editing Dr. ${firstName} ${lastName}`
  const TABS = ['Profile','Schedule','Contact info','About doctor']

  return (
    <form className="df-shell" onSubmit={handleSubmit(onSubmit)}>
      {/* Top strip */}
      <div className="df-topbar">
        <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setRoute('doctors')}>
          <Icon name="chevL" size={14}/> Back
        </button>
        <div className="df-topbar-title">{titleName}</div>
        {isEdit && <Badge variant="warning" dot>Editing</Badge>}
        <div style={{marginLeft:'auto',display:'flex',gap:8}}/>
      </div>

      {/* Tabs */}
      <div className="df-tabs">
        {TABS.map((t,i)=>(
          <button key={t} type="button" className={`df-tab${tab===i?' active':''}`} onClick={()=>setTab(i)}>{t}</button>
        ))}
      </div>

      {/* Body */}
      <div className="df-body">
        <div className="df-panel">
          {tab===0 && (
            <div className="grid-2" style={{gap:16}}>
              <div className="form-group">
                <label className="form-label">First name *</label>
                <input className="form-input" placeholder="First name" {...register('firstName', { required: 'First name is required' })}/>
                {errors.firstName && <span className="form-error">{errors.firstName.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Last name *</label>
                <input className="form-input" placeholder="Last name" {...register('lastName', { required: 'Last name is required' })}/>
                {errors.lastName && <span className="form-error">{errors.lastName.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                {seg(['M','F','Other'],gender,setGender,ro)}
              </div>
              <div className="form-group">
                <label className="form-label">Date of birth</label>
                <input className="form-input" type="date" {...register('dob')}/>
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Qualification *</label>
                <input className="form-input" placeholder="e.g. MBBS, MD" {...register('qual', { required: 'Qualification is required' })}/>
                {errors.qual && <span className="form-error">{errors.qual.message}</span>}
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Specialization *</label>
                {chips(SPECS, specSel, toggleSpec, ro)}
                {specSel.length === 0 && <span className="form-error">Select at least one specialization</span>}
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Photo upload</label>
                <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',border:'1px dashed var(--border)',borderRadius:8}}>
                  <div className="av xl pink" style={{flexShrink:0}}>{firstName?firstName[0]:'?'}{lastName?lastName[0]:''}</div>
                  <div>
                    <button type="button" className="btn btn-secondary btn-sm"><Icon name="plus" size={12}/>Upload photo</button>
                    <div style={{fontSize:11,color:'var(--fg-muted)',marginTop:4}}>JPG, PNG up to 2 MB. Square recommended.</div>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Experience (years) *</label>
                <input className="form-input" type="number" placeholder="e.g. 12" {...register('exp', { required: 'Experience is required' })}/>
                {errors.exp && <span className="form-error">{errors.exp.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Consultation fee (₹) *</label>
                <input className="form-input" type="number" placeholder="e.g. 400" {...register('consultFee', { required: 'Consultation fee is required' })}/>
                {errors.consultFee && <span className="form-error">{errors.consultFee.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Follow-up fee (₹)</label>
                <input className="form-input" type="number" placeholder="e.g. 250" {...register('followFee')}/>
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Languages spoken</label>
                {chips(LANGS, langSel, toggleLang, ro)}
              </div>
            </div>
          )}

          {tab===1 && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div className="form-group">
                <label className="form-label">Schedule active</label>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                  <input type="checkbox" checked={schedActive} onChange={e=>setSchedActive(e.target.checked)} style={{width:16,height:16}}/>
                  <span style={{fontSize:13}}>{schedActive?'Active':'Inactive'}</span>
                </label>
              </div>
              <div className="form-group">
                <label className="form-label">Working days</label>
                <div className="day-pips">
                  {DAYS.map(d=>(
                    <button key={d} type="button" className={`day-pip${daysSel.includes(d)?' active':''}`}
                      onClick={()=>toggleDay(d)}>{d}</button>
                  ))}
                </div>
              </div>
              <div className="grid-2" style={{gap:16}}>
                <div className="form-group">
                  <label className="form-label">Start time</label>
                  <input className="form-input" type="time" {...register('startTime')}/>
                </div>
                <div className="form-group">
                  <label className="form-label">End time</label>
                  <input className="form-input" type="time" {...register('endTime')}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Slot duration (min)</label>
                  {seg(SLOTS,slotDur,setSlotDur,ro)}
                </div>
                <div className="form-group">
                  <label className="form-label">Max tokens</label>
                  <input className="form-input" type="number" {...register('maxTokens')}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Break start</label>
                  <input className="form-input" type="time" {...register('breakStart')}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Break end</label>
                  <input className="form-input" type="time" {...register('breakEnd')}/>
                </div>
              </div>
            </div>
          )}

          {tab===2 && (
            <div className="grid-2" style={{gap:16}}>
              <div className="form-group">
                <label className="form-label">Mobile</label>
                <input className="form-input" placeholder="+91 XXXXX XXXXX" {...register('mobile')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="doctor@noq.health" {...register('email')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Clinic</label>
                <input className="form-input" placeholder="Clinic name" {...register('clinic')}/>
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Address</label>
                <textarea className="form-textarea" rows={3} placeholder="Full address" {...register('address')}/>
              </div>
            </div>
          )}

          {tab===3 && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea className="form-textarea" rows={4} maxLength={600} placeholder="Brief professional bio…" {...register('bio')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Achievements</label>
                <textarea className="form-textarea" rows={3} placeholder="Awards, publications…" {...register('achieve')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Internal notes</label>
                <textarea className="form-textarea" rows={3} placeholder="Internal staff notes (not visible to patient)" {...register('notes')}/>
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="df-preview">
          <div className="preview-card" style={{marginBottom:12}}>
            <div style={{height:56,background:'linear-gradient(135deg,var(--tone-pink-bg) 0%,var(--tone-indigo-bg) 100%)',borderRadius:'8px 8px 0 0'}}/>
            <div style={{padding:'0 16px 16px',marginTop:-24}}>
              <div className="av xl pink" style={{border:'3px solid var(--bg-card)'}}>{firstName?firstName[0]:'?'}{lastName?lastName[0]:''}</div>
              <div style={{fontWeight:700,fontSize:15,marginTop:8}}>{firstName||'First'} {lastName||'Last'}</div>
              <div style={{fontSize:12,color:'var(--fg-secondary)'}}>{specSel[0]||'Specialization'}</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginTop:12}}>
                {[{l:'Fee',v:`₹${consultFee||'—'}`},{l:'Exp',v:`${exp||'—'} yrs`},{l:'Langs',v:String(langSel.length)}].map(k=>(
                  <div key={k.l} style={{background:'var(--bg-section)',borderRadius:6,padding:'6px 8px',textAlign:'center'}}>
                    <div style={{fontSize:13,fontWeight:800}}>{k.v}</div>
                    <div style={{fontSize:10,color:'var(--fg-secondary)'}}>{k.l}</div>
                  </div>
                ))}
              </div>
              {specSel.length>0 && (
                <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:10}}>
                  {specSel.map(s=><span key={s} className="badge brand" style={{fontSize:10}}>{s}</span>)}
                </div>
              )}
              {langSel.length>0 && (
                <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:6}}>
                  {langSel.map(l=><span key={l} className="badge blue" style={{fontSize:10}}>{l}</span>)}
                </div>
              )}
            </div>
          </div>

          <div className="preview-card" style={{marginBottom:12}}>
            <div className="card-h">
              <Icon name="calendar" size={14}/>
              <span>Schedule</span>
              <Badge variant={schedActive?'success':'gray'} dot style={{marginLeft:'auto'}}>{schedActive?'Active':'Inactive'}</Badge>
            </div>
            <div style={{padding:'10px 14px',fontSize:12}}>
              <div className="day-pips" style={{marginBottom:8}}>
                {DAYS.map(d=><span key={d} className={`day-pip${daysSel.includes(d)?' active':''}`}>{d}</span>)}
              </div>
              <div style={{color:'var(--fg-secondary)'}}>{startTime} – {endTime} · {slotDur} min slots</div>
            </div>
          </div>

          {clinic && (
            <div className="preview-card">
              <div className="card-h"><Icon name="building" size={14}/><span>Clinic</span></div>
              <div style={{padding:'10px 14px',fontSize:13,fontWeight:600}}>{clinic}</div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="df-footer">
        {serverError && (
          <div style={{fontSize:12,color:'var(--danger)',display:'flex',alignItems:'center',gap:6}}>
            <Icon name="alert" size={14}/> {serverError}
          </div>
        )}
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <button type="button" className="btn btn-secondary" onClick={()=>setRoute('doctors')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Update doctor' : 'Create doctor'}
          </button>
        </div>
      </div>
    </form>
  )
}
