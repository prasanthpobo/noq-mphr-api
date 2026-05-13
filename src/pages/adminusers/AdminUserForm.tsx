import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Icon from '@/components/ui/Icon'
import Badge, { UserStatusBadge } from '@/components/ui/Badge'
import { useAppStore } from '@/store/app'
import { adminusersService } from '@/services/adminusers.service'
import { toast } from '@/store/toast'

type FormData = {
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  scope: string
  clinic: string
  joined: string
  status: string
  username: string
  password: string
  ipList: string
}

interface Props { id?: string; onClose?: () => void }

const ROLES   = ['Super admin','Clinic admin','Billing admin','Operations','Compliance','Reports analyst','Support admin','Read-only']
const MODULES = ['Bookings','Tokens','Patients','Doctors','Clinics','Billing','Reports','Pharmacy','Master data','Settings','Users','Audit']

const AUDIT_ROWS = [
  { action: 'Updated patient P-1042 record',         when: 'Today · 10:22', kind: 'edit' },
  { action: 'Created appointment APT-892',            when: 'Today · 09:41', kind: 'create' },
  { action: 'Logged in from 192.168.1.10',           when: 'Today · 09:40', kind: 'login' },
  { action: 'Exported billing report Q1-2025',        when: 'Yesterday · 16:05', kind: 'export' },
  { action: 'Changed status of Clinic C-005',        when: 'Yesterday · 14:22', kind: 'edit' },
]

const ROLE_VARIANTS: Record<string,string> = {
  'Super admin':'danger','Clinic admin':'blue','Billing admin':'amber',
  Operations:'mint','Compliance':'indigo','Reports analyst':'plum',
  'Support admin':'brand','Read-only':'gray'
}

function seg(opts:string[], val:string, set:(v:string)=>void) {
  return <div className="seg-ctrl">{opts.map(o=><button key={o} type="button" className={val===o?'active':''} onClick={()=>set(o)}>{o}</button>)}</div>
}

function chipSet(opts:string[], sel:string[], toggle:(v:string)=>void) {
  return <div className="chip-lib">{opts.map(o=><button key={o} type="button" className={`tag${sel.includes(o)?' selected':''}`} onClick={()=>toggle(o)}>{o}</button>)}</div>
}

export default function AdminUserForm({ id, onClose }: Props) {
  const { setRoute } = useAppStore()
  const isEdit = Boolean(id)

  const [tab, setTab] = useState(0)
  const [status, setStatus] = useState('active')
  const [twoFA, setTwoFA] = useState(false)
  const [modSel, setModSel] = useState<string[]>([])
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: { role: 'Clinic admin', status: 'active' }
  })

  const firstName = watch('firstName') || ''
  const lastName  = watch('lastName')  || ''
  const email = watch('email') || ''
  const phone = watch('phone') || ''
  const role = watch('role') || 'Clinic admin'
  const scope = watch('scope') || ''
  const name = `${firstName} ${lastName}`.trim() || 'New User'
  const av   = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()

  useEffect(() => {
    if (isEdit && id) {
      adminusersService.get(id)
        .then(data => {
          reset(data)
          if (data.status)  setStatus(data.status)
          if (data.twoFA !== undefined) setTwoFA(data.twoFA)
          if (data.modSel)  setModSel(data.modSel)
        })
        .catch(() => { setServerError('Failed to load user data'); toast.error('Failed to load record') })
    }
  }, [id])

  const toggleMod = (v:string) => setModSel(s=>s.includes(v)?s.filter(x=>x!==v):[...s,v])

  const onSubmit = async (data: FormData) => {
    try {
      setServerError(null)
      const payload = { ...data, status, twoFA, modSel }
      // password only required on create
      if (!isEdit && !data.password) {
        setServerError('Password is required when creating a user')
        return
      }
      if (isEdit) {
        await adminusersService.update(id!, payload)
        toast.success('Updated successfully')
      } else {
        await adminusersService.create(payload)
        toast.success('Created successfully')
      }
      if (onClose) onClose()
      else setRoute('admin-users')
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Save failed')
      toast.error(err.response?.data?.message || 'Save failed')
    }
  }

  const TABS = ['Profile','Access','Activity']

  return (
    <form className="df-shell" onSubmit={handleSubmit(onSubmit)}>
      <div className="df-tabs" style={{borderBottom:'1px solid var(--border)',padding:'0 20px',display:'flex',alignItems:'center',gap:12,minHeight:52}}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setRoute('admin-users')}>
          <Icon name="chevL" size={14}/> Back
        </button>
        <div style={{fontWeight:700,fontSize:15}}>
          {!isEdit?'Create user':`Editing ${name}`}
        </div>
        {isEdit && <Badge variant={(ROLE_VARIANTS[role]??'muted') as any}>{role}</Badge>}
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
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" placeholder="user@noq.health" {...register('email', { required: 'Email is required' })}/>
                {errors.email && <span className="form-error">{errors.email.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" placeholder="+91 XXXXX XXXXX" {...register('phone')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" {...register('role')}>
                  {ROLES.map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Scope / access level</label>
                <input className="form-input" placeholder="e.g. All clinics, North zone" {...register('scope')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Clinic (if clinic-specific)</label>
                <input className="form-input" placeholder="Clinic name or leave blank" {...register('clinic')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Joined date</label>
                <input className="form-input" type="date" {...register('joined')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                {seg(['active','on-leave','inactive'],status,setStatus)}
              </div>
            </div>
          )}

          {tab===1 && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div className="grid-2" style={{gap:16}}>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input className="form-input" placeholder="username" {...register('username')}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Password{!isEdit && ' *'}</label>
                  <input className="form-input" type="password" placeholder={isEdit ? 'Leave blank to keep current' : 'Set password'} {...register('password')}/>
                  {!isEdit && <div style={{fontSize:11,color:'var(--fg-muted)',marginTop:4}}>Required for new users</div>}
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
                <label className="form-label">Module permissions</label>
                {chipSet(MODULES,modSel,toggleMod)}
              </div>
              <div className="form-group">
                <label className="form-label">IP whitelist</label>
                <textarea className="form-textarea" rows={3} placeholder="One IP per line. Leave blank to allow all." {...register('ipList')}/>
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
        {serverError && (
          <div style={{fontSize:12,color:'var(--danger)',display:'flex',alignItems:'center',gap:6}}>
            <Icon name="alert" size={14}/> {serverError}
          </div>
        )}
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <button type="button" className="btn btn-secondary" onClick={()=>setRoute('admin-users')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Update user' : 'Create user'}
          </button>
        </div>
      </div>
    </form>
  )
}
