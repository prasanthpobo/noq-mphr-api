import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MdLocalHospital } from 'react-icons/md'
import { useAuthStore } from '@/stores/authStore'

const BRAND_GRADIENT = 'linear-gradient(135deg, #102E63 0%, #1E4FA3 55%, #1FA3A8 100%)'

export function Splash() {
  const navigate = useNavigate()
  const token    = useAuthStore((s) => s.token)
  const clinic   = useAuthStore((s) => s.selectedClinic)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!token) navigate('/login', { replace: true })
      else if (!clinic) navigate('/clinic-select', { replace: true })
      else navigate('/', { replace: true })
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div style={{
      flex: 1, minHeight: '100dvh', background: BRAND_GRADIENT,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Roboto, system-ui, sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
      <div style={{ position: 'absolute', top: 80, left: -60, width: 180, height: 180, borderRadius: '50%', background: 'rgba(31,163,168,0.18)' }} />
      <div style={{ position: 'absolute', bottom: 80, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.75 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}
      >
        <div style={{
          width: 96, height: 96, borderRadius: 28,
          background: '#FFFFFF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
        }}>
          <MdLocalHospital size={52} color="#1E4FA3" />
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 40, fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: -1, lineHeight: 1 }}>
            NoQ
          </h1>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 700, margin: '8px 0 0', letterSpacing: '4px' }}>
            FOR DOCTORS
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500, margin: '14px auto 0', maxWidth: 240, lineHeight: 1.5 }}>
            Run your OPD calmly. See the queue, not the chaos.
          </p>
        </div>
      </motion.div>

      {/* ECG line decoration */}
      <svg
        viewBox="0 0 400 60"
        preserveAspectRatio="none"
        style={{ position: 'absolute', bottom: 100, left: 0, width: '100%', height: 50, opacity: 0.35 }}
      >
        <path d="M0,30 L80,30 L90,15 L100,45 L110,30 L180,30 L190,18 L200,42 L210,30 L290,30 L300,16 L310,44 L320,30 L400,30" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      {/* Loading spinner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        style={{ position: 'absolute', bottom: 180, display: 'flex', gap: 8 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.22 }}
            style={{ width: 8, height: 8, borderRadius: '50%', background: '#1FA3A8', display: 'block' }}
          />
        ))}
      </motion.div>
    </div>
  )
}
