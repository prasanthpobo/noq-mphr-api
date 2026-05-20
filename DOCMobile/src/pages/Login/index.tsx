import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiPhone, HiArrowRight } from 'react-icons/hi'
import { MdLocalHospital } from 'react-icons/md'
import { authService } from '@/services/authService'
import { isValidPhone } from '@/utils/validators'

const BRAND_GRADIENT = 'linear-gradient(135deg, #102E63 0%, #1E4FA3 55%, #1FA3A8 100%)'

export function Login() {
  const navigate    = useNavigate()
  const [phone, setPhone]       = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [sending, setSending]   = useState(false)
  const [apiError, setApiError] = useState('')

  const handleSendOtp = async () => {
    setApiError('')
    if (!isValidPhone(phone)) {
      setPhoneError('Enter a valid 10-digit mobile number')
      return
    }
    setPhoneError('')
    setSending(true)
    try {
      await authService.sendOtp(phone)
      navigate('/otp', { state: { phone } })
    } catch {
      setApiError('Failed to send OTP. Please try again.')
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
      <div style={{ position: 'absolute', top: 60, left: -50, width: 160, height: 160, borderRadius: '50%', background: 'rgba(31,163,168,0.20)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 240, right: -40, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

      {/* ── Brand area ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '48px 24px 24px', position: 'relative', zIndex: 1,
        }}
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
          <MdLocalHospital size={46} color="#1E4FA3" />
        </motion.div>

        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: -1, lineHeight: 1 }}>
          NoQ Doctor
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500, margin: '8px 0 0', textAlign: 'center' }}>
          Manage your clinic &amp; patient queue
        </p>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Live Queue', 'Patient Records', 'Quick Rx'].map((f) => (
            <div key={f} style={{
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 20, padding: '5px 12px',
              fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.90)',
            }}>
              {f}
            </div>
          ))}
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
          Doctor Sign In
        </h2>
        <p style={{ fontSize: 13, color: '#6B7C93', margin: '0 0 20px', fontWeight: 500 }}>
          Enter your registered mobile number
        </p>

        {/* Phone input */}
        <div style={{ marginBottom: 14 }}>
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
              autoFocus
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
          {phoneError && (
            <p style={{ fontSize: 12, color: '#EF4444', margin: '5px 0 0 2px' }}>{phoneError}</p>
          )}
        </div>

        {/* API error */}
        {apiError && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10,
            padding: '10px 14px', fontSize: 13, color: '#B91C1C', fontWeight: 500, marginBottom: 14,
          }}>
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
            boxShadow: phone.length >= 10 && !sending ? '0 8px 20px rgba(30,79,163,0.32)' : 'none',
            fontFamily: 'inherit',
          }}
        >
          {sending ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
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

        <p style={{ fontSize: 12, color: '#A0AEC0', textAlign: 'center', lineHeight: 1.5, margin: '14px 0 0' }}>
          OTP will be sent via WhatsApp to your registered number
        </p>

        <p style={{ fontSize: 11, color: '#A0AEC0', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
          By continuing you agree to our{' '}
          <span style={{ color: '#1E4FA3', cursor: 'pointer', fontWeight: 600 }}>Terms</span>{' '}&amp;{' '}
          <span style={{ color: '#1E4FA3', cursor: 'pointer', fontWeight: 600 }}>Privacy Policy</span>
        </p>
      </motion.div>
    </div>
  )
}
