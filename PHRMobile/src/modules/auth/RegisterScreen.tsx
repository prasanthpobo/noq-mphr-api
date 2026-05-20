import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiArrowLeft, HiArrowRight, HiUser, HiPhone, HiCalendar, HiMail } from 'react-icons/hi'
import { useForm } from 'react-hook-form'
import { sendRegisterOtp } from '../../services/authService'
import { useAuthStore } from '../../store/authStore'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

type Gender = 'M' | 'F' | 'Other'

interface RegisterForm {
  name: string
  email: string
  phone: string
  dob: string
  gender: Gender
}

const GENDER_OPTIONS: { value: Gender; label: string; emoji: string }[] = [
  { value: 'M',     label: 'Male',   emoji: '👨' },
  { value: 'F',     label: 'Female', emoji: '👩' },
  { value: 'Other', label: 'Other',  emoji: '🧑' },
]

// Max DOB to be ≥ 18 years old today
function maxDobForAdult(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 18)
  return d.toISOString().split('T')[0]
}

export default function RegisterScreen() {
  const navigate      = useNavigate()
  const setLoginPhone = useAuthStore((s) => s.setLoginPhone)

  const [sending,  setSending]  = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>()

  const selectedGender = watch('gender')
  const phoneValue     = watch('phone', '')

  const onSubmit = async (data: RegisterForm) => {
    setApiError(null)
    setSending(true)
    const cleaned = data.phone.replace(/\D/g, '')
    try {
      const res = await sendRegisterOtp(cleaned)
      if (res.success) {
        // Store form data in route state; OTPScreen will pick it up
        navigate('/otp', {
          state: {
            _dev_otp:     res._dev_otp ?? null,
            registerData: {
              name:   data.name.trim(),
              email:  data.email.trim(),
              phone:  cleaned,
              dob:    data.dob,
              gender: data.gender,
            },
          },
        })
      } else {
        setApiError('Could not send OTP. Please try again.')
      }
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSending(false)
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
      <div style={{ position: 'absolute', top: 60, left: -50, width: 160, height: 160, borderRadius: '50%', background: 'rgba(31,163,168,0.18)', pointerEvents: 'none' }} />

      {/* ── Top section ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ padding: '16px 20px 28px', position: 'relative', zIndex: 2 }}
      >
        <button
          onClick={() => navigate('/login')}
          style={{
            width: 40, height: 40, borderRadius: 12, border: 'none',
            background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', marginBottom: 28,
          }}
        >
          <HiArrowLeft size={20} color="#FFFFFF" />
        </button>

        <div style={{
          width: 68, height: 68, borderRadius: 20,
          background: 'rgba(255,255,255,0.20)', border: '1.5px solid rgba(255,255,255,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        }}>
          <HiUser size={32} color="#FFFFFF" />
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px', letterSpacing: -0.5 }}>
          Create Account
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', margin: 0, fontWeight: 500 }}>
          You must be <span style={{ fontWeight: 700, color: '#FFFFFF' }}>18 years or older</span> to register
        </p>
      </motion.div>

      {/* ── White sheet ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          flex: 1, background: '#FFFFFF', borderRadius: '28px 28px 0 0',
          padding: '28px 24px 36px',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.14)',
          position: 'relative', zIndex: 2, overflowY: 'auto',
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E3EAF2', margin: '0 auto 24px' }} />

        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Full Name */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
              Full Name <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{
              display: 'flex', alignItems: 'center',
              border: `1.5px solid ${errors.name ? '#EF4444' : '#E3EAF2'}`,
              borderRadius: 14, background: '#F5F8FC', height: 54, overflow: 'hidden',
            }}>
              <div style={{ padding: '0 14px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                <HiUser size={18} color="#A0AEC0" />
              </div>
              <input
                type="text"
                placeholder="Enter your full name"
                autoCapitalize="words"
                style={{ flex: 1, height: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 15, fontWeight: 500, color: '#1A1A1A', fontFamily: 'inherit' }}
                {...register('name', {
                  required: 'Full name is required',
                  minLength: { value: 2, message: 'At least 2 characters' },
                })}
              />
            </div>
            {errors.name && <p style={{ fontSize: 12, color: '#EF4444', margin: '5px 0 0 2px' }}>{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
              Email ID <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{
              display: 'flex', alignItems: 'center',
              border: `1.5px solid ${errors.email ? '#EF4444' : '#E3EAF2'}`,
              borderRadius: 14, background: '#F5F8FC', height: 54, overflow: 'hidden',
            }}>
              <div style={{ padding: '0 14px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                <HiMail size={18} color="#A0AEC0" />
              </div>
              <input
                type="email"
                placeholder="Enter your email address"
                autoCapitalize="none"
                autoCorrect="off"
                inputMode="email"
                style={{ flex: 1, height: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 15, fontWeight: 500, color: '#1A1A1A', fontFamily: 'inherit' }}
                {...register('email', {
                  required: 'Email address is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
                })}
              />
            </div>
            {errors.email && <p style={{ fontSize: 12, color: '#EF4444', margin: '5px 0 0 2px' }}>{errors.email.message}</p>}
          </div>

          {/* Phone Number */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
              Mobile Number <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{
              display: 'flex', alignItems: 'center',
              border: `1.5px solid ${errors.phone ? '#EF4444' : '#E3EAF2'}`,
              borderRadius: 14, background: '#F5F8FC', height: 54, overflow: 'hidden',
            }}>
              <div style={{
                padding: '0 12px 0 14px', borderRight: '1.5px solid #E3EAF2',
                display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, height: '100%',
              }}>
                <span style={{ fontSize: 18 }}>🇮🇳</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#3D4A5B' }}>+91</span>
              </div>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="10-digit mobile number"
                style={{ flex: 1, height: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 15, fontWeight: 600, color: '#1A1A1A', fontFamily: 'inherit', padding: '0 14px', letterSpacing: 1 }}
                {...register('phone', {
                  required: 'Mobile number is required',
                  validate: (v) => v.replace(/\D/g, '').length === 10 || 'Enter a valid 10-digit number',
                  onChange: (e) => {
                    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10)
                    setValue('phone', e.target.value)
                  },
                })}
              />
              <span style={{ fontSize: 11, color: '#C8D4E0', paddingRight: 14, flexShrink: 0 }}>
                {(phoneValue ?? '').replace(/\D/g, '').length}/10
              </span>
            </div>
            {errors.phone && <p style={{ fontSize: 12, color: '#EF4444', margin: '5px 0 0 2px' }}>{errors.phone.message}</p>}
          </div>

          {/* Date of Birth */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
              Date of Birth <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{
              display: 'flex', alignItems: 'center',
              border: `1.5px solid ${errors.dob ? '#EF4444' : '#E3EAF2'}`,
              borderRadius: 14, background: '#F5F8FC', height: 54, overflow: 'hidden',
            }}>
              <div style={{ padding: '0 14px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                <HiCalendar size={18} color="#A0AEC0" />
              </div>
              <input
                type="date"
                max={maxDobForAdult()}
                style={{
                  flex: 1, height: '100%', background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 15, fontWeight: 500, color: '#1A1A1A', fontFamily: 'inherit',
                  colorScheme: 'light', padding: '0 14px 0 0',
                }}
                {...register('dob', {
                  required: 'Date of birth is required',
                  validate: (v) => {
                    const dob    = new Date(v)
                    const age18  = new Date()
                    age18.setFullYear(age18.getFullYear() - 18)
                    return dob <= age18 || 'You must be at least 18 years old to register'
                  },
                })}
              />
            </div>
            {errors.dob
              ? <p style={{ fontSize: 12, color: '#EF4444', margin: '5px 0 0 2px' }}>{errors.dob.message}</p>
              : <p style={{ fontSize: 11, color: '#A0AEC0', margin: '4px 0 0 2px' }}>Must be 18 years or older</p>
            }
          </div>

          {/* Gender */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
              Gender <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input type="hidden" {...register('gender', { required: 'Please select your gender' })} />
            <div style={{ display: 'flex', gap: 8 }}>
              {GENDER_OPTIONS.map((g) => {
                const active = selectedGender === g.value
                return (
                  <motion.button
                    key={g.value}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setValue('gender', g.value, { shouldValidate: true })}
                    style={{
                      flex: 1, height: 56, borderRadius: 14,
                      border: active ? '2px solid #2C6ED5' : '1.5px solid #E3EAF2',
                      background: active ? '#EBF2FF' : '#F5F8FC',
                      color: active ? '#1E4FA3' : '#6B7C93',
                      fontSize: 13, fontWeight: active ? 700 : 500,
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 2,
                      transition: 'all 0.15s',
                      boxShadow: active ? '0 4px 12px rgba(44,110,213,0.18)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{g.emoji}</span>
                    <span>{g.label}</span>
                  </motion.button>
                )
              })}
            </div>
            {errors.gender && <p style={{ fontSize: 12, color: '#EF4444', margin: '5px 0 0 2px' }}>{errors.gender.message}</p>}
          </div>

          {/* API error */}
          {apiError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              style={{
                background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10,
                padding: '10px 14px', fontSize: 13, color: '#B91C1C', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              ⚠️ {apiError}
            </motion.div>
          )}

          {/* Submit */}
          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            disabled={sending}
            style={{
              width: '100%', height: 54,
              background: sending ? 'rgba(44,110,213,0.65)' : BRAND_GRADIENT,
              color: '#FFFFFF', fontSize: 16, fontWeight: 700,
              border: 'none', borderRadius: 14,
              cursor: sending ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: sending ? 'none' : '0 8px 20px rgba(44,110,213,0.32)',
              fontFamily: 'inherit', marginTop: 4,
            }}
          >
            {sending ? (
              <motion.span
                animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                style={{ display: 'inline-block', width: 22, height: 22, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#FFFFFF', borderRadius: '50%' }}
              />
            ) : (
              <>
                <HiPhone size={18} />
                Get OTP & Create Account
                <HiArrowRight size={18} />
              </>
            )}
          </motion.button>

          {/* Sign in link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <div style={{ flex: 1, height: 1, background: '#E3EAF2' }} />
            <span style={{ fontSize: 12, color: '#A0AEC0', fontWeight: 500 }}>already have an account?</span>
            <div style={{ flex: 1, height: 1, background: '#E3EAF2' }} />
          </div>

          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              width: '100%', height: 50,
              background: '#FFFFFF', color: '#2C6ED5', fontSize: 15, fontWeight: 700,
              border: '1.5px solid #BFDBFE', borderRadius: 14,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Sign In
          </button>
        </form>

        <p style={{ fontSize: 11, color: '#A0AEC0', textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>
          By registering you agree to our{' '}
          <span style={{ color: '#2C6ED5', cursor: 'pointer' }}>Terms of Service</span> &amp;{' '}
          <span style={{ color: '#2C6ED5', cursor: 'pointer' }}>Privacy Policy</span>
        </p>
      </motion.div>
    </div>
  )
}
