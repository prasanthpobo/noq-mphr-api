import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiChevronRight,
  HiExclamationCircle,
} from 'react-icons/hi'
import MobileHeader from '../../components/MobileHeader'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ToggleStates {
  appointmentReminders: boolean
  queueUpdates: boolean
  promotions: boolean
  shareHealthData: boolean
  anonymousAnalytics: boolean
  twoFactorAuth: boolean
}

// ── Custom Toggle Component ───────────────────────────────────────────────────

interface ToggleProps {
  enabled: boolean
  onChange: (value: boolean) => void
}

function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <motion.button
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      animate={{ background: enabled ? '#2C6ED5' : '#CBD5E0' }}
      transition={{ duration: 0.2 }}
      style={{
        width: '48px',
        height: '28px',
        borderRadius: '14px',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        flexShrink: 0,
        padding: 0,
        outline: 'none',
      }}
    >
      <motion.div
        animate={{ x: enabled ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{
          position: 'absolute',
          top: '3px',
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: '#FFFFFF',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }}
      />
    </motion.button>
  )
}

// ── Toggle Row ────────────────────────────────────────────────────────────────

interface ToggleRowProps {
  label: string
  description: string
  enabled: boolean
  onChange: (value: boolean) => void
  isLast?: boolean
}

function ToggleRow({ label, description, enabled, onChange, isLast = false }: ToggleRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '14px 16px',
        borderBottom: isLast ? 'none' : '1px solid #EEF2F7',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A', margin: '0 0 2px' }}>
          {label}
        </p>
        <p style={{ fontSize: '12px', color: '#A0AEC0', margin: 0, lineHeight: 1.4 }}>
          {description}
        </p>
      </div>
      <Toggle enabled={enabled} onChange={onChange} />
    </div>
  )
}

// ── Preference Row ────────────────────────────────────────────────────────────

interface PreferenceRowProps {
  label: string
  value: string
  onTap?: () => void
  isLast?: boolean
}

function PreferenceRow({ label, value, onTap, isLast = false }: PreferenceRowProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        background: 'none',
        border: 'none',
        borderBottom: isLast ? 'none' : '1px solid #EEF2F7',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontSize: '14px', color: '#6B7C93' }}>{value}</span>
        <HiChevronRight size={16} color="#A0AEC0" />
      </div>
    </motion.button>
  )
}

// ── Nav Row ───────────────────────────────────────────────────────────────────

interface NavRowProps {
  label: string
  onTap?: () => void
  isLast?: boolean
  valueText?: string
}

function NavRow({ label, onTap, isLast = false, valueText }: NavRowProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        background: 'none',
        border: 'none',
        borderBottom: isLast ? 'none' : '1px solid #EEF2F7',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>{label}</span>
      {valueText ? (
        <span style={{ fontSize: '13px', color: '#A0AEC0' }}>{valueText}</span>
      ) : (
        <HiChevronRight size={16} color="#A0AEC0" />
      )}
    </motion.button>
  )
}

// ── Section Card ──────────────────────────────────────────────────────────────

interface SectionCardProps {
  title: string
  children: React.ReactNode
  index: number
}

function SectionCard({ title, children, index }: SectionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      style={{ marginBottom: '20px' }}
    >
      <p
        style={{
          fontSize: '12px',
          fontWeight: 700,
          color: '#A0AEC0',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          margin: '0 0 8px 4px',
        }}
      >
        {title}
      </p>
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(30,79,163,0.08)',
        }}
      >
        {children}
      </div>
    </motion.div>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const navigate = useNavigate()

  const [toggles, setToggles] = useState<ToggleStates>({
    appointmentReminders: true,
    queueUpdates: true,
    promotions: false,
    shareHealthData: false,
    anonymousAnalytics: true,
    twoFactorAuth: false,
  })

  const setToggle = (key: keyof ToggleStates) => (value: boolean) => {
    setToggles((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#F5F8FC',
        fontFamily: 'Roboto, system-ui, sans-serif',
        overflowX: 'hidden',
      }}
    >
      {/* Header */}
      <MobileHeader title="Settings" showBack />

      {/* Content */}
      <div style={{ padding: '16px 16px', paddingBottom: '96px' }}>

        {/* ── Section 1: Notifications ─────────────────────────────────────── */}
        <SectionCard title="Notifications" index={0}>
          <ToggleRow
            label="Appointment Reminders"
            description="Get notified before your scheduled appointments"
            enabled={toggles.appointmentReminders}
            onChange={setToggle('appointmentReminders')}
          />
          <ToggleRow
            label="Queue Updates"
            description="Real-time updates about your queue position"
            enabled={toggles.queueUpdates}
            onChange={setToggle('queueUpdates')}
          />
          <ToggleRow
            label="Promotions"
            description="Health tips, offers and clinic promotions"
            enabled={toggles.promotions}
            onChange={setToggle('promotions')}
            isLast
          />
        </SectionCard>

        {/* ── Section 2: Preferences ───────────────────────────────────────── */}
        <SectionCard title="Preferences" index={1}>
          <PreferenceRow
            label="Language"
            value="English"
            onTap={() => console.log('Language settings')}
          />
          <PreferenceRow
            label="Consultation Mode"
            value="In-person"
            onTap={() => console.log('Consultation mode settings')}
          />
          <PreferenceRow
            label="Default Clinic"
            value="City Medical Center"
            onTap={() => console.log('Default clinic settings')}
            isLast
          />
        </SectionCard>

        {/* ── Section 3: Privacy ───────────────────────────────────────────── */}
        <SectionCard title="Privacy" index={2}>
          <ToggleRow
            label="Share Health Data"
            description="Allow anonymized data sharing for research"
            enabled={toggles.shareHealthData}
            onChange={setToggle('shareHealthData')}
          />
          <ToggleRow
            label="Anonymous Analytics"
            description="Help improve the app with usage analytics"
            enabled={toggles.anonymousAnalytics}
            onChange={setToggle('anonymousAnalytics')}
          />
          <ToggleRow
            label="Two-Factor Auth"
            description="Require OTP verification on each login"
            enabled={toggles.twoFactorAuth}
            onChange={setToggle('twoFactorAuth')}
            isLast
          />
        </SectionCard>

        {/* ── Section 4: App Info ──────────────────────────────────────────── */}
        <SectionCard title="App Info" index={3}>
          <NavRow label="App Version" valueText="1.0.0" isLast={false} />
          <NavRow
            label="Terms of Service"
            onTap={() => navigate('/app/settings/terms')}
          />
          <NavRow
            label="Privacy Policy"
            onTap={() => navigate('/app/settings/privacy')}
          />
          <NavRow
            label="Licenses"
            onTap={() => navigate('/app/settings/licenses')}
            isLast
          />
        </SectionCard>

        {/* ── Danger Zone ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.4 }}
          style={{
            border: '1.5px solid #FEB2B2',
            borderRadius: '16px',
            overflow: 'hidden',
            background: '#FFFAFA',
          }}
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => console.log('Delete account requested')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '18px 16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <HiExclamationCircle size={20} color="#E53E3E" />
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#E53E3E' }}>
              Delete Account
            </span>
          </motion.button>
        </motion.div>

        <p
          style={{
            fontSize: '11px',
            color: '#A0AEC0',
            textAlign: 'center',
            marginTop: '8px',
            lineHeight: 1.5,
          }}
        >
          Deleting your account is permanent and cannot be undone.
        </p>
      </div>
    </div>
  )
}
