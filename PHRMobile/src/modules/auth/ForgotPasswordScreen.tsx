import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiArrowLeft, HiPhone, HiArrowRight, HiShieldCheck } from 'react-icons/hi'
import { forgotPassword } from '../../services/authService'
import { useAuthStore } from '../../store/authStore'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

export default function ForgotPasswordScreen() {
  const navigate           = useNavigate()
  const setResetIdentifier = useAuthStore((s) => s.setResetIdentifier)

  const [phone,      setPhone]      = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [sending,    setSending]    = useState(false)
  const [apiError,   setApiError]   = useState<string | null>(null)
  const [sent,       setSent]       = useState(false)

  const handleSend = async () => {
    setApiError(null)
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length < 10) { setPhoneError('Enter a valid 10-digit mobile number'); return }
    setPhoneError('')
    setSending(true)
    try {
      const res = await forgotPassword(cleaned)
      if (res.success) {
        setResetIdentifier(cleaned)
        setSent(true)
        setTimeout(() => {
          navigate('/otp', { state: { _dev_otp: res._dev_otp ?? null } })
        }, 1200)
      } else {
        setApiError(res.message || 'Could not send OTP. Please try again.')
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
          onClick={() => navigate(-1)}
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
          <HiShieldCheck size={32} color="#FFFFFF" />
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px', letterSpacing: -0.5 }}>
          Forgot Password?
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', margin: 0, fontWeight: 500 }}>
          We'll send a 6-digit OTP to your registered WhatsApp number
        </p>
      </motion.div>

      {/* ── White sheet ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          flex: 1, background: '#FFFFFF', borderRadius: '28px 28px 0 0',
          padding: '28px 24px 40px',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.14)',
          position: 'relative', zIndex: 2,
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E3EAF2', margin: '0 auto 28px' }} />

        {sent ? (
          /* ── Sent confirmation ── */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', padding: '20px 0' }}
          >
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
              style={{
                width: 72, height: 72, borderRadius: '50%',
                background: BRAND_GRADIENT,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 8px 24px rgba(44,110,213,0.35)',
              }}
            >
              <HiShieldCheck size={34} color="#FFFFFF" />
            </motion.div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', margin: '0 0 8px' }}>OTP Sent!</h2>
            <p style={{ fontSize: 14, color: '#6B7C93', margin: '0 0 6px', lineHeight: 1.5 }}>
              Check WhatsApp on
            </p>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#1E4FA3', margin: 0, letterSpacing: 1 }}>
              +91 {phone.replace(/\D/g, '').replace(/(\d{2})\d+(\d{2})$/, '$1 *** $2')}
            </p>
            <p style={{ fontSize: 12, color: '#A0AEC0', marginTop: 12 }}>Redirecting to OTP screen…</p>
          </motion.div>
        ) : (
          /* ── Input form ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#3D4A5B', margin: '0 0 14px' }}>
                Enter your registered mobile number to receive a reset OTP via WhatsApp.
              </p>

              {/* Phone input */}
              <div style={{
                display: 'flex', alignItems: 'center',
                border: `1.5px solid ${phoneError ? '#EF4444' : '#E3EAF2'}`,
                borderRadius: 14, background: '#F5F8FC', height: 56, overflow: 'hidden',
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
                  placeholder="Enter mobile number"
                  value={phone}
                  autoFocus
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 10)
                    setPhone(v)
                    setPhoneError('')
                    setApiError(null)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  style={{
                    flex: 1, height: '100%', background: 'transparent', border: 'none',
                    outline: 'none', fontSize: 16, fontWeight: 600, color: '#1A1A1A',
                    fontFamily: 'inherit', padding: '0 14px', letterSpacing: 1,
                  }}
                />
                <span style={{ fontSize: 11, color: '#C8D4E0', paddingRight: 14, flexShrink: 0 }}>
                  {phone.length}/10
                </span>
              </div>
              {phoneError && <p style={{ fontSize: 12, color: '#EF4444', margin: '5px 0 0 2px' }}>{phoneError}</p>}
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

            {/* Send button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSend}
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
                <motion.span
                  animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                  style={{ display: 'inline-block', width: 22, height: 22, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#FFFFFF', borderRadius: '50%' }}
                />
              ) : (
                <>
                  <HiPhone size={18} />
                  Send OTP via WhatsApp
                  <HiArrowRight size={18} />
                </>
              )}
            </motion.button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, color: '#A0AEC0', fontWeight: 600, fontFamily: 'inherit',
                padding: '6px 0',
              }}
            >
              Back to Sign In
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
