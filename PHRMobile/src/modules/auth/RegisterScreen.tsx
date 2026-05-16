import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { patientRegister } from '../../services/authService'
import { useAuthStore } from '../../store/authStore'

type Gender = 'M' | 'F' | 'Other'

interface RegisterForm {
  name: string
  email: string
  phone: string
  gender: Gender
  dob: string
  password: string
  confirm: string
}

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'M',     label: 'Male' },
  { value: 'F',     label: 'Female' },
  { value: 'Other', label: 'Other' },
]

export default function RegisterScreen() {
  const navigate = useNavigate()
  const setToken = useAuthStore((s) => s.setToken)
  const setUser  = useAuthStore((s) => s.setUser)

  const [isLoading, setIsLoading] = useState(false)
  const [apiError,  setApiError]  = useState<string | null>(null)
  const [showPass,  setShowPass]  = useState(false)
  const [showConf,  setShowConf]  = useState(false)
  const [step, setStep]           = useState<1 | 2>(1)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<RegisterForm>()

  const selectedGender = watch('gender')
  const passwordValue  = watch('password', '')

  const goToStep2 = async () => {
    const valid = await trigger(['name', 'email', 'phone', 'gender'])
    if (valid) setStep(2)
  }

  const onSubmit = async (data: RegisterForm) => {
    setApiError(null)
    setIsLoading(true)
    try {
      const res = await patientRegister({
        name:     data.name.trim(),
        email:    data.email.trim(),
        phone:    data.phone.trim(),
        gender:   data.gender,
        dob:      data.dob || undefined,
        password: data.password,
      })
      if (res.success) {
        setToken(res.token)
        setUser(res.user)
        navigate('/app/dashboard', { replace: true })
      } else {
        setApiError('Registration failed. Please try again.')
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
      <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }}/>
      <div style={{ position: 'absolute', top: 40, left: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }}/>

      {/* ── Brand area ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 24px 28px', position: 'relative', zIndex: 1,
      }}>
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          style={{
            width: 88, height: 88, borderRadius: 26, background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 12px 32px rgba(0,0,0,0.22)', marginBottom: 18,
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

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45 }}
          style={{ textAlign: 'center', marginBottom: 20 }}
        >
          <h1 style={{ fontSize: 38, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: -1, lineHeight: 1 }}>NoQ</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.78)', fontWeight: 500, margin: '8px 0 0' }}>
            Your health, one tap away
          </p>
        </motion.div>

        {/* Step dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {[1, 2].map((s) => (
            <div key={s} style={{
              width: s === step ? 28 : 10, height: 6, borderRadius: 4,
              background: s <= step ? '#fff' : 'rgba(255,255,255,0.35)',
              transition: 'width 0.3s ease, background 0.3s ease',
            }}/>
          ))}
        </motion.div>
      </div>

      {/* ── Bottom white sheet ── */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: '#fff', borderRadius: '28px 28px 0 0',
          padding: '24px 24px 36px',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.14)',
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 4, background: '#E3EAF2', margin: '0 auto 22px' }}/>

        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', margin: '0 0 4px', letterSpacing: -0.3 }}>
          {step === 1 ? 'Create Account' : 'Set Password'}
        </h2>
        <p style={{ fontSize: 13, color: '#6B7C93', margin: '0 0 20px', fontWeight: 500 }}>
          {step === 1 ? 'Step 1 of 2 — Your information' : 'Step 2 of 2 — Secure your account'}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* ── Step 1 ── */}
          {step === 1 && (
            <>
              {/* Full name */}
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  border: errors.name ? '1.5px solid #EF4444' : '1.5px solid #E3EAF2',
                  borderRadius: 14, background: '#F5F8FC', height: 52, overflow: 'hidden',
                }}>
                  <div style={{ padding: '0 14px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0114 0v1"/>
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Full name"
                    autoCapitalize="words"
                    style={{ flex: 1, height: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 15, fontWeight: 500, color: '#1A1A1A', fontFamily: 'inherit' }}
                    {...register('name', { required: 'Full name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
                  />
                </div>
                {errors.name && <p style={{ fontSize: 12, color: '#EF4444', margin: '5px 0 0 2px' }}>{errors.name.message}</p>}
              </div>

              {/* Email */}
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  border: errors.email ? '1.5px solid #EF4444' : '1.5px solid #E3EAF2',
                  borderRadius: 14, background: '#F5F8FC', height: 52, overflow: 'hidden',
                }}>
                  <div style={{ padding: '0 14px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
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

              {/* Phone */}
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  border: errors.phone ? '1.5px solid #EF4444' : '1.5px solid #E3EAF2',
                  borderRadius: 14, background: '#F5F8FC', height: 52, overflow: 'hidden',
                }}>
                  <div style={{ padding: '0 14px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 9.81 19.79 19.79 0 012 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                    </svg>
                  </div>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    style={{ flex: 1, height: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 15, fontWeight: 500, color: '#1A1A1A', fontFamily: 'inherit' }}
                    {...register('phone', { required: 'Phone number is required' })}
                  />
                </div>
                {errors.phone && <p style={{ fontSize: 12, color: '#EF4444', margin: '5px 0 0 2px' }}>{errors.phone.message}</p>}
              </div>

              {/* Gender pills */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#6B7C93', margin: '0 0 8px 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Gender <span style={{ color: '#EF4444' }}>*</span>
                </p>
                {/* Hidden input for validation */}
                <input type="hidden" {...register('gender', { required: 'Please select your gender' })} />
                <div style={{ display: 'flex', gap: 8 }}>
                  {GENDER_OPTIONS.map((g) => {
                    const active = selectedGender === g.value
                    return (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => { setValue('gender', g.value, { shouldValidate: true }) }}
                        style={{
                          flex: 1, height: 46, borderRadius: 12,
                          border: active ? '2px solid #2C6ED5' : '1.5px solid #E3EAF2',
                          background: active ? '#EBF2FF' : '#F5F8FC',
                          color: active ? '#1E4FA3' : '#6B7C93',
                          fontSize: 14, fontWeight: active ? 700 : 500,
                          cursor: 'pointer', fontFamily: 'inherit',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {g.label}
                      </button>
                    )
                  })}
                </div>
                {errors.gender && <p style={{ fontSize: 12, color: '#EF4444', margin: '5px 0 0 2px' }}>{errors.gender.message}</p>}
              </div>

              {/* Date of birth (optional) */}
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  border: '1.5px solid #E3EAF2',
                  borderRadius: 14, background: '#F5F8FC', height: 52, overflow: 'hidden',
                }}>
                  <div style={{ padding: '0 14px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                    </svg>
                  </div>
                  <input
                    type="date"
                    style={{
                      flex: 1, height: '100%', background: 'transparent', border: 'none', outline: 'none',
                      fontSize: 15, fontWeight: 500, color: '#1A1A1A', fontFamily: 'inherit',
                      colorScheme: 'light',
                    }}
                    {...register('dob')}
                  />
                </div>
                <p style={{ fontSize: 11, color: '#A0AEC0', margin: '4px 0 0 2px' }}>Date of birth (optional)</p>
              </div>

              <button
                type="button"
                onClick={goToStep2}
                style={{
                  width: '100%', height: 52,
                  background: 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)',
                  color: '#fff', fontSize: 16, fontWeight: 700,
                  border: 'none', borderRadius: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 8px 20px rgba(44,110,213,0.32)',
                  fontFamily: 'inherit', marginTop: 4,
                }}
              >
                Next
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3.75 9h10.5M9.75 4.5 14.25 9l-4.5 4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <>
              {/* Back */}
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none', color: '#6B7C93',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', padding: 0, marginBottom: 4,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back
              </button>

              {/* Password */}
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  border: errors.password ? '1.5px solid #EF4444' : '1.5px solid #E3EAF2',
                  borderRadius: 14, background: '#F5F8FC', height: 52, overflow: 'hidden',
                }}>
                  <div style={{ padding: '0 14px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Create password (min. 6 chars)"
                    style={{ flex: 1, height: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 15, fontWeight: 500, color: '#1A1A1A', fontFamily: 'inherit' }}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Minimum 6 characters' },
                    })}
                  />
                  <button type="button" onClick={() => setShowPass((p) => !p)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 14px', color: '#A0AEC0', display: 'flex', alignItems: 'center' }}>
                    {showPass
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                {errors.password && <p style={{ fontSize: 12, color: '#EF4444', margin: '5px 0 0 2px' }}>{errors.password.message}</p>}
              </div>

              {/* Confirm password */}
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  border: errors.confirm ? '1.5px solid #EF4444' : '1.5px solid #E3EAF2',
                  borderRadius: 14, background: '#F5F8FC', height: 52, overflow: 'hidden',
                }}>
                  <div style={{ padding: '0 14px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  </div>
                  <input
                    type={showConf ? 'text' : 'password'}
                    placeholder="Confirm password"
                    style={{ flex: 1, height: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 15, fontWeight: 500, color: '#1A1A1A', fontFamily: 'inherit' }}
                    {...register('confirm', {
                      required: 'Please confirm your password',
                      validate: (v) => v === passwordValue || 'Passwords do not match',
                    })}
                  />
                  <button type="button" onClick={() => setShowConf((p) => !p)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 14px', color: '#A0AEC0', display: 'flex', alignItems: 'center' }}>
                    {showConf
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                {errors.confirm && <p style={{ fontSize: 12, color: '#EF4444', margin: '5px 0 0 2px' }}>{errors.confirm.message}</p>}
              </div>

              {/* API error */}
              {apiError && (
                <div style={{
                  background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 10,
                  padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                  </svg>
                  <span style={{ fontSize: 13, color: '#B91C1C', fontWeight: 500 }}>{apiError}</span>
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={isLoading} style={{
                width: '100%', height: 52,
                background: isLoading ? 'rgba(44,110,213,0.65)' : 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)',
                color: '#fff', fontSize: 16, fontWeight: 700,
                border: 'none', borderRadius: 14,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: isLoading ? 'none' : '0 8px 20px rgba(44,110,213,0.32)',
                fontFamily: 'inherit', marginTop: 4,
              }}>
                {isLoading ? (
                  <>
                    <svg className="animate-spin" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="8" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5"/>
                      <path d="M10 2a8 8 0 018 8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                    Creating account…
                  </>
                ) : (
                  <>
                    Create Account
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M3.75 9h10.5M9.75 4.5 14.25 9l-4.5 4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </button>
            </>
          )}

          {/* Sign in link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 0' }}>
            <div style={{ flex: 1, height: 1, background: '#E3EAF2' }}/>
            <span style={{ fontSize: 12, color: '#A0AEC0', fontWeight: 500 }}>already have an account?</span>
            <div style={{ flex: 1, height: 1, background: '#E3EAF2' }}/>
          </div>

          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              width: '100%', height: 50,
              background: '#fff', color: '#2C6ED5', fontSize: 15, fontWeight: 700,
              border: '1.5px solid #2C6ED5', borderRadius: 14,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Sign In
          </button>
        </form>

        <p style={{ fontSize: 11.5, color: '#A0AEC0', textAlign: 'center', marginTop: 18, lineHeight: 1.5 }}>
          By continuing you agree to our{' '}
          <span style={{ color: '#2C6ED5', cursor: 'pointer' }}>Terms</span> &amp;{' '}
          <span style={{ color: '#2C6ED5', cursor: 'pointer' }}>Privacy</span>
        </p>
      </motion.div>
    </div>
  )
}
