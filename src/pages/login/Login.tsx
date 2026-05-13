import { useState } from 'react'
import { useAppStore } from '@/store/app'
import Icon from '@/components/ui/Icon'

export default function LoginPage() {
  const { setAuthed } = useAppStore()

  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [keepMe, setKeepMe]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)
    // Simulate network delay then log in
    setTimeout(() => {
      setLoading(false)
      setAuthed(true)
    }, 600)
  }

  const handleSso = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setAuthed(true)
    }, 600)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">N</div>

        {/* Headings */}
        <h1 style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
          Sign in to NoQ
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--fg-secondary)', fontSize: 13.5, marginBottom: 24 }}>
          Clinic admin dashboard
        </p>

        {/* Error banner */}
        {error && (
          <div style={{
            background: 'var(--danger-100)', color: 'var(--danger-500)',
            borderRadius: 10, padding: '9px 12px', fontSize: 13, marginBottom: 16,
            border: '1px solid rgba(239,68,68,0.2)', fontWeight: 500
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Email */}
          <div className="form-group">
            <label className="form-label required" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@clinic.in"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="form-label required" htmlFor="password">Password</label>
              <button
                type="button"
                style={{ fontSize: 12, color: 'var(--teal-600)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
              >
                Forgot?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--fg-muted)', padding: 2, lineHeight: 0
                }}
                title={showPw ? 'Hide password' : 'Show password'}
              >
                <Icon name={showPw ? 'eye' : 'eye'} size={16} />
              </button>
            </div>
          </div>

          {/* Keep me signed in */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={keepMe}
              onChange={e => setKeepMe(e.target.checked)}
              style={{ width: 15, height: 15, accentColor: 'var(--teal-600)', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 13, color: 'var(--fg-secondary)', fontWeight: 500 }}>Keep me signed in</span>
          </label>

          {/* Sign in button */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '11px 14px', fontSize: 14 }}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
          <span style={{ fontSize: 12, color: 'var(--fg-muted)', fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
        </div>

        {/* SSO button */}
        <button
          type="button"
          className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'center', padding: '10px 14px', fontSize: 13.5 }}
          onClick={handleSso}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path d="M21.8 10.3H12v3.8h5.6c-.5 2.5-2.8 4.3-5.6 4.3-3.4 0-6.1-2.7-6.1-6.1s2.7-6.1 6.1-6.1c1.5 0 2.9.6 4 1.5l2.7-2.7C16.8 3.5 14.5 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c5.8 0 9.7-4.1 9.7-9.8 0-.5-.1-1.1-.2-1.5z" fill="#4285F4"/>
          </svg>
          Continue with SSO / Google Workspace
        </button>

        {/* Footer note */}
        <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 20, lineHeight: 1.6 }}>
          By signing in, you agree to NoQ&apos;s{' '}
          <span style={{ color: 'var(--teal-600)', cursor: 'pointer' }}>Terms of Service</span> and{' '}
          <span style={{ color: 'var(--teal-600)', cursor: 'pointer' }}>Privacy Policy</span>.
        </p>
      </div>
    </div>
  )
}
