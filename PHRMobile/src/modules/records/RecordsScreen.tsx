import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  HiDocumentText,
  HiPhotograph,
  HiClipboard,
  HiDownload,
  HiShare,
  HiUpload,
  HiPlus,
} from 'react-icons/hi'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

// ── Types ─────────────────────────────────────────────────────────────────────

type FileType = 'pdf' | 'image' | 'doc'
type RecordCategory = 'All' | 'Lab Reports' | 'Prescriptions' | 'Imaging' | 'Certificates'

interface MedicalRecord {
  id: string
  name: string
  doctorOrLab: string
  date: string
  fileSize: string
  fileType: FileType
  tags: string[]
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const RECORDS: MedicalRecord[] = [
  {
    id: 'r1',
    name: 'Blood Test Report',
    doctorOrLab: 'Apollo Diagnostics',
    date: '10 May 2026',
    fileSize: '1.2 MB',
    fileType: 'pdf',
    tags: ['Lab Report'],
  },
  {
    id: 'r2',
    name: 'Chest X-Ray Report',
    doctorOrLab: 'City Imaging Center',
    date: '02 May 2026',
    fileSize: '3.8 MB',
    fileType: 'image',
    tags: ['Imaging'],
  },
  {
    id: 'r3',
    name: 'Prescription — Cardiology',
    doctorOrLab: 'Dr. Suresh Reddy',
    date: '28 Apr 2026',
    fileSize: '0.4 MB',
    fileType: 'doc',
    tags: ['Prescription'],
  },
  {
    id: 'r4',
    name: 'Lipid Profile Report',
    doctorOrLab: 'Thyrocare Labs',
    date: '15 Apr 2026',
    fileSize: '0.9 MB',
    fileType: 'pdf',
    tags: ['Lab Report'],
  },
  {
    id: 'r5',
    name: 'Medical Fitness Certificate',
    doctorOrLab: 'Dr. Anita Singh',
    date: '10 Mar 2026',
    fileSize: '0.3 MB',
    fileType: 'doc',
    tags: ['Certificates'],
  },
]

const FILTER_TABS: RecordCategory[] = [
  'All',
  'Lab Reports',
  'Prescriptions',
  'Imaging',
  'Certificates',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFileTypeConfig(type: FileType): {
  icon: React.ComponentType<{ size?: number; color?: string }>
  color: string
  bg: string
} {
  switch (type) {
    case 'pdf':
      return { icon: HiDocumentText, color: '#E53E3E', bg: '#FFF5F5' }
    case 'image':
      return { icon: HiPhotograph, color: '#2C6ED5', bg: '#EBF2FF' }
    case 'doc':
      return { icon: HiClipboard, color: '#16A34A', bg: '#ECFDF5' }
  }
}

function getTagChipStyle(tag: string): React.CSSProperties {
  const map: Record<string, { bg: string; color: string }> = {
    'Lab Report': { bg: '#EBF2FF', color: '#2C6ED5' },
    'Prescription': { bg: '#E6F6F6', color: '#1FA3A8' },
    'Imaging': { bg: '#F3EEFF', color: '#7C3AED' },
    'Certificates': { bg: '#ECFDF5', color: '#16A34A' },
  }
  const style = map[tag] ?? { bg: '#F5F8FC', color: '#6B7C93' }
  return {
    fontSize: '11px',
    fontWeight: 600,
    borderRadius: '20px',
    padding: '3px 9px',
    background: style.bg,
    color: style.color,
  }
}

// ── Record Card ───────────────────────────────────────────────────────────────

interface RecordCardProps {
  record: MedicalRecord
  index: number
}

function RecordCard({ record, index }: RecordCardProps) {
  const typeConfig = getFileTypeConfig(record.fileType)
  const Icon = typeConfig.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(30,79,163,0.08)',
        marginBottom: '12px',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* File type icon */}
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: typeConfig.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={22} color={typeConfig.color} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#1A1A1A',
              margin: '0 0 3px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {record.name}
          </p>
          <p style={{ fontSize: '12px', color: '#6B7C93', margin: '0 0 2px' }}>
            {record.doctorOrLab}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#A0AEC0' }}>{record.date}</span>
            <span style={{ fontSize: '10px', color: '#A0AEC0' }}>•</span>
            <span style={{ fontSize: '11px', color: '#A0AEC0' }}>{record.fileSize}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => console.log('Download:', record.id)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#EBF2FF',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Download"
          >
            <HiDownload size={15} color="#2C6ED5" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => console.log('Share:', record.id)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#F5F8FC',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Share"
          >
            <HiShare size={15} color="#6B7C93" />
          </motion.button>
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
        {record.tags.map((tag) => (
          <span key={tag} style={getTagChipStyle(tag)}>
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function RecordsScreen() {
  const [activeFilter, setActiveFilter] = useState<RecordCategory>('All')

  const filteredRecords = RECORDS.filter((r) => {
    if (activeFilter === 'All') return true
    return r.tags.some((tag) => tag === activeFilter)
  })

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#F5F8FC',
        fontFamily: 'Roboto, system-ui, sans-serif',
        overflowX: 'hidden',
        position: 'relative',
      }}
    >
      {/* ── Gradient Header ──────────────────────────────────────────────────── */}
      <div
        style={{
          background: BRAND_GRADIENT,
          borderRadius: '0 0 28px 28px',
          padding: '20px 20px 36px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)',
          }}
        />

        {/* Top row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div style={{ width: '40px' }} />
          <h1
            style={{
              color: '#FFFFFF',
              fontSize: '18px',
              fontWeight: 700,
              margin: 0,
              textAlign: 'center',
            }}
          >
            Medical Records
          </h1>
          <button
            onClick={() => console.log('Upload record')}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Upload"
          >
            <HiUpload size={20} color="#FFFFFF" />
          </button>
        </div>
      </div>

      {/* ── Quick Stats ───────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          margin: '-20px 16px 0',
          padding: '16px',
          boxShadow: '0 4px 16px rgba(30,79,163,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {[
          { value: '4', label: 'Reports' },
          { value: '3', label: 'Prescriptions' },
          { value: '12', label: 'Appointments' },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
              borderRight: i < 2 ? '1px solid #EEF2F7' : 'none',
              padding: '0 4px',
            }}
          >
            <span
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#2C6ED5',
                lineHeight: 1,
                marginBottom: '4px',
              }}
            >
              {stat.value}
            </span>
            <span style={{ fontSize: '11px', color: '#6B7C93', textAlign: 'center' }}>
              {stat.label}
            </span>
          </div>
        ))}
      </motion.div>

      {/* ── Filter Tabs ───────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          padding: '16px 16px 0',
          scrollbarWidth: 'none',
        }}
      >
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab
          return (
            <motion.button
              key={tab}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveFilter(tab)}
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                borderRadius: '24px',
                border: isActive ? 'none' : '1.5px solid #E3EAF2',
                background: isActive ? BRAND_GRADIENT : '#FFFFFF',
                color: isActive ? '#FFFFFF' : '#6B7C93',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: isActive ? '0 2px 8px rgba(44,110,213,0.25)' : 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {tab}
            </motion.button>
          )
        })}
      </div>

      {/* ── Records List ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 16px', paddingBottom: '96px' }}>
        {filteredRecords.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '48px 16px',
              color: '#A0AEC0',
            }}
          >
            <HiDocumentText size={48} color="#E3EAF2" />
            <p style={{ marginTop: '12px', fontSize: '14px', color: '#A0AEC0' }}>
              No records found
            </p>
          </div>
        ) : (
          filteredRecords.map((record, index) => (
            <RecordCard key={record.id} record={record} index={index} />
          ))
        )}
      </div>

      {/* ── Upload FAB ────────────────────────────────────────────────────────── */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.35 }}
        onClick={() => console.log('Upload new record')}
        style={{
          position: 'fixed',
          bottom: '96px',
          right: '16px',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: BRAND_GRADIENT,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 20px rgba(44,110,213,0.4)',
          zIndex: 50,
        }}
        aria-label="Upload record"
      >
        <HiPlus size={24} color="#FFFFFF" />
      </motion.button>
    </div>
  )
}
