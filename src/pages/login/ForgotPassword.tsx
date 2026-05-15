import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/store/app'
import api from '@/lib/axios'
import Icon from '@/components/ui/Icon'

/* ── Types ───────────────────────────────────────────────────────────────── */
type Step = 'request' | 'verify' | 'reset' | 'success'

/* ── Password strength ───────────────────────────────────────────────────── */
interface StrengthResult {
  score:  0 | 1 | 2 | 3 | 4
  label:  string
  color:  string
  checks: { label: string; ok: boolean }[]
}

function calcStrength(pw: string): StrengthResult {
  const checks = [
    { label: 'At least 8 characters',         ok: pw.length >= 8 },
    { label: 'One uppercase letter (A–Z)',     ok: /[A-Z]/.test(pw) },
    { label: 'One lowercase letter (a–z)',     ok: /[a-z]/.test(pw) },
    { label: 'One number (0–9)',               ok: /[0-9]/.test(pw) },
    { label: 'One special character (!@#$…)', ok: /[^A-Za-z0-9]/.test(pw) },
  ]
  const passed = checks.filter(c => c.ok).length as 0 | 1 | 2 | 3 | 4
  const score  = Math.min(4, passed) as 0 | 1 | 2 | 3 | 4
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', 'var(--danger-500)', 'var(--warning-500)', 'var(--info-500)', 'var(--success-500)']
  return { score, label: labels[score], color: colors[score], checks }
}

/* ── OTP_LENGTH ──────────────────────────────────────────────────────────── */
const OTP_LEN = 6
const RESEND_SECONDS = 60

/* ── Main component ──────────────────────────────────────────────────────── */
export default function ForgotPassword() {
  const { setRoute } = useAppStore()

  const [step,        setStep]       = useState<Step>('request')
  const [identifier,  setIdentifier] = useState('')     // email or phone
  const [maskedContact, setMaskedContact] = useState('')
  const [otp,         setOtp]        = useState<string[]>(Array(OTP_LEN).fill(''))
  const [resetToken,  setResetToken] = useState('')
  const [password,    setPassword]   = useState('')
  const [confirm,     setConfirm]    = useState('')
  const [showPw,      setShowPw]     = useState(false)
  const [showCfm,     setShowCfm]    = useState(false)
  const [loading,     setLoading]    = useState(false)
  const [error,       setError]      = useState('')
  const [countdown,   setCountdown]  = useState(0) // resend timer
  const [redirect,    setRedirect]   = useState(5) // success redirect

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const strength = calcStrength(password)
  const pwMatch  = password.length > 0 && confirm.length > 0 && password === confirm

  /* ── Resend countdown ─────────────────────────────────────────────────── */
  const startResendTimer = useCallback(() => {
    setCountdown(RESEND_SECONDS)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCountdown(s => {
        if (s <= 1) { clearInterval(timerRef.current!); return 0 }
        return s - 1
      })
    }, 1000)
  }, [])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  /* ── Success redirect countdown ──────────────────────────────────────── */
  useEffect(() => {
    if (step !== 'success') return
    const t = setInterval(() => {
      setRedirect(s => {
        if (s <= 1) { clearInterval(t); setRoute('login'); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [step, setRoute])

  /* ── Focus first OTP box on verify step ─────────────────────────────── */
  useEffect(() => {
    if (step === 'verify') {
      setTimeout(() => otpRefs.current[0]?.focus(), 80)
    }
  }, [step])

  /* ── Step 1: Request OTP ──────────────────────────────────────────────── */
  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const id = identifier.trim()
    if (!id) { setError('Please enter your email or mobile number'); return }

    setLoading(true)
    try {
      const { data } = await api.post('/auth/forgot-password', { identifier: id })
      setMaskedContact(data.maskedContact ?? id)
      setStep('verify')
      startResendTimer()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  /* ── Step 2: OTP input handlers ───────────────────────────────────────── */
  const handleOtpChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next  = [...otp]
    next[i] = digit
    setOtp(next)
    if (digit && i < OTP_LEN - 1) otpRefs.current[i + 1]?.focus()
  }

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && i > 0)          otpRefs.current[i - 1]?.focus()
    if (e.key === 'ArrowRight' && i < OTP_LEN - 1) otpRefs.current[i + 1]?.focus()
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN)
    if (digits.length === OTP_LEN) {
      setOtp(digits.split(''))
      otpRefs.current[OTP_LEN - 1]?.focus()
    }
    e.preventDefault()
  }

  /* ── Step 2: Verify OTP ───────────────────────────────────────────────── */
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const code = otp.join('')
    if (code.length < OTP_LEN) { setError(`Enter all ${OTP_LEN} digits`); return }

    setLoading(true)
    try {
      const { data } = await api.post('/auth/verify-otp', { identifier: identifier.trim(), otp: code })
      setResetToken(data.resetToken)
      setStep('reset')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.')
      setOtp(Array(OTP_LEN).fill(''))
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setError('')
    setOtp(Array(OTP_LEN).fill(''))
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { identifier: identifier.trim() })
      startResendTimer()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not resend OTP.')
    } finally {
      setLoading(false)
    }
  }

  /* ── Step 3: Reset password ───────────────────────────────────────────── */
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (strength.score < 2) { setError('Please choose a stronger password'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', { resetToken, password })
      setStep('success')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /* ── Shared card wrapper ──────────────────────────────────────────────── */
  const card = (children: React.ReactNode) => (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 420 }}>
        {/* Logo */}
        <div className="login-logo">N</div>
        {children}
      </div>
    </div>
  )

  /* ═══════════════════════════════════════════════════════════════════════
     STEP 1 — Request OTP
  ═══════════════════════════════════════════════════════════════════════ */
  if (step === 'request') return card(
    <>
      <h1 style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
        Forgot password?
      </h1>
      <p style={{ textAlign: 'center', color: 'var(--fg-secondary)', fontSize: 13.5, marginBottom: 24, lineHeight: 1.55 }}>
        Enter your registered email or mobile number and we'll send you a one-time code.
      </p>

      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleRequest} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="form-group">
          <label className="form-label required" htmlFor="fp-id">Email or mobile number</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)', lineHeight: 0 }}>
              <Icon name="user" size={16} />
            </span>
            <input
              id="fp-id"
              className="form-input"
              style={{ paddingLeft: 38 }}
              placeholder="you@clinic.in or +91 98765 43210"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 5 }}>
            We'll send a 6-digit OTP to this address.
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '11px 14px', fontSize: 14 }}
          disabled={loading}
        >
          {loading ? <Spinner /> : <><Icon name="chevR" size={15} /> Send OTP</>}
        </button>
      </form>

      <BackToLogin onClick={() => setRoute('login')} />
    </>
  )

  /* ═══════════════════════════════════════════════════════════════════════
     STEP 2 — Verify OTP
  ═══════════════════════════════════════════════════════════════════════ */
  if (step === 'verify') return card(
    <>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%', margin: '0 auto 14px',
          background: 'var(--brand-gradient-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1.5px solid rgba(44,110,213,0.2)',
        }}>
          <Icon name="phone" size={22} style={{ color: 'var(--teal-600)' }} />
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Enter OTP</h1>
        <p style={{ color: 'var(--fg-secondary)', fontSize: 13.5, lineHeight: 1.55 }}>
          We sent a 6-digit code to<br />
          <strong style={{ color: 'var(--fg-primary)' }}>{maskedContact}</strong>
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* OTP boxes */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => { otpRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleOtpChange(i, e.target.value)}
              onKeyDown={e => handleOtpKeyDown(i, e)}
              onPaste={handleOtpPaste}
              style={{
                width: 46, height: 54, textAlign: 'center',
                fontSize: 22, fontWeight: 800,
                borderRadius: 12,
                border: `2px solid ${digit ? 'var(--teal-600)' : 'var(--border-soft)'}`,
                background: digit ? 'var(--brand-gradient-soft)' : 'var(--bg-surface)',
                color: 'var(--fg-primary)',
                outline: 'none',
                transition: 'border-color 0.15s, background 0.15s',
                caretColor: 'transparent',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--teal-600)'}
              onBlur={e => e.target.style.borderColor = otp[i] ? 'var(--teal-600)' : 'var(--border-soft)'}
            />
          ))}
        </div>

        {/* Resend */}
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--fg-secondary)' }}>
          Didn't receive it?{' '}
          {countdown > 0 ? (
            <span style={{ color: 'var(--fg-muted)', fontWeight: 600 }}>
              Resend in {countdown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teal-600)', fontWeight: 600, fontSize: 13, padding: 0 }}
            >
              Resend OTP
            </button>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '11px 14px', fontSize: 14 }}
          disabled={loading || otp.join('').length < OTP_LEN}
        >
          {loading ? <Spinner /> : <><Icon name="check" size={15} /> Verify OTP</>}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button
          type="button"
          onClick={() => { setStep('request'); setOtp(Array(OTP_LEN).fill('')); setError('') }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-secondary)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <Icon name="chevL" size={13} /> Change email / mobile
        </button>
      </div>
    </>
  )

  /* ═══════════════════════════════════════════════════════════════════════
     STEP 3 — Reset Password
  ═══════════════════════════════════════════════════════════════════════ */
  if (step === 'reset') return card(
    <>
      <h1 style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
        Create new password
      </h1>
      <p style={{ textAlign: 'center', color: 'var(--fg-secondary)', fontSize: 13.5, marginBottom: 24 }}>
        Choose a strong password you haven't used before.
      </p>

      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* New password */}
        <div className="form-group">
          <label className="form-label required" htmlFor="pw-new">New password</label>
          <div style={{ position: 'relative' }}>
            <input
              id="pw-new"
              type={showPw ? 'text' : 'password'}
              className="form-input"
              style={{ paddingRight: 40 }}
              placeholder="Min 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              autoComplete="new-password"
            />
            <EyeToggle show={showPw} onToggle={() => setShowPw(v => !v)} />
          </div>

          {/* Strength bar */}
          {password.length > 0 && (
            <>
              <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                {[1, 2, 3, 4].map(n => (
                  <div key={n} style={{
                    flex: 1, height: 4, borderRadius: 4,
                    background: n <= strength.score ? strength.color : 'var(--border-soft)',
                    transition: 'background 0.2s',
                  }} />
                ))}
              </div>
              {strength.score > 0 && (
                <div style={{ fontSize: 12, fontWeight: 600, color: strength.color, marginTop: 4 }}>
                  {strength.label}
                </div>
              )}
              {/* Policy checklist */}
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {strength.checks.map(c => (
                  <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
                    <span style={{
                      width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: c.ok ? 'var(--success-500)' : 'var(--border-soft)',
                      fontSize: 9, color: c.ok ? 'white' : 'var(--fg-muted)',
                    }}>
                      {c.ok ? '✓' : ''}
                    </span>
                    <span style={{ color: c.ok ? 'var(--fg-primary)' : 'var(--fg-muted)' }}>{c.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Confirm password */}
        <div className="form-group">
          <label className="form-label required" htmlFor="pw-cfm">Confirm password</label>
          <div style={{ position: 'relative' }}>
            <input
              id="pw-cfm"
              type={showCfm ? 'text' : 'password'}
              className={`form-input${confirm.length > 0 && !pwMatch ? ' error' : ''}`}
              style={{
                paddingRight: 40,
                borderColor: confirm.length > 0 ? (pwMatch ? 'var(--success-500)' : 'var(--danger-500)') : undefined,
              }}
              placeholder="Re-enter password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
            <EyeToggle show={showCfm} onToggle={() => setShowCfm(v => !v)} />
          </div>
          {confirm.length > 0 && (
            <div style={{ fontSize: 12, marginTop: 5, color: pwMatch ? 'var(--success-500)' : 'var(--danger-500)', fontWeight: 500 }}>
              {pwMatch ? '✓ Passwords match' : 'Passwords do not match'}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '11px 14px', fontSize: 14 }}
          disabled={loading || strength.score < 2 || !pwMatch}
        >
          {loading ? <Spinner /> : <><Icon name="lock" size={15} /> Update Password</>}
        </button>
      </form>
    </>
  )

  /* ═══════════════════════════════════════════════════════════════════════
     STEP 4 — Success
  ═══════════════════════════════════════════════════════════════════════ */
  return card(
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      {/* Success icon */}
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'var(--success-100)', border: '2px solid var(--success-500)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px', animation: 'fp-pop 0.4s var(--ease-out)',
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="var(--success-500)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: 'var(--fg-primary)' }}>
        Password updated!
      </h1>
      <p style={{ color: 'var(--fg-secondary)', fontSize: 13.5, lineHeight: 1.6, marginBottom: 28 }}>
        Your password has been reset successfully.<br />
        You can now sign in with your new password.
      </p>

      {/* Countdown ring */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '8px 16px', borderRadius: 20,
        background: 'var(--bg-section)', border: '1px solid var(--border-soft)',
        fontSize: 13, color: 'var(--fg-secondary)', marginBottom: 20,
      }}>
        <span style={{
          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
          background: 'var(--brand-gradient)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, color: 'white',
        }}>
          {redirect}
        </span>
        Redirecting to login in {redirect}s…
      </div>

      <button
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', padding: '11px 14px', fontSize: 14 }}
        onClick={() => setRoute('login')}
      >
        <Icon name="log" size={15} /> Go to Login now
      </button>
    </div>
  )
}

/* ── Small shared components ──────────────────────────────────────────────── */
function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{
      background: 'var(--danger-100)', color: 'var(--danger-500)',
      borderRadius: 10, padding: '9px 12px', fontSize: 13, marginBottom: 16,
      border: '1px solid rgba(239,68,68,0.2)', fontWeight: 500,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <Icon name="x" size={14} style={{ flexShrink: 0 }} />
      {message}
    </div>
  )
}

function Spinner() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        width: 16, height: 16, borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.3)',
        borderTopColor: 'white',
        animation: 'spin 0.7s linear infinite',
        display: 'inline-block',
      }} />
      Please wait…
    </span>
  )
}

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--fg-muted)', padding: 2, lineHeight: 0,
      }}
      title={show ? 'Hide password' : 'Show password'}
      tabIndex={-1}
    >
      <Icon name={show ? 'eye' : 'eye'} size={16} />
    </button>
  )
}

function BackToLogin({ onClick }: { onClick: () => void }) {
  return (
    <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--fg-secondary)', marginTop: 20 }}>
      Remembered it?{' '}
      <button
        type="button"
        onClick={onClick}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teal-600)', fontWeight: 600, fontSize: 13, padding: 0 }}
      >
        Back to Login
      </button>
    </p>
  )
}
