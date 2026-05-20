import { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiArrowLeft, HiShieldCheck, HiPhone } from 'react-icons/hi'
import { MdPhoneAndroid } from 'react-icons/md'
import { verifyOtp, forgotPassword, verifyLoginOtp, sendLoginOtp, otpRegister, sendRegisterOtp } from '../../services/authService'
import { useAuthStore } from '../../store/authStore'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'
const OTP_LENGTH = 6
const RESEND_COUNTDOWN = 60

export default function OTPScreen() {
  const navigate          = useNavigate()
  const location          = useLocation()
  const loginPhone        = useAuthStore((s) => s.loginPhone)
  const resetIdentifier   = useAuthStore((s) => s.resetIdentifier)
  const setResetToken     = useAuthStore((s) => s.setResetToken)
  const setToken          = useAuthStore((s) => s.setToken)
  const setUser           = useAuthStore((s) => s.setUser)
  const setLoginPhone     = useAuthStore((s) => s.setLoginPhone)

  const routeState   = location.state as { _dev_otp?: string; registerData?: { name: string; email: string; phone: string; dob: string; gender: 'M' | 'F' | 'Other' } } | null
  const registerData = routeState?.registerData ?? null

  const isRegisterMode = !!registerData
  const isLoginMode    = !isRegisterMode && !!loginPhone
  const identifier     = isRegisterMode ? registerData.phone : isLoginMode ? loginPhone : resetIdentifier

  const [digits, setDigits]           = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [isLoading, setIsLoading]     = useState(false)
  const [apiError, setApiError]       = useState<string | null>(null)
  const [countdown, setCountdown]     = useState(RESEND_COUNTDOWN)
  const [isResending, setIsResending] = useState(false)
  const [success, setSuccess]         = useState(false)
  const routeDevOtp                   = routeState?._dev_otp ?? null
  const [devOtp, setDevOtp]           = useState<string | null>(routeDevOtp)

  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(OTP_LENGTH).fill(null))

  useEffect(() => { inputRefs.current[0]?.focus() }, [])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  if (!identifier) {
    navigate(isRegisterMode ? '/register' : '/login', { replace: true })
    return null
  }

  const isFilled = digits.every((d) => d !== '')
  const formatCountdown = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const maskedPhone = identifier.replace(/(\d{2})\d+(\d{2})$/, '$1 ••••••$2')
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
      if (isRegisterMode) {
        const res = await otpRegister({ ...registerData!, otp })
        if (res.success) {
          setSuccess(true)
          setToken(res.token)
          setUser(res.user)
          setTimeout(() => navigate('/app/dashboard', { replace: true }), 600)
        } else {
          setApiError('Invalid OTP. Please check and try again.')
          setDigits(Array(OTP_LENGTH).fill(''))
          setTimeout(() => focusInput(0), 50)
        }
      } else if (isLoginMode) {
        const res = await verifyLoginOtp(identifier, otp)
        if (res.success) {
          setSuccess(true)
          setToken(res.token)
          setUser(res.user)
          setLoginPhone('')
          setTimeout(() => navigate('/app/dashboard', { replace: true }), 600)
        } else {
          setApiError('Invalid OTP. Please check and try again.')
          setDigits(Array(OTP_LENGTH).fill(''))
          setTimeout(() => focusInput(0), 50)
        }
      } else {
        const res = await verifyOtp(identifier, otp)
        if (res.success) {
          setResetToken(res.resetToken)
          navigate('/reset-password', { replace: true })
        } else {
          setApiError('Invalid OTP. Please check and try again.')
          setDigits(Array(OTP_LENGTH).fill(''))
          setTimeout(() => focusInput(0), 50)
        }
      }
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Verification failed. Please try again.')
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
    setDevOtp(null)
    setDigits(Array(OTP_LENGTH).fill(''))
    try {
      if (isRegisterMode) {
        const res = await sendRegisterOtp(registerData!.phone)
        if (res._dev_otp) setDevOtp(res._dev_otp)
      } else if (isLoginMode) {
        const res = await sendLoginOtp(identifier)
        if (res._dev_otp) setDevOtp(res._dev_otp)
      } else {
        const res = await forgotPassword(identifier)
        if (res._dev_otp) setDevOtp(res._dev_otp)
      }
      setCountdown(RESEND_COUNTDOWN)
      setTimeout(() => focusInput(0), 50)
    } catch {
      setApiError('Failed to resend OTP. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const headingText = isRegisterMode ? 'Confirm Your Number' : isLoginMode ? 'Verify & Login' : 'Reset Password'
  const subtitleText = isRegisterMode
    ? 'Verify your number to complete registration'
    : isLoginMode
      ? 'We sent a 6-digit code to your number'
      : 'Enter the OTP sent to recover your account'

  return (
    <div style={{
      minHeight: '100%', flex: 1, width: '100%',
      display: 'flex', flexDirection: 'column',
      background: BRAND_GRADIENT,
      fontFamily: 'Roboto, system-ui, sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative circles — same as LoginScreen */}
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
        {/* Back button — top-left */}
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

        {/* Icon in white box — matches LoginScreen shield style */}
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

        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px', letterSpacing: -0.5, textAlign: 'center' }}>
          {headingText}
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', fontWeight: 500, margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
          {subtitleText}
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
                      ? '2px solid #2C6ED5'
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
            {isRegisterMode ? 'Account created! Taking you home…' : 'Verified! Logging you in…'}
          </motion.div>
        )}

        {/* Dev OTP hint */}
        {devOtp && (
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
              <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dev Mode — OTP</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#D97706', letterSpacing: 4, marginTop: 2 }}>{devOtp}</div>
            </div>
          </motion.div>
        )}

        {/* Resend timer */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          {countdown > 0 ? (
            <p style={{ fontSize: 13, color: '#6B7C93', margin: 0 }}>
              Resend code in{' '}
              <span style={{ fontWeight: 700, color: '#2C6ED5' }}>{formatCountdown(countdown)}</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={isResending}
              style={{
                background: 'none', border: 'none', fontSize: 14, color: '#2C6ED5',
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
            background: !isFilled || success ? '#C8D9F5' : isLoading ? 'rgba(44,110,213,0.75)' : BRAND_GRADIENT,
            color: '#FFFFFF', fontSize: 16, fontWeight: 700,
            border: 'none', borderRadius: 14,
            cursor: !isFilled || isLoading || success ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: isFilled && !isLoading && !success ? '0 8px 20px rgba(44,110,213,0.32)' : 'none',
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
              {isRegisterMode ? 'Verify & Create Account' : isLoginMode ? 'Verify & Sign In' : 'Verify & Continue'}
            </>
          )}
        </motion.button>

        {/* Wrong number link */}
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
