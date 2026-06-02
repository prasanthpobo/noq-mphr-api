import { useState, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import Badge from '@/components/ui/Badge'
import { StatusBadge } from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import Modal from '@/components/ui/Modal'
import { useAppStore } from '@/store/app'
import { tokensService } from '@/services/tokens.service'
import { toast } from '@/store/toast'
import type { Priority } from '@/types'

const STATUS_FILTERS = ['All', 'Waiting', 'In consultation', 'Completed', 'Cancelled', 'Not visited']

function matchStatus(q: any, chip: string): boolean {
  if (chip === 'All') return true
  if (chip === 'Waiting') return q.status === 'waiting'
  if (chip === 'In consultation') return q.status === 'in-consultation'
  if (chip === 'Completed') return q.status === 'completed'
  if (chip === 'Cancelled') return q.status === 'cancelled'
  if (chip === 'Not visited') return q.status === 'not-visited'
  return true
}

const TABLE_COLS = 6

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
            width: i === TABLE_COLS - 1 ? '80%' : '85%',
          }} />
        </td>
      ))}
    </tr>
  )
}

type ModalType = 'add' | 'view' | 'edit' | null

export default function TokensManager() {
  const { setRoute } = useAppStore()
  const [items, setItems]               = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [doctorFilter, setDoctorFilter] = useState('All')
  const [modalType, setModalType]       = useState<ModalType>(null)
  const [selectedToken, setSelectedToken] = useState<any | null>(null)

  // Add modal state
  const [addPatientId, setAddPatientId] = useState('')
  const [addDoctorId, setAddDoctorId]   = useState('')
  const [addClinicId, setAddClinicId]   = useState('')
  const [addPriority, setAddPriority]   = useState<Priority>('normal')
  const [addNotes, setAddNotes]         = useState('')

  // Edit modal state
  const [editStatus, setEditStatus] = useState('')
  const [editNotes, setEditNotes]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await tokensService.list({ date: dayjs().format('YYYY-MM-DD') })
      setItems((res.data ?? []).map((t: any, i: number) => ({ ...t, pos: i + 1 })))
    } catch {
      toast.error('Failed to load tokens')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const uniqueDoctors = Array.from(
    new Set(items.map(t => t.doctorId?.name).filter(Boolean))
  ) as string[]

  const filtered = items.filter(q => {
    const qLower = search.toLowerCase()
    const matchSearch = !qLower ||
      String(q.tokenNumber ?? '').toLowerCase().includes(qLower) ||
      (q.patientId?.name ?? '').toLowerCase().includes(qLower) ||
      (q.doctorId?.name ?? '').toLowerCase().includes(qLower)
    const matchSt = matchStatus(q, statusFilter)
    const matchDr = doctorFilter === 'All' || q.doctorId?.name === doctorFilter
    return matchSearch && matchSt && matchDr
  })

  const total     = items.length
  const waiting   = items.filter(q => q.status === 'waiting').length
  const inConsult = items.filter(q => q.status === 'in-consultation').length
  const completed = items.filter(q => q.status === 'completed').length
  const cancelled = items.filter(q => q.status === 'cancelled').length

  const moveUp = async (item: any) => {
    try {
      await tokensService.move(item._id, 'up')
      toast.success('Token moved up')
      load()
    } catch {
      toast.error('Failed to move token')
    }
  }

  const moveDown = async (item: any) => {
    try {
      await tokensService.move(item._id, 'down')
      toast.success('Token moved down')
      load()
    } catch {
      toast.error('Failed to move token')
    }
  }

  const markCompleted = async (item: any) => {
    try {
      await tokensService.updateStatus(item._id, 'completed')
      toast.success('Token marked completed')
      load()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const cancelToken = async (item: any) => {
    try {
      await tokensService.updateStatus(item._id, 'cancelled')
      toast.success('Token cancelled')
      load()
    } catch {
      toast.error('Failed to cancel token')
    }
  }

  const openView = (t: any) => { setSelectedToken(t); setModalType('view') }
  const openEdit = (t: any) => {
    setSelectedToken(t)
    setEditStatus(t.status)
    setEditNotes(t.notes ?? '')
    setModalType('edit')
  }

  const saveEdit = async () => {
    if (!selectedToken) return
    try {
      await tokensService.updateStatus(selectedToken._id, editStatus)
      toast.success('Token updated')
      setModalType(null)
      load()
    } catch {
      toast.error('Failed to update token')
    }
  }

  const addValid = addPatientId.trim() && addDoctorId.trim() && addClinicId.trim()

  const saveAdd = async () => {
    if (!addValid) return
    try {
      await tokensService.create({
        patientId: addPatientId.trim(),
        doctorId:  addDoctorId.trim(),
        clinicId:  addClinicId.trim(),
        priority:  addPriority,
        notes:     addNotes,
        date:      dayjs().toISOString(),
      })
      toast.success('Token created')
      setModalType(null)
      setAddPatientId(''); setAddDoctorId(''); setAddClinicId('')
      setAddPriority('normal'); setAddNotes('')
      load()
    } catch {
      toast.error('Failed to create token')
    }
  }

  return (
    <>
      <Header
        title="Tokens manager"
        crumbs={`${total} total · ${waiting} waiting · ${inConsult} in consultation`}
      />

      <div className="main">
        {/* KPI Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          <StatCard ic="ticket"      tone="blue"  label="Total tokens"      value={String(total)}     foot="Today's queue" />
          <StatCard ic="hourglass"   tone="amber" label="Waiting"           value={String(waiting)}   foot="In queue" accent />
          <StatCard ic="stethoscope" tone="teal"  label="In consultation"   value={String(inConsult)} foot="With doctor" />
          <StatCard ic="check"       tone="green" label="Completed"         value={String(completed)} foot="Seen today" />
          <StatCard ic="x"           tone="plum"  label="Cancelled"         value={String(cancelled)} foot="No-shows + cancelled" />
        </div>

        <div className="table-card">
          <div className="table-toolbar">
            <div className="table-search">
              <Icon name="search" size={15} />
              <input
                placeholder="Search token, patient, doctor…"
                value={search}
                onChange={e => { setSearch(e.target.value) }}
              />
            </div>
            <select
              className="form-input"
              style={{ width: 180 }}
              value={doctorFilter}
              onChange={e => setDoctorFilter(e.target.value)}
            >
              <option value="All">All doctors</option>
              {uniqueDoctors.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <div className="filters">
              {STATUS_FILTERS.map(f => (
                <button
                  key={f}
                  className={`chip ${statusFilter === f ? 'active' : ''}`}
                  onClick={() => setStatusFilter(f)}
                >
                  {f}
                  <span className="count">{items.filter(q => matchStatus(q, f)).length}</span>
                </button>
              ))}
            </div>
            <button
              className="btn btn-primary btn-sm"
              style={{ marginLeft: 'auto' }}
              onClick={() => setModalType('add')}
            >
              <Icon name="plus" size={14}/> Add token
            </button>
          </div>

          <table className="data">
            <thead>
              <tr>
                <th>Token #</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date &amp; Time</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={TABLE_COLS}>
                    <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--fg-muted)' }}>
                      <Icon name="ticket" size={32} />
                      <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600 }}>No tokens found</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your filters</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const isNow       = t.status === 'in-consultation'
                  const globalIdx   = items.indexOf(t)
                  const patientName = t.patientId?.name ?? 'Patient'
                  const initials    = patientName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                  const apptDate    = t.appointmentId?.date ?? t.issuedAt
                  const slotTime    = t.appointmentId?.time
                  return (
                    <tr key={t._id} style={{ background: isNow ? 'var(--brand-gradient-soft)' : undefined }}>
                      {/* Token Number */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span className={`cell-token ${t.priority === 'emergency' ? 'emergency' : ''}`}
                                style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {String(t.tokenNumber).padStart(3, '0')}
                          </span>
                          {isNow && <Badge variant="teal">NOW</Badge>}
                          {t.priority === 'emergency' && <Badge variant="danger">EMG</Badge>}
                          {t.priority === 'priority'  && <Badge variant="warning">PRI</Badge>}
                        </div>
                      </td>

                      {/* Patient Name */}
                      <td>
                        <div className="cell-person">
                          <div className="av blue">{initials}</div>
                          <div className="info">
                            <div className="n">{patientName}</div>
                            {t.patientId?.phone && (
                              <div className="s">{t.patientId.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Doctor Name */}
                      <td>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-primary)' }}>
                          {t.doctorId?.name ?? '—'}
                        </div>
                        {t.doctorId?.specialization && (
                          <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2 }}>
                            {t.doctorId.specialization}
                          </div>
                        )}
                      </td>

                      {/* Date and Time */}
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>
                          {apptDate ? dayjs(apptDate).format('DD MMM YYYY') : '—'}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-secondary)', marginTop: 2 }}>
                          {slotTime ?? (t.issuedAt ? dayjs(t.issuedAt).format('hh:mm A') : '—')}
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <StatusBadge status={t.status} emergency={t.priority === 'emergency'} />
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="row-actions">
                          <button className="act" title="View" onClick={() => openView(t)}><Icon name="eye" size={13} /></button>
                          <button className="act" title="Edit" onClick={() => openEdit(t)}><Icon name="edit" size={13} /></button>
                          <button className="act" title="Move up"   disabled={globalIdx === 0}                   onClick={() => moveUp(t)}   style={{ opacity: globalIdx === 0 ? 0.3 : 1 }}>
                            <Icon name="arrowUp" size={13} />
                          </button>
                          <button className="act" title="Move down" disabled={globalIdx === items.length - 1}    onClick={() => moveDown(t)} style={{ opacity: globalIdx === items.length - 1 ? 0.3 : 1 }}>
                            <Icon name="arrowDown" size={13} />
                          </button>
                          <button className="act success" title="Mark completed" onClick={() => markCompleted(t)} style={{ color: 'var(--fg-secondary)' }}>
                            <Icon name="check" size={13} />
                          </button>
                          <button className="act danger"  title="Cancel" onClick={() => cancelToken(t)}>
                            <Icon name="x" size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderTop: '1px solid var(--border-light)',
            fontSize: 12.5, color: 'var(--fg-secondary)',
          }}>
            <span>Showing {filtered.length} of {total} tokens</span>
          </div>
        </div>
      </div>

      {/* Add Token Modal */}
      {modalType === 'add' && (
        <Modal
          title="Add token"
          onClose={() => setModalType(null)}
          size="lg"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={!addValid} onClick={saveAdd}>Save token</button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label required">Patient ID</label>
              <input
                className="form-input"
                placeholder="Enter patient ID…"
                value={addPatientId}
                onChange={e => setAddPatientId(e.target.value)}
              />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label required">Clinic ID</label>
                <input
                  className="form-input"
                  placeholder="Enter clinic ID…"
                  value={addClinicId}
                  onChange={e => setAddClinicId(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label required">Doctor ID</label>
                <input
                  className="form-input"
                  placeholder="Enter doctor ID…"
                  value={addDoctorId}
                  onChange={e => setAddDoctorId(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <div className="seg-ctrl">
                {(['normal', 'priority', 'emergency'] as Priority[]).map(p => (
                  <button key={p} className={addPriority === p ? 'active' : ''} onClick={() => setAddPriority(p)} style={{ textTransform: 'capitalize' }}>{p}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-input form-textarea" placeholder="Optional notes…" value={addNotes} onChange={e => setAddNotes(e.target.value)} style={{ minHeight: 60 }} />
            </div>
          </div>
        </Modal>
      )}

      {/* View Token Modal */}
      {modalType === 'view' && selectedToken && (
        <Modal
          title={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <span style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'var(--brand-gradient-soft)',
                border: '1px solid rgba(30,79,163,0.18)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon name="ticket" size={18} style={{ color: 'var(--teal-600)' }} />
              </span>
              <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--fg-primary)', letterSpacing: -0.2, lineHeight: 1.1 }}>
                Token {selectedToken.tokenNumber}
              </span>
              <StatusBadge
                status={selectedToken.status}
                emergency={selectedToken.priority === 'emergency'}
              />
              {selectedToken.priority !== 'normal' && (
                <Badge variant={selectedToken.priority === 'emergency' ? 'danger' : 'warning'}>
                  {selectedToken.priority}
                </Badge>
              )}
            </span>
          }
          onClose={() => setModalType(null)}
          size="lg"
        >
          {(() => {
            const t           = selectedToken
            const patientName = t.patientId?.name ?? 'Patient'
            const initials    = patientName.split(' ').map((n: string) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Patient card */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 16,
                  background: 'var(--brand-gradient-soft)',
                  border: '1px solid rgba(30,79,163,0.10)',
                }}>
                  <div className="av lg blue" style={{ width: 54, height: 54, fontSize: 16 }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--fg-primary)' }}>
                      {patientName}
                    </div>
                    <div style={{
                      fontSize: 13, color: 'var(--fg-secondary)', fontWeight: 600,
                      marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}>
                      <Icon name="phone" size={12} style={{ color: 'var(--teal-600)' }} />
                      {t.patientId?.phone ?? '—'}
                    </div>
                  </div>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: 'var(--bg-surface)', border: '1px solid var(--border-soft)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon name="user" size={18} style={{ color: 'var(--teal-600)' }} />
                  </div>
                </div>

                {/* Detail grid card */}
                <div style={{
                  borderRadius: 16, border: '1px solid var(--border-light)',
                  background: 'var(--bg-surface)', overflow: 'hidden',
                }}>
                  {(() => {
                    const slotDate = t.appointmentId?.date
                    const slotTime = t.appointmentId?.time
                    const dateStr  = slotDate ? dayjs(slotDate).format('DD MMM YYYY') : null
                    const cells: {
                      label: string
                      primary: string
                      secondary?: string
                      icon: string
                      bg: string
                      fg: string
                      capitalize?: boolean
                    }[][] = [
                      [
                        { label: 'Clinic',       primary: t.clinicId?.name ?? '—',
                          icon: 'building',    bg: '#DCFCE7', fg: '#16A34A' },
                        { label: 'Doctor',       primary: t.doctorId?.name ?? '—',
                          secondary: t.doctorId?.specialization ?? undefined,
                          icon: 'stethoscope', bg: '#EDE9FE', fg: '#7C3AED' },
                      ],
                      [
                        { label: 'Date & time',  primary: slotTime ?? (slotDate ? dayjs(slotDate).format('hh:mm A') : '—'),
                          secondary: dateStr ?? undefined,
                          icon: 'clock',       bg: '#FEF3C7', fg: '#D97706' },
                        { label: 'Queue pos.',   primary: `#${t.pos ?? '—'}`,
                          icon: 'hash',        bg: '#CCFBF1', fg: '#0D9488' },
                      ],
                      [
                        { label: 'Issued at',    primary: t.issuedAt ? dayjs(t.issuedAt).format('hh:mm A') : '—',
                          secondary: t.issuedAt ? dayjs(t.issuedAt).format('DD MMM YYYY') : undefined,
                          icon: 'calendar',    bg: '#DBEAFE', fg: '#2563EB' },
                        { label: 'Priority',     primary: t.priority,
                          icon: 'flag',        bg: '#FEE2E2', fg: '#DC2626',
                          capitalize: true },
                      ],
                    ]
                    return cells.map((row, rowIdx) => (
                      <div key={rowIdx}
                        style={{
                          display: 'grid', gridTemplateColumns: '1fr 1fr',
                          borderBottom: rowIdx < cells.length - 1 ? '1px solid var(--border-light)' : 'none',
                        }}>
                        {row.map((cell, cellIdx) => (
                          <div key={cell.label}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
                              borderRight: cellIdx === 0 ? '1px solid var(--border-light)' : 'none',
                            }}>
                            <div style={{
                              width: 42, height: 42, borderRadius: 12,
                              background: cell.bg, color: cell.fg,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                              <HashOrIcon name={cell.icon} fg={cell.fg} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{
                                fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase',
                                letterSpacing: '0.06em', color: 'var(--fg-muted)', marginBottom: 4,
                              }}>{cell.label}</div>
                              <div style={{
                                fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)',
                                textTransform: cell.capitalize ? 'capitalize' : undefined,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              }}>{cell.primary}</div>
                              {cell.secondary && (
                                <div style={{
                                  fontSize: 11.5, color: 'var(--fg-secondary)', fontWeight: 500,
                                  marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                }}>{cell.secondary}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  })()}
                </div>

                {/* Footer action row */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10,
                  alignItems: 'stretch',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 12,
                    background: 'var(--brand-gradient-soft)',
                    border: '1px solid rgba(30,79,163,0.10)',
                    fontSize: 12.5, color: 'var(--fg-primary)', lineHeight: 1.4,
                  }}>
                    <Icon name="info" size={16} style={{ color: 'var(--teal-600)', flexShrink: 0 }} />
                    <span>
                      Please be present at the clinic{' '}
                      <span style={{ color: 'var(--teal-600)', fontWeight: 800 }}>15 minutes</span>{' '}
                      before your slot time.
                    </span>
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={() => window.print()}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Icon name="printer" size={14} /> Print Token
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => openEdit(t)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Icon name="edit" size={14} /> Edit Token
                  </button>
                </div>

                {/* Optional notes */}
                {t.notes && (
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-muted)', marginBottom: 6 }}>Notes</div>
                    <div style={{ padding: '10px 12px', background: 'var(--bg-section)', borderRadius: 10, fontSize: 13.5 }}>{t.notes}</div>
                  </div>
                )}
              </div>
            )
          })()}
        </Modal>
      )}

      {/* Edit Token Modal */}
      {modalType === 'edit' && selectedToken && (
        <Modal
          title={`Edit token ${selectedToken.tokenNumber}`}
          onClose={() => setModalType(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEdit}>Update</button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                <option value="not-visited">Not visited</option>
                <option value="waiting">Waiting</option>
                <option value="in-consultation">In consultation</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-input form-textarea" value={editNotes} onChange={e => setEditNotes(e.target.value)} style={{ minHeight: 60 }} />
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

/**
 * Renders an icon for the detail-tile, falling back to a styled `#` glyph
 * for icon names that don't exist in our SVG set (e.g. `hash`).
 */
function HashOrIcon({ name, fg }: { name: string; fg: string }) {
  if (name === 'hash') {
    return (
      <span style={{
        fontSize: 18, fontWeight: 900, color: fg, lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}>#</span>
    )
  }
  return <Icon name={name} size={18} style={{ color: fg }} />
}
