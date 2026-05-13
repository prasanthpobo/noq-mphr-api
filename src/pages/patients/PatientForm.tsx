import { useState } from 'react'
import Icon from '@/components/ui/Icon'
import Badge, { PatientTagBadge } from '@/components/ui/Badge'
import { useAppStore } from '@/store/app'
import type { Patient } from '@/types'

type Mode = 'create' | 'view' | 'edit'
interface Props { mode: Mode; existing?: Partial<Patient> }

const ALLERGIES  = ['Penicillin','Sulfa','Aspirin','Ibuprofen','Latex','Peanuts','Shellfish','Dust','Pollen','Mold']
const CONDITIONS = ['Hypertension','Diabetes','Asthma','Hypothyroid','COPD','Arthritis','Anemia','Depression','Obesity','CAD']
const BG_OPTS    = ['A+','A-','B+','B-','AB+','AB-','O+','O-']
const GOV_IDS    = ['Aadhaar','PAN','Passport','Voter ID','Driving Licence']

function seg(opts: string[], val: string, set: (v:string)=>void, ro: boolean) {
  if (ro) return <span className="ro-val">{val||'—'}</span>
  return <div className="seg-ctrl">{opts.map(o=><button key={o} className={val===o?'active':''} onClick={()=>set(o)}>{o}</button>)}</div>
}

function chipSet(opts: string[], sel: string[], toggle:(v:string)=>void, ro: boolean, danger=false) {
  if (ro) return (
    <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
      {sel.length ? sel.map(s=><span key={s} className={`badge ${danger?'red':'brand'}`} style={{fontSize:11}}>{s}</span>) : <span className="ro-val">None</span>}
    </div>
  )
  return (
    <div className="chip-lib">
      {opts.map(o=><button key={o} className={`tag${sel.includes(o)?' selected':''}`} onClick={()=>toggle(o)}>{o}</button>)}
    </div>
  )
}

function calcAge(dob: string) {
  if (!dob) return ''
  const diff = Date.now() - new Date(dob).getTime()
  return String(Math.floor(diff / (365.25*24*3600*1000)))
}

export default function PatientForm({ mode, existing }: Props) {
  const { setRoute } = useAppStore()
  const ro = mode === 'view'
  const isCreate = mode === 'create'

  const [tab, setTab] = useState(0)
  const [firstName, setFirstName] = useState(isCreate?'':'Aarav')
  const [lastName,  setLastName]  = useState(isCreate?'':'Sharma')
  const [gender,    setGender]    = useState('M')
  const [dob,       setDob]       = useState(isCreate?'':'1990-04-15')
  const [bg,        setBg]        = useState(isCreate?'O+':'O+')
  const [marital,   setMarital]   = useState('Single')
  const [occ,       setOcc]       = useState(isCreate?'':'Software Engineer')
  const [ptag,      setPtag]      = useState('active')
  // contact
  const [mobile,    setMobile]    = useState(isCreate?'':'+91 98765 11001')
  const [altPhone,  setAltPhone]  = useState('')
  const [email,     setEmail]     = useState(isCreate?'':'aarav.s@email.com')
  const [street,    setStreet]    = useState(isCreate?'':'12, MG Road')
  const [city,      setCity]      = useState(isCreate?'':'Bengaluru')
  const [state,     setState]     = useState(isCreate?'':'Karnataka')
  const [pin,       setPin]       = useState(isCreate?'':'560001')
  const [emgName,   setEmgName]   = useState('')
  const [emgRel,    setEmgRel]    = useState('')
  const [emgPhone,  setEmgPhone]  = useState('')
  const [govType,   setGovType]   = useState('Aadhaar')
  const [govNum,    setGovNum]    = useState('')
  // medical
  const [allergies, setAllergies] = useState<string[]>([])
  const [conditions,setConditions]= useState<string[]>([])
  const [meds,      setMeds]      = useState('')
  const [surgeries, setSurgeries] = useState('')
  const [medNotes,  setMedNotes]  = useState('')
  // insurance
  const [insurer,   setInsurer]   = useState('')
  const [policy,    setPolicy]    = useState('')
  const [validTill, setValidTill] = useState('')
  const [cashless,  setCashless]  = useState(false)

  const toggleA = (v:string) => setAllergies(s=>s.includes(v)?s.filter(x=>x!==v):[...s,v])
  const toggleC = (v:string) => setConditions(s=>s.includes(v)?s.filter(x=>x!==v):[...s,v])

  const age = dob ? calcAge(dob) : ''

  const errors: string[] = []
  if (!firstName.trim()) errors.push('First name')
  if (!lastName.trim())  errors.push('Last name')
  if (!mobile.trim())    errors.push('Mobile')

  const name = `${firstName} ${lastName}`.trim() || 'New Patient'
  const av   = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
  const TABS = ['Profile','Contact & ID','Medical history','Insurance']

  return (
    <div className="df-shell">
      <div className="df-tabs" style={{borderBottom:'1px solid var(--border)',padding:'0 20px',display:'flex',alignItems:'center',gap:12,minHeight:52}}>
        <button className="btn btn-ghost btn-sm" onClick={()=>setRoute('patients')}>
          <Icon name="chevL" size={14}/> Back
        </button>
        <div style={{fontWeight:700,fontSize:15}}>
          {isCreate ? 'Create patient' : mode==='edit' ? `Editing ${name}` : name}
        </div>
        {!isCreate && <PatientTagBadge tag={ptag}/>}
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          {mode==='view' && <button className="btn btn-primary btn-sm" onClick={()=>setRoute('patient-edit')}><Icon name="edit" size={13}/>Edit</button>}
        </div>
      </div>

      <div className="df-tabs">
        {TABS.map((t,i)=>(
          <button key={t} className={`df-tab${tab===i?' active':''}`} onClick={()=>setTab(i)}>{t}</button>
        ))}
      </div>

      <div className="df-body">
        <div className="df-panel">
          {tab===0 && (
            <div className="grid-2" style={{gap:16}}>
              <div className="form-group">
                <label className="form-label">First name *</label>
                {ro?<span className="ro-val">{firstName}</span>:<input className="form-input" value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="First name"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Last name *</label>
                {ro?<span className="ro-val">{lastName}</span>:<input className="form-input" value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Last name"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                {seg(['M','F','Other'],gender,setGender,ro)}
              </div>
              <div className="form-group">
                <label className="form-label">Date of birth{age?` · ${age} yrs`:''}</label>
                {ro?<span className="ro-val">{dob||'—'}</span>:<input className="form-input" type="date" value={dob} onChange={e=>setDob(e.target.value)}/>}
              </div>
              <div className="form-group">
                <label className="form-label">Blood group</label>
                {ro?<span className="ro-val">{bg}</span>:(
                  <select className="form-select" value={bg} onChange={e=>setBg(e.target.value)}>
                    {BG_OPTS.map(o=><option key={o}>{o}</option>)}
                  </select>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Marital status</label>
                {seg(['Single','Married','Other'],marital,setMarital,ro)}
              </div>
              <div className="form-group">
                <label className="form-label">Occupation</label>
                {ro?<span className="ro-val">{occ||'—'}</span>:<input className="form-input" value={occ} onChange={e=>setOcc(e.target.value)} placeholder="Occupation"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Patient tag</label>
                {seg(['active','new','follow-up','critical'],ptag,setPtag,ro)}
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Photo upload</label>
                <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',border:'1px dashed var(--border)',borderRadius:8}}>
                  <div className="av xl blue">{av}</div>
                  <div>{ro?<span className="ro-val">Photo on file</span>:<><button className="btn btn-secondary btn-sm"><Icon name="plus" size={12}/>Upload photo</button><div style={{fontSize:11,color:'var(--fg-muted)',marginTop:4}}>JPG, PNG up to 2 MB</div></>}</div>
                </div>
              </div>
            </div>
          )}

          {tab===1 && (
            <div className="grid-2" style={{gap:16}}>
              <div className="form-group">
                <label className="form-label">Mobile *</label>
                {ro?<span className="ro-val">{mobile}</span>:<input className="form-input" value={mobile} onChange={e=>setMobile(e.target.value)} placeholder="+91 XXXXX XXXXX"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Alt phone</label>
                {ro?<span className="ro-val">{altPhone||'—'}</span>:<input className="form-input" value={altPhone} onChange={e=>setAltPhone(e.target.value)} placeholder="Alternate number"/>}
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Email</label>
                {ro?<span className="ro-val">{email||'—'}</span>:<input className="form-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="patient@email.com"/>}
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Street</label>
                {ro?<span className="ro-val">{street||'—'}</span>:<input className="form-input" value={street} onChange={e=>setStreet(e.target.value)} placeholder="Street address"/>}
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                {ro?<span className="ro-val">{city||'—'}</span>:<input className="form-input" value={city} onChange={e=>setCity(e.target.value)} placeholder="City"/>}
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                {ro?<span className="ro-val">{state||'—'}</span>:<input className="form-input" value={state} onChange={e=>setState(e.target.value)} placeholder="State"/>}
              </div>
              <div className="form-group">
                <label className="form-label">PIN code</label>
                {ro?<span className="ro-val">{pin||'—'}</span>:<input className="form-input" value={pin} onChange={e=>setPin(e.target.value)} placeholder="6-digit PIN"/>}
              </div>
              <div className="section-divider" style={{gridColumn:'1/-1'}}>Emergency contact</div>
              <div className="form-group">
                <label className="form-label">Name</label>
                {ro?<span className="ro-val">{emgName||'—'}</span>:<input className="form-input" value={emgName} onChange={e=>setEmgName(e.target.value)} placeholder="Contact name"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Relation</label>
                {ro?<span className="ro-val">{emgRel||'—'}</span>:<input className="form-input" value={emgRel} onChange={e=>setEmgRel(e.target.value)} placeholder="e.g. Spouse"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                {ro?<span className="ro-val">{emgPhone||'—'}</span>:<input className="form-input" value={emgPhone} onChange={e=>setEmgPhone(e.target.value)} placeholder="+91 XXXXX XXXXX"/>}
              </div>
              <div className="section-divider" style={{gridColumn:'1/-1'}}>Government ID</div>
              <div className="form-group">
                <label className="form-label">ID type</label>
                {ro?<span className="ro-val">{govType}</span>:(
                  <select className="form-select" value={govType} onChange={e=>setGovType(e.target.value)}>
                    {GOV_IDS.map(g=><option key={g}>{g}</option>)}
                  </select>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">ID number</label>
                {ro?<span className="ro-val">{govNum||'—'}</span>:<input className="form-input" value={govNum} onChange={e=>setGovNum(e.target.value)} placeholder="ID number"/>}
              </div>
            </div>
          )}

          {tab===2 && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div className="form-group">
                <label className="form-label">Drug allergies</label>
                {chipSet(ALLERGIES,allergies,toggleA,ro,true)}
              </div>
              <div className="form-group">
                <label className="form-label">Chronic conditions</label>
                {chipSet(CONDITIONS,conditions,toggleC,ro)}
              </div>
              <div className="form-group">
                <label className="form-label">Current medications</label>
                {ro?<span className="ro-val">{meds||'—'}</span>:<textarea className="form-textarea" value={meds} onChange={e=>setMeds(e.target.value)} rows={3} placeholder="List medications and dosage…"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Past surgeries</label>
                {ro?<span className="ro-val">{surgeries||'—'}</span>:<textarea className="form-textarea" value={surgeries} onChange={e=>setSurgeries(e.target.value)} rows={3} placeholder="Surgical history…"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Internal notes <span style={{color:'var(--fg-muted)',fontWeight:400}}>({medNotes.length}/500)</span></label>
                {ro?<span className="ro-val">{medNotes||'—'}</span>:<textarea className="form-textarea" value={medNotes} maxLength={500} onChange={e=>setMedNotes(e.target.value)} rows={3} placeholder="Notes visible only to staff…"/>}
              </div>
            </div>
          )}

          {tab===3 && (
            <div className="grid-2" style={{gap:16}}>
              <div className="form-group">
                <label className="form-label">Insurer</label>
                {ro?<span className="ro-val">{insurer||'—'}</span>:<input className="form-input" value={insurer} onChange={e=>setInsurer(e.target.value)} placeholder="Insurance company"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Policy number</label>
                {ro?<span className="ro-val">{policy||'—'}</span>:<input className="form-input" value={policy} onChange={e=>setPolicy(e.target.value)} placeholder="Policy number"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Valid till</label>
                {ro?<span className="ro-val">{validTill||'—'}</span>:<input className="form-input" type="date" value={validTill} onChange={e=>setValidTill(e.target.value)}/>}
              </div>
              <div className="form-group">
                <label className="form-label">Cashless billing</label>
                {ro?<span className="ro-val">{cashless?'Yes':'No'}</span>:(
                  <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                    <input type="checkbox" checked={cashless} onChange={e=>setCashless(e.target.checked)} style={{width:16,height:16}}/>
                    <span style={{fontSize:13}}>Enabled</span>
                  </label>
                )}
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
                {[{l:'Visits',v:'4'},{l:'Last',v:'Today'},{l:'Allergy',v:String(allergies.length)}].map(k=>(
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
        <div style={{fontSize:12,color:errors.length>0?'var(--danger)':'var(--success)',display:'flex',alignItems:'center',gap:6}}>
          <Icon name={errors.length>0?'alert':'check'} size={14}/>
          {errors.length>0?`${errors.length} field${errors.length>1?'s':''} need attention`:'All required fields filled'}
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <button className="btn btn-secondary" onClick={()=>setRoute('patients')}>Cancel</button>
          {isCreate && <button className="btn btn-secondary" disabled={errors.length>0}>Save &amp; add another</button>}
          <button className="btn btn-primary" disabled={isCreate&&errors.length>0}>
            {isCreate?'Create patient':'Update patient'}
          </button>
        </div>
      </div>
    </div>
  )
}
