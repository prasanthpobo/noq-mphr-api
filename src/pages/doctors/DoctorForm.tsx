import { useState } from 'react'
import Icon from '@/components/ui/Icon'
import Badge from '@/components/ui/Badge'
import { useAppStore } from '@/store/app'
import { CLINICS } from '@/data'

type Mode = 'create' | 'view' | 'edit'

interface Props { mode: Mode }

const SPECS = ['General medicine','Cardiology','Dermatology','Pediatrics','Gynecology','Orthopedics','Neurology','Psychiatry','ENT','Ophthalmology','Dentistry','Oncology']
const LANGS = ['English','Hindi','Tamil','Telugu','Kannada','Malayalam','Bengali']
const DAYS  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const SLOTS = ['5','10','15','20']

function seg(label: string, opts: string[], val: string, set: (v:string)=>void, ro: boolean) {
  if (ro) return <span className="ro-val">{val}</span>
  return (
    <div className="seg-ctrl">
      {opts.map(o => <button key={o} className={val===o?'active':''} onClick={()=>set(o)}>{o}</button>)}
    </div>
  )
}

function chips(label: string, opts: string[], sel: string[], toggle: (v:string)=>void, ro: boolean) {
  if (ro) return (
    <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
      {sel.map(s=><span key={s} className="badge brand">{s}</span>)}
      {sel.length===0&&<span className="ro-val">—</span>}
    </div>
  )
  return (
    <div className="chip-lib">
      {opts.map(o=>(
        <button key={o} className={`tag${sel.includes(o)?' selected':''}`} onClick={()=>toggle(o)}>{o}</button>
      ))}
    </div>
  )
}

export default function DoctorForm({ mode }: Props) {
  const { setRoute } = useAppStore()
  const ro = mode === 'view'
  const isCreate = mode === 'create'

  const [tab, setTab] = useState(0)
  const [firstName, setFirstName]   = useState(isCreate ? '' : 'Ananya')
  const [lastName,  setLastName]    = useState(isCreate ? '' : 'Rao')
  const [gender,    setGender]      = useState('F')
  const [dob,       setDob]         = useState(isCreate ? '' : '1985-03-12')
  const [qual,      setQual]        = useState(isCreate ? '' : 'MBBS, MD (General Medicine)')
  const [specSel,   setSpecSel]     = useState<string[]>(isCreate ? [] : ['General medicine'])
  const [exp,       setExp]         = useState(isCreate ? '' : '12')
  const [consultFee,setConsultFee]  = useState(isCreate ? '' : '400')
  const [followFee, setFollowFee]   = useState(isCreate ? '' : '250')
  const [langSel,   setLangSel]     = useState<string[]>(isCreate ? [] : ['English','Hindi','Tamil'])
  // schedule
  const [schedActive, setSchedActive] = useState(true)
  const [daysSel,   setDaysSel]     = useState<string[]>(['Mon','Tue','Wed','Thu','Fri'])
  const [startTime, setStartTime]   = useState('09:00')
  const [endTime,   setEndTime]     = useState('18:00')
  const [slotDur,   setSlotDur]     = useState('15')
  const [maxTokens, setMaxTokens]   = useState('30')
  const [breakStart,setBreakStart]  = useState('13:00')
  const [breakEnd,  setBreakEnd]    = useState('14:00')
  // contact
  const [mobile,    setMobile]      = useState(isCreate ? '' : '+91 98765 43210')
  const [email,     setEmail]       = useState(isCreate ? '' : 'ananya.rao@noq.health')
  const [clinic,    setClinic]      = useState(isCreate ? '' : 'Sunshine Clinic')
  const [address,   setAddress]     = useState(isCreate ? '' : 'Koramangala, Bengaluru')
  // about
  const [bio,       setBio]         = useState(isCreate ? '' : 'Dr. Ananya Rao is a general physician with 12 years of clinical experience.')
  const [achieve,   setAchieve]     = useState(isCreate ? '' : '')
  const [notes,     setNotes]       = useState('')

  const toggleSpec = (v: string) => setSpecSel(s => s.includes(v) ? s.filter(x=>x!==v) : [...s,v])
  const toggleLang = (v: string) => setLangSel(s => s.includes(v) ? s.filter(x=>x!==v) : [...s,v])
  const toggleDay  = (v: string) => setDaysSel(s => s.includes(v) ? s.filter(x=>x!==v) : [...s,v])

  const errors: string[] = []
  if (!firstName.trim()) errors.push('First name')
  if (!lastName.trim())  errors.push('Last name')
  if (!qual.trim())      errors.push('Qualification')
  if (specSel.length===0) errors.push('Specialization')
  if (!exp.trim())       errors.push('Experience')
  if (!consultFee.trim()) errors.push('Consultation fee')

  const titleName = isCreate ? 'Create doctor' : mode==='edit' ? `Editing Dr. ${firstName} ${lastName}` : `Dr. ${firstName} ${lastName}`

  const TABS = ['Profile','Schedule','Contact info','About doctor']

  return (
    <div className="df-shell">
      {/* Top strip */}
      <div className="df-tabs" style={{borderBottom:'1px solid var(--border)',padding:'0 20px',display:'flex',alignItems:'center',gap:12,minHeight:52}}>
        <button className="btn btn-ghost btn-sm" onClick={()=>setRoute('doctors')}>
          <Icon name="chevL" size={14}/> Back
        </button>
        <div style={{fontWeight:700,fontSize:15}}>{titleName}</div>
        {!isCreate && <Badge variant={mode==='edit'?'warning':'success'} dot>{mode==='edit'?'Editing':'Active'}</Badge>}
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          {mode==='view' && <button className="btn btn-primary btn-sm" onClick={()=>setRoute('doctor-edit')}><Icon name="edit" size={13}/>Edit</button>}
          {mode==='view' && <button className="btn btn-secondary btn-sm"><Icon name="eye" size={13}/>Preview</button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="df-tabs">
        {TABS.map((t,i)=>(
          <button key={t} className={`df-tab${tab===i?' active':''}`} onClick={()=>setTab(i)}>{t}</button>
        ))}
      </div>

      {/* Body */}
      <div className="df-body">
        <div className="df-panel">
          {tab===0 && (
            <div className="grid-2" style={{gap:16}}>
              <div className="form-group">
                <label className="form-label">First name *</label>
                {ro ? <span className="ro-val">{firstName}</span> : <input className="form-input" value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="First name"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Last name *</label>
                {ro ? <span className="ro-val">{lastName}</span> : <input className="form-input" value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Last name"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                {seg('Gender',['M','F','Other'],gender,setGender,ro)}
              </div>
              <div className="form-group">
                <label className="form-label">Date of birth</label>
                {ro ? <span className="ro-val">{dob||'—'}</span> : <input className="form-input" type="date" value={dob} onChange={e=>setDob(e.target.value)}/>}
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Qualification *</label>
                {ro ? <span className="ro-val">{qual||'—'}</span> : <input className="form-input" value={qual} onChange={e=>setQual(e.target.value)} placeholder="e.g. MBBS, MD"/>}
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Specialization *</label>
                {chips('Specialization',SPECS,specSel,toggleSpec,ro)}
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Photo upload</label>
                <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',border:'1px dashed var(--border)',borderRadius:8}}>
                  <div className="av xl pink" style={{flexShrink:0}}>{firstName?firstName[0]:'?'}{lastName?lastName[0]:''}</div>
                  <div>
                    {ro ? <span className="ro-val">Photo on file</span> : <><button className="btn btn-secondary btn-sm"><Icon name="plus" size={12}/>Upload photo</button><div style={{fontSize:11,color:'var(--fg-muted)',marginTop:4}}>JPG, PNG up to 2 MB. Square recommended.</div></>}
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Experience (years) *</label>
                {ro ? <span className="ro-val">{exp} yrs</span> : <input className="form-input" type="number" value={exp} onChange={e=>setExp(e.target.value)} placeholder="e.g. 12"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Consultation fee (₹) *</label>
                {ro ? <span className="ro-val">₹{consultFee}</span> : <input className="form-input" type="number" value={consultFee} onChange={e=>setConsultFee(e.target.value)} placeholder="e.g. 400"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Follow-up fee (₹)</label>
                {ro ? <span className="ro-val">₹{followFee||'—'}</span> : <input className="form-input" type="number" value={followFee} onChange={e=>setFollowFee(e.target.value)} placeholder="e.g. 250"/>}
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Languages spoken</label>
                {chips('Languages',LANGS,langSel,toggleLang,ro)}
              </div>
            </div>
          )}

          {tab===1 && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div className="form-group">
                <label className="form-label">Schedule active</label>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  {ro ? <span className="ro-val">{schedActive?'Active':'Inactive'}</span> : (
                    <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                      <input type="checkbox" checked={schedActive} onChange={e=>setSchedActive(e.target.checked)} style={{width:16,height:16}}/>
                      <span style={{fontSize:13}}>{schedActive?'Active':'Inactive'}</span>
                    </label>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Working days</label>
                <div className="day-pips">
                  {DAYS.map(d=>(
                    <button key={d} className={`day-pip${daysSel.includes(d)?' active':''}`}
                      onClick={()=>!ro&&toggleDay(d)}
                      style={{cursor:ro?'default':'pointer'}}>{d}</button>
                  ))}
                </div>
              </div>
              <div className="grid-2" style={{gap:16}}>
                <div className="form-group">
                  <label className="form-label">Start time</label>
                  {ro ? <span className="ro-val">{startTime}</span> : <input className="form-input" type="time" value={startTime} onChange={e=>setStartTime(e.target.value)}/>}
                </div>
                <div className="form-group">
                  <label className="form-label">End time</label>
                  {ro ? <span className="ro-val">{endTime}</span> : <input className="form-input" type="time" value={endTime} onChange={e=>setEndTime(e.target.value)}/>}
                </div>
                <div className="form-group">
                  <label className="form-label">Slot duration (min)</label>
                  {seg('Slot',SLOTS,slotDur,setSlotDur,ro)}
                </div>
                <div className="form-group">
                  <label className="form-label">Max tokens</label>
                  {ro ? <span className="ro-val">{maxTokens}</span> : <input className="form-input" type="number" value={maxTokens} onChange={e=>setMaxTokens(e.target.value)}/>}
                </div>
                <div className="form-group">
                  <label className="form-label">Break start</label>
                  {ro ? <span className="ro-val">{breakStart}</span> : <input className="form-input" type="time" value={breakStart} onChange={e=>setBreakStart(e.target.value)}/>}
                </div>
                <div className="form-group">
                  <label className="form-label">Break end</label>
                  {ro ? <span className="ro-val">{breakEnd}</span> : <input className="form-input" type="time" value={breakEnd} onChange={e=>setBreakEnd(e.target.value)}/>}
                </div>
              </div>
            </div>
          )}

          {tab===2 && (
            <div className="grid-2" style={{gap:16}}>
              <div className="form-group">
                <label className="form-label">Mobile</label>
                {ro ? <span className="ro-val">{mobile||'—'}</span> : <input className="form-input" value={mobile} onChange={e=>setMobile(e.target.value)} placeholder="+91 XXXXX XXXXX"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                {ro ? <span className="ro-val">{email||'—'}</span> : <input className="form-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="doctor@noq.health"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Clinic</label>
                {ro ? <span className="ro-val">{clinic||'—'}</span> : (
                  <select className="form-select" value={clinic} onChange={e=>setClinic(e.target.value)}>
                    <option value="">Select clinic</option>
                    {CLINICS.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                )}
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Address</label>
                {ro ? <span className="ro-val">{address||'—'}</span> : <textarea className="form-textarea" value={address} onChange={e=>setAddress(e.target.value)} rows={3} placeholder="Full address"/>}
              </div>
            </div>
          )}

          {tab===3 && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div className="form-group">
                <label className="form-label">Bio <span style={{color:'var(--fg-muted)',fontWeight:400}}>({bio.length}/600)</span></label>
                {ro ? <span className="ro-val">{bio||'—'}</span> : <textarea className="form-textarea" value={bio} maxLength={600} onChange={e=>setBio(e.target.value)} rows={4} placeholder="Brief professional bio…"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Achievements</label>
                {ro ? <span className="ro-val">{achieve||'—'}</span> : <textarea className="form-textarea" value={achieve} onChange={e=>setAchieve(e.target.value)} rows={3} placeholder="Awards, publications…"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Internal notes</label>
                {ro ? <span className="ro-val">{notes||'—'}</span> : <textarea className="form-textarea" value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder="Internal staff notes (not visible to patient)"/>}
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
              <div style={{color:'var(--fg-secondary)'}}>{startTime} – {endTime} · {slotDur} min slots · Max {maxTokens}</div>
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
        <div style={{fontSize:12,color:errors.length>0?'var(--danger)':'var(--success)',display:'flex',alignItems:'center',gap:6}}>
          <Icon name={errors.length>0?'alert':'check'} size={14}/>
          {errors.length>0 ? `${errors.length} field${errors.length>1?'s':''} need attention` : 'All required fields filled'}
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <button className="btn btn-secondary" onClick={()=>setRoute('doctors')}>Cancel</button>
          <button className="btn btn-primary" disabled={isCreate && errors.length>0}>
            {isCreate ? 'Create doctor' : 'Update doctor'}
          </button>
        </div>
      </div>
    </div>
  )
}
