import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiArrowLeft, HiExternalLink } from 'react-icons/hi'
import { MdCode } from 'react-icons/md'

const PURPLE_GRADIENT = 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 50%, #A855F7 100%)'

interface License {
  name: string
  version: string
  license: string
  description: string
  url: string
}

const LICENSES: License[] = [
  {
    name: 'React',
    version: '18.3.1',
    license: 'MIT',
    description: 'A JavaScript library for building user interfaces.',
    url: 'https://github.com/facebook/react',
  },
  {
    name: 'React DOM',
    version: '18.3.1',
    license: 'MIT',
    description: 'React package for working with the DOM.',
    url: 'https://github.com/facebook/react',
  },
  {
    name: 'React Router DOM',
    version: '6.x',
    license: 'MIT',
    description: 'Declarative routing for React applications.',
    url: 'https://github.com/remix-run/react-router',
  },
  {
    name: 'Framer Motion',
    version: '11.x',
    license: 'MIT',
    description: 'A production-ready motion library for React.',
    url: 'https://github.com/framer/motion',
  },
  {
    name: 'Axios',
    version: '1.x',
    license: 'MIT',
    description: 'Promise-based HTTP client for the browser and Node.js.',
    url: 'https://github.com/axios/axios',
  },
  {
    name: 'Day.js',
    version: '1.x',
    license: 'MIT',
    description: 'Fast 2kB alternative to Moment.js with the same modern API.',
    url: 'https://github.com/iamkun/dayjs',
  },
  {
    name: 'React Icons',
    version: '5.x',
    license: 'MIT',
    description: 'Popular icons library for React (includes HeroIcons, Material Design Icons, and more).',
    url: 'https://github.com/react-icons/react-icons',
  },
  {
    name: 'Zustand',
    version: '5.x',
    license: 'MIT',
    description: 'A small, fast, and scalable state management solution.',
    url: 'https://github.com/pmndrs/zustand',
  },
  {
    name: 'TypeScript',
    version: '5.x',
    license: 'Apache-2.0',
    description: 'A strongly typed programming language that builds on JavaScript.',
    url: 'https://github.com/microsoft/TypeScript',
  },
  {
    name: 'Vite',
    version: '5.x',
    license: 'MIT',
    description: 'Next generation frontend tooling for fast development builds.',
    url: 'https://github.com/vitejs/vite',
  },
  {
    name: 'Express',
    version: '4.x',
    license: 'MIT',
    description: 'Fast, unopinionated, minimalist web framework for Node.js.',
    url: 'https://github.com/expressjs/express',
  },
  {
    name: 'Mongoose',
    version: '8.x',
    license: 'MIT',
    description: 'Elegant MongoDB object modeling for Node.js.',
    url: 'https://github.com/Automattic/mongoose',
  },
  {
    name: 'JSON Web Token (jsonwebtoken)',
    version: '9.x',
    license: 'MIT',
    description: 'An implementation of JSON Web Tokens for authentication.',
    url: 'https://github.com/auth0/node-jsonwebtoken',
  },
  {
    name: 'bcryptjs',
    version: '2.x',
    license: 'MIT',
    description: 'Optimized bcrypt library for password hashing.',
    url: 'https://github.com/dcodeIO/bcrypt.js',
  },
  {
    name: 'dotenv',
    version: '16.x',
    license: 'BSD-2-Clause',
    description: 'Loads environment variables from a .env file into process.env.',
    url: 'https://github.com/motdotla/dotenv',
  },
  {
    name: 'cors',
    version: '2.x',
    license: 'MIT',
    description: 'Node.js CORS middleware for Express.',
    url: 'https://github.com/expressjs/cors',
  },
  {
    name: 'Multer',
    version: '1.x',
    license: 'MIT',
    description: 'Node.js middleware for handling multipart/form-data (file uploads).',
    url: 'https://github.com/expressjs/multer',
  },
  {
    name: 'ESLint',
    version: '9.x',
    license: 'MIT',
    description: 'Pluggable JavaScript linter for identifying and reporting code problems.',
    url: 'https://github.com/eslint/eslint',
  },
]

const LICENSE_COLORS: Record<string, { bg: string; text: string }> = {
  'MIT':           { bg: '#F0FDF4', text: '#15803D' },
  'Apache-2.0':    { bg: '#EFF6FF', text: '#1E40AF' },
  'BSD-2-Clause':  { bg: '#FFF7ED', text: '#9A3412' },
}

export default function LicensesScreen() {
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
        <span style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>Licenses</span>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 40px' }}>

        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(91,33,182,0.18)', marginBottom: 20 }}
        >
          <div style={{ background: PURPLE_GRADIENT, padding: '24px 20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
            <div style={{ position: 'absolute', bottom: -20, left: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(255,255,255,0.20)', border: '2px solid rgba(255,255,255,0.40)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <MdCode size={28} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>Open Source Licenses</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', marginBottom: 8 }}>Libraries & frameworks powering NoQ</div>
                <span style={{ fontSize: 12, fontWeight: 600, borderRadius: 20, padding: '3px 10px', background: 'rgba(255,255,255,0.20)', color: '#FFFFFF' }}>
                  {LICENSES.length} packages
                </span>
              </div>
            </div>
          </div>
          <div style={{ background: '#FFFFFF', padding: '14px 20px' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#6B7C93', lineHeight: 1.65 }}>
              NoQ is built on a foundation of amazing open-source software. We are grateful to the developers and communities behind these projects.
            </p>
          </div>
        </motion.div>

        {/* License cards */}
        <div style={{ background: '#FFFFFF', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(30,79,163,0.06)' }}>
          {LICENSES.map((lib, i) => {
            const lc = LICENSE_COLORS[lib.license] ?? { bg: '#F1F5F9', text: '#475569' }
            return (
              <motion.div
                key={lib.name}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + i * 0.03, duration: 0.25 }}
                style={{
                  padding: '14px 16px',
                  borderBottom: i < LICENSES.length - 1 ? '1px solid #F0F4F8' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{lib.name}</span>
                    <span style={{ fontSize: 11, color: '#A0AEC0', flexShrink: 0 }}>v{lib.version}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '2px 9px',
                      background: lc.bg, color: lc.text,
                    }}>
                      {lib.license}
                    </span>
                    <HiExternalLink size={14} color="#A0AEC0" />
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: '#6B7C93', lineHeight: 1.55 }}>{lib.description}</p>
              </motion.div>
            )
          })}
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: 16, padding: '14px 16px', marginTop: 12, boxShadow: '0 2px 12px rgba(30,79,163,0.06)' }}>
          <p style={{ margin: 0, fontSize: 12, color: '#6B7C93', lineHeight: 1.65 }}>
            All third-party libraries retain their respective copyrights and are used in accordance with their license terms. Full license texts are available in the app bundle or on each project's repository page.
          </p>
        </div>

        <p style={{ fontSize: 11, color: '#A0AEC0', textAlign: 'center', marginTop: 12, lineHeight: 1.6 }}>
          © 2025 NoQ Health Technologies Sdn. Bhd. All rights reserved.
        </p>
      </div>
    </div>
  )
}
