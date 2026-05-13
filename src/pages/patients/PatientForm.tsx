import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Icon from '@/components/ui/Icon'
import Badge, { PatientTagBadge } from '@/components/ui/Badge'
import { useAppStore } from '@/store/app'
import { patientsService } from '@/services/patients.service'

type FormData = {
  firstName: string
  lastName: string
  gender: string
  dob: string
  bg: string
  marital: string
  occ: string
  ptag: string
  mobile: string
  altPhone: string
  email: string
  street: string
  city: string
  state: string
  pin: string
  emgName: string
  emgRel: string
  emgPhone: string
  govType: string
  govNum: string
  meds: string
  surgeries: string
  medNotes: string
  insurer: string
  policy: string
  validTill: string
  cashless: boolean
}

interface Props { id?: string; onClose?: () => void }

const ALLERGIES  = ['Penicillin','Sulfa','Aspirin','Ibuprofen','Latex','Peanuts','Shellfish','Dust','Pollen','Mold']
const CONDITIONS = ['Hypertension','Diabetes','Asthma','Hypothyroid','COPD','Arthritis','Anemia','Depression','Obesity','CAD']
const BG_OPTS    = ['A+','A-','B+','B-','AB+','AB-','O+','O-']
const GOV_IDS    = ['Aadhaar','PAN','Passport','Voter ID','Driving Licence']

function seg(opts: string[], val: string, set: (v:string)=>void) {
  return <div className="seg-ctrl">{opts.map(o=><button key={o} type="button" className={val===o?'active':''} onClick={()=>set(o)}>{o}</button>)}</div>
}

function chipSet(opts: string[], sel: string[], toggle:(v:string)=>void, danger=false) {
  return (
    <div className="chip-lib">
      {opts.map(o=><button key={o} type="button" className={`tag${sel.includes(o)?' selected':''}`} onClick={()=>toggle(o)}>{o}</button>)}
    </div>
  )
}

function calcAge(dob: string) {
  if (!dob) return ''
  const diff = Date.now() - new Date(dob).getTime()
  return String(Math.floor(diff / (365.25*24*3600*1000)))
}

export default function PatientForm({ id, onClose }: Props) {
  const { setRoute } = useAppStore()
  const isEdit = Boolean(id)

  const [tab, setTab] = useState(0)
  const [gender, setGender] = useState('M')
  const [marital, setMarital] = useState('Single')
  const [ptag, setPtag] = useState('active')
  const [allergies, setAllergies] = useState<string[]>([])
  const [conditions, setConditions] = useState<string[]>([])
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: { bg: 'O+', govType: 'Aadhaar', cashless: false }
  })

  const firstName = watch('firstName') || ''
  const lastName  = watch('lastName')  || ''
  const dob = watch('dob') || ''
  const bg = watch('bg') || 'O+'
  const mobile = watch('mobile') || ''
  const email = watch('email') || ''
  const insurer = watch('insurer') || ''
  const policy = watch('policy') || ''
  const cashless = watch('cashless')
  const age = calcAge(dob)
  const name = `${firstName} ${lastName}`.trim() || 'New Patient'
  const av   = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()

  useEffect(() => {
    if (isEdit && id) {
      patientsService.get(id)
        .then(data => {
          reset(data)
          if (data.gender)     setGender(data.gender)
          if (data.marital)    setMarital(data.marital)
          if (data.ptag)       setPtag(data.ptag)
          if (data.allergies)  setAllergies(data.allergies)
          if (data.conditions) setConditions(data.conditions)
        })
        .catch(() => setServerError('Failed to load patient data'))
    }
  }, [id])

  const toggleA = (v:string) => setAllergies(s=>s.includes(v)?s.filter(x=>x!==v):[...s,v])
  const toggleC = (v:string) => setConditions(s=>s.includes(v)?s.filter(x=>x!==v):[...s,v])

  const onSubmit = async (data: FormData) => {
    try {
      setServerError(null)
      const payload = { ...data, gender, marital, ptag, allergies, conditions }
      if (isEdit) await patientsService.update(id!, payload)
      else await patientsService.create(payload)
      if (onClose) onClose()
      else setRoute('patients')
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Save failed')
    }
  }

  const TABS = ['Profile','Contact & ID','Medical history','Insurance']

  return (
    <form className="df-shell" onSubmit={handleSubmit(onSubmit)}>
      <div className="df-tabs" style={{borderBottom:'1px solid var(--border)',padding:'0 20px',display:'flex',alignItems:'center',gap:12,minHeight:52}}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setRoute('patients')}>
          <Icon name="chevL" size={14}/> Back
        </button>
        <div style={{fontWeight:700,fontSize:15}}>
          {!isEdit ? 'Create patient' : `Editing ${name}`}
        </div>
        {isEdit && <PatientTagBadge tag={ptag}/>}
      </div>

      <div className="df-tabs">
        {TABS.map((t,i)=>(
          <button key={t} type="button" className={`df-tab${tab===i?' active':''}`} onClick={()=>setTab(i)}>{t}</button>
        ))}
      </div>

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
                {seg(['M','F','Other'],gender,setGender)}
              </div>
              <div className="form-group">
                <label className="form-label">Date of birth{age?` · ${age} yrs`:''}</label>
                <input className="form-input" type="date" {...register('dob')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Blood group</label>
                <select className="form-select" {...register('bg')}>
                  {BG_OPTS.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Marital status</label>
                {seg(['Single','Married','Other'],marital,setMarital)}
              </div>
              <div className="form-group">
                <label className="form-label">Occupation</label>
                <input className="form-input" placeholder="Occupation" {...register('occ')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Patient tag</label>
                {seg(['active','new','follow-up','critical'],ptag,setPtag)}
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Photo upload</label>
                <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',border:'1px dashed var(--border)',borderRadius:8}}>
                  <div className="av xl blue">{av}</div>
                  <div>
                    <button type="button" className="btn btn-secondary btn-sm"><Icon name="plus" size={12}/>Upload photo</button>
                    <div style={{fontSize:11,color:'var(--fg-muted)',marginTop:4}}>JPG, PNG up to 2 MB</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab===1 && (
            <div className="grid-2" style={{gap:16}}>
              <div className="form-group">
                <label className="form-label">Mobile *</label>
                <input className="form-input" placeholder="+91 XXXXX XXXXX" {...register('mobile', { required: 'Mobile is required' })}/>
                {errors.mobile && <span className="form-error">{errors.mobile.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Alt phone</label>
                <input className="form-input" placeholder="Alternate number" {...register('altPhone')}/>
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="patient@email.com" {...register('email')}/>
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Street</label>
                <input className="form-input" placeholder="Street address" {...register('street')}/>
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
              <div className="section-divider" style={{gridColumn:'1/-1'}}>Emergency contact</div>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" placeholder="Contact name" {...register('emgName')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Relation</label>
                <input className="form-input" placeholder="e.g. Spouse" {...register('emgRel')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" placeholder="+91 XXXXX XXXXX" {...register('emgPhone')}/>
              </div>
              <div className="section-divider" style={{gridColumn:'1/-1'}}>Government ID</div>
              <div className="form-group">
                <label className="form-label">ID type</label>
                <select className="form-select" {...register('govType')}>
                  {GOV_IDS.map(g=><option key={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">ID number</label>
                <input className="form-input" placeholder="ID number" {...register('govNum')}/>
              </div>
            </div>
          )}

          {tab===2 && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div className="form-group">
                <label className="form-label">Drug allergies</label>
                {chipSet(ALLERGIES, allergies, toggleA, true)}
              </div>
              <div className="form-group">
                <label className="form-label">Chronic conditions</label>
                {chipSet(CONDITIONS, conditions, toggleC)}
              </div>
              <div className="form-group">
                <label className="form-label">Current medications</label>
                <textarea className="form-textarea" rows={3} placeholder="List medications and dosage…" {...register('meds')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Past surgeries</label>
                <textarea className="form-textarea" rows={3} placeholder="Surgical history…" {...register('surgeries')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Internal notes</label>
                <textarea className="form-textarea" rows={3} maxLength={500} placeholder="Notes visible only to staff…" {...register('medNotes')}/>
              </div>
            </div>
          )}

          {tab===3 && (
            <div className="grid-2" style={{gap:16}}>
              <div className="form-group">
                <label className="form-label">Insurer</label>
                <input className="form-input" placeholder="Insurance company" {...register('insurer')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Policy number</label>
                <input className="form-input" placeholder="Policy number" {...register('policy')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Valid till</label>
                <input className="form-input" type="date" {...register('validTill')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Cashless billing</label>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                  <input type="checkbox" style={{width:16,height:16}} {...register('cashless')}/>
                  <span style={{fontSize:13}}>Enabled</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="df-preview">
          <div className="preview-card" style={{marginBottom:12}}>
            <div style={{height:48,background:'linear-gradient(135deg,#3b82f6 0%,#6366f1 100%)',borderRadius:'8px 8px 0 0'}}/>
            <div style={{padding:'0 14px 14px',marginTop:-20}}>
              <div className="av xl blue" style={{border:'3px solid var(--bg-card)'}}>{av}</div>
              <div style={{marginTop:8,fontWeight:700,fontSize:15}}>{name}</div>
              <div style={{fontSize:12,color:'var(--fg-secondary)',marginTop:2}}>
                {age?`${age} yrs · `:''}
                {gender}{bg?` · ${bg}`:''}
              </div>
              <div style={{marginTop:8}}><PatientTagBadge tag={ptag}/></div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginTop:10}}>
                {[{l:'Allergy',v:String(allergies.length)},{l:'Condition',v:String(conditions.length)},{l:'Tag',v:ptag}].map(k=>(
                  <div key={k.l} style={{background:'var(--bg-section)',borderRadius:6,padding:'6px 8px',textAlign:'center'}}>
                    <div style={{fontSize:13,fontWeight:800}}>{k.v}</div>
                    <div style={{fontSize:10,color:'var(--fg-secondary)'}}>{k.l}</div>
                  </div>
                ))}
              </div>
              {allergies.length>0 && (
                <div style={{marginTop:10}}>
                  <div style={{fontSize:11,color:'var(--fg-muted)',marginBottom:4}}>Allergies</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                    {allergies.map(a=><span key={a} className="badge red" style={{fontSize:10}}>{a}</span>)}
                  </div>
                </div>
              )}
              {conditions.length>0 && (
                <div style={{marginTop:8}}>
                  <div style={{fontSize:11,color:'var(--fg-muted)',marginBottom:4}}>Conditions</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                    {conditions.map(c=><span key={c} className="badge warning" style={{fontSize:10}}>{c}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {(mobile||email) && (
            <div className="preview-card" style={{marginBottom:12}}>
              <div className="card-h"><Icon name="user" size={14}/><span>Contact</span></div>
              <div style={{padding:'8px 14px',fontSize:12,display:'flex',flexDirection:'column',gap:4}}>
                {mobile && <div>{mobile}</div>}
                {email && <div style={{color:'var(--fg-secondary)'}}>{email}</div>}
              </div>
            </div>
          )}

          {(insurer||policy) && (
            <div className="preview-card">
              <div className="card-h"><Icon name="shield" size={14}/><span>Insurance</span></div>
              <div style={{padding:'8px 14px',fontSize:12,display:'flex',flexDirection:'column',gap:4}}>
                {insurer && <div style={{fontWeight:600}}>{insurer}</div>}
                {policy && <div style={{color:'var(--fg-secondary)'}}>{policy}</div>}
                {cashless && <Badge variant="success">Cashless</Badge>}
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
          <button type="button" className="btn btn-secondary" onClick={()=>setRoute('patients')}>Cancel</button>
          {!isEdit && (
            <button type="button" className="btn btn-secondary" disabled={isSubmitting}>Save &amp; add another</button>
          )}
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Update patient' : 'Create patient'}
          </button>
        </div>
      </div>
    </form>
  )
}
