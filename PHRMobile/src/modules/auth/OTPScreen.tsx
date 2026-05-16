import { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { verifyOtp, forgotPassword } from '../../services/authService'
import { useAuthStore } from '../../store/authStore'
import MobileHeader from '../../components/MobileHeader'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'
const OTP_LENGTH = 6
const RESEND_COUNTDOWN = 60

export default function OTPScreen() {
  const navigate = useNavigate()
  const identifier = useAuthStore((s) => s.resetIdentifier)
  const setResetToken = useAuthStore((s) => s.setResetToken)

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN)
  const [isResending, setIsResending] = useState(false)

  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(OTP_LENGTH).fill(null))

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  if (!identifier) {
    navigate('/forgot-password', { replace: true })
    return null
  }

  const isFilled = digits.every((d) => d !== '')

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const focusInput = (index: number) => {
    if (index >= 0 && index < OTP_LENGTH) {
      inputRefs.current[index]?.focus()
    }
  }

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newDigits = [...digits]
    newDigits[index] = digit
    setDigits(newDigits)
    setApiError(null)
    if (digit && index < OTP_LENGTH - 1) focusInput(index + 1)
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const newDigits = [...digits]
        newDigits[index] = ''
        setDigits(newDigits)
      } else if (index > 0) {
        const newDigits = [...digits]
        newDigits[index - 1] = ''
        setDigits(newDigits)
        focusInput(index - 1)
      }
      e.preventDefault()
    } else if (e.key === 'ArrowLeft') {
      focusInput(index - 1)
    } else if (e.key === 'ArrowRight') {
      focusInput(index + 1)
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    const newDigits = [...digits]
    for (let i = 0; i < OTP_LENGTH; i++) newDigits[i] = pasted[i] ?? ''
    setDigits(newDigits)
    focusInput(Math.min(pasted.length - 1, OTP_LENGTH - 1))
  }

  const handleVerify = async () => {
    if (!isFilled || isLoading) return
    setApiError(null)
    setIsLoading(true)
    try {
      const otp = digits.join('')
      const res = await verifyOtp(identifier, otp)
      if (res.success) {
        setResetToken(res.resetToken)
        navigate('/reset-password', { replace: true })
      } else {
        setApiError('Invalid OTP. Please check and try again.')
        setDigits(Array(OTP_LENGTH).fill(''))
        setTimeout(() => focusInput(0), 50)
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
    setDigits(Array(OTP_LENGTH).fill(''))
    try {
      await forgotPassword(identifier)
      setCountdown(RESEND_COUNTDOWN)
      setTimeout(() => focusInput(0), 50)
    } catch {
      setApiError('Failed to resend OTP. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const maskedIdentifier = identifier.includes('@')
    ? identifier.replace(/(.{2}).+(@.+)/, '$1***$2')
    : identifier.replace(/(\d{2})\d+(\d{2})/, '$1*****$2')

  return (
    <div style={{ minHeight: '100%', flex: 1, background: '#F5F8FC', fontFamily: 'Roboto, system-ui, sans-serif' }}>
      <MobileHeader title="Verify OTP" showBack={true} />

      <motion.div
        style={{
          margin: '16px 16px 0',
          borderRadius: 20,
          padding: '20px 20px',
          background: BRAND_GRADIENT,
          boxShadow: '0 8px 20px rgba(44,110,213,0.28)',
        }}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="8" width="18" height="13" rx="2" stroke="white" strokeWidth="1.8"/>
              <path d="M8 8V6a4 4 0 018 0v2" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="12" cy="14.5" r="1.5" fill="white"/>
              <path d="M12 16v2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>Enter 6-digit OTP</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
              Sent to {maskedIdentifier}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        style={{
          margin: '16px 16px 0',
          background: '#fff',
          borderRadius: 20,
          padding: '24px 20px',
          boxShadow: '0 4px 12px rgba(30,79,163,0.08)',
          display: 'flex', flexDirection: 'column', gap: 20,
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el }}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              style={{
                width: 46, height: 54,
                textAlign: 'center', fontSize: 22, fontWeight: 700,
                fontFamily: 'inherit',
                border: digit ? '2px solid #2C6ED5' : apiError ? '2px solid #EF4444' : '1.5px solid #E3EAF2',
                borderRadius: 12,
                background: digit ? '#EFF5FF' : '#F5F8FC',
                color: '#1E4FA3', outline: 'none',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              aria-label={`OTP digit ${index + 1}`}
            />
          ))}
        </div>

        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#EF4444' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6.5" stroke="#EF4444"/>
              <path d="M7 4v3.5" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="7" cy="10" r="0.75" fill="#EF4444"/>
            </svg>
            {apiError}
          </motion.div>
        )}

        <div style={{ textAlign: 'center' }}>
          {countdown > 0 ? (
            <span style={{ fontSize: 14, color: '#6B7C93' }}>
              Resend in <strong style={{ color: '#2C6ED5' }}>{formatCountdown(countdown)}</strong>
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={isResending}
              style={{
                background: 'none', border: 'none', fontSize: 14, color: '#2C6ED5',
                fontWeight: 600, cursor: isResending ? 'not-allowed' : 'pointer',
                opacity: isResending ? 0.6 : 1, fontFamily: 'inherit',
                textDecoration: 'underline', textUnderlineOffset: 2,
              }}
            >
              {isResending ? 'Resending…' : 'Resend OTP'}
            </button>
          )}
        </div>
      </motion.div>

      <motion.div
        style={{ margin: '20px 16px 0' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={handleVerify}
          disabled={!isFilled || isLoading}
          style={{
            width: '100%', height: 52,
            background: !isFilled ? '#C8D9F5' : isLoading ? 'rgba(44,110,213,0.75)' : BRAND_GRADIENT,
            color: '#fff', fontSize: 16, fontWeight: 700,
            border: 'none', borderRadius: 14,
            cursor: !isFilled || isLoading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: isFilled && !isLoading ? '0 8px 20px rgba(44,110,213,0.32)' : 'none',
            fontFamily: 'inherit',
          }}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5"/>
                <path d="M10 2a8 8 0 018 8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              Verifying…
            </>
          ) : (
            <>
              Verify &amp; Continue
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3.75 9h10.5M9.75 4.5 14.25 9l-4.5 4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </>
          )}
        </button>
      </motion.div>
    </div>
  )
}
