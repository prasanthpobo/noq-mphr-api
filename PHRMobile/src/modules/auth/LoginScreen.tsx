import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiPhone, HiMail, HiLockClosed, HiEye, HiEyeOff, HiArrowRight } from 'react-icons/hi'
import { MdShield } from 'react-icons/md'
import { login, sendLoginOtp } from '../../services/authService'
import { useAuthStore } from '../../store/authStore'
import { useForm } from 'react-hook-form'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

interface EmailForm { email: string; password: string }

export default function LoginScreen() {
  const navigate       = useNavigate()
  const setToken       = useAuthStore((s) => s.setToken)
  const setUser        = useAuthStore((s) => s.setUser)
  const setLoginPhone  = useAuthStore((s) => s.setLoginPhone)

  const [mode, setMode]         = useState<'phone' | 'email'>('phone')
  const [phone, setPhone]       = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [sending, setSending]   = useState(false)
  const [apiError, setApiError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<EmailForm>()

  /* ── Phone OTP flow ─────────────────────────────────────────────────────── */
  const handleSendOtp = async () => {
    setApiError('')
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length < 10) { setPhoneError('Enter a valid 10-digit mobile number'); return }
    setPhoneError('')
    setSending(true)
    try {
      const res = await sendLoginOtp(cleaned)
      if (res.success) {
        setLoginPhone(cleaned)
        navigate('/otp', { state: { _dev_otp: res._dev_otp ?? null } })
      } else {
        setApiError('Could not send OTP. Please try again.')
      }
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSending(false)
    }
  }

  /* ── Email / password flow ──────────────────────────────────────────────── */
  const onEmailSubmit = async (data: EmailForm) => {
    setApiError('')
    setEmailLoading(true)
    try {
      const res = await login(data.email, data.password)
      if (res.success) {
        setToken(res.token)
        setUser(res.user)
        navigate('/app/dashboard', { replace: true })
      } else {
        setApiError('Invalid credentials. Please try again.')
      }
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setEmailLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100%', flex: 1, width: '100%',
      display: 'flex', flexDirection: 'column',
      background: BRAND_GRADIENT,
      fontFamily: 'Roboto, system-ui, sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 60, left: -50, width: 160, height: 160, borderRadius: '50%', background: 'rgba(31,163,168,0.20)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 200, right: -40, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

      {/* ── Brand area ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px 24px', position: 'relative', zIndex: 1 }}
      >
        {/* App icon */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          style={{
            width: 84, height: 84, borderRadius: 24,
            background: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 12px 32px rgba(0,0,0,0.20)', marginBottom: 16,
          }}
        >
          <MdShield size={44} color="#1E4FA3" />
        </motion.div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 20, padding: '5px 12px', marginBottom: 12,
        }}>
          <span style={{ fontSize: 12 }}>💙</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#FFFFFF', letterSpacing: '1.2px' }}>PATIENT PORTAL</span>
        </div>

        <h1 style={{ fontSize: 30, fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: -0.5, lineHeight: 1.15, textAlign: 'center' }}>
          Your health,<br/>one tap away
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500, margin: '10px 0 0', textAlign: 'center' }}>
          Book OPD, skip the queue, keep your records safe
        </p>

        {/* Patient stat pills */}
        <div style={{ display: 'flex', gap: 8, marginTop: 18, width: '100%', maxWidth: 360 }}>
          <StatPill value="150+" label="DOCTORS" />
          <StatPill value="12" label="CLINICS" />
          <StatPill value="~5m" label="AVG WAIT" />
        </div>
      </motion.div>

      {/* ── Bottom white sheet ───────────────────────────────────────────── */}
      <motion.div
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: '#FFFFFF', borderRadius: '28px 28px 0 0',
          padding: '20px 24px 36px',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.14)',
          position: 'relative', zIndex: 2,
        }}
      >
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E3EAF2', margin: '0 auto 20px' }} />

        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', margin: '0 0 4px' }}>
          {mode === 'phone' ? 'Login with OTP 📱' : 'Sign in to NoQ'}
        </h2>
        <p style={{ fontSize: 13, color: '#6B7C93', margin: '0 0 20px', fontWeight: 500 }}>
          {mode === 'phone'
            ? 'Enter your registered mobile number'
            : 'Use your email and password'}
        </p>

        {/* ── Mode tabs ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', background: '#F5F8FC', borderRadius: 12, padding: 4, marginBottom: 20 }}>
          {(['phone', 'email'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setApiError(''); setPhoneError('') }}
              style={{
                flex: 1, height: 38, borderRadius: 9, border: 'none', cursor: 'pointer',
                background: mode === m ? '#FFFFFF' : 'transparent',
                color: mode === m ? '#1E4FA3' : '#6B7C93',
                fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                boxShadow: mode === m ? '0 2px 8px rgba(30,79,163,0.12)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.15s',
              }}
            >
              {m === 'phone' ? <HiPhone size={15} /> : <HiMail size={15} />}
              {m === 'phone' ? 'Mobile OTP' : 'Email Login'}
            </button>
          ))}
        </div>

        {/* ── Phone OTP form ────────────────────────────────────────────── */}
        {mode === 'phone' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Phone input */}
            <div>
              <div style={{
                display: 'flex', alignItems: 'center',
                border: `1.5px solid ${phoneError ? '#EF4444' : '#E3EAF2'}`,
                borderRadius: 14, background: '#F5F8FC', height: 56, overflow: 'hidden',
              }}>
                {/* Country code */}
                <div style={{
                  padding: '0 12px 0 14px', borderRight: '1.5px solid #E3EAF2',
                  display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, height: '100%',
                }}>
                  <span style={{ fontSize: 18, lineHeight: 1 }}>🇮🇳</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#3D4A5B' }}>+91</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Enter mobile number"
                  value={phone}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 10)
                    setPhone(v)
                    setPhoneError('')
                    setApiError('')
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                  style={{
                    flex: 1, height: '100%', background: 'transparent', border: 'none',
                    outline: 'none', fontSize: 16, fontWeight: 600, color: '#1A1A1A',
                    fontFamily: 'inherit', padding: '0 14px', letterSpacing: 1,
                  }}
                />
                {/* Character count */}
                <span style={{ fontSize: 11, color: '#C8D4E0', paddingRight: 14, flexShrink: 0 }}>
                  {phone.length}/10
                </span>
              </div>
              {phoneError && <p style={{ fontSize: 12, color: '#EF4444', margin: '5px 0 0 2px' }}>{phoneError}</p>}
            </div>

            {/* API error */}
            {apiError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#B91C1C', fontWeight: 500 }}>
                ⚠️ {apiError}
              </div>
            )}

            {/* Send OTP button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSendOtp}
              disabled={sending || phone.length < 10}
              style={{
                width: '100%', height: 54,
                background: phone.length < 10 ? '#C8D9F5' : BRAND_GRADIENT,
                color: '#FFFFFF', fontSize: 16, fontWeight: 700,
                border: 'none', borderRadius: 14,
                cursor: phone.length < 10 || sending ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: phone.length >= 10 && !sending ? '0 8px 20px rgba(44,110,213,0.32)' : 'none',
                fontFamily: 'inherit',
              }}
            >
              {sending ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                    style={{ display: 'inline-block', width: 20, height: 20, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#FFFFFF', borderRadius: '50%' }}
                  />
                  Sending OTP…
                </>
              ) : (
                <>
                  <HiPhone size={18} />
                  Get OTP
                  <HiArrowRight size={18} />
                </>
              )}
            </motion.button>

            <p style={{ fontSize: 12, color: '#A0AEC0', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
              OTP will be sent to your registered mobile number
            </p>
          </div>
        )}

        {/* ── Email / password form ──────────────────────────────────────── */}
        {mode === 'email' && (
          <form onSubmit={handleSubmit(onEmailSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Email */}
            <div>
              <div style={{
                display: 'flex', alignItems: 'center',
                border: `1.5px solid ${errors.email ? '#EF4444' : '#E3EAF2'}`,
                borderRadius: 14, background: '#F5F8FC', height: 52, overflow: 'hidden',
              }}>
                <div style={{ padding: '0 14px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  <HiMail size={18} color="#A0AEC0" />
                </div>
                <input
                  type="email"
                  placeholder="Email address"
                  autoCapitalize="none"
                  style={{ flex: 1, height: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 15, fontWeight: 500, color: '#1A1A1A', fontFamily: 'inherit' }}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                  })}
                />
              </div>
              {errors.email && <p style={{ fontSize: 12, color: '#EF4444', margin: '5px 0 0 2px' }}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div style={{
                display: 'flex', alignItems: 'center',
                border: `1.5px solid ${errors.password ? '#EF4444' : '#E3EAF2'}`,
                borderRadius: 14, background: '#F5F8FC', height: 52, overflow: 'hidden',
              }}>
                <div style={{ padding: '0 14px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  <HiLockClosed size={18} color="#A0AEC0" />
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Password"
                  style={{ flex: 1, height: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 15, fontWeight: 500, color: '#1A1A1A', fontFamily: 'inherit' }}
                  {...register('password', { required: 'Password is required' })}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 14px', color: '#A0AEC0', display: 'flex', alignItems: 'center' }}>
                  {showPass ? <HiEyeOff size={18} /> : <HiEye size={18} />}
                </button>
              </div>
              {errors.password && <p style={{ fontSize: 12, color: '#EF4444', margin: '5px 0 0 2px' }}>{errors.password.message}</p>}
            </div>

            <div style={{ textAlign: 'right', marginTop: -4 }}>
              <button type="button" onClick={() => navigate('/forgot-password')}
                style={{ background: 'none', border: 'none', color: '#2C6ED5', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Forgot password?
              </button>
            </div>

            {apiError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#B91C1C', fontWeight: 500 }}>
                ⚠️ {apiError}
              </div>
            )}

            <button type="submit" disabled={emailLoading} style={{
              width: '100%', height: 52,
              background: emailLoading ? 'rgba(44,110,213,0.65)' : BRAND_GRADIENT,
              color: '#FFFFFF', fontSize: 15, fontWeight: 700,
              border: 'none', borderRadius: 14,
              cursor: emailLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: emailLoading ? 'none' : '0 8px 20px rgba(44,110,213,0.32)',
              fontFamily: 'inherit',
            }}>
              {emailLoading ? (
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                  style={{ display: 'inline-block', width: 20, height: 20, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#FFFFFF', borderRadius: '50%' }} />
              ) : <>Sign In <HiArrowRight size={17} /></>}
            </button>
          </form>
        )}

        {/* ── Divider + register ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 14px' }}>
          <div style={{ flex: 1, height: 1, background: '#E3EAF2' }} />
          <span style={{ fontSize: 12, color: '#A0AEC0', fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#E3EAF2' }} />
        </div>

        <button type="button" onClick={() => navigate('/register')} style={{
          width: '100%', height: 50,
          background: '#FFFFFF', color: '#2C6ED5', fontSize: 14, fontWeight: 700,
          border: '1.5px solid #BFDBFE', borderRadius: 14,
          cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          Create Patient Account
        </button>

        <p style={{ fontSize: 11, color: '#A0AEC0', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
          By continuing you agree to our{' '}
          <span onClick={() => navigate('/app/settings/terms')} style={{ color: '#2C6ED5', cursor: 'pointer' }}>Terms</span>{' '}&amp;{' '}
          <span onClick={() => navigate('/app/settings/privacy')} style={{ color: '#2C6ED5', cursor: 'pointer' }}>Privacy Policy</span>
        </p>
      </motion.div>
    </div>
  )
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div style={{
      flex: 1, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)',
      borderRadius: 14, padding: '10px 8px', textAlign: 'center',
    }}>
      <p style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.6px', margin: '6px 0 0' }}>{label}</p>
    </div>
  )
}
