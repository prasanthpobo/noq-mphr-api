import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiSearch, HiStar, HiLocationMarker, HiAdjustments } from 'react-icons/hi'
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
      <MobileHeader
        title="Clinics"
        rightAction={
          <button
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#F5F8FC',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1E4FA3',
            }}
            aria-label="Filter clinics"
          >
            <HiAdjustments size={20} />
          </button>
        }
      />

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
            <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 14, boxShadow: '0 4px 12px rgba(30,79,163,0.08)', height: 110, opacity: 0.5 + i * 0.15 }}/>
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
                borderRadius: '16px',
                padding: '14px',
                boxShadow: '0 4px 12px rgba(30,79,163,0.08)',
              }}
            >
              <div style={{ display: 'flex', gap: '12px' }}>
                <div
                  style={{
                    width: '50px', height: '50px', borderRadius: '50%',
                    background: BRAND_GRADIENT,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', fontWeight: 700, color: '#FFFFFF',
                    flexShrink: 0, letterSpacing: '0.5px',
                  }}
                >
                  {clinic.initials}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 3px', lineHeight: 1.3 }}>
                      {clinic.name}
                    </p>
                    <span
                      style={{
                        display: 'inline-block', fontSize: '10px', fontWeight: 600,
                        padding: '2px 8px', borderRadius: '10px',
                        background: clinic.status === 'active' ? '#ECFDF5' : '#FEF2F2',
                        color: clinic.status === 'active' ? '#16A34A' : '#DC2626',
                        flexShrink: 0, whiteSpace: 'nowrap',
                      }}
                    >
                      {clinic.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <HiLocationMarker size={11} color="#A0AEC0" />
                    <span style={{ fontSize: '12px', color: '#6B7C93', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {clinic.address}, {clinic.city}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px', color: '#2C6ED5', background: '#EBF2FF', borderRadius: '6px', padding: '3px 8px', fontWeight: 500 }}>
                      {clinic.type}
                    </span>
                    {clinic.openTime && clinic.closeTime && (
                      <span style={{ fontSize: '11px', color: '#6B7C93', background: '#F5F8FC', borderRadius: '6px', padding: '3px 8px' }}>
                        {clinic.openTime} – {clinic.closeTime}
                      </span>
                    )}
                    {clinic.phone && (
                      <span style={{ fontSize: '11px', color: '#6B7C93', background: '#F5F8FC', borderRadius: '6px', padding: '3px 8px' }}>
                        {clinic.phone}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <HiStar size={13} color="#F59E0B" />
                      <span style={{ fontSize: '12px', color: '#6B7C93' }}>{clinic.state}</span>
                    </div>
                    <button
                      onClick={() => navigate(`/app/clinic/${clinic.id}`)}
                      style={{
                        background: '#2C6ED5', color: '#FFFFFF', border: 'none',
                        borderRadius: '20px', padding: '7px 16px',
                        fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
