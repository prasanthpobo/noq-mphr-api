import { useState } from 'react'
import Icon from '@/components/ui/Icon'
import Badge, { UserStatusBadge } from '@/components/ui/Badge'
import { useAppStore } from '@/store/app'
import { CLINICS } from '@/data'
import type { Nurse } from '@/types'

type Mode = 'create' | 'view' | 'edit'
interface Props { mode: Mode; existing?: Partial<Nurse> }

const ROLES   = ['Trainee','Staff nurse','Senior nurse','Charge nurse','Head nurse','Nurse manager']
const DEPTS   = ['ICU','ER','Surgery','Pediatrics','Maternity','Cardiology','OPD','General','Oncology','Admin']
const SHIFTS  = ['Morning','Afternoon','Evening','Night','Rotational']
const BG_OPTS = ['A+','A-','B+','B-','AB+','AB-','O+','O-']
const DAYS    = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const CERTS   = ['BLS','ACLS','PALS','NRP','IV Therapy','Wound Care','Critical Care','Phlebotomy','Triage','Infection Control']
const MODULES = ['Bookings','Tokens','Patients','Doctors','Clinics','Billing','Reports','Pharmacy']

function seg(opts:string[], val:string, set:(v:string)=>void, ro:boolean) {
  if (ro) return <span className="ro-val">{val||'—'}</span>
  return <div className="seg-ctrl">{opts.map(o=><button key={o} className={val===o?'active':''} onClick={()=>set(o)}>{o}</button>)}</div>
}

function chipSet(opts:string[], sel:string[], toggle:(v:string)=>void, ro:boolean, variant='brand') {
  if (ro) return (
    <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
      {sel.length?sel.map(s=><span key={s} className={`badge ${variant}`} style={{fontSize:11}}>{s}</span>):<span className="ro-val">None</span>}
    </div>
  )
  return <div className="chip-lib">{opts.map(o=><button key={o} className={`tag${sel.includes(o)?' selected':''}`} onClick={()=>toggle(o)}>{o}</button>)}</div>
}

export default function NurseForm({ mode, existing }: Props) {
  const { setRoute } = useAppStore()
  const ro = mode==='view'
  const isCreate = mode==='create'

  const [tab,       setTab]       = useState(0)
  const [firstName, setFirstName] = useState(isCreate?'':'Mary')
  const [lastName,  setLastName]  = useState(isCreate?'':'George')
  const [gender,    setGender]    = useState('F')
  const [dob,       setDob]       = useState(isCreate?'':'1985-09-14')
  const [bg,        setBg]        = useState('O+')
  const [exp,       setExp]       = useState(isCreate?'':'14')
  const [empId,     setEmpId]     = useState(isCreate?'':'NR-001')
  const [regNum,    setRegNum]    = useState(isCreate?'':'KNC-2010-04521')
  const [joined,    setJoined]    = useState(isCreate?'':'2018-04-12')
  const [role,      setRole]      = useState(isCreate?'Staff nurse':'Head nurse')
  const [clinic,    setClinic]    = useState(isCreate?'':'Sunshine Clinic')
  const [deptSel,   setDeptSel]   = useState<string[]>(isCreate?[]:['ICU'])
  const [status,    setStatus]    = useState('active')
  // shift
  const [shiftType, setShiftType] = useState('Morning')
  const [rotational,setRotational]= useState(false)
  const [onCall,    setOnCall]    = useState(false)
  const [daysSel,   setDaysSel]   = useState<string[]>(['Mon','Tue','Wed','Thu','Fri'])
  const [startTime, setStartTime] = useState('07:00')
  const [endTime,   setEndTime]   = useState('15:00')
  const [ward,      setWard]      = useState(isCreate?'':'ICU-A')
  const [breakStart,setBreakStart]= useState('12:00')
  const [breakEnd,  setBreakEnd]  = useState('13:00')
  // contact
  const [mobile,    setMobile]    = useState(isCreate?'':'+91 98765 20001')
  const [altPhone,  setAltPhone]  = useState('')
  const [email,     setEmail]     = useState(isCreate?'':'mary.g@noq.health')
  const [address,   setAddress]   = useState('')
  const [emgName,   setEmgName]   = useState('')
  const [emgRel,    setEmgRel]    = useState('')
  const [emgPhone,  setEmgPhone]  = useState('')
  // skills
  const [username,  setUsername]  = useState(isCreate?'':'mary.george')
  const [password,  setPassword]  = useState('')
  const [twoFA,     setTwoFA]     = useState(false)
  const [certSel,   setCertSel]   = useState<string[]>(isCreate?[]:['BLS','ACLS'])
  const [notes,     setNotes]     = useState('')

  const toggleDay  = (v:string) => !ro && setDaysSel(s=>s.includes(v)?s.filter(x=>x!==v):[...s,v])
  const toggleDept = (v:string) => setDeptSel(s=>s.includes(v)?s.filter(x=>x!==v):[...s,v])
  const toggleCert = (v:string) => setCertSel(s=>s.includes(v)?s.filter(x=>x!==v):[...s,v])

  const errors: string[] = []
  if (!firstName.trim()) errors.push('First name')
  if (!lastName.trim())  errors.push('Last name')
  if (!mobile.trim())    errors.push('Mobile')

  const name = `${firstName} ${lastName}`.trim() || 'New Nurse'
  const av   = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
  const TABS = ['Profile','Shift & ward','Contact','Skills & access']

  return (
    <div className="df-shell">
      <div className="df-tabs" style={{borderBottom:'1px solid var(--border)',padding:'0 20px',display:'flex',alignItems:'center',gap:12,minHeight:52}}>
        <button className="btn btn-ghost btn-sm" onClick={()=>setRoute('nurses')}>
          <Icon name="chevL" size={14}/> Back
        </button>
        <div style={{fontWeight:700,fontSize:15}}>
          {isCreate?'Create nurse':mode==='edit'?`Editing ${name}`:name}
        </div>
        {!isCreate && <UserStatusBadge status={status}/>}
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          {mode==='view'&&<button className="btn btn-primary btn-sm" onClick={()=>setRoute('nurse-edit')}><Icon name="edit" size={13}/>Edit</button>}
        </div>
      </div>

      <div className="df-tabs">
        {TABS.map((t,i)=><button key={t} className={`df-tab${tab===i?' active':''}`} onClick={()=>setTab(i)}>{t}</button>)}
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
                <label className="form-label">Date of birth</label>
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
                <label className="form-label">Experience (yrs)</label>
                {ro?<span className="ro-val">{exp} yrs</span>:<input className="form-input" type="number" value={exp} onChange={e=>setExp(e.target.value)} placeholder="Years of experience"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Employee ID</label>
                {ro?<span className="ro-val">{empId||'—'}</span>:<input className="form-input" value={empId} onChange={e=>setEmpId(e.target.value)} placeholder="NR-XXX"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Nursing council reg #</label>
                {ro?<span className="ro-val">{regNum||'—'}</span>:<input className="form-input" value={regNum} onChange={e=>setRegNum(e.target.value)} placeholder="Registration number"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Joined date</label>
                {ro?<span className="ro-val">{joined||'—'}</span>:<input className="form-input" type="date" value={joined} onChange={e=>setJoined(e.target.value)}/>}
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                {ro?<span className="ro-val">{role}</span>:(
                  <select className="form-select" value={role} onChange={e=>setRole(e.target.value)}>
                    {ROLES.map(r=><option key={r}>{r}</option>)}
                  </select>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Clinic</label>
                {ro?<span className="ro-val">{clinic||'—'}</span>:(
                  <select className="form-select" value={clinic} onChange={e=>setClinic(e.target.value)}>
                    <option value="">Select clinic</option>
                    {CLINICS.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                )}
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Department(s)</label>
                {chipSet(DEPTS,deptSel,toggleDept,ro)}
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                {seg(['active','on-leave','inactive'],status,setStatus,ro)}
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Photo</label>
                <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',border:'1px dashed var(--border)',borderRadius:8}}>
                  <div className="av xl pink">{av}</div>
                  <div>{ro?<span className="ro-val">Photo on file</span>:<><button className="btn btn-secondary btn-sm"><Icon name="plus" size={12}/>Upload photo</button><div style={{fontSize:11,color:'var(--fg-muted)',marginTop:4}}>JPG or PNG, up to 2 MB</div></>}</div>
                </div>
              </div>
            </div>
          )}

          {tab===1 && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div className="form-group">
                <label className="form-label">Shift type</label>
                {seg(SHIFTS,shiftType,setShiftType,ro)}
              </div>
              <div className="grid-2" style={{gap:16}}>
                <div className="form-group">
                  <label className="form-label">Rotational</label>
                  {ro?<span className="ro-val">{rotational?'Yes':'No'}</span>:(
                    <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                      <input type="checkbox" checked={rotational} onChange={e=>setRotational(e.target.checked)} style={{width:16,height:16}}/>
                      <span style={{fontSize:13}}>Rotational shift</span>
                    </label>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">On-call</label>
                  {ro?<span className="ro-val">{onCall?'Yes':'No'}</span>:(
                    <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                      <input type="checkbox" checked={onCall} onChange={e=>setOnCall(e.target.checked)} style={{width:16,height:16}}/>
                      <span style={{fontSize:13}}>On-call eligible</span>
                    </label>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Working days</label>
                <div className="day-pips">
                  {DAYS.map(d=><button key={d} className={`day-pip${daysSel.includes(d)?' active':''}`} onClick={()=>toggleDay(d)} style={{cursor:ro?'default':'pointer'}}>{d}</button>)}
                </div>
              </div>
              <div className="grid-2" style={{gap:16}}>
                <div className="form-group">
                  <label className="form-label">Start time</label>
                  {ro?<span className="ro-val">{startTime}</span>:<input className="form-input" type="time" value={startTime} onChange={e=>setStartTime(e.target.value)}/>}
                </div>
                <div className="form-group">
                  <label className="form-label">End time</label>
                  {ro?<span className="ro-val">{endTime}</span>:<input className="form-input" type="time" value={endTime} onChange={e=>setEndTime(e.target.value)}/>}
                </div>
                <div className="form-group">
                  <label className="form-label">Ward / room</label>
                  {ro?<span className="ro-val">{ward||'—'}</span>:<input className="form-input" value={ward} onChange={e=>setWard(e.target.value)} placeholder="Ward or room ID"/>}
                </div>
                <div className="form-group">
                  <label className="form-label">Break start</label>
                  {ro?<span className="ro-val">{breakStart}</span>:<input className="form-input" type="time" value={breakStart} onChange={e=>setBreakStart(e.target.value)}/>}
                </div>
                <div className="form-group">
                  <label className="form-label">Break end</label>
                  {ro?<span className="ro-val">{breakEnd}</span>:<input className="form-input" type="time" value={breakEnd} onChange={e=>setBreakEnd(e.target.value)}/>}
                </div>
              </div>
            </div>
          )}

          {tab===2 && (
            <div className="grid-2" style={{gap:16}}>
              <div className="form-group">
                <label className="form-label">Mobile *</label>
                {ro?<span className="ro-val">{mobile}</span>:<input className="form-input" value={mobile} onChange={e=>setMobile(e.target.value)} placeholder="+91 XXXXX XXXXX"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Alt phone</label>
                {ro?<span className="ro-val">{altPhone||'—'}</span>:<input className="form-input" value={altPhone} onChange={e=>setAltPhone(e.target.value)}/>}
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Email</label>
                {ro?<span className="ro-val">{email||'—'}</span>:<input className="form-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nurse@noq.health"/>}
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Address</label>
                {ro?<span className="ro-val">{address||'—'}</span>:<textarea className="form-textarea" value={address} onChange={e=>setAddress(e.target.value)} rows={3} placeholder="Full address"/>}
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
            </div>
          )}

          {tab===3 && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div className="grid-2" style={{gap:16}}>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  {ro?<span className="ro-val">{username||'—'}</span>:<input className="form-input" value={username} onChange={e=>setUsername(e.target.value)} placeholder="username"/>}
                </div>
                <div className="form-group">
                  <label className="form-label">Temp password</label>
                  {ro?<span className="ro-val">••••••••</span>:<div><input className="form-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Temporary password"/><div style={{fontSize:11,color:'var(--fg-muted)',marginTop:4}}>User resets on first login</div></div>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Two-factor authentication</label>
                {ro?<span className="ro-val">{twoFA?'Enabled':'Disabled'}</span>:(
                  <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                    <input type="checkbox" checked={twoFA} onChange={e=>setTwoFA(e.target.checked)} style={{width:16,height:16}}/>
                    <span style={{fontSize:13}}>{twoFA?'Enabled':'Disabled'}</span>
                  </label>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Certifications</label>
                {chipSet(CERTS,certSel,toggleCert,ro,'pink')}
              </div>
              <div className="form-group">
                <label className="form-label">Internal notes</label>
                {ro?<span className="ro-val">{notes||'—'}</span>:<textarea className="form-textarea" value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder="Staff-only notes…"/>}
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="df-preview">
          <div className="preview-card" style={{marginBottom:12}}>
            <div style={{height:48,background:'linear-gradient(135deg,#ec4899 0%,#a855f7 100%)',borderRadius:'8px 8px 0 0'}}/>
            <div style={{padding:'0 14px 14px',marginTop:-20}}>
              <div className="av xl pink" style={{border:'3px solid var(--bg-card)'}}>{av}</div>
              <div style={{marginTop:8,fontWeight:700,fontSize:15}}>{name}</div>
              <div style={{fontSize:12,color:'var(--fg-secondary)'}}>{role}</div>
              {clinic&&<div style={{fontSize:11,color:'var(--fg-muted)'}}>{clinic}</div>}
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginTop:10}}>
                {[{l:'Exp',v:`${exp||'—'} yrs`},{l:'Ward',v:ward||'—'},{l:'Certs',v:String(certSel.length)}].map(k=>(
                  <div key={k.l} style={{background:'var(--bg-section)',borderRadius:6,padding:'6px 8px',textAlign:'center'}}>
                    <div style={{fontSize:13,fontWeight:800}}>{k.v}</div>
                    <div style={{fontSize:10,color:'var(--fg-secondary)'}}>{k.l}</div>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:10}}>
                <UserStatusBadge status={status}/>
                {deptSel.map(d=><span key={d} className="badge pink" style={{fontSize:10}}>{d}</span>)}
              </div>
            </div>
          </div>

          {certSel.length>0 && (
            <div className="preview-card" style={{marginBottom:12}}>
              <div className="card-h"><Icon name="activity" size={14}/><span>Certifications</span></div>
              <div style={{padding:'8px 14px',display:'flex',flexWrap:'wrap',gap:4}}>
                {certSel.map(c=><span key={c} className="badge pink" style={{fontSize:10}}>{c}</span>)}
              </div>
            </div>
          )}

          <div className="preview-card" style={{marginBottom:12}}>
            <div className="card-h"><Icon name="calendar" size={14}/><span>Shift</span></div>
            <div style={{padding:'8px 14px',fontSize:12}}>
              <div className="day-pips" style={{marginBottom:6}}>
                {DAYS.map(d=><span key={d} className={`day-pip${daysSel.includes(d)?' active':''}`}>{d}</span>)}
              </div>
              <div style={{color:'var(--fg-secondary)'}}>{startTime} – {endTime} · {shiftType}</div>
            </div>
          </div>

          {(mobile||email) && (
            <div className="preview-card">
              <div className="card-h"><Icon name="user" size={14}/><span>Contact</span></div>
              <div style={{padding:'8px 14px',fontSize:12,display:'flex',flexDirection:'column',gap:4}}>
                {mobile&&<div>{mobile}</div>}
                {email&&<div style={{color:'var(--fg-secondary)'}}>{email}</div>}
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
          <button className="btn btn-secondary" onClick={()=>setRoute('nurses')}>Cancel</button>
          <button className="btn btn-primary" disabled={isCreate&&errors.length>0}>
            {isCreate?'Create nurse':'Update nurse'}
          </button>
        </div>
      </div>
    </div>
  )
}
