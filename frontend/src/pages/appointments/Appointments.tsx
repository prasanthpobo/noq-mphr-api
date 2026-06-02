import { useState, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import { StatusBadge } from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { useAppStore } from '@/store/app'
import { appointmentsService } from '@/services/appointments.service'
import { tokensService } from '@/services/tokens.service'
import { toast } from '@/store/toast'

const PAGE_SIZE = 8

const STATUS_FILTERS = ['All', 'Scheduled', 'In progress', 'Completed', 'Cancelled', 'Not Visited']

const CHIP_TO_API: Record<string, string> = {
  'Scheduled':   'scheduled',
  'In progress': 'in-progress',
  'Completed':   'completed',
  'Cancelled':   'cancelled',
  'Not Visited': 'no-show',
}

/** Display label for an API status — keeps the "no-show" enum value but renders "Not Visited". */
export const STATUS_DISPLAY: Record<string, string> = {
  'no-show': 'Not Visited',
}

type DateRange = 'today' | 'upcoming' | 'past' | 'all'

const DATE_FILTERS: { key: DateRange; label: string; icon: string }[] = [
  { key: 'today',    label: 'Today',    icon: 'calendar' },
  { key: 'upcoming', label: 'Upcoming', icon: 'clock' },
  { key: 'past',     label: 'Past',     icon: 'hourglass' },
  { key: 'all',      label: 'All',      icon: 'sheet' },
]

/** Build the date-related query params for each tab. */
function dateRangeParams(range: DateRange): Record<string, string> {
  const today = dayjs().format('YYYY-MM-DD')
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
  const tomorrow  = dayjs().add(1, 'day').format('YYYY-MM-DD')
  switch (range) {
    case 'today':    return { date: today }
    case 'past':     return { dateTo: yesterday }
    case 'upcoming': return { dateFrom: tomorrow }
    case 'all':
    default:         return {}
  }
}

const TABLE_COLS = 8

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: TABLE_COLS }).map((_, i) => (
        <td key={i}>
          <div style={{
            height: 14,
            borderRadius: 6,
            background: 'linear-gradient(90deg, var(--bg-section) 25%, var(--border-light) 50%, var(--bg-section) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
            width: i === 0 ? '50%' : i === TABLE_COLS - 1 ? '80%' : '90%',
          }} />
        </td>
      ))}
    </tr>
  )
}

export default function Appointments() {
  const { setRoute, setSelectedId } = useAppStore()
  const [dateRange, setDateRange]       = useState<DateRange>('today')
  const [activeFilter, setActiveFilter] = useState('All')
  const [search, setSearch]             = useState('')
  const [page, setPage]                 = useState(1)
  const [items, setItems]               = useState<any[]>([])
  const [total, setTotal]               = useState(0)
  const [loading, setLoading]           = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {
        page:  String(page),
        limit: String(PAGE_SIZE),
        ...dateRangeParams(dateRange),
      }
      if (activeFilter !== 'All') params.status = CHIP_TO_API[activeFilter] ?? activeFilter
      if (search.trim())          params.search = search.trim()

      const res = await appointmentsService.list(params)
      setItems(res.data ?? [])
      setTotal(res.count ?? 0)
    } catch (err) {
      toast.error('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }, [dateRange, activeFilter, search, page])

  useEffect(() => { load() }, [load])

  const handleDateRangeChange = (r: DateRange) => { setDateRange(r); setPage(1) }
  const handleFilterChange    = (f: string)    => { setActiveFilter(f); setPage(1) }
  const handleSearch          = (v: string)    => { setSearch(v);        setPage(1) }

  // Cancel-confirmation modal state
  const [cancelTarget, setCancelTarget] = useState<any | null>(null)
  const [cancelling, setCancelling] = useState(false)

  // Generate-token modal state
  const [tokenTarget,    setTokenTarget]    = useState<any | null>(null)
  const [tokenPriority,  setTokenPriority]  = useState<'normal' | 'priority' | 'emergency'>('normal')
  const [tokenNotes,     setTokenNotes]     = useState('')
  const [generatingTok,  setGeneratingTok]  = useState(false)

  // View-existing-token modal state
  const [viewTokenAppt,  setViewTokenAppt]  = useState<any | null>(null)
  const [viewTokenData,  setViewTokenData]  = useState<any | null>(null)
  const [loadingTokenView, setLoadingTokenView] = useState(false)
  const [movingTok,      setMovingTok]      = useState(false)

  const openTokenView = async (item: any) => {
    setViewTokenAppt(item)
    setViewTokenData(null)
    setLoadingTokenView(true)
    try {
      const res = await tokensService.list({ appointmentId: item._id })
      const tok = (res.data ?? [])[0] ?? null
      setViewTokenData(tok)
    } catch {
      toast.error('Failed to load token')
    } finally {
      setLoadingTokenView(false)
    }
  }
  const moveToken = async (direction: 'up' | 'down') => {
    if (!viewTokenData?._id) return
    setMovingTok(true)
    try {
      const updated = await tokensService.move(viewTokenData._id, direction)
      setViewTokenData((prev: any) => ({ ...prev, ...updated }))
      toast.success(`Moved ${direction}`)
      // Refresh row data so the table tokenNumber column updates.
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Cannot move ${direction}`)
    } finally {
      setMovingTok(false)
    }
  }

  const askGenerateToken = (item: any) => {
    setTokenTarget(item)
    setTokenPriority('normal')
    setTokenNotes('')
  }
  const confirmGenerateToken = async () => {
    if (!tokenTarget?._id) return
    const patientId = tokenTarget.patientId?._id ?? tokenTarget.patientId
    const doctorId  = tokenTarget.doctorId?._id  ?? tokenTarget.doctorId
    const clinicId  = tokenTarget.clinicId?._id  ?? tokenTarget.clinicId
    if (!patientId || !doctorId || !clinicId) {
      toast.error('Appointment is missing patient/doctor/clinic — cannot generate token')
      return
    }
    setGeneratingTok(true)
    try {
      const tok = await tokensService.create({
        patientId, doctorId, clinicId,
        appointmentId: tokenTarget._id,
        priority: tokenPriority,
        status: tokenPriority === 'emergency' ? 'priority' : 'waiting',
        notes: tokenNotes,
      })
      toast.success(`Token ${String(tok.tokenNumber).padStart(3, '0')} generated`)
      setTokenTarget(null)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate token')
    } finally {
      setGeneratingTok(false)
    }
  }

  const handleView   = (id: string) => { setSelectedId(id); setRoute('appt-view') }
  const handleEdit   = (id: string) => { setSelectedId(id); setRoute('appt-edit') }

  const askCancel = (item: any) => { setCancelTarget(item) }

  const confirmCancel = async () => {
    if (!cancelTarget?._id) return
    setCancelling(true)
    try {
      await appointmentsService.update(cancelTarget._id, { status: 'cancelled' })
      toast.success('Appointment cancelled')
      setCancelTarget(null)
      load()
    } catch {
      toast.error('Failed to cancel appointment')
    } finally {
      setCancelling(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <>
      <Header
        title="Appointments & tokens"
        crumbs={`${total} ${dateRange === 'today' ? 'today' : dateRange === 'past' ? 'past' : dateRange === 'upcoming' ? 'upcoming' : 'total'}`}
      />

      <div className="main">
        <div className="table-card">
          {/* Date range tabs */}
          <div style={{
            display: 'flex', gap: 8, padding: '12px 16px 0',
            borderBottom: '1px solid var(--border-light)',
            flexWrap: 'wrap',
          }}>
            {DATE_FILTERS.map(({ key, label, icon }) => {
              const active = dateRange === key
              return (
                <button
                  key={key}
                  onClick={() => handleDateRangeChange(key)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px',
                    border: 'none', background: 'transparent',
                    color: active ? 'var(--teal-600)' : 'var(--fg-secondary)',
                    fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                    borderBottom: active ? '2.5px solid var(--teal-600)' : '2.5px solid transparent',
                    marginBottom: -1,
                    transition: 'color 0.15s, border-color 0.15s',
                  }}>
                  <Icon name={icon} size={14} />
                  {label}
                  {active && total > 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 800,
                      background: 'var(--teal-600)', color: '#FFFFFF',
                      borderRadius: 999, padding: '2px 7px',
                      marginLeft: 2, letterSpacing: 0.3,
                    }}>{total}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Toolbar */}
          <div className="table-toolbar">
            <div className="table-search">
              <Icon name="search" size={15} />
              <input
                placeholder="Search patient or token…"
                value={search}
                onChange={e => handleSearch(e.target.value)}
              />
            </div>
            <div className="filters">
              {STATUS_FILTERS.map(f => (
                <button
                  key={f}
                  className={`chip ${activeFilter === f ? 'active' : ''}`}
                  onClick={() => handleFilterChange(f)}
                >
                  {f}
                </button>
              ))}
            </div>
            <button
              className="btn btn-primary btn-sm"
              style={{ marginLeft: 'auto' }}
              onClick={() => setRoute('book')}
            >
              <Icon name="plus" size={14}/> Book appointment
            </button>
          </div>

          {/* Table */}
          <table className="data">
            <thead>
              <tr>
                <th>Token #</th>
                <th>Appointment ID</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date &amp; Time</th>
                <th>Type</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={TABLE_COLS}>
                    <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--fg-muted)' }}>
                      <Icon name="ticket" size={32} />
                      <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600 }}>No appointments found</div>
                      <div style={{ marginTop: 4, fontSize: 12 }}>Try adjusting your search or filter</div>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map(item => {
                  const tokenNum = item.token?.tokenNumber
                  const apptId   = item._id ? String(item._id) : ''
                  const shortId  = apptId ? apptId.slice(-6).toUpperCase() : '-'
                  return (
                    <tr key={apptId}>
                      {/* Token Number */}
                      <td>
                        {tokenNum != null ? (
                          <span className="cell-token" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {String(tokenNum).padStart(3, '0')}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}>—</span>
                        )}
                      </td>

                      {/* Appointment ID */}
                      <td>
                        <span
                          title={apptId}
                          style={{
                            fontFamily: 'var(--font-mono)', fontSize: 12,
                            color: 'var(--fg-secondary)', letterSpacing: 0.3,
                          }}>
                          #{shortId}
                        </span>
                      </td>

                      {/* Patient Name */}
                      <td>
                        <div className="cell-person">
                          <div className="av blue">
                            {(item.patientId?.name ?? 'UN').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="info">
                            <div className="n">{item.patientId?.name ?? 'Unknown'}</div>
                            {item.patientId?.phone && (
                              <div className="s">{item.patientId.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Doctor Name */}
                      <td>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-primary)' }}>
                          {item.doctorId?.name ?? '—'}
                        </div>
                        {item.doctorId?.specialization && (
                          <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2 }}>
                            {item.doctorId.specialization}
                          </div>
                        )}
                      </td>

                      {/* Date and Time */}
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>
                          {item.date ? dayjs(item.date).format('DD MMM YYYY') : '—'}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-secondary)', marginTop: 2 }}>
                          {item.time ?? '—'}
                        </div>
                      </td>

                      {/* Type */}
                      <td style={{ fontSize: 13, color: 'var(--fg-secondary)', textTransform: 'capitalize' }}>
                        {item.type ?? '—'}
                      </td>

                      {/* Status */}
                      <td>
                        <StatusBadge status={item.status} />
                      </td>

                      {/* Action */}
                      <td>
                        <div className="row-actions">
                          {(() => {
                            const isToday      = item.date && dayjs(item.date).isSame(dayjs(), 'day')
                            const hasToken     = Boolean(item.token?.tokenNumber)
                            const blockedState = item.status === 'cancelled' || item.status === 'no-show' || item.status === 'completed'
                            if (hasToken) {
                              return (
                                <button
                                  className="act"
                                  title={`View token ${String(item.token.tokenNumber).padStart(3, '0')}`}
                                  onClick={() => openTokenView(item)}
                                  style={{ color: '#15803D' }}
                                >
                                  <Icon name="ticket" size={14} />
                                </button>
                              )
                            }
                            if (!isToday || blockedState) return null
                            return (
                              <button
                                className="act"
                                title="Generate token"
                                onClick={() => askGenerateToken(item)}
                                style={{ color: '#1E4FA3' }}
                              >
                                <Icon name="ticket" size={14} />
                              </button>
                            )
                          })()}
                          <button className="act" title="View" onClick={() => handleView(apptId)}>
                            <Icon name="eye" size={14} />
                          </button>
                          <button className="act" title="Edit" onClick={() => handleEdit(apptId)}>
                            <Icon name="edit" size={14} />
                          </button>
                          <button
                            className="act danger"
                            title="Cancel"
                            disabled={item.status === 'cancelled' || item.status === 'completed'}
                            onClick={() => askCancel(item)}
                          >
                            <Icon name="x" size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>

          {/* Pagination footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderTop: '1px solid var(--border-light)',
            fontSize: 12.5,
            color: 'var(--fg-secondary)',
          }}>
            <span>
              Showing {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} appointments
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <Icon name="chevL" size={13} /> Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  style={{
                    width: 30, height: 30, borderRadius: 8, border: '1px solid',
                    borderColor: p === page ? 'transparent' : 'var(--border-soft)',
                    background: p === page ? 'var(--brand-gradient)' : 'var(--bg-surface)',
                    color: p === page ? 'white' : 'var(--fg-secondary)',
                    fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
                  }}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next <Icon name="chevR" size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel-confirmation modal */}
      {cancelTarget && (
        <Modal
          title={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'rgba(239,68,68,0.10)', color: 'var(--danger-500)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="alert" size={16} />
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-primary)' }}>
                Cancel appointment?
              </span>
            </span>
          }
          onClose={() => !cancelling && setCancelTarget(null)}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
              >
                No, keep it
              </button>
              <button
                className="btn btn-danger"
                onClick={confirmCancel}
                disabled={cancelling}
              >
                <Icon name="x" size={14} /> {cancelling ? 'Cancelling…' : 'Yes, cancel'}
              </button>
            </>
          }
        >
          <div style={{ fontSize: 14, color: 'var(--fg-secondary)', lineHeight: 1.55 }}>
            You're about to cancel this appointment:
          </div>

          {/* Summary card */}
          <div style={{
            marginTop: 12, padding: '14px 16px', borderRadius: 12,
            background: 'var(--bg-section)', border: '1px solid var(--border-light)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div className="av blue" style={{ width: 36, height: 36 }}>
                {(cancelTarget.patientId?.name ?? 'UN')
                  .split(' ').map((n: string) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--fg-primary)' }}>
                  {cancelTarget.patientId?.name ?? 'Patient'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>
                  {cancelTarget.doctorId?.name ?? '—'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 12, color: 'var(--fg-secondary)' }}>
              {cancelTarget.date && (
                <span style={{ background: 'var(--bg-surface)', borderRadius: 999, padding: '3px 9px', fontWeight: 600 }}>
                  📅 {dayjs(cancelTarget.date).format('DD MMM YYYY')}
                </span>
              )}
              {cancelTarget.time && (
                <span style={{ background: 'var(--bg-surface)', borderRadius: 999, padding: '3px 9px', fontWeight: 600 }}>
                  🕒 {cancelTarget.time}
                </span>
              )}
              {cancelTarget._id && (
                <span style={{ background: 'var(--bg-surface)', borderRadius: 999, padding: '3px 9px', fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
                  #{String(cancelTarget._id).slice(-6).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <div style={{
            marginTop: 12, fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.55,
          }}>
            The patient will be notified and the token released. This action cannot be undone.
          </div>
        </Modal>
      )}

      {/* Generate-token modal */}
      {tokenTarget && (
        <Modal
          title={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 32, height: 32, borderRadius: 10,
                background: '#EBF2FF', border: '1px solid #DBE7F8',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="ticket" size={16} style={{ color: '#1E4FA3' }} />
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
                <span style={{ fontSize: 16, fontWeight: 800 }}>Generate Token</span>
                <span style={{ fontSize: 12, color: 'var(--fg-muted)', fontWeight: 500 }}>
                  Issue a queue token for this appointment
                </span>
              </span>
            </span>
          }
          onClose={() => !generatingTok && setTokenTarget(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setTokenTarget(null)} disabled={generatingTok}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={confirmGenerateToken} disabled={generatingTok}>
                <Icon name="check" size={14} /> {generatingTok ? 'Generating…' : 'Generate token'}
              </button>
            </>
          }
        >
          {/* Appointment summary */}
          <div style={{
            padding: '14px 16px', borderRadius: 12,
            background: 'var(--bg-section)', border: '1px solid var(--border-light)',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Patient
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)', marginTop: 4 }}>
                {tokenTarget.patientId?.name ?? '—'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                {tokenTarget.patientId?.phone ?? ''}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Doctor
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)', marginTop: 4 }}>
                {tokenTarget.doctorId?.name ?? '—'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>
                {tokenTarget.doctorId?.specialization ?? ''}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Date &amp; Time
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-primary)', marginTop: 4 }}>
                {tokenTarget.date ? dayjs(tokenTarget.date).format('DD MMM YYYY') : '—'}
                <span style={{ color: 'var(--fg-muted)', fontWeight: 500, marginLeft: 6, fontFamily: 'var(--font-mono)' }}>
                  {tokenTarget.time ?? ''}
                </span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Appointment #
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-primary)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                {String(tokenTarget._id).slice(-6).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Priority */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-secondary)', marginBottom: 8 }}>
              Priority
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['normal','priority','emergency'] as const).map(p => {
                const active = tokenPriority === p
                const colour = p === 'emergency' ? '#DC2626' : p === 'priority' ? '#F59E0B' : '#1E4FA3'
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setTokenPriority(p)}
                    style={{
                      flex: 1, padding: '9px 14px', borderRadius: 10,
                      border: `1.5px solid ${active ? colour : 'var(--border-soft)'}`,
                      background: active ? `${colour}14` : '#FFFFFF',
                      color: active ? colour : 'var(--fg-secondary)',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      fontFamily: 'inherit', textTransform: 'capitalize',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: colour }} />
                    {p}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-secondary)', marginBottom: 6 }}>
              Notes <span style={{ fontWeight: 400, color: 'var(--fg-muted)' }}>(optional)</span>
            </div>
            <textarea
              className="form-textarea"
              rows={2}
              value={tokenNotes}
              onChange={e => setTokenNotes(e.target.value)}
              placeholder="Anything the front desk should know…"
            />
          </div>

          <div style={{
            marginTop: 14, padding: '10px 12px', borderRadius: 10,
            background: '#EFF6FF', border: '1px solid #BFDBFE',
            fontSize: 12, color: '#1E4FA3', lineHeight: 1.55,
          }}>
            Token number is assigned automatically from the doctor's queue for today.
          </div>
        </Modal>
      )}

      {/* View-existing-token modal */}
      {viewTokenAppt && (
        <Modal
          title={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 32, height: 32, borderRadius: 10,
                background: '#EBF2FF', border: '1px solid #DBE7F8',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="ticket" size={16} style={{ color: '#1E4FA3' }} />
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
                <span style={{ fontSize: 16, fontWeight: 800 }}>Token Details</span>
                <span style={{ fontSize: 12, color: 'var(--fg-muted)', fontWeight: 500 }}>
                  Reorder the patient's place in the doctor's queue
                </span>
              </span>
            </span>
          }
          onClose={() => !movingTok && (setViewTokenAppt(null), setViewTokenData(null))}
          footer={
            <button
              className="btn btn-secondary"
              onClick={() => { setViewTokenAppt(null); setViewTokenData(null) }}
              disabled={movingTok}
            >
              Close
            </button>
          }
        >
          {loadingTokenView ? (
            <div style={{ padding: '24px 0', fontSize: 13, color: 'var(--fg-muted)', textAlign: 'center' }}>
              Loading token…
            </div>
          ) : !viewTokenData ? (
            <div style={{ padding: '24px 0', fontSize: 13, color: 'var(--fg-muted)', textAlign: 'center' }}>
              No token found for this appointment.
            </div>
          ) : (
            <>
              {/* Token hero with reorder controls */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '18px 20px', borderRadius: 14,
                background: 'linear-gradient(135deg, #2C6ED5 0%, #1FA3A8 100%)',
                boxShadow: '0 6px 16px rgba(30,79,163,0.20)',
              }}>
                <div style={{ flex: 1, color: '#FFFFFF' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'rgba(255,255,255,0.85)' }}>
                    Token No.
                  </div>
                  <div style={{ fontSize: 42, fontWeight: 900, fontFamily: 'var(--font-mono)', lineHeight: 1, marginTop: 4 }}>
                    {String(viewTokenData.tokenNumber).padStart(3, '0')}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => moveToken('up')}
                    disabled={movingTok || viewTokenData.tokenNumber <= 1}
                    title="Move up (lower number = earlier)"
                    style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.30)',
                      color: '#FFFFFF', cursor: viewTokenData.tokenNumber <= 1 ? 'not-allowed' : 'pointer',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      opacity: viewTokenData.tokenNumber <= 1 ? 0.4 : 1,
                    }}
                  >
                    <Icon name="arrowUp" size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveToken('down')}
                    disabled={movingTok}
                    title="Move down (higher number = later)"
                    style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.30)',
                      color: '#FFFFFF', cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Icon name="arrowDown" size={18} />
                  </button>
                </div>
              </div>

              {/* Meta grid */}
              <div style={{
                marginTop: 14, padding: '14px 16px', borderRadius: 12,
                background: 'var(--bg-section)', border: '1px solid var(--border-light)',
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
              }}>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Patient</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)', marginTop: 4 }}>
                    {viewTokenAppt.patientId?.name ?? '—'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {viewTokenAppt.patientId?.phone ?? ''}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Doctor</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)', marginTop: 4 }}>
                    {viewTokenAppt.doctorId?.name ?? '—'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>
                    {viewTokenAppt.doctorId?.specialization ?? ''}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</div>
                  <div style={{ marginTop: 4 }}>
                    <StatusBadge status={viewTokenData.status} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Priority</div>
                  <div style={{
                    marginTop: 4,
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px', borderRadius: 999,
                    background: viewTokenData.priority === 'emergency' ? '#FEE2E2' : viewTokenData.priority === 'priority' ? '#FEF3C7' : '#F1F5F9',
                    color: viewTokenData.priority === 'emergency' ? '#B91C1C' : viewTokenData.priority === 'priority' ? '#92400E' : '#475569',
                    fontSize: 12, fontWeight: 700, textTransform: 'capitalize',
                  }}>
                    {viewTokenData.priority}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Issued at</div>
                  <div style={{ fontSize: 13, color: 'var(--fg-primary)', marginTop: 4 }}>
                    {viewTokenData.issuedAt ? dayjs(viewTokenData.issuedAt).format('DD MMM YYYY · hh:mm A') : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Called at</div>
                  <div style={{ fontSize: 13, color: 'var(--fg-primary)', marginTop: 4 }}>
                    {viewTokenData.calledAt ? dayjs(viewTokenData.calledAt).format('DD MMM YYYY · hh:mm A') : '—'}
                  </div>
                </div>
              </div>

              {viewTokenData.notes && (
                <div style={{
                  marginTop: 12, padding: '10px 14px', borderRadius: 10,
                  background: '#FFFFFF', border: '1px solid var(--border-soft)',
                  fontSize: 13, color: 'var(--fg-primary)', lineHeight: 1.6,
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>
                    Notes
                  </span>
                  {viewTokenData.notes}
                </div>
              )}

              <div style={{
                marginTop: 12, padding: '10px 12px', borderRadius: 10,
                background: '#EFF6FF', border: '1px solid #BFDBFE',
                fontSize: 12, color: '#1E4FA3', lineHeight: 1.55,
              }}>
                Use the arrows to swap this token's place with the one immediately before or after it in the doctor's queue.
              </div>
            </>
          )}
        </Modal>
      )}
    </>
  )
}
