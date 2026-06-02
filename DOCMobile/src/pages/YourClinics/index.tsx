import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { clinicService } from '@/services/clinicService'
import { unwrapList, clinicId } from '@/services/api'
import type { Clinic } from '@/types'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

export function YourClinics() {
  const navigate = useNavigate()
  const selectedClinic = useAuthStore((s) => s.selectedClinic)
  const setClinic = useAuthStore((s) => s.setClinic)
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    clinicService.list()
      .then((res) => setClinics(unwrapList<Clinic>(res.data)))
      .finally(() => setLoading(false))
  }, [])

  const selectedId = clinicId(selectedClinic)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100%', background: '#F5F8FC' }}>
      {/* Hero */}
      <div style={{ background: BRAND_GRADIENT, padding: '52px 20px 26px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 700, margin: 0 }}>Account</p>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', margin: '4px 0 0' }}>Your Clinics</h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', margin: 0, lineHeight: 1 }}>{clinics.length}</p>
            <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.75)', letterSpacing: '1px', margin: '4px 0 0' }}>ASSOCIATED</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : clinics.length === 0 ? (
          <p style={{ textAlign: 'center', fontSize: 13, color: '#94A3B8', padding: '40px 0' }}>No clinics linked yet</p>
        ) : clinics.map((c) => {
          const cid = clinicId(c)
          const isPrimary = cid === selectedId
          return (
            <div key={cid} style={{ background: '#FFFFFF', borderRadius: 14, padding: 14, boxShadow: '0 2px 8px rgba(30,79,163,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: '#EBF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E4FA3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21V10l9-6 9 6v11" /><path d="M9 21v-6h6v6" /><path d="M12 8v4M10 10h4" />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</p>
                    {isPrimary && (
                      <>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#1E4FA3', background: '#EBF2FF', borderRadius: 999, padding: '2px 7px', flexShrink: 0 }}>PRIMARY</span>
                      </>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>📍 {c.address}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6" /></svg>
              </div>

              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  Mon – Fri · 09:00 – 13:00
                </span>
                {!isPrimary ? (
                  <button onClick={() => setClinic(c)} style={{ fontSize: 11, fontWeight: 700, color: '#1E4FA3', background: '#EBF2FF', border: 'none', borderRadius: 999, padding: '4px 10px', cursor: 'pointer' }}>
                    Switch
                  </button>
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#22C55E' }}>● Active</span>
                )}
              </div>
            </div>
          )
        })}

        <button style={{
          marginTop: 4, width: '100%', padding: 14, borderRadius: 14,
          border: '2px dashed #DBE7F8', background: 'transparent',
          color: '#1E4FA3', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>
          + Add clinic
        </button>

        <p style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', margin: '8px 0 0', lineHeight: 1.5 }}>
          Clinics you add here become selectable on the OPD start screen and are listed on your prescription letterhead.
        </p>
      </div>
    </motion.div>
  )
}
