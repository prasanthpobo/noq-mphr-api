import { motion } from 'framer-motion'

export default function Loader() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F5F8FC',
        zIndex: 9999,
      }}
    >
      {/* Spinner ring */}
      <div style={{ position: 'relative', width: '52px', height: '52px' }}>
        {/* Outer track */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '4px solid #E8F1FD',
          }}
        />
        {/* Animated arc */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '4px solid transparent',
            borderTopColor: '#2C6ED5',
            borderRightColor: '#1FA3A8',
          }}
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 0.9,
            ease: 'linear',
          }}
        />
      </div>

      {/* Brand wordmark dots */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          marginTop: '20px',
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)',
            }}
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
            transition={{
              repeat: Infinity,
              duration: 1.2,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  )
}
