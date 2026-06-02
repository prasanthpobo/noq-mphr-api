import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useHistoryStore } from '@/stores/historyStore'
import { historyService } from '@/services/historyService'
import { unwrapList, clinicId } from '@/services/api'
import type { Consultation } from '@/types'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

type Filter = 'all' | 'prescribed' | 'urgent' | 'follow-up'

export function History() {
  const navigate = useNavigate()
  const clinic = useAuthStore((s) => s.selectedClinic)
  const cid = clinicId(clinic)
  const { setPastConsults, selectConsult } = useHistoryStore()
  const [items, setItems] = useState<Consultation[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!cid) return
    setLoading(true)
    historyService.list(cid)
      .then((res) => {
        const list = unwrapList<Consultation>(res.data)
        setItems(list)
        setPastConsults(list)
      })
      .finally(() => setLoading(false))
  }, [cid])

  const filtered = useMemo(() => {
    let list = items
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((c) => c.patientName.toLowerCase().includes(q) || c.diagnosis.toLowerCase().includes(q))
    }
    if (filter === 'prescribed') list = list.filter((c) => c.rxLines.length > 0)
    if (filter === 'urgent') list = list.filter((c) => /urgent|emergency|chest|ecg/i.test(c.diagnosis + ' ' + c.complaints))
    if (filter === 'follow-up') list = list.filter((c) => /follow/i.test(c.diagnosis + ' ' + c.notes))
    return list
  }, [items, search, filter])

  const counts = {
    all: items.length,
    prescribed: items.filter((c) => c.rxLines.length > 0).length,
    urgent: items.filter((c) => /urgent|emergency/i.test(c.diagnosis + ' ' + c.complaints)).length,
    'follow-up': items.filter((c) => /follow/i.test(c.diagnosis + ' ' + c.notes)).length,
  }

  const monthCount = items.filter((c) => sameMonth(c.createdAt, new Date())).length
  const groups = groupByDay(filtered)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100%', background: '#F5F8FC' }}>
      {/* Hero */}
      <div style={{ background: BRAND_GRADIENT, padding: '52px 20px 22px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 700, margin: 0 }}>Consultation history</p>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', margin: '4px 0 0' }}>Past consults</h1>
          </div>
          <button style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </button>
        </div>

        <div style={{ marginTop: 14, position: 'relative' }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Patient, token, or condition"
            style={{ width: '100%', borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.18)', padding: '12px 40px', color: '#FFFFFF', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.7)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></svg>
          </span>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '14px 16px 0' }} className="scrollbar-hide">
        {(['all', 'prescribed', 'urgent', 'follow-up'] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            flexShrink: 0, padding: '8px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: filter === f ? BRAND_GRADIENT : '#FFFFFF',
            color: filter === f ? '#FFFFFF' : '#475569',
            fontSize: 12, fontWeight: 700,
            boxShadow: '0 2px 6px rgba(30,79,163,0.06)',
          }}>
            {labelize(f)} · {counts[f]}
          </button>
        ))}
      </div>

      {/* Stat banner */}
      <div style={{ margin: '14px 16px 0', background: BRAND_GRADIENT, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 6px 20px rgba(30,79,163,0.25)' }}>
        <div>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 700, margin: 0 }}>This month</p>
          <p style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', margin: '4px 0 0', lineHeight: 1 }}>
            {monthCount} <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>consults</span>
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 11, color: '#FFFFFF', margin: 0, fontWeight: 700 }}>↑ vs last</p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', margin: '2px 0 0' }}>Avg ~{avgMinutes(items)} min</p>
        </div>
      </div>

      {/* Groups */}
      <div style={{ padding: '16px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <p style={{ textAlign: 'center', fontSize: 13, color: '#94A3B8', padding: '40px 0' }}>No consults yet</p>
        ) : groups.map((g) => (
          <div key={g.key} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: '#1E4FA3', letterSpacing: '1px', margin: 0 }}>{g.label}</p>
              <p style={{ fontSize: 10, color: '#94A3B8', margin: 0 }}>{g.items.length} consults</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {g.items.map((c, idx) => (
                <button key={c.id}
                  onClick={() => { selectConsult(c); navigate(`/history/${c.id}`) }}
                  style={{ all: 'unset', cursor: 'pointer', background: '#FFFFFF', borderRadius: 14, padding: 12, boxShadow: '0 2px 8px rgba(30,79,163,0.06)' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ minWidth: 56, padding: '6px 8px', borderRadius: 8, background: '#EBF2FF', textAlign: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#1E4FA3' }}>A-{String(100 + idx).padStart(3, '0')}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', margin: 0 }}>{c.patientName}</p>
                      <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.diagnosis || c.complaints || 'Consult'}</p>
                    </div>
                    <span style={{ fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap' }}>⏱ ~14 min</span>
                  </div>
                  {(c.notes || c.rxLines.length > 0) && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <p style={{ fontSize: 12, fontStyle: 'italic', color: '#64748B', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        "{c.notes?.slice(0, 50) || c.diagnosis || '—'}"
                      </p>
                      {c.rxLines.length > 0 && (
                        <span style={{ flexShrink: 0, marginLeft: 10, fontSize: 10, fontWeight: 700, color: '#1E4FA3', background: '#EBF2FF', borderRadius: 999, padding: '3px 8px' }}>
                          🔗 RX
                        </span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function labelize(f: Filter) {
  return f === 'all' ? 'All' : f === 'prescribed' ? 'Prescribed' : f === 'urgent' ? 'Urgent' : 'Follow-up'
}

function sameMonth(iso: string, ref: Date) {
  const d = new Date(iso)
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
}

function avgMinutes(items: Consultation[]) {
  if (items.length === 0) return 0
  return 13 // placeholder until backend exposes duration
}

function groupByDay(items: Consultation[]) {
  const map = new Map<string, Consultation[]>()
  const now = new Date()
  for (const c of items) {
    const d = new Date(c.createdAt)
    const key = d.toISOString().slice(0, 10)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(c)
  }
  const keys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a))
  return keys.map((k) => {
    const d = new Date(k)
    const diff = Math.round((now.setHours(0, 0, 0, 0) - new Date(k).setHours(0, 0, 0, 0)) / 86400000)
    const label = diff === 0 ? `TODAY · ${formatDayLabel(d)}` : diff === 1 ? `YESTERDAY · ${formatDayLabel(d)}` : formatDayLabel(d).toUpperCase()
    return { key: k, label, items: map.get(k)! }
  })
}

function formatDayLabel(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' })
}
