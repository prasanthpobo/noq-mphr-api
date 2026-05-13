import { useState } from 'react'
import Icon from '@/components/ui/Icon'
import Badge, { UserStatusBadge } from '@/components/ui/Badge'
import { useAppStore } from '@/store/app'
import type { Clinic } from '@/types'

type Mode = 'create' | 'view' | 'edit'
interface Props { mode: Mode; existing?: Partial<Clinic> }

const TYPES      = ['Multi-specialty','Hospital','Specialty','Polyclinic','Diagnostic centre','Dental clinic']
const FACILITIES = ['OPD','IPD','ICU','ER','OT','Lab','Pharmacy','Radiology','Dental','Physiotherapy','Dialysis','Cafeteria']
const DAYS       = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const INSURERS   = ['Star Health','HDFC Ergo','Bajaj Allianz','ICICI Lombard','Niva Bupa','Apollo Munich','Aditya Birla']

function seg(opts:string[], val:string, set:(v:string)=>void, ro:boolean) {
  if (ro) return <span className="ro-val">{val||'—'}</span>
  return <div className="seg-ctrl">{opts.map(o=><button key={o} className={val===o?'active':''} onClick={()=>set(o)}>{o}</button>)}</div>
}

function chipSet(opts:string[], sel:string[], toggle:(v:string)=>void, ro:boolean) {
  if (ro) return (
    <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
      {sel.length?sel.map(s=><span key={s} className="badge brand" style={{fontSize:11}}>{s}</span>):<span className="ro-val">None</span>}
    </div>
  )
  return <div className="chip-lib">{opts.map(o=><button key={o} className={`tag${sel.includes(o)?' selected':''}`} onClick={()=>toggle(o)}>{o}</button>)}</div>
}

export default function ClinicForm({ mode, existing }: Props) {
  const { setRoute } = useAppStore()
  const ro = mode==='view'
  const isCreate = mode==='create'

  const [tab,      setTab]      = useState(0)
  const [name,     setName]     = useState(isCreate?'':'Sunshine Clinic')
  const [type,     setType]     = useState(isCreate?'Multi-specialty':'Multi-specialty')
  const [estYear,  setEstYear]  = useState(isCreate?'':'2014')
  const [status,   setStatus]   = useState('active')
  const [regNum,   setRegNum]   = useState(isCreate?'':'KA-MC-2014-001')
  const [gstin,    setGstin]    = useState(isCreate?'':'29AABCS1429B1Z1')
  // hours
  const [all24,    setAll24]    = useState(false)
  const [daysSel,  setDaysSel]  = useState<string[]>(['Mon','Tue','Wed','Thu','Fri','Sat'])
  const [openTime, setOpenTime] = useState('09:00')
  const [closeTime,setCloseTime]= useState('20:00')
  const [lunchStart,setLunchStart]=useState('13:00')
  const [lunchEnd, setLunchEnd] = useState('14:00')
  const [facilSel, setFacilSel] = useState<string[]>(['OPD','Lab','Pharmacy'])
  // contact
  const [phone,    setPhone]    = useState(isCreate?'':'+91 80 4567 1100')
  const [altPhone, setAltPhone] = useState('')
  const [email,    setEmail]    = useState(isCreate?'':'hello@sunshine.health')
  const [website,  setWebsite]  = useState('')
  const [street,   setStreet]   = useState(isCreate?'':'Koramangala 6th Block')
  const [area,     setArea]     = useState(isCreate?'':'Koramangala')
  const [city,     setCity]     = useState(isCreate?'':'Bengaluru')
  const [state,    setState]    = useState(isCreate?'':'Karnataka')
  const [pin,      setPin]      = useState(isCreate?'':'560095')
  const [mapLink,  setMapLink]  = useState('')
  // about
  const [desc,     setDesc]     = useState(isCreate?'':'A modern multi-specialty clinic serving Koramangala since 2014.')
  const [insurSel, setInsurSel] = useState<string[]>([])
  const [policies, setPolicies] = useState('')
  const [notes,    setNotes]    = useState('')

  const toggleDay  = (v:string) => !ro && setDaysSel(s=>s.includes(v)?s.filter(x=>x!==v):[...s,v])
  const toggleFacil= (v:string) => setFacilSel(s=>s.includes(v)?s.filter(x=>x!==v):[...s,v])
  const toggleInsur= (v:string) => setInsurSel(s=>s.includes(v)?s.filter(x=>x!==v):[...s,v])

  const errors: string[] = []
  if (!name.trim())  errors.push('Clinic name')
  if (!phone.trim()) errors.push('Phone')

  const initials = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || '??'
  const TABS = ['Profile','Hours','Contact','About']

  return (
    <div className="df-shell">
      <div className="df-tabs" style={{borderBottom:'1px solid var(--border)',padding:'0 20px',display:'flex',alignItems:'center',gap:12,minHeight:52}}>
        <button className="btn btn-ghost btn-sm" onClick={()=>setRoute('clinics')}>
          <Icon name="chevL" size={14}/> Back
        </button>
        <div style={{fontWeight:700,fontSize:15}}>
          {isCreate?'Create clinic':mode==='edit'?`Editing ${name}`:name}
        </div>
        {!isCreate && <UserStatusBadge status={status}/>}
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          {mode==='view'&&<button className="btn btn-primary btn-sm" onClick={()=>setRoute('clinic-edit')}><Icon name="edit" size={13}/>Edit</button>}
        </div>
      </div>

      <div className="df-tabs">
        {TABS.map((t,i)=><button key={t} className={`df-tab${tab===i?' active':''}`} onClick={()=>setTab(i)}>{t}</button>)}
      </div>

      <div className="df-body">
        <div className="df-panel">
          {tab===0 && (
            <div className="grid-2" style={{gap:16}}>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Clinic name *</label>
                {ro?<span className="ro-val">{name}</span>:<input className="form-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Clinic name"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                {ro?<span className="ro-val">{type}</span>:(
                  <select className="form-select" value={type} onChange={e=>setType(e.target.value)}>
                    {TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Established year</label>
                {ro?<span className="ro-val">{estYear||'—'}</span>:<input className="form-input" value={estYear} onChange={e=>setEstYear(e.target.value)} placeholder="e.g. 2014"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                {seg(['active','pending','inactive'],status,setStatus,ro)}
              </div>
              <div className="form-group">
                <label className="form-label">Registration #</label>
                {ro?<span className="ro-val">{regNum||'—'}</span>:<input className="form-input" value={regNum} onChange={e=>setRegNum(e.target.value)} placeholder="Registration number"/>}
              </div>
              <div className="form-group">
                <label className="form-label">GSTIN</label>
                {ro?<span className="ro-val">{gstin||'—'}</span>:<input className="form-input" value={gstin} onChange={e=>setGstin(e.target.value)} placeholder="GST number"/>}
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Logo</label>
                <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',border:'1px dashed var(--border)',borderRadius:8}}>
                  <div className="av xl blue" style={{fontSize:16,fontWeight:800}}>{initials}</div>
                  <div>{ro?<span className="ro-val">Logo on file</span>:<><button className="btn btn-secondary btn-sm"><Icon name="plus" size={12}/>Upload logo</button><div style={{fontSize:11,color:'var(--fg-muted)',marginTop:4}}>PNG or SVG, 1:1 ratio recommended</div></>}</div>
                </div>
              </div>
            </div>
          )}

          {tab===1 && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div className="form-group">
                <label className="form-label">24×7 operation</label>
                {ro?<span className="ro-val">{all24?'Yes':'No'}</span>:(
                  <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                    <input type="checkbox" checked={all24} onChange={e=>setAll24(e.target.checked)} style={{width:16,height:16}}/>
                    <span style={{fontSize:13}}>Open 24 hours, 7 days</span>
                  </label>
                )}
              </div>
              {!all24 && (
                <>
                  <div className="form-group">
                    <label className="form-label">Open days</label>
                    <div className="day-pips">
                      {DAYS.map(d=>(
                        <button key={d} className={`day-pip${daysSel.includes(d)?' active':''}`}
                          onClick={()=>toggleDay(d)} style={{cursor:ro?'default':'pointer'}}>{d}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid-2" style={{gap:16}}>
                    <div className="form-group">
                      <label className="form-label">Opening time</label>
                      {ro?<span className="ro-val">{openTime}</span>:<input className="form-input" type="time" value={openTime} onChange={e=>setOpenTime(e.target.value)}/>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Closing time</label>
                      {ro?<span className="ro-val">{closeTime}</span>:<input className="form-input" type="time" value={closeTime} onChange={e=>setCloseTime(e.target.value)}/>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Lunch break start</label>
                      {ro?<span className="ro-val">{lunchStart}</span>:<input className="form-input" type="time" value={lunchStart} onChange={e=>setLunchStart(e.target.value)}/>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Lunch break end</label>
                      {ro?<span className="ro-val">{lunchEnd}</span>:<input className="form-input" type="time" value={lunchEnd} onChange={e=>setLunchEnd(e.target.value)}/>}
                    </div>
                  </div>
                </>
              )}
              <div className="form-group">
                <label className="form-label">Facilities</label>
                {chipSet(FACILITIES,facilSel,toggleFacil,ro)}
              </div>
            </div>
          )}

          {tab===2 && (
            <div className="grid-2" style={{gap:16}}>
              <div className="form-group">
                <label className="form-label">Primary phone *</label>
                {ro?<span className="ro-val">{phone}</span>:<input className="form-input" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 80 XXXX XXXX"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Alt phone</label>
                {ro?<span className="ro-val">{altPhone||'—'}</span>:<input className="form-input" value={altPhone} onChange={e=>setAltPhone(e.target.value)} placeholder="Alternate number"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                {ro?<span className="ro-val">{email||'—'}</span>:<input className="form-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="clinic@email.com"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Website</label>
                {ro?<span className="ro-val">{website||'—'}</span>:<input className="form-input" value={website} onChange={e=>setWebsite(e.target.value)} placeholder="https://"/>}
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Street</label>
                {ro?<span className="ro-val">{street||'—'}</span>:<input className="form-input" value={street} onChange={e=>setStreet(e.target.value)} placeholder="Street / building"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Area</label>
                {ro?<span className="ro-val">{area||'—'}</span>:<input className="form-input" value={area} onChange={e=>setArea(e.target.value)} placeholder="Area / locality"/>}
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
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Google Maps link</label>
                {ro?<span className="ro-val">{mapLink||'—'}</span>:<input className="form-input" value={mapLink} onChange={e=>setMapLink(e.target.value)} placeholder="https://maps.google.com/…"/>}
              </div>
            </div>
          )}

          {tab===3 && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div className="form-group">
                <label className="form-label">Description <span style={{color:'var(--fg-muted)',fontWeight:400}}>({desc.length}/600)</span></label>
                {ro?<span className="ro-val">{desc||'—'}</span>:<textarea className="form-textarea" value={desc} maxLength={600} onChange={e=>setDesc(e.target.value)} rows={4} placeholder="Clinic overview…"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Insurance partners</label>
                {chipSet(INSURERS,insurSel,toggleInsur,ro)}
              </div>
              <div className="form-group">
                <label className="form-label">Policies</label>
                {ro?<span className="ro-val">{policies||'—'}</span>:<textarea className="form-textarea" value={policies} onChange={e=>setPolicies(e.target.value)} rows={3} placeholder="Cancellation, refund policies…"/>}
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
            <div style={{height:52,background:'linear-gradient(135deg,var(--tone-blue-bg) 0%,var(--tone-indigo-bg) 100%)',borderRadius:'8px 8px 0 0'}}/>
            <div style={{padding:'0 14px 14px',marginTop:-22}}>
              <div className="av xl blue" style={{border:'3px solid var(--bg-card)',fontSize:14,fontWeight:800}}>{initials}</div>
              <div style={{marginTop:8,fontWeight:700,fontSize:15}}>{name||'Clinic name'}</div>
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
        <div style={{fontSize:12,color:errors.length>0?'var(--danger)':'var(--success)',display:'flex',alignItems:'center',gap:6}}>
          <Icon name={errors.length>0?'alert':'check'} size={14}/>
          {errors.length>0?`${errors.length} field${errors.length>1?'s':''} need attention`:'All required fields filled'}
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <button className="btn btn-secondary" onClick={()=>setRoute('clinics')}>Cancel</button>
          {isCreate&&<button className="btn btn-secondary" disabled={errors.length>0}>Save &amp; add another</button>}
          <button className="btn btn-primary" disabled={isCreate&&errors.length>0}>
            {isCreate?'Create clinic':'Update clinic'}
          </button>
        </div>
      </div>
    </div>
  )
}
