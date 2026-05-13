import { useState } from 'react'
import Icon from '@/components/ui/Icon'
import Badge, { UserStatusBadge } from '@/components/ui/Badge'
import { useAppStore } from '@/store/app'
import { CLINICS } from '@/data'
import type { AdminUser } from '@/types'

type Mode = 'create' | 'view' | 'edit'
interface Props { mode: Mode; existing?: Partial<AdminUser> }

const ROLES   = ['Super admin','Clinic admin','Billing admin','Operations','Compliance','Reports analyst','Support admin','Read-only']
const MODULES = ['Bookings','Tokens','Patients','Doctors','Clinics','Billing','Reports','Pharmacy','Master data','Settings','Users','Audit']

const AUDIT_ROWS = [
  { action: 'Updated patient P-1042 record',         when: 'Today · 10:22', kind: 'edit' },
  { action: 'Created appointment APT-892',            when: 'Today · 09:41', kind: 'create' },
  { action: 'Logged in from 192.168.1.10',           when: 'Today · 09:40', kind: 'login' },
  { action: 'Exported billing report Q1-2025',        when: 'Yesterday · 16:05', kind: 'export' },
  { action: 'Changed status of Clinic C-005',        when: 'Yesterday · 14:22', kind: 'edit' },
]

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

export default function AdminUserForm({ mode, existing }: Props) {
  const { setRoute } = useAppStore()
  const ro = mode==='view'
  const isCreate = mode==='create'

  const [tab,      setTab]      = useState(0)
  const [firstName,setFirstName]= useState(isCreate?'':'Aarav')
  const [lastName, setLastName] = useState(isCreate?'':'Khanna')
  const [email,    setEmail]    = useState(isCreate?'':'aarav.k@noq.health')
  const [phone,    setPhone]    = useState(isCreate?'':'+91 98765 30001')
  const [role,     setRole]     = useState(isCreate?'Clinic admin':'Super admin')
  const [scope,    setScope]    = useState(isCreate?'':'All clinics')
  const [clinic,   setClinic]   = useState('')
  const [joined,   setJoined]   = useState(isCreate?'':'2019-02-04')
  const [status,   setStatus]   = useState('active')
  // access
  const [username, setUsername] = useState(isCreate?'':'aarav.khanna')
  const [password, setPassword] = useState('')
  const [twoFA,    setTwoFA]    = useState(isCreate?false:true)
  const [modSel,   setModSel]   = useState<string[]>(isCreate?[]:MODULES.slice(0,8))
  const [ipList,   setIpList]   = useState('')

  const toggleMod = (v:string) => setModSel(s=>s.includes(v)?s.filter(x=>x!==v):[...s,v])

  const errors: string[] = []
  if (!firstName.trim()) errors.push('First name')
  if (!lastName.trim())  errors.push('Last name')
  if (!email.trim())     errors.push('Email')

  const name = `${firstName} ${lastName}`.trim() || 'New User'
  const av   = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
  const TABS = ['Profile','Access','Activity']

  const ROLE_VARIANTS: Record<string,string> = {
    'Super admin':'danger','Clinic admin':'blue','Billing admin':'amber',
    Operations:'mint','Compliance':'indigo','Reports analyst':'plum',
    'Support admin':'brand','Read-only':'gray'
  }

  return (
    <div className="df-shell">
      <div className="df-tabs" style={{borderBottom:'1px solid var(--border)',padding:'0 20px',display:'flex',alignItems:'center',gap:12,minHeight:52}}>
        <button className="btn btn-ghost btn-sm" onClick={()=>setRoute('admin-users')}>
          <Icon name="chevL" size={14}/> Back
        </button>
        <div style={{fontWeight:700,fontSize:15}}>
          {isCreate?'Create user':mode==='edit'?`Editing ${name}`:name}
        </div>
        {!isCreate && <Badge variant={(ROLE_VARIANTS[role]??'muted') as any}>{role}</Badge>}
        {!isCreate && <UserStatusBadge status={status}/>}
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          {mode==='view'&&<button className="btn btn-primary btn-sm" onClick={()=>setRoute('admin-edit')}><Icon name="edit" size={13}/>Edit</button>}
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
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Email *</label>
                {ro?<span className="ro-val">{email}</span>:<input className="form-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="user@noq.health"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                {ro?<span className="ro-val">{phone||'—'}</span>:<input className="form-input" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX"/>}
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
                <label className="form-label">Scope / access level</label>
                {ro?<span className="ro-val">{scope||'—'}</span>:<input className="form-input" value={scope} onChange={e=>setScope(e.target.value)} placeholder="e.g. All clinics, North zone"/>}
              </div>
              <div className="form-group">
                <label className="form-label">Clinic (if clinic-specific)</label>
                {ro?<span className="ro-val">{clinic||'—'}</span>:(
                  <select className="form-select" value={clinic} onChange={e=>setClinic(e.target.value)}>
                    <option value="">— All / N/A —</option>
                    {CLINICS.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Joined date</label>
                {ro?<span className="ro-val">{joined||'—'}</span>:<input className="form-input" type="date" value={joined} onChange={e=>setJoined(e.target.value)}/>}
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                {seg(['active','on-leave','inactive'],status,setStatus,ro)}
              </div>
            </div>
          )}

          {tab===1 && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div className="grid-2" style={{gap:16}}>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  {ro?<span className="ro-val">{username||'—'}</span>:<input className="form-input" value={username} onChange={e=>setUsername(e.target.value)} placeholder="username"/>}
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  {ro?<span className="ro-val">••••••••</span>:<input className="form-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Set password"/>}
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
                <label className="form-label">Module permissions</label>
                {chipSet(MODULES,modSel,toggleMod,ro)}
              </div>
              <div className="form-group">
                <label className="form-label">IP whitelist</label>
                {ro?<span className="ro-val">{ipList||'All IPs allowed'}</span>:(
                  <textarea className="form-textarea" value={ipList} onChange={e=>setIpList(e.target.value)} rows={3} placeholder="One IP per line. Leave blank to allow all."/>
                )}
              </div>
            </div>
          )}

          {tab===2 && (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div className="preview-card">
                <div className="card-h"><Icon name="user" size={14}/><span>Last login info</span></div>
                <div style={{padding:'10px 14px',fontSize:12,display:'flex',flexDirection:'column',gap:6}}>
                  <div style={{display:'flex',gap:16}}>
                    <div><div style={{color:'var(--fg-muted)',marginBottom:2}}>Last seen</div><div style={{fontWeight:600}}>Today · 09:42</div></div>
                    <div><div style={{color:'var(--fg-muted)',marginBottom:2}}>IP address</div><div style={{fontWeight:600,fontFamily:'var(--font-mono)'}}>192.168.1.10</div></div>
                    <div><div style={{color:'var(--fg-muted)',marginBottom:2}}>Device</div><div style={{fontWeight:600}}>Chrome · macOS</div></div>
                  </div>
                </div>
              </div>
              <div style={{fontWeight:600,fontSize:13,marginTop:4}}>Recent activity</div>
              {AUDIT_ROWS.map((row,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'var(--bg-section)',borderRadius:8}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:row.kind==='login'?'var(--success)':row.kind==='edit'?'var(--warning)':row.kind==='create'?'var(--info)':'var(--fg-muted)',flexShrink:0}}/>
                  <div style={{flex:1,fontSize:13}}>{row.action}</div>
                  <div style={{fontSize:11,color:'var(--fg-muted)',whiteSpace:'nowrap'}}>{row.when}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="df-preview">
          <div className="preview-card" style={{marginBottom:12}}>
            <div style={{height:48,background:'linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%)',borderRadius:'8px 8px 0 0'}}/>
            <div style={{padding:'0 14px 14px',marginTop:-20}}>
              <div className="av xl blue" style={{border:'3px solid var(--bg-card)'}}>{av}</div>
              <div style={{marginTop:8,fontWeight:700,fontSize:15}}>{name}</div>
              <div style={{fontSize:12,color:'var(--fg-secondary)'}}>{role}</div>
              {scope&&<div style={{fontSize:11,color:'var(--fg-muted)'}}>{scope}</div>}
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginTop:10}}>
                {[{l:'Modules',v:String(modSel.length)},{l:'2FA',v:twoFA?'On':'Off'},{l:'Scope',v:scope?scope.split(' ')[0]:'—'}].map(k=>(
                  <div key={k.l} style={{background:'var(--bg-section)',borderRadius:6,padding:'6px 8px',textAlign:'center'}}>
                    <div style={{fontSize:12,fontWeight:800}}>{k.v}</div>
                    <div style={{fontSize:10,color:'var(--fg-secondary)'}}>{k.l}</div>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:10}}>
                <Badge variant={(ROLE_VARIANTS[role]??'muted') as any}>{role}</Badge>
                <UserStatusBadge status={status}/>
                {twoFA&&<Badge variant="success">2FA</Badge>}
              </div>
            </div>
          </div>

          {modSel.length>0 && (
            <div className="preview-card" style={{marginBottom:12}}>
              <div className="card-h"><Icon name="shield" size={14}/><span>Permissions</span></div>
              <div style={{padding:'8px 14px',display:'flex',flexWrap:'wrap',gap:4}}>
                {modSel.map(m=><span key={m} className="badge brand" style={{fontSize:10}}>{m}</span>)}
              </div>
            </div>
          )}

          {(email||phone) && (
            <div className="preview-card">
              <div className="card-h"><Icon name="user" size={14}/><span>Contact</span></div>
              <div style={{padding:'8px 14px',fontSize:12,display:'flex',flexDirection:'column',gap:4}}>
                {email&&<div style={{color:'var(--fg-secondary)'}}>{email}</div>}
                {phone&&<div>{phone}</div>}
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
          <button className="btn btn-secondary" onClick={()=>setRoute('admin-users')}>Cancel</button>
          <button className="btn btn-primary" disabled={isCreate&&errors.length>0}>
            {isCreate?'Create user':'Update user'}
          </button>
        </div>
      </div>
    </div>
  )
}
