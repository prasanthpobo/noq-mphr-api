import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { forgotPassword } from '../../services/authService'
import { useAuthStore } from '../../store/authStore'

interface ForgotForm {
  identifier: string
}

export default function ForgotPasswordScreen() {
  const navigate = useNavigate()
  const setResetIdentifier = useAuthStore((s) => s.setResetIdentifier)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [maskedContact, setMaskedContact] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>()

  const onSubmit = async (data: ForgotForm) => {
    setApiError(null)
    setIsLoading(true)
    try {
      const res = await forgotPassword(data.identifier.trim())
      if (res.success) {
        setResetIdentifier(data.identifier.trim())
        setMaskedContact(res.maskedContact ?? null)
        setSent(true)
        setTimeout(() => navigate('/otp'), 1400)
      } else {
        setApiError(res.message || 'Could not send OTP. Please try again.')
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
      <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }}/>
      <div style={{ position: 'absolute', top: 40, left: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }}/>

      {/* Back button */}
      <div style={{ padding: '52px 20px 0', position: 'relative', zIndex: 1 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 12,
            width: 40, height: 40, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
      </div>

      {/* Brand area */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px 24px 32px', position: 'relative', zIndex: 1,
      }}>
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          style={{
            width: 80, height: 80, borderRadius: 24,
            background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 12px 32px rgba(0,0,0,0.22)', marginBottom: 16,
          }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="14" stroke="url(#fp1)" strokeWidth="2.5" fill="none"/>
            <path d="M20 13v6l4 3" stroke="url(#fp1)" strokeWidth="2" strokeLinecap="round"/>
            <defs>
              <linearGradient id="fp1" x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1E4FA3"/><stop offset="1" stopColor="#1FA3A8"/>
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45 }}
          style={{ textAlign: 'center' }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: -0.5 }}>Forgot Password?</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: 500, margin: '8px 0 0' }}>
            Enter your email or phone to receive an OTP
          </p>
        </motion.div>
      </div>

      {/* Bottom sheet */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: '#fff', borderRadius: '28px 28px 0 0',
          padding: '24px 24px 40px',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.14)',
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 4, background: '#E3EAF2', margin: '0 auto 22px' }}/>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', padding: '16px 0 8px' }}
          >
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1E4FA3, #1FA3A8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', margin: '0 0 6px' }}>OTP Sent!</h2>
            <p style={{ fontSize: 13, color: '#6B7C93', margin: 0, lineHeight: 1.5 }}>
              Check {maskedContact ?? 'your contact'} for the verification code
            </p>
          </motion.div>
        ) : (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', margin: '0 0 4px', letterSpacing: -0.3 }}>
              Reset Password
            </h2>
            <p style={{ fontSize: 13, color: '#6B7C93', margin: '0 0 20px', fontWeight: 500 }}>
              We'll send a 6-digit OTP to verify your identity
            </p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  border: errors.identifier ? '1.5px solid #EF4444' : '1.5px solid #E3EAF2',
                  borderRadius: 14, background: '#F5F8FC', height: 52, overflow: 'hidden',
                }}>
                  <div style={{ padding: '0 14px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Email or phone number"
                    autoCapitalize="none"
                    style={{
                      flex: 1, height: '100%', background: 'transparent', border: 'none',
                      outline: 'none', fontSize: 15, fontWeight: 500, color: '#1A1A1A', fontFamily: 'inherit',
                    }}
                    {...register('identifier', { required: 'Email or phone is required' })}
                  />
                </div>
                {errors.identifier && (
                  <p style={{ fontSize: 12, color: '#EF4444', margin: '5px 0 0 2px' }}>{errors.identifier.message}</p>
                )}
              </div>

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

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%', height: 52,
                  background: isLoading ? 'rgba(44,110,213,0.65)' : 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)',
                  color: '#fff', fontSize: 16, fontWeight: 700,
                  border: 'none', borderRadius: 14,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: isLoading ? 'none' : '0 8px 20px rgba(44,110,213,0.32)',
                  fontFamily: 'inherit', marginTop: 4,
                }}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="8" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5"/>
                      <path d="M10 2a8 8 0 018 8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                    Sending OTP…
                  </>
                ) : (
                  <>
                    Send OTP
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M3.75 9h10.5M9.75 4.5 14.25 9l-4.5 4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  style={{ background: 'none', border: 'none', color: '#2C6ED5', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  )
}
