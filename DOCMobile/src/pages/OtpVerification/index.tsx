import { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiArrowLeft, HiShieldCheck, HiPhone } from 'react-icons/hi'
import { MdPhoneAndroid } from 'react-icons/md'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'

const BRAND_GRADIENT = 'linear-gradient(135deg, #102E63 0%, #1E4FA3 55%, #1FA3A8 100%)'
const OTP_LENGTH = 6
const RESEND_COUNTDOWN = 60

export function OtpVerification() {
  const navigate  = useNavigate()
  const { state } = useLocation()
  const phone: string   = state?.phone ?? ''
  const routeDevOtp     = state?._dev_otp ?? null
  const setAuth   = useAuthStore((s) => s.setAuth)

  const [digits, setDigits]           = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [isLoading, setIsLoading]     = useState(false)
  const [apiError, setApiError]       = useState<string | null>(null)
  const [countdown, setCountdown]     = useState(RESEND_COUNTDOWN)
  const [isResending, setIsResending] = useState(false)
  const [success, setSuccess]         = useState(false)
  const [devOtp, setDevOtp]           = useState<string | null>(routeDevOtp)

  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(OTP_LENGTH).fill(null))

  useEffect(() => { inputRefs.current[0]?.focus() }, [])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  if (!phone) {
    navigate('/login', { replace: true })
    return null
  }

  const isFilled = digits.every((d) => d !== '')
  const formatCountdown = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const maskedPhone = phone.replace(/(\d{2})\d+(\d{2})$/, '$1 ••••••$2')
  const focusInput = (i: number) => { if (i >= 0 && i < OTP_LENGTH) inputRefs.current[i]?.focus() }

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    setApiError(null)
    if (digit && index < OTP_LENGTH - 1) focusInput(index + 1)
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (digits[index]) {
        const next = [...digits]; next[index] = ''; setDigits(next)
      } else if (index > 0) {
        const next = [...digits]; next[index - 1] = ''; setDigits(next); focusInput(index - 1)
      }
    } else if (e.key === 'ArrowLeft') focusInput(index - 1)
    else if (e.key === 'ArrowRight') focusInput(index + 1)
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    const next = [...digits]
    for (let i = 0; i < OTP_LENGTH; i++) next[i] = pasted[i] ?? ''
    setDigits(next)
    focusInput(Math.min(pasted.length - 1, OTP_LENGTH - 1))
  }

  const handleVerify = async () => {
    if (!isFilled || isLoading) return
    setApiError(null)
    setIsLoading(true)
    const otp = digits.join('')
    try {
      const res = await authService.verifyOtp(phone, otp)
      setSuccess(true)
      setAuth(res.data.user, res.data.token)
      setTimeout(() => navigate('/clinic-select', { replace: true }), 600)
    } catch {
      setApiError('Invalid OTP. Please check and try again.')
      setDigits(Array(OTP_LENGTH).fill(''))
      setTimeout(() => focusInput(0), 50)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0 || isResending) return
    setIsResending(true)
    setApiError(null)
    setDigits(Array(OTP_LENGTH).fill(''))
    try {
      const res = await authService.sendOtp(phone)
      setDevOtp(res.data?._dev_otp ?? null)
      setCountdown(RESEND_COUNTDOWN)
      setTimeout(() => focusInput(0), 50)
    } catch {
      setApiError('Failed to resend OTP. Please try again.')
    } finally {
      setIsResending(false)
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
      <div style={{ position: 'absolute', bottom: 260, right: -40, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

      {/* ── Brand / header area ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '20px 24px 24px', position: 'relative', zIndex: 1,
        }}
      >
        {/* Back button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', top: 16, left: 20,
            width: 40, height: 40, borderRadius: 12, border: 'none',
            background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <HiArrowLeft size={20} color="#FFFFFF" />
        </motion.button>

        {/* Icon */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          style={{
            width: 84, height: 84, borderRadius: 24,
            background: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 12px 32px rgba(0,0,0,0.20)', marginBottom: 18,
          }}
        >
          <MdPhoneAndroid size={44} color="#1E4FA3" />
        </motion.div>

        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 700, letterSpacing: '1.5px', margin: '0 0 10px' }}>
          STEP 2 OF 3
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px', letterSpacing: -0.5, textAlign: 'center' }}>
          Verify it's you
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', fontWeight: 500, margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
          We sent a 6-digit code to your number
        </p>

        {/* Phone number pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 20, padding: '6px 14px', marginTop: 14,
        }}>
          <HiPhone size={14} color="rgba(255,255,255,0.85)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', letterSpacing: 1 }}>
            +91 {maskedPhone}
          </span>
        </div>
      </motion.div>

      {/* ── White sheet ──────────────────────────────────────────────────── */}
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
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E3EAF2', margin: '0 auto 24px' }} />

        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', margin: '0 0 4px' }}>
          Enter verification code
        </h2>
        <p style={{ fontSize: 13, color: '#6B7C93', margin: '0 0 22px', fontWeight: 500 }}>
          Check your WhatsApp for the 6-digit OTP
        </p>

        {/* OTP digit boxes */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 20 }}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el }}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              style={{
                flex: 1,
                height: 58,
                textAlign: 'center',
                fontSize: 24,
                fontWeight: 800,
                fontFamily: 'inherit',
                border: success
                  ? '2px solid #22C55E'
                  : apiError
                    ? '2px solid #EF4444'
                    : digit
                      ? '2px solid #1E4FA3'
                      : '1.5px solid #E3EAF2',
                borderRadius: 14,
                background: success
                  ? '#ECFDF5'
                  : apiError
                    ? '#FEF2F2'
                    : digit
                      ? '#EBF2FF'
                      : '#F5F8FC',
                color: success ? '#16A34A' : apiError ? '#EF4444' : '#1E4FA3',
                outline: 'none',
                transition: 'all 0.15s',
                minWidth: 0,
              }}
            />
          ))}
        </div>

        {/* Waiting-for-SMS hint */}
        {!isFilled && !apiError && !success && (
          <div style={{
            background: '#F5F8FC', border: '1px solid #E3EAF2', borderRadius: 12,
            padding: '10px 12px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: '#EBF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1E4FA3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#1E293B', margin: 0 }}>Waiting for SMS…</p>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>We'll fill it automatically when it arrives</p>
            </div>
          </div>
        )}

        {/* Error banner */}
        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10,
              padding: '10px 14px', fontSize: 13, color: '#B91C1C', fontWeight: 500,
              marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            ⚠️ {apiError}
          </motion.div>
        )}

        {/* Success banner */}
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            style={{
              background: '#ECFDF5', border: '1px solid #BBF7D0', borderRadius: 10,
              padding: '12px 14px', fontSize: 13, color: '#065F46', fontWeight: 600,
              marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <HiShieldCheck size={18} color="#16A34A" />
            Verified! Signing you in…
          </motion.div>
        )}

        {/* OTP preview pill — gated by frontend OTP_ENABLE config
            (requires the API to echo back the OTP). */}
        {import.meta.env.OTP_ENABLE === 'true' && devOtp && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: '#FFFBEB', border: '1.5px dashed #FDE68A',
              borderRadius: 12, padding: '10px 14px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 10,
            }}
          >
            <span style={{ fontSize: 18 }}>🔑</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                OTP Preview
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#D97706', letterSpacing: 4, marginTop: 2 }}>
                {devOtp}
              </div>
            </div>
          </motion.div>
        )}

        {/* Resend timer */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          {countdown > 0 ? (
            <p style={{ fontSize: 13, color: '#6B7C93', margin: 0 }}>
              Resend code in{' '}
              <span style={{ fontWeight: 700, color: '#1E4FA3' }}>{formatCountdown(countdown)}</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={isResending}
              style={{
                background: 'none', border: 'none', fontSize: 14, color: '#1E4FA3',
                fontWeight: 700, cursor: isResending ? 'not-allowed' : 'pointer',
                opacity: isResending ? 0.6 : 1, fontFamily: 'inherit',
              }}
            >
              {isResending ? 'Resending…' : '↺  Resend OTP'}
            </button>
          )}
        </div>

        {/* Verify button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleVerify}
          disabled={!isFilled || isLoading || success}
          style={{
            width: '100%', height: 54,
            background: !isFilled || success ? '#C8D9F5' : isLoading ? 'rgba(30,79,163,0.75)' : BRAND_GRADIENT,
            color: '#FFFFFF', fontSize: 16, fontWeight: 700,
            border: 'none', borderRadius: 14,
            cursor: !isFilled || isLoading || success ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: isFilled && !isLoading && !success ? '0 8px 20px rgba(30,79,163,0.32)' : 'none',
            fontFamily: 'inherit',
          }}
        >
          {isLoading ? (
            <motion.span
              animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
              style={{ display: 'inline-block', width: 22, height: 22, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#FFFFFF', borderRadius: '50%' }}
            />
          ) : (
            <>
              <HiShieldCheck size={20} />
              Verify &amp; Continue
            </>
          )}
        </motion.button>

        {/* Wrong number */}
        <button
          onClick={() => navigate('/login')}
          style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, color: '#A0AEC0', fontWeight: 600, fontFamily: 'inherit',
            marginTop: 14, padding: '8px 0',
          }}
        >
          Wrong number? Change mobile
        </button>
      </motion.div>
    </div>
  )
}
