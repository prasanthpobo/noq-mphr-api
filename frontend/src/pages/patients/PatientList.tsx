import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import Badge, { PatientTagBadge, StatusBadge } from '@/components/ui/Badge'
import Icon from '@/components/ui/Icon'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import { useAppStore } from '@/store/app'
import { patientsService } from '@/services/patients.service'
import { appointmentsService } from '@/services/appointments.service'
import { toast } from '@/store/toast'

const TABLE_COLS = 6

function genderLabel(g?: string): string {
  if (!g) return '—'
  if (g === 'M' || g === 'm' || /^male$/i.test(g)) return 'Male'
  if (g === 'F' || g === 'f' || /^female$/i.test(g)) return 'Female'
  return 'Other'
}

function ageFromDob(dob?: string | Date): number | null {
  if (!dob) return null
  const d = dayjs(dob)
  if (!d.isValid()) return null
  const yrs = dayjs().diff(d, 'year')
  return yrs >= 0 ? yrs : null
}

const PAGE_SIZE = 12

const TAG_FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'active',    label: 'Active' },
  { key: 'follow-up', label: 'Follow-up' },
  { key: 'critical',  label: 'Critical' },
  { key: 'new',       label: 'New' },
]

const BG_VARIANTS: Record<string, string> = {
  'O+':'success','O-':'green','A+':'blue','A-':'blue','B+':'amber','B-':'amber','AB+':'brand','AB-':'brand'
}

function LoadingSkeleton() {
  return (
    <>
      {[1, 2, 3].map(i => (
        <tr key={i}>
          {Array.from({ length: TABLE_COLS }).map((_, j) => (
            <td key={j}>
              <div style={{ height: 16, background: 'var(--bg-section)', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export default function PatientList() {
  const { setRoute, setSelectedId } = useAppStore()
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('all')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const load = async (q?: string, tag?: string) => {
    try {
      setLoading(true)
      setError(null)
      const params: Record<string, string> = {}
      if (q) params.search = q
      if (tag && tag !== 'all') params.tag = tag
      const data = await patientsService.list(params)
      setItems(data.data || [])
    } catch {
      setError('Failed to load patients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    setPage(1)
    const timer = setTimeout(() => load(search, tagFilter), 300)
    return () => clearTimeout(timer)
  }, [search, tagFilter])

  const countOf = (t: string) => items.filter(p => p.tag === t).length
  const filtered  = items
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── Patient-appointments modal ──────────────────────────────────────────
  const [apptPatient, setApptPatient]   = useState<any | null>(null)
  const [apptList, setApptList]         = useState<any[]>([])
  const [apptLoading, setApptLoading]   = useState(false)

  const openPatientAppointments = async (p: any) => {
    const id = p._id || p.id
    setApptPatient(p)
    setApptList([])
    setApptLoading(true)
    try {
      const res = await appointmentsService.list({ patientId: String(id), limit: '100' })
      setApptList(res?.data ?? [])
    } catch {
      toast.error('Failed to load appointments')
    } finally {
      setApptLoading(false)
    }
  }
  const closePatientAppointments = () => { setApptPatient(null); setApptList([]) }
  const goToAppointmentDetail = (apptId: string) => {
    setSelectedId(apptId)
    setRoute('appt-view')
    closePatientAppointments()
  }

  return (
    <>
      <Header
        title="Patient management"
        crumbs={`${items.length} total`}
      />

      <div className="main">
      <div className="stats-grid">
        <StatCard ic="users"    tone="blue"  label="Total patients"       value={String(items.length)} foot="All registered patients" />
        <StatCard ic="activity" tone="green" label="Active this month"    value={String(items.filter(p => p.tag === 'active').length)}   foot="Had visits in 30 days" accent />
        <StatCard ic="calendar" tone="amber" label="Follow-ups due"       value={String(countOf('follow-up'))}    foot="Pending this week" />
        <StatCard ic="alert"    tone="red"   label="Critical watch"       value={String(countOf('critical'))}     foot="Needs monitoring" />
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div className="table-search">
            <Icon name="search" size={15}/>
            <input
              placeholder="Search patients…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="filters">
            {TAG_FILTERS.map(f => (
              <button
                key={f.key}
                className={`chip${tagFilter === f.key ? ' active' : ''}`}
                onClick={() => setTagFilter(f.key)}
              >
                {f.label}
                {f.key !== 'all' && (
                  <span style={{marginLeft:4,opacity:.7,fontSize:11}}>
                    {countOf(f.key)}
                  </span>
                )}
              </button>
            ))}
          </div>
          <button
            className="btn btn-primary btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={() => setRoute('patient-new')}
          >
            <Icon name="plus" size={14}/> Add patient
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', color: 'var(--danger-500)', fontSize: 13 }}>{error}</div>
        )}

        <table className="data">
          <thead>
            <tr>
              <th>Name</th>
              <th>Age / Sex</th>
              <th>Blood group</th>
              <th>Phone</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingSkeleton />
            ) : (
              paginated.map((p) => {
                const id      = p._id || p.id
                const age     = ageFromDob(p.dob) ?? p.age
                const sex     = genderLabel(p.gender)
                const bg      = p.bloodGroup ?? p.bg ?? '—'
                const bgVar   = (BG_VARIANTS[bg] ?? 'muted') as 'success' | 'green' | 'blue' | 'amber' | 'brand' | 'muted'
                const initials = (p.name ?? '').split(' ').map((w: string) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'
                const tone    = p.tone ?? 'blue'
                return (
                  <tr key={id}>
                    <td>
                      <div className="cell-person">
                        <div className={`av ${tone}`}>{initials}</div>
                        <div className="info">
                          <div className="n">{p.name}</div>
                          {p.email && <div className="s">{p.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {age != null ? <b>{age}</b> : '—'} <span style={{ color: 'var(--fg-muted)' }}>· {sex}</span>
                    </td>
                    <td><Badge variant={bgVar}>{bg}</Badge></td>
                    <td style={{ fontSize: 13 }}>{p.phone ?? '—'}</td>
                    <td><PatientTagBadge tag={p.tag} /></td>
                    <td>
                      <div className="row-actions">
                        <button className="act" title="View" onClick={() => { setSelectedId(id); setRoute('patient-view') }}>
                          <Icon name="eye" size={14} />
                        </button>
                        <button className="act" title="Edit" onClick={() => { setSelectedId(id); setRoute('patient-edit') }}>
                          <Icon name="edit" size={14} />
                        </button>
                        <button className="act" title="Appointments" onClick={() => openPatientAppointments(p)}>
                          <Icon name="more" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={TABLE_COLS} style={{ textAlign: 'center', padding: 32, color: 'var(--fg-muted)' }}>
                  No patients found
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>
      </div>

      {/* Patient appointments modal */}
      {apptPatient && (
        <PatientAppointmentsModal
          patient={apptPatient}
          list={apptList}
          loading={apptLoading}
          onClose={closePatientAppointments}
          onView={goToAppointmentDetail}
          onBookNew={() => { closePatientAppointments(); setRoute('book') }}
        />
      )}
    </>
  )
}

/* ── Patient appointments modal ───────────────────────────────────────── */

const APPT_FILTERS = [
  { key: 'all',       label: 'All Appointments' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
] as const
type ApptFilterKey = typeof APPT_FILTERS[number]['key']

function PatientAppointmentsModal({
  patient, list, loading, onClose, onView, onBookNew,
}: {
  patient: any
  list: any[]
  loading: boolean
  onClose: () => void
  onView: (apptId: string) => void
  onBookNew: () => void
}) {
  const [filter, setFilter] = useState<ApptFilterKey>('all')
  const [filterOpen, setFilterOpen] = useState(false)

  const filtered = filter === 'all' ? list : list.filter((a) => a.status === filter)
  const activeFilterLabel = APPT_FILTERS.find((f) => f.key === filter)?.label ?? 'All Appointments'

  const age      = ageFromDob(patient.dob)
  const sex      = genderLabel(patient.gender)
  const isNew    = patient.tag === 'new'
  const phone    = patient.phone ?? '—'

  return (
    <Modal
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <span style={{
            width: 44, height: 44, borderRadius: 12,
            background: '#EBF2FF', border: '1px solid #DBE7F8',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon name="calendar" size={20} style={{ color: '#1E4FA3' }} />
          </span>
          <span style={{ minWidth: 0 }}>
            <span style={{
              fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '0.1em', color: '#1E4FA3', display: 'block', lineHeight: 1,
            }}>
              Appointments
            </span>
            <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--fg-primary)', letterSpacing: -0.2 }}>
              {patient.name ?? 'Patient'}
            </span>
          </span>
          <span style={{
            marginLeft: 8, fontSize: 12, fontWeight: 800,
            color: '#1E4FA3', background: '#EBF2FF',
            borderRadius: 999, padding: '6px 12px',
          }}>
            {list.length} Total
          </span>
        </span>
      }
      onClose={onClose}
      size="xl"
      footer={
        <button className="btn btn-secondary" onClick={onClose} style={{ minWidth: 110 }}>
          Close
        </button>
      }
    >
      {/* Patient summary card (light-blue tinted) */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap',
        padding: '14px 18px', borderRadius: 14,
        background: '#F0F4FF', border: '1px solid #DBE7F8',
        marginBottom: 18,
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            width: 40, height: 40, borderRadius: '50%',
            background: '#FFFFFF', border: '1px solid #DBE7F8',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon name="phone" size={16} style={{ color: '#1E4FA3' }} />
          </span>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--fg-primary)', letterSpacing: 0.3 }}>
            {phone}
          </span>
        </span>

        {(age != null || patient.gender) && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Icon name="user" size={16} style={{ color: '#1E4FA3' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)' }}>
              {age != null ? `${age} years` : '—'} <span style={{ color: 'var(--fg-muted)' }}>•</span> {sex}
            </span>
          </span>
        )}

        {isNew && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 999,
            background: '#FFFFFF', border: '1px solid #BFDBFE',
            fontSize: 13, fontWeight: 700, color: '#1E4FA3',
          }}>
            <span style={{ fontSize: 14 }}>✨</span> New Patient
          </span>
        )}
      </div>

      {/* Section header — title + filter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-primary)', margin: 0 }}>
          Appointments ({filtered.length})
        </h4>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setFilterOpen((v) => !v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '8px 14px', borderRadius: 10,
              background: '#FFFFFF', border: '1px solid var(--border-soft)',
              fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
            <Icon name="calendar" size={14} style={{ color: '#1E4FA3' }} />
            {activeFilterLabel}
            <Icon name="chevD" size={12} />
          </button>
          {filterOpen && (
            <div
              role="listbox"
              style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: 200, zIndex: 5,
                background: '#FFFFFF', border: '1px solid var(--border-soft)',
                borderRadius: 10, boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                padding: 6,
              }}>
              {APPT_FILTERS.map((opt) => {
                const active = filter === opt.key
                return (
                  <button
                    key={opt.key}
                    role="option"
                    onClick={() => { setFilter(opt.key); setFilterOpen(false) }}
                    style={{
                      width: '100%', textAlign: 'left',
                      padding: '8px 10px', borderRadius: 8, border: 'none',
                      background: active ? '#EBF2FF' : 'transparent',
                      color: active ? '#1E4FA3' : 'var(--fg-primary)',
                      fontSize: 13, fontWeight: active ? 700 : 500,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                    {opt.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Appointments list */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13 }}>
          Loading appointments…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          padding: '40px 16px', textAlign: 'center',
          border: '1.5px dashed var(--border-soft)', borderRadius: 14,
          color: 'var(--fg-muted)',
        }}>
          <Icon name="calendar" size={28} />
          <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600, color: 'var(--fg-primary)' }}>
            No appointments to show
          </div>
          <div style={{ marginTop: 4, fontSize: 12 }}>
            Try a different filter — or book a new appointment below.
          </div>
        </div>
      ) : (
        <div style={{ borderRadius: 14, border: '1px solid #DBE7F8', overflow: 'hidden' }}>
          {/* Column header strip */}
          <div style={{
            display: 'grid', gridTemplateColumns: '100px 1.5fr 1.3fr 1fr 1fr 90px',
            padding: '14px 18px', background: '#EBF2FF', borderBottom: '1px solid #DBE7F8',
            fontSize: 13, fontWeight: 700, color: '#1E4FA3', letterSpacing: 0.2,
          }}>
            <span>Token</span>
            <span>Doctor</span>
            <span>Date &amp; Time</span>
            <span>Type</span>
            <span>Status</span>
            <span style={{ textAlign: 'right' }}>Action</span>
          </div>

          {filtered.map((a, i) => {
            const apptId    = a._id ? String(a._id) : ''
            const tokenNum  = a.token?.tokenNumber
            const cancelled = a.status === 'cancelled'
            const completed = a.status === 'completed'
            const dateColor = cancelled ? '#1E4FA3' : completed ? '#475569' : '#10B981'
            return (
              <div
                key={apptId}
                style={{
                  display: 'grid', gridTemplateColumns: '100px 1.5fr 1.3fr 1fr 1fr 90px',
                  alignItems: 'center', gap: 0,
                  padding: '16px 18px',
                  background: '#FFFFFF',
                  borderBottom: i < filtered.length - 1 ? '1px solid #F1F5F9' : 'none',
                }}>
                {/* Token */}
                <div>
                  {tokenNum != null ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      minWidth: 56, padding: '8px 12px', borderRadius: 10,
                      background: '#EBF2FF', color: '#1E4FA3',
                      fontSize: 14, fontWeight: 800, letterSpacing: 0.5,
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {String(tokenNum).padStart(3, '0')}
                    </span>
                  ) : (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      minWidth: 56, padding: '8px 12px', borderRadius: 10,
                      background: '#ECFDF5', color: '#10B981',
                      fontSize: 18, fontWeight: 800,
                    }}>—</span>
                  )}
                </div>

                {/* Doctor */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: '#EBF2FF', border: '1px solid #DBE7F8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    fontSize: 14, fontWeight: 800, color: '#1E4FA3',
                  }}>
                    <Icon name="stethoscope" size={18} style={{ color: '#1E4FA3' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--fg-primary)' }}>
                      {a.doctorId?.name ?? '—'}
                    </div>
                    {a.doctorId?.specialization && (
                      <div style={{ fontSize: 12, color: '#3B82F6', fontWeight: 600 }}>
                        {a.doctorId.specialization}
                      </div>
                    )}
                  </div>
                </div>

                {/* Date & Time */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="calendar" size={14} style={{ color: dateColor }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)' }}>
                      {a.date ? dayjs(a.date).format('DD MMM YYYY') : '—'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Icon name="clock" size={14} style={{ color: '#94A3B8' }} />
                    <span style={{ fontSize: 13, color: 'var(--fg-secondary)', fontWeight: 600 }}>
                      {a.time ?? '—'}
                    </span>
                  </div>
                </div>

                {/* Type */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: cancelled ? '#EBF2FF' : '#ECFDF5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon name="stethoscope" size={16} style={{ color: cancelled ? '#1E4FA3' : '#10B981' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)', textTransform: 'capitalize' }}>
                    {a.type ?? 'Consultation'}
                  </span>
                </div>

                {/* Status */}
                <div>
                  <StatusBadge status={a.status} />
                </div>

                {/* Action */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => onView(apptId)}
                    aria-label="View"
                    style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: '#FFFFFF', border: '1.5px solid #BFDBFE',
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    <Icon name="eye" size={16} style={{ color: '#1E4FA3' }} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Stay updated banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap',
        marginTop: 18, padding: '16px 18px', borderRadius: 14,
        background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
        border: '1px solid #C7D2FE',
      }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 58, height: 58, borderRadius: 14,
            background: '#FFFFFF', border: '1px solid #C7D2FE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="calendar" size={26} style={{ color: '#1E4FA3' }} />
          </div>
          <span style={{
            position: 'absolute', top: -6, right: -6,
            width: 22, height: 22, borderRadius: '50%',
            background: '#10B981', color: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #FFFFFF',
            fontSize: 11, fontWeight: 900,
          }}>✓</span>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-primary)', marginBottom: 2 }}>
            Stay updated
          </div>
          <div style={{ fontSize: 13, color: 'var(--fg-secondary)', fontWeight: 500 }}>
            Your upcoming appointments and consultations.
          </div>
        </div>
        <button
          onClick={onBookNew}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 18px', borderRadius: 10,
            background: '#FFFFFF', border: '1.5px solid #BFDBFE',
            color: '#1E4FA3', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
          <Icon name="calendar" size={16} />
          Book New Appointment
        </button>
      </div>
    </Modal>
  )
}
