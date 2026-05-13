import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Icon from '@/components/ui/Icon'
import Badge, { UserStatusBadge } from '@/components/ui/Badge'
import { useAppStore } from '@/store/app'
import { nursesService } from '@/services/nurses.service'

type FormData = {
  firstName: string
  lastName: string
  gender: string
  dob: string
  bg: string
  exp: string
  empId: string
  regNum: string
  joined: string
  role: string
  clinic: string
  status: string
  ward: string
  startTime: string
  endTime: string
  breakStart: string
  breakEnd: string
  mobile: string
  altPhone: string
  email: string
  address: string
  emgName: string
  emgRel: string
  emgPhone: string
  username: string
  password: string
  notes: string
}

interface Props { id?: string; onClose?: () => void }

const ROLES   = ['Trainee','Staff nurse','Senior nurse','Charge nurse','Head nurse','Nurse manager']
const DEPTS   = ['ICU','ER','Surgery','Pediatrics','Maternity','Cardiology','OPD','General','Oncology','Admin']
const SHIFTS  = ['Morning','Afternoon','Evening','Night','Rotational']
const BG_OPTS = ['A+','A-','B+','B-','AB+','AB-','O+','O-']
const DAYS    = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const CERTS   = ['BLS','ACLS','PALS','NRP','IV Therapy','Wound Care','Critical Care','Phlebotomy','Triage','Infection Control']

function seg(opts:string[], val:string, set:(v:string)=>void) {
  return <div className="seg-ctrl">{opts.map(o=><button key={o} type="button" className={val===o?'active':''} onClick={()=>set(o)}>{o}</button>)}</div>
}

function chipSet(opts:string[], sel:string[], toggle:(v:string)=>void, variant='brand') {
  return <div className="chip-lib">{opts.map(o=><button key={o} type="button" className={`tag${sel.includes(o)?' selected':''}`} onClick={()=>toggle(o)}>{o}</button>)}</div>
}

export default function NurseForm({ id, onClose }: Props) {
  const { setRoute } = useAppStore()
  const isEdit = Boolean(id)

  const [tab, setTab] = useState(0)
  const [gender, setGender] = useState('F')
  const [status, setStatus] = useState('active')
  const [shiftType, setShiftType] = useState('Morning')
  const [deptSel, setDeptSel] = useState<string[]>([])
  const [daysSel, setDaysSel] = useState<string[]>(['Mon','Tue','Wed','Thu','Fri'])
  const [certSel, setCertSel] = useState<string[]>([])
  const [rotational, setRotational] = useState(false)
  const [onCall, setOnCall] = useState(false)
  const [twoFA, setTwoFA] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      bg: 'O+',
      role: 'Staff nurse',
      startTime: '07:00',
      endTime: '15:00',
      breakStart: '12:00',
      breakEnd: '13:00',
    }
  })

  const firstName = watch('firstName') || ''
  const lastName  = watch('lastName')  || ''
  const exp = watch('exp') || ''
  const ward = watch('ward') || ''
  const mobile = watch('mobile') || ''
  const email = watch('email') || ''
  const clinic = watch('clinic') || ''
  const startTime = watch('startTime') || '07:00'
  const endTime = watch('endTime') || '15:00'
  const name = `${firstName} ${lastName}`.trim() || 'New Nurse'
  const av   = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()

  useEffect(() => {
    if (isEdit && id) {
      nursesService.get(id)
        .then(data => {
          reset(data)
          if (data.gender)    setGender(data.gender)
          if (data.status)    setStatus(data.status)
          if (data.shiftType) setShiftType(data.shiftType)
          if (data.deptSel)   setDeptSel(data.deptSel)
          if (data.daysSel)   setDaysSel(data.daysSel)
          if (data.certSel)   setCertSel(data.certSel)
        })
        .catch(() => setServerError('Failed to load nurse data'))
    }
  }, [id])

  const toggleDept = (v:string) => setDeptSel(s=>s.includes(v)?s.filter(x=>x!==v):[...s,v])
  const toggleDay  = (v:string) => setDaysSel(s=>s.includes(v)?s.filter(x=>x!==v):[...s,v])
  const toggleCert = (v:string) => setCertSel(s=>s.includes(v)?s.filter(x=>x!==v):[...s,v])

  const onSubmit = async (data: FormData) => {
    try {
      setServerError(null)
      const payload = { ...data, gender, status, shiftType, deptSel, daysSel, certSel, rotational, onCall, twoFA }
      if (isEdit) await nursesService.update(id!, payload)
      else await nursesService.create(payload)
      if (onClose) onClose()
      else setRoute('nurses')
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Save failed')
    }
  }

  const TABS = ['Profile','Shift & ward','Contact','Skills & access']

  return (
    <form className="df-shell" onSubmit={handleSubmit(onSubmit)}>
      <div className="df-tabs" style={{borderBottom:'1px solid var(--border)',padding:'0 20px',display:'flex',alignItems:'center',gap:12,minHeight:52}}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setRoute('nurses')}>
          <Icon name="chevL" size={14}/> Back
        </button>
        <div style={{fontWeight:700,fontSize:15}}>
          {!isEdit?'Create nurse':`Editing ${name}`}
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
                <label className="form-label">Date of birth</label>
                <input className="form-input" type="date" {...register('dob')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Blood group</label>
                <select className="form-select" {...register('bg')}>
                  {BG_OPTS.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Experience (yrs)</label>
                <input className="form-input" type="number" placeholder="Years of experience" {...register('exp')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Employee ID</label>
                <input className="form-input" placeholder="NR-XXX" {...register('empId')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Nursing council reg #</label>
                <input className="form-input" placeholder="Registration number" {...register('regNum')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Joined date</label>
                <input className="form-input" type="date" {...register('joined')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" {...register('role')}>
                  {ROLES.map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Clinic</label>
                <input className="form-input" placeholder="Clinic name" {...register('clinic')}/>
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Department(s)</label>
                {chipSet(DEPTS,deptSel,toggleDept)}
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                {seg(['active','on-leave','inactive'],status,setStatus)}
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Photo</label>
                <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',border:'1px dashed var(--border)',borderRadius:8}}>
                  <div className="av xl pink">{av}</div>
                  <div>
                    <button type="button" className="btn btn-secondary btn-sm"><Icon name="plus" size={12}/>Upload photo</button>
                    <div style={{fontSize:11,color:'var(--fg-muted)',marginTop:4}}>JPG or PNG, up to 2 MB</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab===1 && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div className="form-group">
                <label className="form-label">Shift type</label>
                {seg(SHIFTS,shiftType,setShiftType)}
              </div>
              <div className="grid-2" style={{gap:16}}>
                <div className="form-group">
                  <label className="form-label">Rotational</label>
                  <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                    <input type="checkbox" checked={rotational} onChange={e=>setRotational(e.target.checked)} style={{width:16,height:16}}/>
                    <span style={{fontSize:13}}>Rotational shift</span>
                  </label>
                </div>
                <div className="form-group">
                  <label className="form-label">On-call</label>
                  <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                    <input type="checkbox" checked={onCall} onChange={e=>setOnCall(e.target.checked)} style={{width:16,height:16}}/>
                    <span style={{fontSize:13}}>On-call eligible</span>
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Working days</label>
                <div className="day-pips">
                  {DAYS.map(d=><button key={d} type="button" className={`day-pip${daysSel.includes(d)?' active':''}`} onClick={()=>toggleDay(d)}>{d}</button>)}
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
                  <label className="form-label">Ward / room</label>
                  <input className="form-input" placeholder="Ward or room ID" {...register('ward')}/>
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
                <label className="form-label">Mobile *</label>
                <input className="form-input" placeholder="+91 XXXXX XXXXX" {...register('mobile', { required: 'Mobile is required' })}/>
                {errors.mobile && <span className="form-error">{errors.mobile.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Alt phone</label>
                <input className="form-input" {...register('altPhone')}/>
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="nurse@noq.health" {...register('email')}/>
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Address</label>
                <textarea className="form-textarea" rows={3} placeholder="Full address" {...register('address')}/>
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
            </div>
          )}

          {tab===3 && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div className="grid-2" style={{gap:16}}>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input className="form-input" placeholder="username" {...register('username')}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Temp password</label>
                  <div>
                    <input className="form-input" type="password" placeholder="Temporary password" {...register('password')}/>
                    <div style={{fontSize:11,color:'var(--fg-muted)',marginTop:4}}>User resets on first login</div>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Two-factor authentication</label>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                  <input type="checkbox" checked={twoFA} onChange={e=>setTwoFA(e.target.checked)} style={{width:16,height:16}}/>
                  <span style={{fontSize:13}}>{twoFA?'Enabled':'Disabled'}</span>
                </label>
              </div>
              <div className="form-group">
                <label className="form-label">Certifications</label>
                {chipSet(CERTS,certSel,toggleCert,'pink')}
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
            <div style={{height:48,background:'linear-gradient(135deg,#ec4899 0%,#a855f7 100%)',borderRadius:'8px 8px 0 0'}}/>
            <div style={{padding:'0 14px 14px',marginTop:-20}}>
              <div className="av xl pink" style={{border:'3px solid var(--bg-card)'}}>{av}</div>
              <div style={{marginTop:8,fontWeight:700,fontSize:15}}>{name}</div>
              <div style={{fontSize:12,color:'var(--fg-secondary)'}}>{watch('role')||'Staff nurse'}</div>
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
        {serverError && (
          <div style={{fontSize:12,color:'var(--danger)',display:'flex',alignItems:'center',gap:6}}>
            <Icon name="alert" size={14}/> {serverError}
          </div>
        )}
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <button type="button" className="btn btn-secondary" onClick={()=>setRoute('nurses')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Update nurse' : 'Create nurse'}
          </button>
        </div>
      </div>
    </form>
  )
}
