import { useState, useRef, useEffect } from 'react'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'

/* ── Types ─────────────────────────────────────────────────────────────── */
type TicketStatus   = 'open' | 'in-progress' | 'resolved' | 'closed'
type TicketPriority = 'high' | 'medium' | 'low'
type TicketCategory = 'Technical' | 'Billing' | 'Appointment' | 'Other'

interface TicketPerson {
  name: string
  av:   string
  tone: string
}

interface Ticket {
  id:          string
  title:       string
  category:    TicketCategory
  priority:    TicketPriority
  status:      TicketStatus
  created:     string
  createdBy:   TicketPerson
  assignedTo:  TicketPerson | null
  description: string
  replies:     number
  unread:      boolean
}

/* ── Initial data ───────────────────────────────────────────────────────── */
const INITIAL_TICKETS: Ticket[] = [
  { id: 'T-001', title: 'Token display frozen on TV', category: 'Technical', priority: 'high', status: 'open', created: '2026-05-08', createdBy: { name: 'Reena A.', av: 'RA', tone: 'blue' }, assignedTo: { name: 'Anil B.', av: 'AB', tone: 'mint' }, description: 'The TV token display screen froze at A-024 and did not advance. Staff had to restart the device manually. This has happened 3 times this week.', replies: 3, unread: true },
  { id: 'T-002', title: 'UPI payment charged twice for A-032', category: 'Billing', priority: 'high', status: 'in-progress', created: '2026-05-09', createdBy: { name: 'Mohit B.', av: 'MB', tone: 'indigo' }, assignedTo: { name: 'Neha B.', av: 'NB', tone: 'amber' }, description: 'Patient Aarav Sharma was double-charged ₹600 on his UPI for token A-032. Refund needs to be processed and root cause investigated.', replies: 5, unread: true },
  { id: 'T-003', title: 'OTP not arriving for staff login', category: 'Technical', priority: 'medium', status: 'in-progress', created: '2026-05-07', createdBy: { name: 'Anjali K.', av: 'AK', tone: 'pink' }, assignedTo: { name: 'Anil B.', av: 'AB', tone: 'mint' }, description: 'New staff member Pradeep Kumar is unable to receive OTP on +91 99001 23456. Login blocked. Tried resending 5 times.', replies: 2, unread: false },
  { id: 'T-004', title: 'GSTIN missing on PDF invoices', category: 'Billing', priority: 'medium', status: 'open', created: '2026-05-06', createdBy: { name: 'Pooja N.', av: 'PN', tone: 'mint' }, assignedTo: null, description: 'Generated invoice PDFs do not show GSTIN number. The GSTIN is set correctly in settings but is not appearing on the printed/downloaded PDFs.', replies: 0, unread: true },
  { id: 'T-005', title: 'Cannot reschedule appointment', category: 'Appointment', priority: 'low', status: 'resolved', created: '2026-05-05', createdBy: { name: 'Karthik I.', av: 'KI', tone: 'plum' }, assignedTo: { name: 'Vivek A.', av: 'VA', tone: 'mint' }, description: 'The reschedule button is greyed out for appointments booked more than 3 days ago. Patients are calling in to change dates manually.', replies: 4, unread: false },
  { id: 'T-006', title: 'Doctor availability not reflecting in booking', category: 'Appointment', priority: 'high', status: 'open', created: '2026-05-10', createdBy: { name: 'Reena A.', av: 'RA', tone: 'blue' }, assignedTo: null, description: 'Dr. Vikram Mehta marked leave on 12 May but the booking flow still shows him as available. Three appointments have already been booked.', replies: 1, unread: true },
  { id: 'T-007', title: 'Patient SMS not delivered after confirmation', category: 'Technical', priority: 'medium', status: 'in-progress', created: '2026-05-04', createdBy: { name: 'Mohit B.', av: 'MB', tone: 'indigo' }, assignedTo: { name: 'Anil B.', av: 'AB', tone: 'mint' }, description: 'Appointment confirmation SMSes stopped delivering since 4 May morning. Twilio dashboard shows no failures. Issue may be on routing side.', replies: 3, unread: false },
  { id: 'T-008', title: 'Lab report upload failing for large PDFs', category: 'Technical', priority: 'medium', status: 'open', created: '2026-05-03', createdBy: { name: 'Anjali K.', av: 'AK', tone: 'pink' }, assignedTo: { name: 'Anil B.', av: 'AB', tone: 'mint' }, description: 'Uploading lab reports over 5MB fails silently. No error message shown. Only small reports succeed. Affects about 30% of uploads.', replies: 2, unread: true },
  { id: 'T-009', title: 'Invoice total incorrect with discount applied', category: 'Billing', priority: 'low', status: 'resolved', created: '2026-05-02', createdBy: { name: 'Pooja N.', av: 'PN', tone: 'mint' }, assignedTo: { name: 'Neha B.', av: 'NB', tone: 'amber' }, description: 'When a 10% discount is applied to a multi-service invoice the total is calculated before tax instead of after. Results in slightly inflated totals.', replies: 6, unread: false },
  { id: 'T-010', title: 'Queue display showing wrong doctor name', category: 'Technical', priority: 'low', status: 'closed', created: '2026-05-01', createdBy: { name: 'Karthik I.', av: 'KI', tone: 'plum' }, assignedTo: { name: 'Vivek A.', av: 'VA', tone: 'mint' }, description: 'Live token queue occasionally shows Dr. Ananya Rao on tokens assigned to Dr. Priya Iyer. Seems to be a display cache issue.', replies: 2, unread: false },
]

const STAFF = [
  { name: 'Anil B.',  av: 'AB', tone: 'mint'   },
  { name: 'Neha B.',  av: 'NB', tone: 'amber'  },
  { name: 'Vivek A.', av: 'VA', tone: 'mint'   },
  { name: 'Reena A.', av: 'RA', tone: 'blue'   },
  { name: 'Mohit B.', av: 'MB', tone: 'indigo' },
]

/* ── Helpers ────────────────────────────────────────────────────────────── */
function statusVariant(s: TicketStatus): string {
  if (s === 'open')        return 'warning'
  if (s === 'in-progress') return 'blue'
  if (s === 'resolved')    return 'success'
  return 'gray'
}

function priorityColor(p: TicketPriority) {
  if (p === 'high')   return { bg: '#fff0f0', color: '#e53e3e' }
  if (p === 'medium') return { bg: '#fff7e6', color: '#dd6b20' }
  return { bg: '#f0f4ff', color: '#3b82f6' }
}

/* ── Slide panel ────────────────────────────────────────────────────────── */
function TicketPanel({ ticket, onClose, onStatusChange }: {
  ticket: Ticket
  onClose: () => void
  onStatusChange: (id: string, s: TicketStatus) => void
}) {
  const [reply, setReply] = useState('')
  const pc = priorityColor(ticket.priority)

  const bubbles = [
    { mine: false, text: `Hi, I'm looking into this. Can you provide the token ID and time of occurrence?`, time: '10:02 AM' },
    { mine: true,  text: `Token A-024 at approximately 9:30 AM. The screen froze and showed the old number for 15 minutes.`, time: '10:08 AM' },
    { mine: false, text: `Got it. This looks like a WebSocket reconnect issue. We'll push a fix in tonight's deploy.`, time: '10:45 AM' },
    { mine: true,  text: `Thank you. Please confirm once deployed. This is causing patient confusion.`, time: '11:00 AM' },
  ]

  return (
    <>
      <div className="slide-panel-backdrop" onClick={onClose} />
      <div className="slide-panel" style={{ width: 620, display: 'flex', flexDirection: 'column' }}>
        {/* Panel header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <code style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{ticket.id}</code>
            <span style={{ ...pc, padding: '2px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase' }}>
              {ticket.priority}
            </span>
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={onClose}>
              <Icon name="x" size={15} />
            </button>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-primary)', marginBottom: 8 }}>{ticket.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Badge variant={statusVariant(ticket.status) as never}>{ticket.status}</Badge>
            <span className="badge muted">{ticket.category}</span>
            <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{ticket.created}</span>
          </div>
        </div>

        {/* Created / Assigned cards */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {(['createdBy','assignedTo'] as const).map(key => {
            const p = ticket[key]
            const label = key === 'createdBy' ? 'Created by' : 'Assigned to'
            return (
              <div key={key} style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg-surface-alt)', border: '1px solid var(--border-soft)' }}>
                <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 8, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>{label}</div>
                {p ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className={`av ${p.tone}`} style={{ width: 32, height: 32, fontSize: 11 }}>{p.av}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Staff</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', fontStyle: 'italic' }}>Unassigned</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Description */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-muted)', marginBottom: 8 }}>Description</div>
          <p style={{ fontSize: 13.5, color: 'var(--fg-primary)', lineHeight: 1.6, margin: 0 }}>{ticket.description}</p>
        </div>

        {/* Thread */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-muted)', marginBottom: 12 }}>
            Conversation ({ticket.replies})
          </div>
          <div className="thread">
            {bubbles.map((b, i) => (
              <div key={i} className={`msg-bubble ${b.mine ? 'mine' : 'other'}`}>
                <div className="bubble">{b.text}</div>
                <div className="meta">{b.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Reply composer */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Write a reply…"
              value={reply}
              onChange={e => setReply(e.target.value)}
              style={{ flex: 1, resize: 'none' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" title="Attach file">
                <Icon name="paperclip" size={15} />
              </button>
              <button className="btn btn-primary btn-sm" disabled={!reply.trim()} onClick={() => setReply('')}>
                <Icon name="send" size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer quick actions */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ticket.status === 'open' && (
            <button className="btn btn-secondary btn-sm" onClick={() => onStatusChange(ticket.id, 'in-progress')}>
              Mark in progress
            </button>
          )}
          {ticket.status === 'in-progress' && (
            <button className="btn btn-secondary btn-sm" onClick={() => onStatusChange(ticket.id, 'resolved')}>
              Mark resolved
            </button>
          )}
          {ticket.status !== 'closed' && (
            <button className="btn btn-secondary btn-sm" onClick={() => onStatusChange(ticket.id, 'closed')}>
              Close ticket
            </button>
          )}
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}>
            <Icon name="edit" size={14} /> Edit
          </button>
          <button className="btn btn-primary btn-sm" onClick={onClose}>Done</button>
        </div>
      </div>
    </>
  )
}

/* ── Status popover ─────────────────────────────────────────────────────── */
function StatusPopover({ current, onChange, onClose }: {
  current: TicketStatus
  onChange: (s: TicketStatus) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const statuses: TicketStatus[] = ['open', 'in-progress', 'resolved', 'closed']

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div ref={ref} style={{
      position: 'absolute', right: 0, top: '110%', zIndex: 100,
      background: 'var(--bg-surface)', borderRadius: 10,
      border: '1px solid var(--border-soft)', boxShadow: 'var(--shadow-md)',
      padding: 8, minWidth: 160,
    }}>
      {statuses.map(s => (
        <button
          key={s}
          onClick={() => { onChange(s); onClose() }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px', border: 'none', borderRadius: 6,
            background: 'transparent', cursor: 'pointer', fontSize: 13,
            color: 'var(--fg-primary)',
          }}
        >
          <Badge variant={statusVariant(s) as never}>{s}</Badge>
          {s === current && <Icon name="check" size={13} style={{ marginLeft: 'auto' }} />}
        </button>
      ))}
    </div>
  )
}

/* ── Create / Edit modal forms ──────────────────────────────────────────── */
interface TicketFormState {
  title:      string
  description:string
  category:   TicketCategory
  priority:   TicketPriority
  assignedTo: string
}

function TicketForm({ value, onChange }: { value: TicketFormState; onChange: (v: TicketFormState) => void }) {
  const set = (k: keyof TicketFormState) => (val: string) => onChange({ ...value, [k]: val as never })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="form-group">
        <label className="form-label">Title <span style={{ color: 'var(--danger)' }}>*</span></label>
        <input className="form-input" value={value.title} onChange={e => set('title')(e.target.value)} placeholder="Brief description of the issue" />
      </div>
      <div className="form-group">
        <label className="form-label">Description <span style={{ color: 'var(--danger)' }}>*</span></label>
        <textarea className="form-textarea" rows={4} value={value.description} onChange={e => set('description')(e.target.value)} placeholder="Detailed explanation of the problem…" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select" value={value.category} onChange={e => set('category')(e.target.value)}>
            <option>Technical</option>
            <option>Billing</option>
            <option>Appointment</option>
            <option>Other</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Assign to</label>
          <select className="form-select" value={value.assignedTo} onChange={e => set('assignedTo')(e.target.value)}>
            <option value="">Unassigned</option>
            {STAFF.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Priority</label>
        <div className="seg-ctrl">
          {(['low','medium','high'] as TicketPriority[]).map(p => (
            <button
              key={p}
              className={value.priority === p ? 'active' : ''}
              onClick={() => set('priority')(p)}
              type="button"
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────────────── */
export default function SupportTickets() {
  const [tickets, setTickets]           = useState<Ticket[]>(INITIAL_TICKETS)
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [search, setSearch]             = useState('')
  const [sort, setSort]                 = useState<'latest' | 'priority'>('latest')
  const [viewTicket, setViewTicket]     = useState<Ticket | null>(null)
  const [editTicket, setEditTicket]     = useState<Ticket | null>(null)
  const [createOpen, setCreateOpen]     = useState(false)
  const [popoverId, setPopoverId]       = useState<string | null>(null)

  const emptyForm: TicketFormState = { title: '', description: '', category: 'Technical', priority: 'medium', assignedTo: '' }
  const [createForm, setCreateForm] = useState<TicketFormState>(emptyForm)
  const [createError, setCreateError] = useState('')
  const [editForm, setEditForm]     = useState<TicketFormState>(emptyForm)

  const counts = {
    all:        tickets.length,
    open:       tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in-progress').length,
    resolved:   tickets.filter(t => t.status === 'resolved').length,
    high:       tickets.filter(t => t.priority === 'high').length,
  }

  const filtered = tickets
    .filter(t => {
      if (statusFilter !== 'All') {
        if (statusFilter === 'Open' && t.status !== 'open') return false
        if (statusFilter === 'In Progress' && t.status !== 'in-progress') return false
        if (statusFilter === 'Resolved' && t.status !== 'resolved') return false
        if (statusFilter === 'Closed' && t.status !== 'closed') return false
      }
      if (priorityFilter !== 'All' && t.priority !== priorityFilter.toLowerCase()) return false
      if (categoryFilter !== 'All' && t.category !== categoryFilter) return false
      const q = search.toLowerCase()
      if (q && !t.title.toLowerCase().includes(q) && !t.id.toLowerCase().includes(q)) return false
      return true
    })
    .sort((a, b) => {
      if (sort === 'priority') {
        const order = { high: 0, medium: 1, low: 2 }
        return order[a.priority] - order[b.priority]
      }
      return b.created.localeCompare(a.created)
    })

  const handleStatusChange = (id: string, s: TicketStatus) => {
    setTickets(ts => ts.map(t => t.id === id ? { ...t, status: s } : t))
    if (viewTicket?.id === id) setViewTicket(v => v ? { ...v, status: s } : v)
  }

  const handleCreate = () => {
    if (!createForm.title.trim() || !createForm.description.trim()) {
      setCreateError('Title and description are required.')
      return
    }
    const assignee = STAFF.find(s => s.name === createForm.assignedTo) ?? null
    const newTicket: Ticket = {
      id:          `T-${String(tickets.length + 1).padStart(3, '0')}`,
      title:       createForm.title,
      description: createForm.description,
      category:    createForm.category,
      priority:    createForm.priority,
      status:      'open',
      created:     new Date().toISOString().slice(0, 10),
      createdBy:   { name: 'Reena A.', av: 'RA', tone: 'blue' },
      assignedTo:  assignee,
      replies:     0,
      unread:      false,
    }
    setTickets(ts => [newTicket, ...ts])
    setCreateOpen(false)
    setCreateForm(emptyForm)
    setCreateError('')
  }

  const openEdit = (t: Ticket) => {
    setEditForm({
      title:       t.title,
      description: t.description,
      category:    t.category,
      priority:    t.priority,
      assignedTo:  t.assignedTo?.name ?? '',
    })
    setEditTicket(t)
  }

  const handleEdit = () => {
    if (!editTicket) return
    const assignee = STAFF.find(s => s.name === editForm.assignedTo) ?? null
    setTickets(ts => ts.map(t => t.id === editTicket.id ? {
      ...t,
      title:       editForm.title,
      description: editForm.description,
      category:    editForm.category,
      priority:    editForm.priority,
      assignedTo:  assignee,
    } : t))
    setEditTicket(null)
  }

  return (
    <>
      <Header
        title="Support tickets"
        crumbs={`${counts.all} tickets total`}
        onAdd={() => { setCreateOpen(true); setCreateError('') }}
        addLabel="New ticket"
      />

      <div className="main">
        {/* KPI chips */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'All',         count: counts.all,        key: 'All'        },
            { label: 'Open',        count: counts.open,       key: 'Open'       },
            { label: 'In Progress', count: counts.inProgress, key: 'In Progress'},
            { label: 'Resolved',    count: counts.resolved,   key: 'Resolved'   },
            { label: 'High priority', count: counts.high,     key: '_high'      },
          ].map(k => (
            <button
              key={k.key}
              onClick={() => {
                if (k.key === '_high') { setPriorityFilter('High'); setStatusFilter('All') }
                else setStatusFilter(k.key)
              }}
              className={`chip ${statusFilter === k.key || (k.key === '_high' && priorityFilter === 'High') ? 'active' : ''}`}
            >
              {k.label} <span className="count">{k.count}</span>
            </button>
          ))}
        </div>

        <div className="table-card">
          {/* Toolbar */}
          <div className="table-toolbar" style={{ flexWrap: 'wrap', gap: 10 }}>
            <div className="table-search" style={{ flex: 1, minWidth: 200 }}>
              <Icon name="search" size={15} />
              <input placeholder="Search tickets…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Priority filter */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {['All','High','Medium','Low'].map(p => (
                <button
                  key={p}
                  className={`chip ${priorityFilter === p ? 'active' : ''}`}
                  onClick={() => setPriorityFilter(p)}
                  style={{ fontSize: 12 }}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Category filter */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {['All','Technical','Billing','Appointment','Other'].map(c => (
                <button
                  key={c}
                  className={`chip ${categoryFilter === c ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(c)}
                  style={{ fontSize: 12 }}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button className={`btn btn-sm ${sort === 'latest' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSort('latest')}>Latest</button>
              <button className={`btn btn-sm ${sort === 'priority' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSort('priority')}>Priority</button>
            </div>
          </div>

          {/* Table */}
          <table className="data">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Title</th>
                <th>Category</th>
                <th>People</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const pc = priorityColor(t.priority)
                const isHighActive = t.priority === 'high' && t.status !== 'resolved' && t.status !== 'closed'
                return (
                  <tr key={t.id} style={isHighActive ? { background: 'rgba(229,62,62,0.04)' } : undefined}>
                    {/* ID */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {t.unread && (
                          <span style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: 'var(--brand-gradient)', flexShrink: 0,
                            boxShadow: '0 0 0 2px var(--bg-canvas)',
                          }} />
                        )}
                        <code style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--fg-secondary)' }}>{t.id}</code>
                      </div>
                    </td>

                    {/* Title */}
                    <td>
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                        onClick={() => setViewTicket(t)}
                      >
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--brand-primary)' }}>{t.title}</div>
                        {t.replies > 0 && (
                          <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2 }}>
                            <Icon name="message" size={11} /> {t.replies} replies
                          </div>
                        )}
                      </button>
                    </td>

                    {/* Category */}
                    <td><span className="badge muted" style={{ fontSize: 11.5 }}>{t.category}</span></td>

                    {/* People */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className={`av ${t.createdBy.tone}`} style={{ width: 26, height: 26, fontSize: 9.5 }} title={`Created by ${t.createdBy.name}`}>{t.createdBy.av}</div>
                        {t.assignedTo ? (
                          <>
                            <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>→</span>
                            <div className={`av ${t.assignedTo.tone}`} style={{ width: 26, height: 26, fontSize: 9.5 }} title={`Assigned to ${t.assignedTo.name}`}>{t.assignedTo.av}</div>
                          </>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--fg-muted)', fontStyle: 'italic' }}>Unassigned</span>
                        )}
                      </div>
                    </td>

                    {/* Priority */}
                    <td>
                      <span style={{
                        ...pc,
                        padding: '3px 10px', borderRadius: 20,
                        fontSize: 11.5, fontWeight: 700, textTransform: 'capitalize',
                        boxShadow: t.priority === 'high' ? '0 0 0 2px rgba(229,62,62,0.2)' : 'none',
                      }}>
                        {t.priority}
                      </span>
                    </td>

                    {/* Status */}
                    <td><Badge variant={statusVariant(t.status) as never}>{t.status}</Badge></td>

                    {/* Created */}
                    <td style={{ fontSize: 12.5, color: 'var(--fg-secondary)' }}>{t.created}</td>

                    {/* Actions */}
                    <td>
                      <div className="row-actions" style={{ justifyContent: 'flex-end', position: 'relative' }}>
                        <button className="act" title="View" onClick={() => setViewTicket(t)}>
                          <Icon name="eye" size={14} />
                        </button>
                        <button className="act" title="Edit" onClick={() => openEdit(t)}>
                          <Icon name="edit" size={14} />
                        </button>
                        <div style={{ position: 'relative' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Change status"
                            onClick={() => setPopoverId(id => id === t.id ? null : t.id)}
                          >
                            Status <Icon name="chevD" size={12} />
                          </button>
                          {popoverId === t.id && (
                            <StatusPopover
                              current={t.status}
                              onChange={s => handleStatusChange(t.id, s)}
                              onClose={() => setPopoverId(null)}
                            />
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--fg-muted)' }}>
                      <Icon name="lifebuoy" size={32} />
                      <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600 }}>No tickets found</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide panel */}
      {viewTicket && (
        <TicketPanel
          ticket={viewTicket}
          onClose={() => setViewTicket(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Edit modal */}
      {editTicket && (
        <Modal
          title={`Edit ${editTicket.id}`}
          onClose={() => setEditTicket(null)}
          size="lg"
          footer={
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setEditTicket(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleEdit}>Update ticket</button>
            </div>
          }
        >
          <TicketForm value={editForm} onChange={setEditForm} />
          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={editTicket.status}
              onChange={e => {
                const s = e.target.value as TicketStatus
                setEditTicket(t => t ? { ...t, status: s } : t)
              }}
            >
              <option value="open">Open</option>
              <option value="in-progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </Modal>
      )}

      {/* Create modal */}
      {createOpen && (
        <Modal
          title="New support ticket"
          onClose={() => setCreateOpen(false)}
          size="lg"
          footer={
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
              {createError && <span style={{ fontSize: 12.5, color: 'var(--danger)', flex: 1 }}>{createError}</span>}
              <button className="btn btn-secondary" onClick={() => setCreateOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>Submit ticket</button>
            </div>
          }
        >
          <TicketForm value={createForm} onChange={setCreateForm} />
          <div style={{ marginTop: 16 }}>
            <div className="form-label" style={{ marginBottom: 8 }}>Attachment</div>
            <div style={{
              border: '2px dashed var(--border-soft)', borderRadius: 10,
              padding: '20px 16px', textAlign: 'center',
              color: 'var(--fg-muted)', fontSize: 13, cursor: 'pointer',
            }}>
              <Icon name="paperclip" size={18} />
              <div style={{ marginTop: 6 }}>Drop files here or click to upload</div>
              <div style={{ fontSize: 11.5, marginTop: 4 }}>PNG, JPG, PDF up to 10 MB</div>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
