import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function SplashScreen() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login', { replace: true })
    }, 2500)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div
      style={{
        minHeight: '100%',
        flex: 1,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative blobs */}
      <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
      <div style={{ position: 'absolute', bottom: '-60px', left: '-40px', width: 240, height: 240, borderRadius: '50%', background: 'rgba(31,163,168,0.18)' }} />

      {/* Center content */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '0 32px', position: 'relative', zIndex: 1 }}>

        {/* Logo mark */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        >
          <div
            style={{
              width: 96, height: 96, borderRadius: 28,
              background: 'rgba(255,255,255,0.15)',
              border: '2px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 16px 40px rgba(0,0,0,0.2)',
            }}
          >
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L3 7v6c0 5 3.8 8.5 9 10 5.2-1.5 9-5 9-10V7l-9-5z"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
          </div>
        </motion.div>

        {/* App name */}
        <motion.div
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
        >
          <h1 style={{ fontSize: 52, fontWeight: 800, color: '#fff', letterSpacing: -1, lineHeight: 1, margin: 0 }}>
            NoQ
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: 500, textAlign: 'center', margin: 0 }}>
            Smart Clinic Queue Management
          </p>
        </motion.div>

        {/* Feature list */}
        <motion.div
          style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', marginTop: 8 }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.45 }}
        >
          {[
            { icon: '⚡', text: 'Skip the queue — book tokens instantly' },
            { icon: '📅', text: 'Manage appointments effortlessly' },
            { icon: '📋', text: 'Access your health records anytime' },
          ].map((f) => (
            <div
              key={f.text}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'rgba(255,255,255,0.12)',
                borderRadius: 14,
                padding: '12px 16px',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              <span style={{ fontSize: 20 }}>{f.icon}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>{f.text}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Version footer */}
      <motion.p
        style={{
          position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center',
          fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        v1.0.0
      </motion.p>
    </div>
  )
}
