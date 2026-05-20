import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiSearch, HiLocationMarker, HiPhone, HiClock } from 'react-icons/hi'
import { MdLocalHospital } from 'react-icons/md'
import MobileHeader from '../../components/MobileHeader'
import { getClinics } from '../../services/clinicService'
import type { Clinic as ServerClinic } from '../../services/clinicService'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

type FilterOption = 'All' | 'Active' | 'Inactive'

interface DisplayClinic {
  id: string
  name: string
  address: string
  city: string
  state: string
  phone?: string
  status: string
  initials: string
  type: string
  openTime?: string
  closeTime?: string
}

function toDisplay(c: ServerClinic): DisplayClinic {
  const words = c.name.trim().split(/\s+/)
  const initials = words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : c.name.slice(0, 2).toUpperCase()
  return {
    id: (c as unknown as { _id: string })._id ?? (c as { id?: string }).id ?? '',
    name: c.name,
    address: c.address,
    city: c.city,
    state: c.state,
    phone: c.phone,
    status: c.status,
    initials,
    type: c.type,
    openTime: c.openTime,
    closeTime: c.closeTime,
  }
}

const FILTER_OPTIONS: FilterOption[] = ['All', 'Active', 'Inactive']

export default function ClinicsScreen() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All')
  const [clinics, setClinics] = useState<DisplayClinic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClinics = useCallback(async (search?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getClinics(search || undefined)
      setClinics(res.data.map(toDisplay))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load clinics')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchClinics(searchQuery || undefined), 350)
    return () => clearTimeout(timer)
  }, [searchQuery, fetchClinics])

  const filteredClinics = clinics.filter((clinic) => {
    if (activeFilter === 'Active') return clinic.status === 'active'
    if (activeFilter === 'Inactive') return clinic.status === 'inactive'
    return true
  })

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#F5F8FC',
        fontFamily: 'Roboto, system-ui, sans-serif',
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <MobileHeader title="Clinics" showBack />

      {/* ── Search Bar ──────────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 16px 0' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '0 14px',
            height: '46px',
            border: '1.5px solid',
            borderColor: searchQuery ? '#2C6ED5' : '#E3EAF2',
            boxShadow: '0 2px 8px rgba(30,79,163,0.05)',
            transition: 'border-color 0.15s',
          }}
        >
          <HiSearch size={17} color={searchQuery ? '#2C6ED5' : '#A0AEC0'} />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clinics, departments..."
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '14px',
              color: '#1A1A1A',
            }}
          />
        </div>
      </div>

      {/* ── Filter Chips ────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 16px 0',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option}
            onClick={() => setActiveFilter(option)}
            style={{
              flexShrink: 0,
              padding: '7px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 500,
              border: '1.5px solid',
              borderColor: activeFilter === option ? '#2C6ED5' : '#E3EAF2',
              background: activeFilter === option ? '#EBF2FF' : '#FFFFFF',
              color: activeFilter === option ? '#2C6ED5' : '#6B7C93',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {option}
          </button>
        ))}
      </div>

      {/* ── Results count ───────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 16px 0' }}>
        <p style={{ fontSize: '13px', color: '#A0AEC0', margin: 0 }}>
          {isLoading ? 'Loading…' : `${filteredClinics.length} clinic${filteredClinics.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* ── Clinic List ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 16px 96px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {error ? (
          <div style={{ textAlign: 'center', paddingTop: '48px' }}>
            <p style={{ color: '#EF4444', fontSize: '14px' }}>{error}</p>
            <button onClick={() => fetchClinics()} style={{ marginTop: 12, color: '#2C6ED5', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Retry</button>
          </div>
        ) : isLoading ? (
          [0, 1, 2].map((i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 12px rgba(30,79,163,0.08)', opacity: 0.5 + i * 0.15 }}>
              <div style={{ height: 4, background: '#EEF2F7' }} />
              <div style={{ padding: 14 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: '#EEF2F7' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 14, borderRadius: 6, background: '#EEF2F7', marginBottom: 8, width: '60%' }} />
                    <div style={{ height: 10, borderRadius: 6, background: '#EEF2F7', width: '35%' }} />
                  </div>
                </div>
                <div style={{ height: 1, background: '#F0F4F8', marginBottom: 10 }} />
                <div style={{ height: 10, borderRadius: 6, background: '#EEF2F7', marginBottom: 7, width: '80%' }} />
                <div style={{ height: 10, borderRadius: 6, background: '#EEF2F7', width: '55%' }} />
              </div>
              <div style={{ height: 44, background: '#F9FAFB', borderTop: '1px solid #F0F4F8' }} />
            </div>
          ))
        ) : filteredClinics.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '48px' }}>
            <p style={{ color: '#A0AEC0', fontSize: '14px' }}>No clinics match your search</p>
          </div>
        ) : (
          filteredClinics.map((clinic, index) => (
            <motion.div
              key={clinic.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07, duration: 0.35 }}
              style={{
                background: '#FFFFFF',
                borderRadius: '18px',
                boxShadow: '0 2px 12px rgba(30,79,163,0.08)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Top accent bar */}
              <div style={{
                height: 4,
                background: clinic.status === 'active' ? BRAND_GRADIENT : '#E5E7EB',
              }} />

              <div style={{ padding: '14px 14px 0' }}>
                {/* Header row: avatar + name + status */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                    background: clinic.status === 'active' ? BRAND_GRADIENT : '#F1F5F9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: clinic.status === 'active' ? '0 4px 12px rgba(44,110,213,0.25)' : 'none',
                  }}>
                    {clinic.status === 'active'
                      ? <span style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', letterSpacing: 0.5 }}>{clinic.initials}</span>
                      : <MdLocalHospital size={22} color="#9CA3AF" />
                    }
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px', lineHeight: 1.3, flex: 1, minWidth: 0 }}>
                        {clinic.name}
                      </p>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
                        fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                        background: clinic.status === 'active' ? '#ECFDF5' : '#F9FAFB',
                        color: clinic.status === 'active' ? '#16A34A' : '#6B7280',
                        border: `1px solid ${clinic.status === 'active' ? '#BBF7D0' : '#E5E7EB'}`,
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: clinic.status === 'active' ? '#16A34A' : '#9CA3AF' }} />
                        {clinic.status === 'active' ? 'Open' : 'Closed'}
                      </span>
                    </div>

                    {/* Type chip */}
                    <span style={{
                      display: 'inline-block', fontSize: 11, fontWeight: 600,
                      background: '#EBF2FF', color: '#2C6ED5',
                      borderRadius: 6, padding: '2px 8px',
                    }}>
                      {clinic.type}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: '#F0F4F8', marginBottom: 10 }} />

                {/* Info rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 7, background: '#F5F8FC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <HiLocationMarker size={12} color="#2C6ED5" />
                    </div>
                    <span style={{ fontSize: 12, color: '#6B7C93', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {clinic.address}, {clinic.city}, {clinic.state}
                    </span>
                  </div>

                  {clinic.openTime && clinic.closeTime && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 7, background: '#F5F8FC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <HiClock size={12} color="#D97706" />
                      </div>
                      <span style={{ fontSize: 12, color: '#6B7C93' }}>
                        {clinic.openTime} – {clinic.closeTime}
                      </span>
                    </div>
                  )}

                  {clinic.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 7, background: '#F5F8FC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <HiPhone size={11} color="#059669" />
                      </div>
                      <span style={{ fontSize: 12, color: '#6B7C93' }}>{clinic.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer action */}
              <button
                onClick={() => navigate(`/app/clinic/${clinic.id}`)}
                style={{
                  width: '100%', padding: '12px 14px',
                  background: clinic.status === 'active' ? '#F0F6FF' : '#F9FAFB',
                  border: 'none', borderTop: '1px solid #F0F4F8',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: clinic.status === 'active' ? '#2C6ED5' : '#9CA3AF' }}>
                  View Clinic
                </span>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: clinic.status === 'active' ? '#2C6ED5' : '#E5E7EB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 14, color: clinic.status === 'active' ? '#FFFFFF' : '#9CA3AF', fontWeight: 700, lineHeight: 1 }}>›</span>
                </div>
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
