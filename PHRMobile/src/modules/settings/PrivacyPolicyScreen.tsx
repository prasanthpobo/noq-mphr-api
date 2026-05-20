import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiArrowLeft } from 'react-icons/hi'
import { MdPrivacyTip } from 'react-icons/md'

const TEAL_GRADIENT = 'linear-gradient(135deg, #0F766E 0%, #14B8A6 50%, #06B6D4 100%)'

const SECTIONS = [
  {
    title: '1. Information We Collect',
    points: [
      'Personal details: full name, date of birth, gender, national identification number, and contact information.',
      'Health information: medical history, diagnoses, prescriptions, lab results, and appointment records.',
      'Device information: IP address, device type, operating system, and app usage logs.',
      'Location data (optional): used only to find nearby clinics when you grant permission.',
      'Communications: messages sent through the in-app support or chat features.',
    ],
  },
  {
    title: '2. How We Use Your Information',
    points: [
      'To provide and operate the NoQ service, including booking appointments and managing queue positions.',
      'To securely store and display your personal health records (PHR) within the App.',
      'To send appointment reminders, queue updates, and service notifications.',
      'To improve the App through aggregated, anonymized usage analytics.',
      'To comply with legal and regulatory obligations, including healthcare data regulations.',
      'To detect and prevent fraud, abuse, or unauthorized access.',
    ],
  },
  {
    title: '3. Data Sharing',
    points: [
      'We share your information with healthcare providers only to facilitate the appointment or service you requested.',
      'We do not sell your personal or health data to third parties under any circumstances.',
      'We may share data with trusted technology partners (e.g., cloud hosting) under strict data processing agreements.',
      'Data may be disclosed to authorities if required by law or valid legal process.',
      'In the event of a merger or acquisition, user data may be transferred as part of the business assets, with prior notice.',
    ],
  },
  {
    title: '4. Data Security',
    points: [
      'All data is encrypted in transit using TLS 1.2 or higher.',
      'Health records at rest are encrypted using AES-256.',
      'Access to personal health data is strictly controlled and audited.',
      'We perform regular security assessments and penetration testing.',
      'Despite our best efforts, no system is 100% secure. Please use a strong password and enable Two-Factor Authentication.',
    ],
  },
  {
    title: '5. Data Retention',
    points: [
      'Account data is retained for as long as your account is active.',
      'Health records are retained for a minimum of 7 years in compliance with Malaysian healthcare regulations.',
      'Support communications are retained for up to 3 years.',
      'Upon account deletion, personal data is anonymized or deleted within 30 days, except where retention is legally required.',
    ],
  },
  {
    title: '6. Your Rights',
    points: [
      'Right to access: you may request a copy of your personal data held by NoQ at any time.',
      'Right to correction: you may update inaccurate personal data through your profile settings.',
      'Right to deletion: you may request account deletion from the Settings screen.',
      'Right to data portability: you may request your health records in a machine-readable format.',
      'Right to withdraw consent: you may opt out of non-essential data uses at any time in Settings.',
    ],
  },
  {
    title: '7. Cookies & Tracking',
    points: [
      'The App uses local storage and session tokens to maintain your login session.',
      'We do not use third-party advertising cookies or tracking pixels.',
      'Anonymized analytics may use crash reporting tools such as Sentry to improve stability.',
      'You may clear your local data by logging out or clearing the app cache.',
    ],
  },
  {
    title: '8. Children\'s Privacy',
    points: [
      'The App is not intended for direct use by children under 13.',
      'Children may be registered as family members under a parent or guardian\'s account.',
      'Health data for minors is accessible only to the registered guardian.',
      'If we become aware of data collected from a child without guardian consent, we will delete it promptly.',
    ],
  },
  {
    title: '9. Changes to This Policy',
    points: [
      'We may update this Privacy Policy from time to time to reflect legal or service changes.',
      'Material changes will be communicated via in-app notification or email.',
      'The effective date at the top of this document will be updated with each revision.',
      'Continued use of the App after notification constitutes acceptance of the updated policy.',
    ],
  },
  {
    title: '10. Contact & Complaints',
    points: [
      'For privacy-related enquiries, contact our Data Protection Officer at privacy@noq.app.',
      'You have the right to lodge a complaint with the Personal Data Protection Commissioner of Malaysia.',
      'We aim to respond to all privacy requests within 14 working days.',
    ],
  },
]

export default function PrivacyPolicyScreen() {
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
        <span style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>Privacy Policy</span>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 40px' }}>

        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(15,118,110,0.18)', marginBottom: 20 }}
        >
          <div style={{ background: TEAL_GRADIENT, padding: '24px 20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
            <div style={{ position: 'absolute', bottom: -20, left: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(255,255,255,0.20)', border: '2px solid rgba(255,255,255,0.40)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <MdPrivacyTip size={26} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>Privacy Policy</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', marginBottom: 8 }}>How we collect, use & protect your data</div>
                <span style={{ fontSize: 12, fontWeight: 600, borderRadius: 20, padding: '3px 10px', background: 'rgba(255,255,255,0.20)', color: '#FFFFFF' }}>
                  Effective: 1 January 2025
                </span>
              </div>
            </div>
          </div>
          <div style={{ background: '#FFFFFF', padding: '14px 20px' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#6B7C93', lineHeight: 1.65 }}>
              Your privacy matters to us. This policy explains what data we collect, why we collect it, and how we keep it safe.
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
            <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #F0F4F8' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#1A1A1A' }}>{section.title}</span>
            </div>
            <div style={{ padding: '12px 16px 14px' }}>
              {section.points.map((point, pi) => (
                <div key={pi} style={{ display: 'flex', gap: 10, marginBottom: pi < section.points.length - 1 ? 10 : 0 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    background: TEAL_GRADIENT,
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
