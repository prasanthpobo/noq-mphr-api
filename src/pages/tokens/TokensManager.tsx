import { useState } from 'react'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import Badge from '@/components/ui/Badge'
import { StatusBadge } from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import Modal from '@/components/ui/Modal'
import { useAppStore } from '@/store/app'
import { TOKEN_QUEUE, DOCTORS, PATIENTS, CLINICS } from '@/data'
import type { TokenQueue, Priority } from '@/types'

const STATUS_FILTERS = ['All', 'Waiting', 'In consultation', 'Completed', 'Cancelled', 'Not visited']

function matchStatus(q: TokenQueue, chip: string): boolean {
  if (chip === 'All') return true
  if (chip === 'Waiting') return q.status === 'waiting'
  if (chip === 'In consultation') return q.status === 'in-consultation'
  if (chip === 'Completed') return q.status === 'completed'
  if (chip === 'Cancelled') return q.status === 'cancelled'
  if (chip === 'Not visited') return q.status === 'not-visited'
  return true
}

type ModalType = 'add' | 'view' | 'edit' | null

export default function TokensManager() {
  const { setRoute } = useAppStore()
  const [queue, setQueue] = useState<TokenQueue[]>(TOKEN_QUEUE.map((t, i) => ({ ...t, pos: i + 1 })))
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [doctorFilter, setDoctorFilter] = useState('All')
  const [modalType, setModalType] = useState<ModalType>(null)
  const [selectedToken, setSelectedToken] = useState<TokenQueue | null>(null)

  // Add modal state
  const [addPatient, setAddPatient] = useState('')
  const [addClinic, setAddClinic] = useState('')
  const [addDoctor, setAddDoctor] = useState('')
  const [addSlot, setAddSlot] = useState('')
  const [addTokenMode, setAddTokenMode] = useState<'auto' | 'manual'>('auto')
  const [addTokenNum, setAddTokenNum] = useState('')
  const [addPriority, setAddPriority] = useState<Priority>('normal')
  const [addNotes, setAddNotes] = useState('')

  // Edit modal state
  const [editDoctor, setEditDoctor] = useState('')
  const [editSlot, setEditSlot] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const filtered = queue.filter(q => {
    const qLower = search.toLowerCase()
    const matchSearch = !qLower || q.id.toLowerCase().includes(qLower) || q.patient.toLowerCase().includes(qLower) || q.doctor.toLowerCase().includes(qLower)
    const matchSt = matchStatus(q, statusFilter)
    const matchDr = doctorFilter === 'All' || q.doctor === doctorFilter
    return matchSearch && matchSt && matchDr
  })

  const total        = queue.length
  const waiting      = queue.filter(q => q.status === 'waiting').length
  const inConsult    = queue.filter(q => q.status === 'in-consultation').length
  const completed    = queue.filter(q => q.status === 'completed').length
  const cancelled    = queue.filter(q => q.status === 'cancelled').length

  const moveUp = (id: string) => {
    setQueue(prev => {
      const idx = prev.findIndex(t => t.id === id)
      if (idx <= 0) return prev
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next.map((t, i) => ({ ...t, pos: i + 1 }))
    })
  }

  const moveDown = (id: string) => {
    setQueue(prev => {
      const idx = prev.findIndex(t => t.id === id)
      if (idx < 0 || idx >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next.map((t, i) => ({ ...t, pos: i + 1 }))
    })
  }

  const markCompleted = (id: string) => {
    setQueue(prev => prev.map(t => t.id === id ? { ...t, status: 'completed' } : t))
  }

  const cancelToken = (id: string) => {
    setQueue(prev => prev.map(t => t.id === id ? { ...t, status: 'cancelled' } : t))
  }

  const openView = (t: TokenQueue) => { setSelectedToken(t); setModalType('view') }
  const openEdit = (t: TokenQueue) => {
    setSelectedToken(t)
    setEditDoctor(t.doctor)
    setEditSlot(t.slot)
    setEditStatus(t.status)
    setEditNotes(t.notes)
    setModalType('edit')
  }

  const saveEdit = () => {
    if (!selectedToken) return
    setQueue(prev => prev.map(t => t.id === selectedToken.id ? { ...t, doctor: editDoctor, slot: editSlot, status: editStatus as TokenQueue['status'], notes: editNotes } : t))
    setModalType(null)
  }

  const autoToken = (): string => {
    const last = queue[queue.length - 1]?.id ?? 'A-000'
    const num = parseInt(last.split('-')[1] ?? '0', 10) + 1
    return `A-${String(num).padStart(3, '0')}`
  }

  const addValid = addPatient && addClinic && addDoctor && addSlot && (addTokenMode === 'auto' || addTokenNum)

  const saveAdd = () => {
    if (!addValid) return
    const patient = PATIENTS.find(p => p.name === addPatient)
    const newToken: TokenQueue = {
      id: addTokenMode === 'auto' ? autoToken() : addTokenNum,
      patient: addPatient,
      patientId: patient?.id ?? 'P-???',
      clinic: addClinic,
      doctor: addDoctor,
      slot: addSlot,
      status: 'not-visited',
      priority: addPriority,
      pos: queue.length + 1,
      created: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      notes: addNotes,
      av: patient ? patient.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??',
      tone: patient?.tone ?? 'blue',
    }
    setQueue(prev => [...prev, newToken])
    setModalType(null)
    setAddPatient(''); setAddClinic(''); setAddDoctor(''); setAddSlot('')
    setAddTokenMode('auto'); setAddTokenNum(''); setAddPriority('normal'); setAddNotes('')
  }

  return (
    <>
      <Header
        title="Tokens manager"
        crumbs={`${total} total · ${waiting} waiting · ${inConsult} in consultation`}
        onAdd={() => setModalType('add')}
        addLabel="Add token"
      />

      <div className="main">
        {/* KPI Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          <StatCard ic="ticket" tone="blue"   label="Total tokens"      value={String(total)}     foot="Today's queue" />
          <StatCard ic="hourglass" tone="amber" label="Waiting"         value={String(waiting)}   foot="In queue" accent />
          <StatCard ic="stethoscope" tone="teal" label="In consultation" value={String(inConsult)} foot="With doctor" />
          <StatCard ic="check"   tone="green" label="Completed"         value={String(completed)} foot="Seen today" />
          <StatCard ic="x"       tone="plum"  label="Cancelled"         value={String(cancelled)} foot="No-shows + cancelled" />
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
              {DOCTORS.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
            <div className="filters">
              {STATUS_FILTERS.map(f => (
                <button
                  key={f}
                  className={`chip ${statusFilter === f ? 'active' : ''}`}
                  onClick={() => setStatusFilter(f)}
                >
                  {f}
                  <span className="count">{queue.filter(q => matchStatus(q, f)).length}</span>
                </button>
              ))}
            </div>
          </div>

          <table className="data">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>Token</th>
                <th>Patient</th>
                <th>Clinic</th>
                <th>Doctor</th>
                <th>Slot</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--fg-muted)' }}>
                      <Icon name="ticket" size={32} />
                      <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600 }}>No tokens found</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your filters</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((t, idx) => {
                  const isNow = t.status === 'in-consultation'
                  const globalIdx = queue.indexOf(t)
                  return (
                    <tr key={t.id} style={{ background: isNow ? 'var(--brand-gradient-soft)' : undefined }}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 700, color: 'var(--fg-secondary)', textAlign: 'center' }}>
                        {t.pos}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span className={`cell-token ${t.priority === 'emergency' ? 'emergency' : ''}`}>{t.id}</span>
                          {isNow && <Badge variant="teal">NOW</Badge>}
                          {t.priority === 'emergency' && <Badge variant="danger">EMG</Badge>}
                          {t.priority === 'priority' && <Badge variant="warning">PRI</Badge>}
                        </div>
                      </td>
                      <td>
                        <div className="cell-person">
                          <div className={`av ${t.tone}`}>{t.av}</div>
                          <div className="info">
                            <div className="n">{t.patient}</div>
                            <div className="s">{t.patientId}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>{t.clinic}</td>
                      <td style={{ fontSize: 13, fontWeight: 600 }}>{t.doctor}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--fg-secondary)' }}>{t.slot}</td>
                      <td><StatusBadge status={t.status} emergency={t.priority === 'emergency'} /></td>
                      <td>
                        <div className="row-actions">
                          <button className="act" title="View" onClick={() => openView(t)}><Icon name="eye" size={13} /></button>
                          <button className="act" title="Edit" onClick={() => openEdit(t)}><Icon name="edit" size={13} /></button>
                          <button className="act" title="Move up" disabled={globalIdx === 0} onClick={() => moveUp(t.id)} style={{ opacity: globalIdx === 0 ? 0.3 : 1 }}>
                            <Icon name="arrowUp" size={13} />
                          </button>
                          <button className="act" title="Move down" disabled={globalIdx === queue.length - 1} onClick={() => moveDown(t.id)} style={{ opacity: globalIdx === queue.length - 1 ? 0.3 : 1 }}>
                            <Icon name="arrowDown" size={13} />
                          </button>
                          <button className="act success" title="Mark completed" onClick={() => markCompleted(t.id)} style={{ color: 'var(--fg-secondary)' }}>
                            <Icon name="check" size={13} />
                          </button>
                          <button className="act danger" title="Cancel" onClick={() => cancelToken(t.id)}>
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
              <label className="form-label required">Patient</label>
              <select className="form-input" value={addPatient} onChange={e => setAddPatient(e.target.value)}>
                <option value="">Select patient…</option>
                {PATIENTS.map(p => <option key={p.id} value={p.name}>{p.name} · {p.id}</option>)}
              </select>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label required">Clinic</label>
                <select className="form-input" value={addClinic} onChange={e => setAddClinic(e.target.value)}>
                  <option value="">Select clinic…</option>
                  {CLINICS.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label required">Doctor</label>
                <select className="form-input" value={addDoctor} onChange={e => setAddDoctor(e.target.value)}>
                  <option value="">Select doctor…</option>
                  {DOCTORS.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label required">Time slot</label>
              <input type="time" className="form-input" value={addSlot} onChange={e => setAddSlot(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Token number</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div className="seg-ctrl">
                  <button className={addTokenMode === 'auto' ? 'active' : ''} onClick={() => setAddTokenMode('auto')}>Auto</button>
                  <button className={addTokenMode === 'manual' ? 'active' : ''} onClick={() => setAddTokenMode('manual')}>Manual</button>
                </div>
                {addTokenMode === 'auto' ? (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13.5, fontWeight: 700, color: 'var(--teal-600)', background: 'var(--teal-100)', padding: '5px 10px', borderRadius: 8 }}>{autoToken()}</span>
                ) : (
                  <input className="form-input" style={{ width: 120 }} placeholder="e.g. A-011" value={addTokenNum} onChange={e => setAddTokenNum(e.target.value)} />
                )}
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
          title={`Token ${selectedToken.id}`}
          onClose={() => setModalType(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalType(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => openEdit(selectedToken)}>Edit</button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className={`cell-token ${selectedToken.priority === 'emergency' ? 'emergency' : ''}`} style={{ fontSize: 16, padding: '6px 14px' }}>
                {selectedToken.id}
              </span>
              <StatusBadge status={selectedToken.status} emergency={selectedToken.priority === 'emergency'} />
              {selectedToken.priority !== 'normal' && <Badge variant={selectedToken.priority === 'emergency' ? 'danger' : 'warning'}>{selectedToken.priority}</Badge>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-section)', borderRadius: 12 }}>
              <div className={`av lg ${selectedToken.tone}`}>{selectedToken.av}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{selectedToken.patient}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 2 }}>{selectedToken.patientId}</div>
              </div>
            </div>
            <div className="grid-2" style={{ gap: 10 }}>
              {[
                { label: 'Clinic', value: selectedToken.clinic },
                { label: 'Doctor', value: selectedToken.doctor },
                { label: 'Slot', value: selectedToken.slot },
                { label: 'Queue pos.', value: `#${selectedToken.pos}` },
                { label: 'Created', value: selectedToken.created },
                { label: 'Priority', value: selectedToken.priority },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-muted)', marginBottom: 3 }}>{f.label}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{f.value}</div>
                </div>
              ))}
            </div>
            {selectedToken.notes && (
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-muted)', marginBottom: 6 }}>Notes</div>
                <div style={{ padding: '10px 12px', background: 'var(--bg-section)', borderRadius: 10, fontSize: 13.5 }}>{selectedToken.notes}</div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Edit Token Modal */}
      {modalType === 'edit' && selectedToken && (
        <Modal
          title={`Edit token ${selectedToken.id}`}
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
              <label className="form-label">Doctor</label>
              <select className="form-input" value={editDoctor} onChange={e => setEditDoctor(e.target.value)}>
                {DOCTORS.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Time slot</label>
              <input type="time" className="form-input" value={editSlot} onChange={e => setEditSlot(e.target.value)} />
            </div>
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
