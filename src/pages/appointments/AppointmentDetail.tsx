import { useState } from 'react'
import Icon from '@/components/ui/Icon'
import Badge from '@/components/ui/Badge'
import { StatusBadge } from '@/components/ui/Badge'
import { useAppStore } from '@/store/app'

interface Props {
  mode: 'view' | 'edit'
}

const QUEUE_TOKENS = [
  { id: 'A-027', done: true },
  { id: 'A-028', done: true },
  { id: 'A-029', done: true },
  { id: 'A-030', done: true },
  { id: 'A-031', done: true },
  { id: 'A-032', done: false, current: true },
  { id: 'A-033', done: false },
  { id: 'A-034', done: false },
  { id: 'A-035', done: false, yours: true },
]

const TABS = ['Appointment info', 'Consultation info', 'Rx info', 'Medical documents']

const MEDICINES_LIST = [
  'Paracetamol', 'Amoxicillin', 'Ibuprofen', 'Metformin', 'Atorvastatin',
  'Azithromycin', 'Cetirizine', 'Omeprazole', 'Pantoprazole', 'Losartan',
  'Amlodipine', 'Metoprolol', 'Ciprofloxacin', 'Doxycycline', 'Clopidogrel', 'Aspirin',
]

const MED_TYPES = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Cream', 'Inhaler']
const DUR_UNITS = ['days', 'weeks', 'months']

interface RxItem {
  id: number
  name: string
  type: string
  morning: boolean
  afternoon: boolean
  night: boolean
  durValue: string
  durUnit: string
  instructions: string
}

export default function AppointmentDetail({ mode }: Props) {
  const { setRoute } = useAppStore()
  const [tab, setTab] = useState(0)
  const [editMode, setEditMode] = useState(mode === 'edit')

  // Consultation vitals
  const [vitals, setVitals] = useState({ temp: '98.4', bp: '118/76', weight: '72', pulse: '78' })

  // Doctor notes
  const [notes, setNotes] = useState({ symptoms: 'Mild fever, headache', diagnosis: 'Viral fever', notes: 'Rest and hydration recommended' })
  const [followUp, setFollowUp] = useState(true)
  const [followDate, setFollowDate] = useState('2026-05-20')

  // Rx state
  const [rxList, setRxList] = useState<RxItem[]>([
    { id: 1, name: 'Paracetamol', type: 'Tablet', morning: true, afternoon: false, night: true, durValue: '5', durUnit: 'days', instructions: 'After meals' },
    { id: 2, name: 'Cetirizine', type: 'Tablet', morning: false, afternoon: false, night: true, durValue: '3', durUnit: 'days', instructions: 'At bedtime' },
  ])
  const [rxSearch, setRxSearch] = useState('')
  const [rxSuggestions, setRxSuggestions] = useState<string[]>([])
  const [editingRxId, setEditingRxId] = useState<number | null>(null)
  const [composer, setComposer] = useState<Omit<RxItem, 'id'>>({
    name: '', type: 'Tablet', morning: false, afternoon: false, night: false,
    durValue: '', durUnit: 'days', instructions: '',
  })

  const handleRxSearch = (val: string) => {
    setRxSearch(val)
    setComposer(c => ({ ...c, name: val }))
    if (val.length > 0) {
      setRxSuggestions(MEDICINES_LIST.filter(m => m.toLowerCase().includes(val.toLowerCase())).slice(0, 6))
    } else {
      setRxSuggestions([])
    }
  }

  const selectMed = (med: string) => {
    setRxSearch(med)
    setComposer(c => ({ ...c, name: med }))
    setRxSuggestions([])
  }

  const toggleSched = (sched: 'morning' | 'afternoon' | 'night') => {
    setComposer(c => ({ ...c, [sched]: !c[sched] }))
  }

  const composerValid = composer.name && composer.durValue && (composer.morning || composer.afternoon || composer.night)

  const addOrUpdateMed = () => {
    if (!composerValid) return
    if (editingRxId !== null) {
      setRxList(list => list.map(r => r.id === editingRxId ? { ...composer, id: editingRxId } : r))
      setEditingRxId(null)
    } else {
      setRxList(list => [...list, { ...composer, id: Date.now() }])
    }
    setComposer({ name: '', type: 'Tablet', morning: false, afternoon: false, night: false, durValue: '', durUnit: 'days', instructions: '' })
    setRxSearch('')
  }

  const editRx = (rx: RxItem) => {
    setEditingRxId(rx.id)
    setComposer({ name: rx.name, type: rx.type, morning: rx.morning, afternoon: rx.afternoon, night: rx.night, durValue: rx.durValue, durUnit: rx.durUnit, instructions: rx.instructions })
    setRxSearch(rx.name)
    setRxSuggestions([])
  }

  const deleteRx = (id: number) => {
    setRxList(list => list.filter(r => r.id !== id))
    if (editingRxId === id) {
      setEditingRxId(null)
      setComposer({ name: '', type: 'Tablet', morning: false, afternoon: false, night: false, durValue: '', durUnit: 'days', instructions: '' })
      setRxSearch('')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Top Strip */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px',
        background: 'linear-gradient(135deg, #0F5F67 0%, #1FA3A8 100%)',
        flexShrink: 0,
      }}>
        <button
          onClick={() => setRoute('appointments')}
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}
        >
          <Icon name="chevL" size={16} />
        </button>
        <div style={{
          background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '6px 14px',
          fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: 2,
        }}>
          A-032
        </div>
        <StatusBadge status="in-room" />
        <div style={{ flex: 1 }} />
        <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', gap: 6 }}>
          <Icon name="printer" size={14} /> Print Rx
        </button>
        <button
          className="btn btn-sm"
          onClick={() => setEditMode(e => !e)}
          style={{ background: editMode ? 'white' : 'rgba(255,255,255,0.15)', color: editMode ? 'var(--teal-800)' : 'white', border: 'none' }}
        >
          <Icon name="edit" size={14} /> {editMode ? 'Editing' : 'Edit'}
        </button>
      </div>

      {/* Live Queue Strip */}
      <div style={{
        background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-soft)',
        padding: '10px 24px', flexShrink: 0, overflowX: 'auto',
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 'max-content' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4 }}>Queue</span>
          {QUEUE_TOKENS.map(t => (
            <div
              key={t.id}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '5px 10px', borderRadius: 10, minWidth: 56, position: 'relative',
                background: t.current
                  ? 'linear-gradient(135deg, #1E4FA3, #1FA3A8)'
                  : t.done ? 'var(--bg-section)' : 'var(--bg-surface)',
                border: t.current ? 'none' : '1px solid var(--border-soft)',
                opacity: t.done ? 0.5 : 1,
              }}
            >
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
                color: t.current ? 'white' : 'var(--fg-primary)',
                textDecoration: t.done ? 'line-through' : 'none',
              }}>{t.id}</span>
              {t.current && (
                <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: 1 }}>Now</span>
              )}
              {t.yours && (
                <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--warning-500)', textTransform: 'uppercase', letterSpacing: 1 }}>You</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tab Strip */}
      <div style={{
        display: 'flex', gap: 0, background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-soft)', flexShrink: 0, padding: '0 24px',
      }}>
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            style={{
              padding: '12px 18px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13.5, fontWeight: tab === i ? 700 : 500,
              color: tab === i ? '#0F5F67' : 'var(--fg-secondary)',
              borderBottom: tab === i ? '2px solid #0F5F67' : '2px solid transparent',
              transition: 'all 140ms',
              whiteSpace: 'nowrap',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', paddingBottom: 80 }}>

        {/* Tab 1: Appointment Info */}
        {tab === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 800 }}>
            <div className="card">
              <div className="card-h"><h2>Basic details</h2></div>
              <div className="grid-4" style={{ gap: 12 }}>
                {[
                  { label: 'Appointment ID', value: 'APT-2026-0512' },
                  { label: 'Token', value: 'A-032' },
                  { label: 'Date', value: '13 May 2026' },
                  { label: 'Time', value: '11:45 AM' },
                  { label: 'Clinic', value: 'Sunshine Clinic' },
                  { label: 'Doctor', value: 'Dr. Ananya Rao' },
                  { label: 'Patient', value: 'Aarav Sharma' },
                  { label: 'Patient ID', value: 'P-1042' },
                ].map(f => (
                  <div key={f.label} className="form-group">
                    <label className="form-label">{f.label}</label>
                    {editMode ? (
                      <input className="form-input" defaultValue={f.value} />
                    ) : (
                      <div style={{ padding: '9px 12px', background: 'var(--bg-section)', borderRadius: 10, fontSize: 13.5, fontWeight: 500 }}>{f.value}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-h"><h2>Status & queue</h2></div>
              <div className="grid-3" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  {editMode ? (
                    <select className="form-input" defaultValue="in-room">
                      <option value="waiting">Waiting</option>
                      <option value="in-room">In room</option>
                      <option value="in-consultation">In consultation</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  ) : (
                    <div style={{ paddingTop: 4 }}><StatusBadge status="in-room" /></div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Queue position</label>
                  <div style={{ padding: '9px 12px', background: 'var(--bg-section)', borderRadius: 10, fontSize: 13.5, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>#6</div>
                </div>
                <div className="form-group">
                  <label className="form-label">ETA</label>
                  <div style={{ padding: '9px 12px', background: 'var(--bg-section)', borderRadius: 10, fontSize: 13.5, fontWeight: 500 }}>~18 min</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-h"><h2>Payment</h2></div>
              <div className="grid-4" style={{ gap: 12 }}>
                {[
                  { label: 'Consultation fee', value: '₹400' },
                  { label: 'Discount', value: '₹0' },
                  { label: 'Total', value: '₹400' },
                  { label: 'Payment method', value: 'UPI' },
                ].map(f => (
                  <div key={f.label} className="form-group">
                    <label className="form-label">{f.label}</label>
                    {editMode ? (
                      <input className="form-input" defaultValue={f.value} />
                    ) : (
                      <div style={{ padding: '9px 12px', background: 'var(--bg-section)', borderRadius: 10, fontSize: 13.5, fontWeight: 500 }}>{f.value}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Consultation Info */}
        {tab === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 800 }}>
            <div className="card">
              <div className="card-h"><h2>Vitals</h2></div>
              <div className="grid-4" style={{ gap: 12 }}>
                {[
                  { key: 'temp' as const, label: 'Temperature', unit: '°F', icon: 'thermometer' },
                  { key: 'bp' as const, label: 'Blood pressure', unit: 'mmHg', icon: 'activity' },
                  { key: 'weight' as const, label: 'Weight', unit: 'kg', icon: 'pulse' },
                  { key: 'pulse' as const, label: 'Pulse', unit: 'bpm', icon: 'heart' },
                ].map(v => (
                  <div key={v.key} style={{ background: 'var(--bg-section)', borderRadius: 14, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: 'var(--teal-600)' }}>
                      <Icon name={v.icon} size={16} />
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-secondary)' }}>{v.label}</span>
                    </div>
                    {editMode ? (
                      <input
                        className="form-input"
                        value={vitals[v.key]}
                        onChange={e => setVitals(vt => ({ ...vt, [v.key]: e.target.value }))}
                      />
                    ) : (
                      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--fg-primary)', letterSpacing: '-0.03em' }}>
                        {vitals[v.key]} <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)' }}>{v.unit}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-h"><h2>Doctor notes</h2></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { key: 'symptoms' as const, label: 'Symptoms' },
                  { key: 'diagnosis' as const, label: 'Diagnosis' },
                  { key: 'notes' as const, label: 'Clinical notes' },
                ].map(f => (
                  <div key={f.key} className="form-group">
                    <label className="form-label">{f.label}</label>
                    {editMode ? (
                      <textarea
                        className="form-input form-textarea"
                        value={notes[f.key]}
                        onChange={e => setNotes(n => ({ ...n, [f.key]: e.target.value }))}
                      />
                    ) : (
                      <div style={{ padding: '10px 12px', background: 'var(--bg-section)', borderRadius: 10, fontSize: 13.5, lineHeight: 1.6, minHeight: 60 }}>{notes[f.key]}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Follow-up</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 2 }}>Schedule a follow-up appointment</div>
                </div>
                <button
                  onClick={() => editMode && setFollowUp(f => !f)}
                  style={{
                    width: 44, height: 24, borderRadius: 12, border: 'none', cursor: editMode ? 'pointer' : 'default',
                    background: followUp ? 'linear-gradient(135deg, #1E4FA3, #1FA3A8)' : 'var(--ink-200)',
                    transition: 'background 200ms', position: 'relative',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%', background: 'white',
                    transition: 'left 200ms', left: followUp ? 22 : 2, boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  }} />
                </button>
              </div>
              {followUp && (
                <div className="form-group" style={{ marginTop: 14 }}>
                  <label className="form-label">Follow-up date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={followDate}
                    onChange={e => setFollowDate(e.target.value)}
                    disabled={!editMode}
                    style={{ maxWidth: 240 }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Rx Info */}
        {tab === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 800 }}>
            {/* Composer */}
            <div className="card">
              <div className="card-h">
                <h2>{editingRxId !== null ? 'Edit medicine' : 'Add medicine'}</h2>
                {editingRxId !== null && (
                  <button className="btn btn-ghost btn-sm" onClick={() => { setEditingRxId(null); setComposer({ name: '', type: 'Tablet', morning: false, afternoon: false, night: false, durValue: '', durUnit: 'days', instructions: '' }); setRxSearch('') }}>
                    Cancel edit
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Row 1: medicine search + type */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 12 }}>
                  <div className="form-group" style={{ position: 'relative' }}>
                    <label className="form-label required">Medicine name</label>
                    <input
                      className="form-input"
                      placeholder="Search medicine…"
                      value={rxSearch}
                      onChange={e => handleRxSearch(e.target.value)}
                      autoComplete="off"
                    />
                    {rxSuggestions.length > 0 && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-surface)',
                        border: '1px solid var(--border-soft)', borderRadius: 10, zIndex: 10,
                        boxShadow: 'var(--sh-elevated)', overflow: 'hidden',
                      }}>
                        {rxSuggestions.map(m => (
                          <button
                            key={m}
                            style={{ display: 'block', width: '100%', padding: '9px 14px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 13.5, color: 'var(--fg-primary)' }}
                            onMouseDown={() => selectMed(m)}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-input" value={composer.type} onChange={e => setComposer(c => ({ ...c, type: e.target.value }))}>
                      {MED_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                {/* Row 2: schedule + duration */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label required">Schedule</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(['morning', 'afternoon', 'night'] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => toggleSched(s)}
                          style={{
                            flex: 1, padding: '7px 0', borderRadius: 8, border: '1.5px solid',
                            borderColor: composer[s] ? 'transparent' : 'var(--border-soft)',
                            background: composer[s] ? 'linear-gradient(135deg, #0F5F67, #1FA3A8)' : 'var(--bg-surface)',
                            color: composer[s] ? 'white' : 'var(--fg-secondary)',
                            fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 140ms',
                            textTransform: 'capitalize',
                          }}
                        >
                          {s === 'morning' ? 'M' : s === 'afternoon' ? 'A' : 'N'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Duration</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="e.g. 5"
                        value={composer.durValue}
                        onChange={e => setComposer(c => ({ ...c, durValue: e.target.value }))}
                        style={{ width: 80 }}
                      />
                      <select className="form-input" value={composer.durUnit} onChange={e => setComposer(c => ({ ...c, durUnit: e.target.value }))}>
                        {DUR_UNITS.map(u => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                {/* Instructions */}
                <div className="form-group">
                  <label className="form-label">Instructions</label>
                  <textarea
                    className="form-input form-textarea"
                    placeholder="e.g. After meals, with water…"
                    value={composer.instructions}
                    onChange={e => setComposer(c => ({ ...c, instructions: e.target.value }))}
                    style={{ minHeight: 60 }}
                  />
                </div>
                <div>
                  <button
                    className="btn btn-primary"
                    disabled={!composerValid}
                    onClick={addOrUpdateMed}
                  >
                    <Icon name="plus" size={15} />
                    {editingRxId !== null ? 'Update medicine' : 'Add medicine'}
                  </button>
                </div>
              </div>
            </div>

            {/* Prescribed medicines list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rxList.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--fg-muted)', background: 'var(--bg-surface)', borderRadius: 14, border: '1px dashed var(--border-soft)' }}>
                  <Icon name="pill" size={28} />
                  <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600 }}>No medicines prescribed yet</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Use the form above to add medicines</div>
                </div>
              )}
              {rxList.map((rx, idx) => (
                <div key={rx.id} className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 10, background: 'var(--brand-gradient)',
                      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800, flexShrink: 0,
                    }}>
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 14.5 }}>{rx.name}</span>
                        <Badge variant="teal">{rx.type}</Badge>
                        <span style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>{rx.durValue} {rx.durUnit}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 5, marginBottom: rx.instructions ? 6 : 0 }}>
                        {(['morning', 'afternoon', 'night'] as const).map(s => (
                          <span
                            key={s}
                            style={{
                              width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, fontWeight: 800,
                              background: rx[s] ? 'linear-gradient(135deg, #0F5F67, #1FA3A8)' : 'var(--bg-section)',
                              color: rx[s] ? 'white' : 'var(--fg-muted)',
                            }}
                          >
                            {s === 'morning' ? 'M' : s === 'afternoon' ? 'A' : 'N'}
                          </span>
                        ))}
                      </div>
                      {rx.instructions && (
                        <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 4 }}>{rx.instructions}</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="act" style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border-soft)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--fg-secondary)' }} onClick={() => editRx(rx)} title="Edit">
                        <Icon name="edit" size={13} />
                      </button>
                      <button className="act" style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border-soft)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--fg-secondary)' }} onClick={() => deleteRx(rx.id)} title="Delete">
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Medical Documents */}
        {tab === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 800 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {['Lab report', 'Radiology scan', 'Previous records'].map(label => (
                <div
                  key={label}
                  style={{
                    border: '2px dashed var(--border-soft)', borderRadius: 14,
                    padding: '32px 16px', textAlign: 'center', cursor: 'pointer',
                    transition: 'border-color 140ms',
                    background: 'var(--bg-surface)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--teal-500)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-soft)')}
                >
                  <Icon name="upload" size={24} style={{ color: 'var(--fg-muted)', marginBottom: 8 }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-secondary)' }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 4 }}>Click to upload</div>
                </div>
              ))}
            </div>

            <div className="table-card">
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', fontWeight: 700, fontSize: 14 }}>Uploaded files</div>
              <table className="data">
                <thead>
                  <tr>
                    <th>File name</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'CBC_report_2026.pdf', type: 'Lab report', size: '245 KB', date: '10 May 2026' },
                    { name: 'Chest_Xray.jpg', type: 'Radiology', size: '1.2 MB', date: '08 May 2026' },
                  ].map(f => (
                    <tr key={f.name}>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{f.name}</td>
                      <td><Badge variant="blue">{f.type}</Badge></td>
                      <td style={{ color: 'var(--fg-secondary)', fontSize: 13 }}>{f.size}</td>
                      <td style={{ color: 'var(--fg-secondary)', fontSize: 13 }}>{f.date}</td>
                      <td>
                        <div className="row-actions">
                          <button className="act" title="View"><Icon name="eye" size={13} /></button>
                          <button className="act" title="Download"><Icon name="download" size={13} /></button>
                          <button className="act danger" title="Delete"><Icon name="trash" size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Sticky action bar */}
      <div style={{
        position: 'sticky', bottom: 0, display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 24px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-soft)',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.06)', flexShrink: 0, zIndex: 10,
      }}>
        {!editMode ? (
          <>
            <button className="btn btn-secondary" onClick={() => setRoute('appointments')}><Icon name="chevL" size={14} /> Close</button>
            <button className="btn btn-secondary"><Icon name="printer" size={14} /> Print</button>
            <div style={{ flex: 1 }} />
            <button className="btn btn-primary" onClick={() => setEditMode(true)}><Icon name="edit" size={14} /> Edit</button>
          </>
        ) : (
          <>
            <button className="btn btn-secondary" onClick={() => setEditMode(false)}><Icon name="x" size={14} /> Cancel</button>
            <button className="btn btn-danger"><Icon name="x" size={14} /> Cancel appointment</button>
            <div style={{ flex: 1 }} />
            <button className="btn btn-secondary" style={{ borderColor: 'var(--success-500)', color: 'var(--success-500)' }}>
              <Icon name="check" size={14} /> Mark completed
            </button>
            <button className="btn btn-primary"><Icon name="check" size={14} /> Update</button>
          </>
        )}
      </div>
    </div>
  )
}
