import { useEffect, useRef, useState, type KeyboardEvent, type ClipboardEvent } from 'react'
import { useAppStore } from '@/store/app'
import { useAuthStore } from '@/store/auth'
import { DEFAULT_ROUTE, type Role } from '@/config/rbac'
import Icon from '@/components/ui/Icon'

function roleRoute(role?: string): string {
  return DEFAULT_ROUTE[(role as Role) || 'user'] ?? 'support'
}

const OTP_LENGTH = 6
const RESEND_SECONDS = 60

type Mode = 'email' | 'mobile'
type Step = 'phone' | 'otp'

export default function LoginPage() {
  const { setAuthed, setRoute } = useAppStore()
  const { user, loading, error, previewOtp, login, sendOtp, verifyOtp, clearError } = useAuthStore()

  // ── Mode + shared state ─────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>('email')

  // ── Email/password fields ───────────────────────────────────────────────
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [keepMe, setKeepMe]     = useState(false)

  // ── Mobile/OTP fields ───────────────────────────────────────────────────
  const [step, setStep]         = useState<Step>('phone')
  const [phone, setPhone]       = useState('')
  const [digits, setDigits]     = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [countdown, setCountdown] = useState(0)
  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(OTP_LENGTH).fill(null))

  // Redirect once authenticated
  useEffect(() => {
    if (user) {
      setAuthed(true)
      setRoute(roleRoute(user.role))
    }
  }, [user, setAuthed, setRoute])

  // Reset OTP boxes when sending again / changing number
  useEffect(() => {
    if (step === 'otp') {
      setDigits(Array(OTP_LENGTH).fill(''))
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
    }
  }, [step])

  // Resend countdown
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const phoneDigits = phone.replace(/\D/g, '')
  const phoneValid  = phoneDigits.length === 10 && /^[6-9]/.test(phoneDigits)
  const otpFilled   = digits.every((d) => d !== '')

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    if (!email || !password) return
    await login(email, password)
    const u = useAuthStore.getState().user
    if (u) { setAuthed(true); setRoute(roleRoute(u.role)) }
  }

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault()
    clearError()
    if (!phoneValid) return
    const res = await sendOtp(phoneDigits)
    if (res.success) {
      setStep('otp')
      setCountdown(RESEND_SECONDS)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    clearError()
    const res = await sendOtp(phoneDigits)
    if (res.success) setCountdown(RESEND_SECONDS)
  }

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!otpFilled) return
    clearError()
    await verifyOtp(phoneDigits, digits.join(''))
    const u = useAuthStore.getState().user
    if (u) { setAuthed(true); setRoute(roleRoute(u.role)) }
  }

  const focusInput = (i: number) => {
    if (i >= 0 && i < OTP_LENGTH) inputRefs.current[i]?.focus()
  }

  const handleDigitChange = (i: number, raw: string) => {
    const d = raw.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = d
    setDigits(next)
    clearError()
    if (d && i < OTP_LENGTH - 1) focusInput(i + 1)
  }

  const handleDigitKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (digits[i]) {
        const next = [...digits]; next[i] = ''; setDigits(next)
      } else if (i > 0) {
        const next = [...digits]; next[i - 1] = ''; setDigits(next); focusInput(i - 1)
      }
    } else if (e.key === 'ArrowLeft')  focusInput(i - 1)
    else if (e.key === 'ArrowRight') focusInput(i + 1)
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    const next = [...digits]
    for (let i = 0; i < OTP_LENGTH; i++) next[i] = pasted[i] ?? ''
    setDigits(next)
    focusInput(Math.min(pasted.length, OTP_LENGTH - 1))
  }

  const autofillFromDev = () => {
    if (!previewOtp) return
    const arr = previewOtp.padEnd(OTP_LENGTH, ' ').slice(0, OTP_LENGTH).split('')
    setDigits(arr.map((c) => /\d/.test(c) ? c : ''))
    focusInput(OTP_LENGTH - 1)
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">N</div>

        <h1 style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
          Sign in to NoQ
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--fg-secondary)', fontSize: 13.5, marginBottom: 20 }}>
          Clinic admin dashboard
        </p>

        {/* Mode toggle */}
        <div style={{
          display: 'flex', background: 'var(--bg-muted, #F1F5F9)', borderRadius: 10, padding: 4, marginBottom: 18,
        }}>
          {(['email', 'mobile'] as Mode[]).map((m) => {
            const active = mode === m
            return (
              <button key={m} type="button"
                onClick={() => { setMode(m); clearError(); setStep('phone') }}
                style={{
                  flex: 1, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: active ? '#FFFFFF' : 'transparent',
                  color: active ? 'var(--teal-600)' : 'var(--fg-secondary)',
                  fontSize: 13, fontWeight: 700,
                  boxShadow: active ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.15s',
                }}>
                <Icon name={m === 'email' ? 'mail' : 'phone'} size={14} />
                {m === 'email' ? 'Email' : 'Mobile OTP'}
              </button>
            )
          })}
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            background: 'var(--danger-100)', color: 'var(--danger-500)',
            borderRadius: 10, padding: '9px 12px', fontSize: 13, marginBottom: 14,
            border: '1px solid rgba(239,68,68,0.2)', fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        {/* ── Email / password ─────────────────────────────────────────── */}
        {mode === 'email' && (
          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label required" htmlFor="email">Email address</label>
              <input
                id="email" type="email" className="form-input"
                placeholder="you@clinic.in"
                value={email} onChange={(e) => setEmail(e.target.value)}
                autoComplete="email" autoFocus
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="form-label required" htmlFor="password">Password</label>
                <button type="button"
                  style={{ fontSize: 12, color: 'var(--teal-600)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                  onClick={() => setRoute('forgot-password')}>
                  Forgot?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="password" type={showPw ? 'text' : 'password'} className="form-input"
                  placeholder="Enter your password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password" style={{ paddingRight: 40 }}
                />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', padding: 2, lineHeight: 0 }}
                  title={showPw ? 'Hide password' : 'Show password'}>
                  <Icon name="eye" size={16} />
                </button>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={keepMe} onChange={(e) => setKeepMe(e.target.checked)}
                style={{ width: 15, height: 15, accentColor: 'var(--teal-600)', cursor: 'pointer' }} />
              <span style={{ fontSize: 13, color: 'var(--fg-secondary)', fontWeight: 500 }}>Keep me signed in</span>
            </label>

            <button type="submit" className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px 14px', fontSize: 14 }}
              disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}

        {/* ── Mobile + OTP ─────────────────────────────────────────────── */}
        {mode === 'mobile' && step === 'phone' && (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label required" htmlFor="phone">Mobile number</label>
              <div style={{
                display: 'flex', alignItems: 'center',
                border: `1.5px solid ${phoneDigits.length > 0 && !phoneValid ? '#EF4444' : 'var(--border-base, #E3EAF2)'}`,
                background: 'var(--bg-input, #F8FAFC)',
                borderRadius: 10, overflow: 'hidden', height: 44,
              }}>
                <span style={{ padding: '0 12px', fontSize: 13, fontWeight: 700, color: 'var(--fg-secondary)', borderRight: '1.5px solid var(--border-base, #E3EAF2)', display: 'flex', alignItems: 'center', height: '100%' }}>
                  🇮🇳 +91
                </span>
                <input
                  id="phone" type="tel" inputMode="numeric" maxLength={10}
                  placeholder="10-digit mobile"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  autoComplete="tel" autoFocus
                  style={{ flex: 1, height: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: 14, fontWeight: 600, color: 'var(--fg-primary)', padding: '0 12px', fontFamily: 'inherit', letterSpacing: 0.5 }}
                />
                <span style={{ fontSize: 11, color: 'var(--fg-muted)', padding: '0 12px' }}>{phoneDigits.length}/10</span>
              </div>
              {phoneDigits.length > 0 && !phoneValid && (
                <p style={{ fontSize: 12, color: 'var(--danger-500)', margin: '6px 0 0' }}>
                  Enter a valid 10-digit Indian mobile (starting 6, 7, 8 or 9)
                </p>
              )}
            </div>

            <button type="submit" className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px 14px', fontSize: 14 }}
              disabled={loading || !phoneValid}>
              {loading ? 'Sending OTP…' : 'Send OTP'}
            </button>

            <p style={{ fontSize: 12, color: 'var(--fg-muted)', textAlign: 'center', margin: 0 }}>
              OTP will be sent via WhatsApp to your registered mobile.
            </p>
          </form>
        )}

        {mode === 'mobile' && step === 'otp' && (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <p style={{ fontSize: 13, color: 'var(--fg-secondary)', margin: '0 0 4px' }}>
                Enter the 6-digit code sent to
              </p>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)', margin: 0 }}>
                +91 {phoneDigits.slice(0, 5)} {phoneDigits.slice(5)}
                <button type="button" onClick={() => { setStep('phone'); clearError() }}
                  style={{ marginLeft: 8, fontSize: 12, color: 'var(--teal-600)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  Change
                </button>
              </p>
            </div>

            {/* OTP digit boxes */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="tel" inputMode="numeric" maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKey(i, e)}
                  onPaste={handlePaste}
                  style={{
                    flex: 1, height: 50, textAlign: 'center', fontSize: 22, fontWeight: 800,
                    border: error ? '1.5px solid #EF4444' : d ? '1.5px solid var(--teal-600)' : '1.5px solid var(--border-base, #E3EAF2)',
                    borderRadius: 10,
                    background: d ? 'rgba(20,184,166,0.06)' : 'var(--bg-input, #F8FAFC)',
                    color: d ? 'var(--teal-600)' : 'var(--fg-primary)',
                    outline: 'none', minWidth: 0, fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>

            {/* OTP preview pill — gated by frontend OTP_ENABLE config (and
                requires the API to echo back the OTP in its response). */}
            {import.meta.env.OTP_ENABLE === 'true' && previewOtp && (
              <button type="button" onClick={autofillFromDev}
                style={{
                  background: '#FFFBEB', border: '1.5px dashed #FDE68A',
                  borderRadius: 10, padding: '8px 12px',
                  display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'inherit',
                }}>
                <span style={{ fontSize: 18 }}>🔑</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#92400E', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    OTP Preview
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#D97706', letterSpacing: 4 }}>{previewOtp}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#92400E', background: '#FEF3C7', borderRadius: 999, padding: '4px 9px' }}>
                  Tap to fill
                </span>
              </button>
            )}

            {/* Resend timer */}
            <div style={{ textAlign: 'center' }}>
              {countdown > 0 ? (
                <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: 0 }}>
                  Resend code in <b style={{ color: 'var(--teal-600)' }}>{`0:${String(countdown).padStart(2, '0')}`}</b>
                </p>
              ) : (
                <button type="button" onClick={handleResend} disabled={loading}
                  style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--teal-600)', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  ↺ Resend OTP
                </button>
              )}
            </div>

            <button type="submit" className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px 14px', fontSize: 14 }}
              disabled={loading || !otpFilled}>
              {loading ? 'Verifying…' : 'Verify & Sign in'}
            </button>
          </form>
        )}

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 20, lineHeight: 1.6 }}>
          By signing in, you agree to NoQ&apos;s{' '}
          <span style={{ color: 'var(--teal-600)', cursor: 'pointer' }}>Terms of Service</span> and{' '}
          <span style={{ color: 'var(--teal-600)', cursor: 'pointer' }}>Privacy Policy</span>.
        </p>
      </div>
    </div>
  )
}
