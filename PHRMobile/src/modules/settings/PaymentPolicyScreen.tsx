import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiArrowLeft } from 'react-icons/hi'
import { MdPayment } from 'react-icons/md'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

const SECTIONS = [
  {
    title: '1. Platform Fee Policy',
    points: [
      'All fees charged through the NoQ platform are non-refundable once the transaction has been processed.',
      'Platform fees cover the cost of service facilitation, queue management, and digital infrastructure.',
      'These fees are separate from any consultation fees charged directly by healthcare providers.',
    ],
  },
  {
    title: '2. No Refund Policy',
    points: [
      'No refunding based on platform fee services. Once a platform fee is paid, it cannot be reversed or refunded under any circumstances.',
      'This policy applies regardless of whether the appointment was attended, rescheduled, or cancelled.',
      'Platform fees are collected to maintain and operate the NoQ digital queue and appointment system.',
    ],
  },
  {
    title: '3. Appointment Cancellation',
    points: [
      'Cancelling an appointment does not entitle the user to a refund of platform fees already paid.',
      'Consultation fees paid directly to clinics or doctors are subject to the respective provider\'s own refund policy.',
      'Please contact the clinic or healthcare provider directly for queries regarding consultation fee refunds.',
    ],
  },
  {
    title: '4. Disputed Charges',
    points: [
      'If you believe a charge was made in error, contact NoQ support within 7 days of the transaction.',
      'We will review the case and respond within 5 business days.',
      'Verified billing errors will be corrected; however, platform service fees remain non-refundable.',
    ],
  },
  {
    title: '5. Changes to This Policy',
    points: [
      'NoQ reserves the right to update this Payment Policy at any time.',
      'Users will be notified of significant changes via in-app notification or email.',
      'Continued use of the platform after changes constitutes acceptance of the updated policy.',
    ],
  },
]

export default function PaymentPolicyScreen() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#F5F8FC',
        fontFamily: 'Roboto, system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: BRAND_GRADIENT,
          padding: '16px',
          paddingTop: 'max(16px, env(safe-area-inset-top))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '10px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <HiArrowLeft size={20} color="#FFFFFF" />
          </motion.button>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
            Payment Policy
          </h1>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <MdPayment size={24} color="#FFFFFF" />
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 2px' }}>
              NoQ Payment Policy
            </p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', margin: 0 }}>
              Effective: January 2025
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px 16px', paddingBottom: '32px' }}>
        {/* Highlight box */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: '#FFF8E1',
            border: '1.5px solid #F59E0B',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '20px',
          }}
        >
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#92400E', margin: '0 0 4px' }}>
            Important Notice
          </p>
          <p style={{ fontSize: '13px', color: '#92400E', margin: 0, lineHeight: 1.5 }}>
            No refunding based on platform fee services. All platform fees are final upon payment.
          </p>
        </motion.div>

        {SECTIONS.map((section, i) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '12px',
              boxShadow: '0 2px 8px rgba(30,79,163,0.07)',
            }}
          >
            <p
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#1E4FA3',
                margin: '0 0 10px',
              }}
            >
              {section.title}
            </p>
            {section.points.map((point, j) => (
              <div
                key={j}
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: j < section.points.length - 1 ? '8px' : 0,
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#2C6ED5',
                    flexShrink: 0,
                    marginTop: '6px',
                  }}
                />
                <p style={{ fontSize: '13px', color: '#4A5568', lineHeight: 1.6, margin: 0 }}>
                  {point}
                </p>
              </div>
            ))}
          </motion.div>
        ))}

        <p
          style={{
            fontSize: '11px',
            color: '#A0AEC0',
            textAlign: 'center',
            marginTop: '8px',
            lineHeight: 1.5,
          }}
        >
          For payment support, contact us at support@noq.health
        </p>
      </div>
    </div>
  )
}
