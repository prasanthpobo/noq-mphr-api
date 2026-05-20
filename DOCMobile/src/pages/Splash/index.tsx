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
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: -1 }}>
            NoQ Doctor
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', fontWeight: 500, margin: '6px 0 0' }}>
            Clinic management, redefined.
          </p>
        </div>
      </motion.div>

      {/* Loading dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        style={{ position: 'absolute', bottom: 60, display: 'flex', gap: 8 }}
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
