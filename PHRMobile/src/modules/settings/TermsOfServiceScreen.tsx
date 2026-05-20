import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiArrowLeft } from 'react-icons/hi'
import { MdGavel } from 'react-icons/md'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    points: [
      'By accessing or using the NoQ mobile application ("App"), you agree to be bound by these Terms of Service.',
      'If you do not agree to these terms, please do not use the App.',
      'We reserve the right to modify these terms at any time. Continued use of the App after changes constitutes acceptance.',
      'These terms apply to all users including patients, caregivers, and family members who access the service.',
    ],
  },
  {
    title: '2. Use of the Service',
    points: [
      'NoQ provides a platform to book medical appointments, manage queue positions, and access personal health records.',
      'You must be at least 18 years of age to create an account. Minors may be registered as family members under a guardian’s account.',
      'You agree not to misuse the service, including submitting false information, impersonating others, or disrupting service operations.',
      'The App is intended for personal, non-commercial use only.',
      'Automated access, scraping, or programmatic use of the platform is strictly prohibited.',
    ],
  },
  {
    title: '3. User Accounts',
    points: [
      'You are responsible for maintaining the confidentiality of your login credentials.',
      'You must notify us immediately of any unauthorized use of your account.',
      'Each user may maintain only one account. Duplicate accounts may be removed without notice.',
      'Account information must be accurate and kept up to date. False information may result in account suspension.',
    ],
  },
  {
    title: '4. Medical Disclaimer',
    points: [
      'NoQ is a scheduling and queue management platform — it does not provide medical advice, diagnosis, or treatment.',
      'All medical decisions must be made in consultation with a qualified healthcare professional.',
      'Health records displayed in the App are sourced from connected clinics and may not be complete or current.',
      'In the event of a medical emergency, please contact emergency services immediately (e.g., call 999 or go to your nearest A&E).',
    ],
  },
  {
    title: '5. Appointments & Cancellations',
    points: [
      'Appointments booked through NoQ are subject to the availability and policies of the respective clinic or doctor.',
      'Cancellations made less than 2 hours before the scheduled time may attract a no-show fee at the clinic\'s discretion.',
      'NoQ is not liable for appointment cancellations initiated by the clinic or healthcare provider.',
      'Queue positions are estimated and may vary depending on real-time clinic conditions.',
    ],
  },
  {
    title: '6. Intellectual Property',
    points: [
      'All content, branding, logos, and design elements within the App are the property of NoQ and protected by copyright law.',
      'You may not reproduce, distribute, or create derivative works from any App content without written permission.',
      'User-submitted content (such as health notes or uploaded documents) remains the property of the user.',
      'By submitting content, you grant NoQ a limited licence to store and display it within the App.',
    ],
  },
  {
    title: '7. Limitation of Liability',
    points: [
      'NoQ shall not be liable for any indirect, incidental, or consequential damages arising from use of the App.',
      'Our total liability to you for any claim shall not exceed the amount paid by you to NoQ in the preceding 12 months.',
      'We do not guarantee uninterrupted, error-free access to the service.',
      'NoQ is not responsible for the actions, advice, or service quality of any healthcare provider listed on the platform.',
    ],
  },
  {
    title: '8. Termination',
    points: [
      'We reserve the right to suspend or terminate your account for violation of these terms.',
      'You may delete your account at any time from the Settings screen within the App.',
      'Upon termination, your right to use the App ceases immediately.',
      'Certain provisions of these terms, including liability limitations, will survive termination.',
    ],
  },
  {
    title: '9. Governing Law',
    points: [
      'These terms are governed by the laws of Malaysia and applicable local regulations.',
      'Any disputes shall be subject to the exclusive jurisdiction of the courts of Malaysia.',
      'If any provision of these terms is found unenforceable, the remaining provisions continue in full effect.',
    ],
  },
  {
    title: '10. Contact Us',
    points: [
      'For questions about these Terms of Service, please contact us at legal@noq.app.',
      'Support requests should be submitted via the in-app Support section.',
      'Our registered business address: NoQ Health Technologies Sdn. Bhd., Kuala Lumpur, Malaysia.',
    ],
  },
]

export default function TermsOfServiceScreen() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100dvh', background: '#F5F8FC', fontFamily: 'Roboto, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* White nav bar */}
      <div style={{
        background: '#FFFFFF', padding: '12px 16px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #F0F4F8', flexShrink: 0,
      }}>
        <button onClick={() => navigate(-1)} style={{
          width: 36, height: 36, borderRadius: 10, background: '#F5F8FC',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <HiArrowLeft size={18} color="#1A1A1A" />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>Terms of Service</span>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 40px' }}>

        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(30,79,163,0.14)', marginBottom: 20 }}
        >
          <div style={{ background: BRAND_GRADIENT, padding: '24px 20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
            <div style={{ position: 'absolute', bottom: -20, left: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(255,255,255,0.20)', border: '2px solid rgba(255,255,255,0.40)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <MdGavel size={26} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>Terms of Service</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', marginBottom: 8 }}>Please read these terms carefully</div>
                <span style={{ fontSize: 12, fontWeight: 600, borderRadius: 20, padding: '3px 10px', background: 'rgba(255,255,255,0.20)', color: '#FFFFFF' }}>
                  Effective: 1 January 2025
                </span>
              </div>
            </div>
          </div>
          <div style={{ background: '#FFFFFF', padding: '14px 20px' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#6B7C93', lineHeight: 1.65 }}>
              These Terms of Service govern your use of the NoQ app and services. By using NoQ, you enter into a binding agreement with us.
            </p>
          </div>
        </motion.div>

        {/* Sections */}
        {SECTIONS.map((section, si) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + si * 0.04, duration: 0.3 }}
            style={{ background: '#FFFFFF', borderRadius: 16, marginBottom: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(30,79,163,0.06)' }}
          >
            {/* Section header */}
            <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #F0F4F8' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#1A1A1A' }}>{section.title}</span>
            </div>
            {/* Points */}
            <div style={{ padding: '12px 16px 14px' }}>
              {section.points.map((point, pi) => (
                <div key={pi} style={{ display: 'flex', gap: 10, marginBottom: pi < section.points.length - 1 ? 10 : 0 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    background: 'linear-gradient(135deg, #1E4FA3, #1FA3A8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#FFFFFF' }}>{pi + 1}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#4A5568', lineHeight: 1.65, flex: 1 }}>{point}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        <p style={{ fontSize: 11, color: '#A0AEC0', textAlign: 'center', marginTop: 8, lineHeight: 1.6 }}>
          © 2025 NoQ Health Technologies Sdn. Bhd. All rights reserved.
        </p>
      </div>
    </div>
  )
}
