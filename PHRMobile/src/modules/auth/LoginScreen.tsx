import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { login } from '../../services/authService'
import { useAuthStore } from '../../store/authStore'

interface LoginForm {
  email: string
  password: string
}

export default function LoginScreen() {
  const navigate = useNavigate()
  const setToken = useAuthStore((s) => s.setToken)
  const setUser  = useAuthStore((s) => s.setUser)
  const [isLoading, setIsLoading]   = useState(false)
  const [apiError,  setApiError]    = useState<string | null>(null)
  const [showPass,  setShowPass]    = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setApiError(null)
    setIsLoading(true)
    try {
      const res = await login(data.email, data.password)
      if (res.success) {
        setToken(res.token)
        setUser(res.user)
        navigate('/app/dashboard', { replace: true })
      } else {
        setApiError('Login failed. Please check your credentials.')
      }
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100%', flex: 1, width: '100%',
      display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(160deg, #102E63 0%, #1E4FA3 40%, #2C6ED5 75%, #1FA3A8 100%)',
      position: 'relative', overflow: 'hidden',
      fontFamily: 'Roboto, system-ui, sans-serif',
    }}>
      {/* Decorative blobs */}
      <div style={{ position:'absolute', top:-60, right:-60, width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }}/>
      <div style={{ position:'absolute', top:40, left:-40, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>

      {/* ── Brand area ── */}
      <div style={{
        flex: 1, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        padding:'48px 24px 32px', position:'relative', zIndex:1,
      }}>
        {/* App icon */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type:'spring', stiffness:220, damping:18 }}
          style={{
            width:88, height:88, borderRadius:26,
            background:'#fff',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 12px 32px rgba(0,0,0,0.22)', marginBottom:18,
          }}
        >
          <svg width="54" height="54" viewBox="0 0 54 54" fill="none">
            <circle cx="27" cy="27" r="22" stroke="url(#lg1)" strokeWidth="3.5" fill="none"/>
            <circle cx="27" cy="27" r="12" fill="url(#lg2)"/>
            <path d="M23 31l8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="27" cy="27" r="4" fill="white"/>
            <path d="M33 33l4 4" stroke="url(#lg1)" strokeWidth="3" strokeLinecap="round"/>
            <defs>
              <linearGradient id="lg1" x1="5" y1="5" x2="49" y2="49" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1E4FA3"/><stop offset="1" stopColor="#1FA3A8"/>
              </linearGradient>
              <linearGradient id="lg2" x1="15" y1="15" x2="39" y2="39" gradientUnits="userSpaceOnUse">
                <stop stopColor="#2C6ED5"/><stop offset="1" stopColor="#1FA3A8"/>
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Name + tagline */}
        <motion.div
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.2, duration:0.45 }}
          style={{ textAlign:'center', marginBottom:28 }}
        >
          <h1 style={{ fontSize:38, fontWeight:800, color:'#fff', margin:0, letterSpacing:-1, lineHeight:1 }}>NoQ</h1>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.78)', fontWeight:500, margin:'8px 0 0' }}>
            Smart OPD booking &amp; health records
          </p>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.35, duration:0.45 }}
          style={{ display:'flex', gap:12, width:'100%', maxWidth:320 }}
        >
          {[
            { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>, title:'Skip the queue', sub:'Book tokens instantly' },
            { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.6a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.07a5.5 5.5 0 10-7.78 7.78l8.84 8.84 8.84-8.84a5.5 5.5 0 000-7.78z"/></svg>, title:'Secure PHR', sub:'Your health, private' },
          ].map((f) => (
            <div key={f.title} style={{
              flex:1, background:'rgba(255,255,255,0.12)',
              border:'1px solid rgba(255,255,255,0.18)',
              borderRadius:16, padding:'14px 12px', backdropFilter:'blur(8px)',
            }}>
              {f.icon}
              <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginTop:8, lineHeight:1.2 }}>{f.title}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', marginTop:3 }}>{f.sub}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Bottom white sheet ── */}
      <motion.div
        initial={{ y:60, opacity:0 }}
        animate={{ y:0, opacity:1 }}
        transition={{ delay:0.15, duration:0.5, ease:[0.16,1,0.3,1] }}
        style={{
          background:'#fff', borderRadius:'28px 28px 0 0',
          padding:'24px 24px 36px',
          boxShadow:'0 -8px 32px rgba(0,0,0,0.14)',
        }}
      >
        {/* Handle */}
        <div style={{ width:40, height:4, borderRadius:4, background:'#E3EAF2', margin:'0 auto 22px' }}/>

        <h2 style={{ fontSize:22, fontWeight:800, color:'#1A1A1A', margin:'0 0 4px', letterSpacing:-0.3 }}>
          Welcome back 👋
        </h2>
        <p style={{ fontSize:13, color:'#6B7C93', margin:'0 0 20px', fontWeight:500 }}>
          Sign in to your NoQ account
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Email field */}
          <div>
            <div style={{
              display:'flex', alignItems:'center',
              border: errors.email ? '1.5px solid #EF4444' : '1.5px solid #E3EAF2',
              borderRadius:14, background:'#F5F8FC', height:52, overflow:'hidden',
            }}>
              <div style={{ padding:'0 14px', flexShrink:0, display:'flex', alignItems:'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <input
                type="email"
                placeholder="Email address"
                autoCapitalize="none"
                style={{
                  flex:1, height:'100%', background:'transparent', border:'none',
                  outline:'none', fontSize:15, fontWeight:500, color:'#1A1A1A', fontFamily:'inherit',
                }}
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value:/^\S+@\S+\.\S+$/, message:'Enter a valid email' },
                })}
              />
            </div>
            {errors.email && <p style={{ fontSize:12, color:'#EF4444', margin:'5px 0 0 2px' }}>{errors.email.message}</p>}
          </div>

          {/* Password field */}
          <div>
            <div style={{
              display:'flex', alignItems:'center',
              border: errors.password ? '1.5px solid #EF4444' : '1.5px solid #E3EAF2',
              borderRadius:14, background:'#F5F8FC', height:52, overflow:'hidden',
            }}>
              <div style={{ padding:'0 14px', flexShrink:0, display:'flex', alignItems:'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                style={{
                  flex:1, height:'100%', background:'transparent', border:'none',
                  outline:'none', fontSize:15, fontWeight:500, color:'#1A1A1A', fontFamily:'inherit',
                }}
                {...register('password', { required: 'Password is required' })}
              />
              <button type="button" onClick={() => setShowPass(p => !p)}
                style={{ background:'none', border:'none', cursor:'pointer', padding:'0 14px', color:'#A0AEC0', display:'flex', alignItems:'center' }}>
                {showPass
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            {errors.password && <p style={{ fontSize:12, color:'#EF4444', margin:'5px 0 0 2px' }}>{errors.password.message}</p>}
          </div>

          {/* Forgot password link */}
          <div style={{ textAlign:'right', marginTop:-4 }}>
            <button type="button" onClick={() => navigate('/forgot-password')}
              style={{ background:'none', border:'none', color:'#2C6ED5', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              Forgot password?
            </button>
          </div>

          {/* API error */}
          {apiError && (
            <div style={{
              background:'#FEE2E2', border:'1px solid #FCA5A5', borderRadius:10,
              padding:'10px 14px', display:'flex', alignItems:'center', gap:8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              <span style={{ fontSize:13, color:'#B91C1C', fontWeight:500 }}>{apiError}</span>
            </div>
          )}

          {/* Sign in button */}
          <button type="submit" disabled={isLoading} style={{
            width:'100%', height:52,
            background: isLoading ? 'rgba(44,110,213,0.65)' : 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)',
            color:'#fff', fontSize:16, fontWeight:700,
            border:'none', borderRadius:14,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            boxShadow: isLoading ? 'none' : '0 8px 20px rgba(44,110,213,0.32)',
            fontFamily:'inherit', marginTop:4,
          }}>
            {isLoading
              ? <><svg className="animate-spin" width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5"/><path d="M10 2a8 8 0 018 8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>Signing in…</>
              : <>Sign In <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3.75 9h10.5M9.75 4.5 14.25 9l-4.5 4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></>
            }
          </button>

          {/* Divider */}
          <div style={{ display:'flex', alignItems:'center', gap:12, margin:'4px 0' }}>
            <div style={{ flex:1, height:1, background:'#E3EAF2' }}/>
            <span style={{ fontSize:12, color:'#A0AEC0', fontWeight:500 }}>or</span>
            <div style={{ flex:1, height:1, background:'#E3EAF2' }}/>
          </div>

          {/* Create account */}
          <button type="button" onClick={() => navigate('/register')}
            style={{
              width:'100%', height:50,
              background:'#fff', color:'#2C6ED5', fontSize:15, fontWeight:700,
              border:'1.5px solid #2C6ED5', borderRadius:14,
              cursor:'pointer', fontFamily:'inherit',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0114 0v1"/><path d="M19 8v6M22 11h-6"/>
            </svg>
            Create Patient Account
          </button>

          {/* Continue as guest */}
          <button type="button" onClick={() => navigate('/app/dashboard')}
            style={{
              width:'100%', height:44,
              background:'transparent', color:'#A0AEC0', fontSize:13, fontWeight:600,
              border:'none', borderRadius:14,
              cursor:'pointer', fontFamily:'inherit',
            }}>
            Continue as guest
          </button>
        </form>

        <p style={{ fontSize:11.5, color:'#A0AEC0', textAlign:'center', marginTop:18, lineHeight:1.5 }}>
          By continuing you agree to our{' '}
          <span style={{ color:'#2C6ED5', cursor:'pointer' }}>Terms</span> &amp;{' '}
          <span style={{ color:'#2C6ED5', cursor:'pointer' }}>Privacy</span>
        </p>
      </motion.div>
    </div>
  )
}
