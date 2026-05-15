import { useState, useEffect, useCallback, useRef } from 'react'
import dayjs from 'dayjs'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { useAuthStore } from '@/store/auth'
import { supportService } from '@/services/support.service'
import { toast } from '@/store/toast'
import api from '@/lib/axios'

/* ── Types ─────────────────────────────────────────────────────────────── */
type TicketStatus   = 'open' | 'in-progress' | 'resolved' | 'closed'
type TicketPriority = 'low' | 'medium' | 'high' | 'critical'
type TicketCategory = 'technical' | 'billing' | 'clinical' | 'general' | 'complaint'

interface TicketUser    { _id: string; name: string; email: string }
interface TicketMessage { _id: string; sender: TicketUser | null; text: string; sentAt: string; isStaff: boolean }

interface Ticket {
  _id:         string
  ticketId:    string
  subject:     string
  category:    TicketCategory
  priority:    TicketPriority
  status:      TicketStatus
  createdAt:   string
  resolvedAt?: string
  submittedBy: TicketUser | null
  assignedTo:  TicketUser | null
  messages:    TicketMessage[]
}

interface UserItem { _id: string; name: string; role: string }

/* ── Helpers ────────────────────────────────────────────────────────────── */
const CATEGORIES: TicketCategory[] = ['technical', 'billing', 'clinical', 'general', 'complaint']
const PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'critical']

function statusVariant(s: TicketStatus) {
  if (s === 'open')        return 'warning'
  if (s === 'in-progress') return 'blue'
  if (s === 'resolved')    return 'success'
  return 'muted'
}

function priorityStyle(p: TicketPriority) {
  if (p === 'critical' || p === 'high') return { background: '#fff0f0', color: '#e53e3e' }
  if (p === 'medium')                   return { background: '#fff7e6', color: '#dd6b20' }
  return { background: '#f0f4ff', color: '#3b82f6' }
}

function initials(name?: string | null) {
  if (!name) return '??'
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

/* ── Skeleton ───────────────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i}>
          <div style={{
            height: 14, borderRadius: 6,
            background: 'linear-gradient(90deg, var(--bg-section) 25%, var(--border-light) 50%, var(--bg-section) 75%)',
            backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', width: '85%',
          }} />
        </td>
      ))}
    </tr>
  )
}

/* ── TicketPanel ────────────────────────────────────────────────────────── */
function TicketPanel({ ticket, currentUserId, onClose, onStatusChange, onReload, onEditOpen }: {
  ticket:          Ticket
  currentUserId:   string
  onClose:         () => void
  onStatusChange:  (id: string, s: TicketStatus) => Promise<void>
  onReload:        () => Promise<void>
  onEditOpen:      (t: Ticket) => void
}) {
  const [reply,   setReply]   = useState('')
  const [sending, setSending] = useState(false)
  const ps = priorityStyle(ticket.priority)

  const sendReply = async () => {
    if (!reply.trim()) return
    setSending(true)
    try {
      await supportService.addMessage(ticket._id, reply.trim(), true)
      setReply('')
      await onReload()
    } catch {
      toast.error('Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div className="slide-panel-backdrop" onClick={onClose} />
      <div className="slide-panel" style={{ width: 620, display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <code style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>
              {ticket.ticketId}
            </code>
            <span style={{ ...ps, padding: '2px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase' }}>
              {ticket.priority}
            </span>
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={onClose}>
              <Icon name="x" size={15} />
            </button>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-primary)', marginBottom: 8 }}>
            {ticket.subject}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Badge variant={statusVariant(ticket.status) as never}>{ticket.status}</Badge>
            <span className="badge muted" style={{ textTransform: 'capitalize' }}>{ticket.category}</span>
            <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
              {dayjs(ticket.createdAt).format('DD MMM YYYY')}
            </span>
          </div>
        </div>

        {/* People */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Submitted by', person: ticket.submittedBy },
            { label: 'Assigned to',  person: ticket.assignedTo  },
          ].map(({ label, person }) => (
            <div key={label} style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg-section)', border: '1px solid var(--border-soft)' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 8, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>{label}</div>
              {person ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="av blue" style={{ width: 32, height: 32, fontSize: 11 }}>{initials(person.name)}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>{person.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{person.email}</div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', fontStyle: 'italic' }}>Unassigned</div>
              )}
            </div>
          ))}
        </div>

        {/* Conversation thread */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-muted)', marginBottom: 12 }}>
            Conversation ({ticket.messages.length})
          </div>
          {ticket.messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--fg-muted)', fontSize: 13 }}>
              No messages yet. Be the first to reply.
            </div>
          ) : (
            <div className="thread">
              {ticket.messages.map(m => {
                const mine = m.sender?._id === currentUserId
                return (
                  <div key={m._id} className={`msg-bubble ${mine ? 'mine' : 'other'}`}>
                    {!mine && m.sender && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-secondary)', marginBottom: 3 }}>
                        {m.sender.name}
                      </div>
                    )}
                    <div className="bubble">{m.text}</div>
                    <div className="meta">{dayjs(m.sentAt).format('hh:mm A · DD MMM')}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Reply composer */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Write a reply… (Ctrl+Enter to send)"
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendReply() }}
              style={{ flex: 1, resize: 'none' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" title="Attach file">
                <Icon name="paperclip" size={15} />
              </button>
              <button
                className="btn btn-primary btn-sm"
                disabled={!reply.trim() || sending}
                onClick={sendReply}
              >
                <Icon name="send" size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ticket.status === 'open' && (
            <button className="btn btn-secondary btn-sm" onClick={() => onStatusChange(ticket._id, 'in-progress')}>
              Mark in progress
            </button>
          )}
          {ticket.status === 'in-progress' && (
            <button className="btn btn-secondary btn-sm" onClick={() => onStatusChange(ticket._id, 'resolved')}>
              Mark resolved
            </button>
          )}
          {ticket.status !== 'closed' && (
            <button className="btn btn-secondary btn-sm" onClick={() => onStatusChange(ticket._id, 'closed')}>
              Close ticket
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => { onClose(); onEditOpen(ticket) }}>
            <Icon name="edit" size={14} /> Edit
          </button>
          <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={onClose}>Done</button>
        </div>
      </div>
    </>
  )
}

/* ── StatusPopover ──────────────────────────────────────────────────────── */
function StatusPopover({ current, onChange, onClose }: {
  current:  TicketStatus
  onChange: (s: TicketStatus) => void
  onClose:  () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

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
      {(['open', 'in-progress', 'resolved', 'closed'] as TicketStatus[]).map(s => (
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

/* ── TicketForm ─────────────────────────────────────────────────────────── */
interface TicketFormState {
  subject:      string
  description:  string
  category:     TicketCategory
  priority:     TicketPriority
  assignedToId: string
  status:       TicketStatus
}

const EMPTY_FORM: TicketFormState = {
  subject: '', description: '', category: 'technical',
  priority: 'medium', assignedToId: '', status: 'open',
}

function TicketForm({ value, onChange, users, showStatus }: {
  value:       TicketFormState
  onChange:    (v: TicketFormState) => void
  users:       UserItem[]
  showStatus?: boolean
}) {
  const set = (k: keyof TicketFormState, v: string) => onChange({ ...value, [k]: v })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="form-group">
        <label className="form-label">Subject <span style={{ color: 'var(--danger-500)' }}>*</span></label>
        <input
          className="form-input"
          value={value.subject}
          onChange={e => set('subject', e.target.value)}
          placeholder="Brief description of the issue"
        />
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          className="form-textarea"
          rows={4}
          value={value.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Detailed explanation of the problem…"
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-input" value={value.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{cap(c)}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Assign to</label>
          <select className="form-input" value={value.assignedToId} onChange={e => set('assignedToId', e.target.value)}>
            <option value="">Unassigned</option>
            {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Priority</label>
        <div className="seg-ctrl">
          {PRIORITIES.map(p => (
            <button
              key={p}
              type="button"
              className={value.priority === p ? 'active' : ''}
              onClick={() => set('priority', p)}
              style={{ textTransform: 'capitalize' }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      {showStatus && (
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-input" value={value.status} onChange={e => set('status', e.target.value)}>
            <option value="open">Open</option>
            <option value="in-progress">In progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      )}
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────────────── */
const PAGE_SIZE = 10

export default function SupportTickets() {
  const { user } = useAuthStore()

  const [tickets,        setTickets]        = useState<Ticket[]>([])
  const [users,          setUsers]          = useState<UserItem[]>([])
  const [loading,        setLoading]        = useState(true)
  const [saving,         setSaving]         = useState(false)
  const [statusFilter,   setStatusFilter]   = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [search,         setSearch]         = useState('')
  const [sort,           setSort]           = useState<'latest' | 'priority'>('latest')
  const [page,           setPage]           = useState(1)
  const [viewTicket,     setViewTicket]     = useState<Ticket | null>(null)
  const [editTicket,     setEditTicket]     = useState<Ticket | null>(null)
  const [createOpen,     setCreateOpen]     = useState(false)
  const [popoverId,      setPopoverId]      = useState<string | null>(null)
  const [createForm,     setCreateForm]     = useState<TicketFormState>(EMPTY_FORM)
  const [editForm,       setEditForm]       = useState<TicketFormState>(EMPTY_FORM)
  const [createError,    setCreateError]    = useState('')

  /* Dropdown state */
  const [catDropOpen,  setCatDropOpen]  = useState(false)
  const [catSearch,    setCatSearch]    = useState('')
  const [priDropOpen,  setPriDropOpen]  = useState(false)

  const CATEGORY_OPTIONS = ['All', 'Technical', 'Billing', 'Clinical', 'General', 'Complaint']
  const PRIORITY_OPTIONS = ['All', 'Low', 'Medium', 'High', 'Critical']

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await supportService.list()
      setTickets(res.data ?? [])
    } catch {
      toast.error('Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    api.get('/users').then(r => setUsers(r.data.data ?? [])).catch(() => {})
  }, [load])

  /* KPI counts */
  const counts = {
    all:        tickets.length,
    open:       tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in-progress').length,
    resolved:   tickets.filter(t => t.status === 'resolved').length,
    high:       tickets.filter(t => t.priority === 'high' || t.priority === 'critical').length,
  }

  /* Filtered + sorted list */
  const filtered = tickets
    .filter(t => {
      if (statusFilter !== 'All') {
        const map: Record<string, TicketStatus> = {
          'Open': 'open', 'In Progress': 'in-progress',
          'Resolved': 'resolved', 'Closed': 'closed',
        }
        if (t.status !== map[statusFilter]) return false
      }
      if (priorityFilter !== 'All' && t.priority !== priorityFilter.toLowerCase()) return false
      if (categoryFilter !== 'All' && t.category !== categoryFilter.toLowerCase()) return false
      const q = search.toLowerCase()
      if (q && !t.subject.toLowerCase().includes(q) && !t.ticketId.toLowerCase().includes(q)) return false
      return true
    })
    .sort((a, b) => {
      if (sort === 'priority') {
        const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
        return (order[a.priority] ?? 4) - (order[b.priority] ?? 4)
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  /* Open view panel — fetch full ticket with message detail */
  const openView = async (t: Ticket) => {
    try {
      const full = await supportService.get(t._id)
      setViewTicket(full)
    } catch {
      setViewTicket(t)
    }
  }

  /* Reload just the open panel ticket (after a reply) */
  const reloadViewTicket = async () => {
    if (!viewTicket) return
    try {
      const fresh = await supportService.get(viewTicket._id)
      setViewTicket(fresh)
      setTickets(ts => ts.map(t => t._id === fresh._id ? fresh : t))
    } catch {
      toast.error('Failed to refresh ticket')
    }
  }

  /* Status change — call API then update local state */
  const handleStatusChange = async (id: string, s: TicketStatus) => {
    try {
      const updated = await supportService.updateStatus(id, s)
      setTickets(ts => ts.map(t => t._id === id ? updated : t))
      if (viewTicket?._id === id) setViewTicket(updated)
      toast.success(`Ticket marked ${s}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  /* Create */
  const handleCreate = async () => {
    if (!createForm.subject.trim()) { setCreateError('Subject is required.'); return }
    if (!user?.id) { setCreateError('You must be logged in.'); return }
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        subject:     createForm.subject,
        category:    createForm.category,
        priority:    createForm.priority,
        submittedBy: user.id,
        ...(createForm.assignedToId && { assignedTo: createForm.assignedToId }),
        ...(user.clinicId           && { clinicId:   user.clinicId }),
        ...(createForm.description  && {
          messages: [{ sender: user.id, text: createForm.description, sentAt: new Date(), isStaff: true }],
        }),
      }
      await supportService.create(payload)
      toast.success('Ticket submitted')
      setCreateOpen(false)
      setCreateForm(EMPTY_FORM)
      setCreateError('')
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create ticket')
    } finally {
      setSaving(false)
    }
  }

  /* Open edit modal */
  const openEdit = (t: Ticket) => {
    setEditForm({
      subject:      t.subject,
      description:  '',
      category:     t.category,
      priority:     t.priority,
      assignedToId: t.assignedTo?._id ?? '',
      status:       t.status,
    })
    setEditTicket(t)
  }

  /* Save edit */
  const handleEdit = async () => {
    if (!editTicket) return
    setSaving(true)
    try {
      await supportService.update(editTicket._id, {
        subject:    editForm.subject,
        category:   editForm.category,
        priority:   editForm.priority,
        assignedTo: editForm.assignedToId || null,
        status:     editForm.status,
      })
      toast.success('Ticket updated')
      setEditTicket(null)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update ticket')
    } finally {
      setSaving(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const catDropOptions = CATEGORY_OPTIONS.filter(c => c === 'All' || c.toLowerCase().includes(catSearch.toLowerCase()))

  return (
    <>
      <Header
        title="Support tickets"
        crumbs={`${counts.all} tickets · ${counts.open} open`}
      />

      <div className="main">
        {/* KPI filter chips */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'All',           count: counts.all,        key: 'All'         },
            { label: 'Open',          count: counts.open,       key: 'Open'        },
            { label: 'In Progress',   count: counts.inProgress, key: 'In Progress' },
            { label: 'Resolved',      count: counts.resolved,   key: 'Resolved'    },
            { label: 'High priority', count: counts.high,       key: '_high'       },
          ].map(k => (
            <button
              key={k.key}
              className={`chip ${statusFilter === k.key || (k.key === '_high' && priorityFilter === 'High') ? 'active' : ''}`}
              onClick={() => {
                if (k.key === '_high') { setPriorityFilter('High'); setStatusFilter('All') }
                else { setStatusFilter(k.key); setPriorityFilter('All') }
                setPage(1)
              }}
            >
              {k.label} <span className="count">{k.count}</span>
            </button>
          ))}
        </div>

        <div className="table-card">
          {/* Toolbar */}
          <div className="table-toolbar" style={{ gap: 8 }}>
            {/* Title */}
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)', flexShrink: 0 }}>
              Support tickets
              <span className="badge muted" style={{ marginLeft: 6, fontWeight: 500 }}>{tickets.length}</span>
            </div>

            {/* Right side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
              {/* Search */}
              <div className="table-search" style={{ width: 220, flexShrink: 0 }}>
                <Icon name="search" size={15} />
                <input
                  placeholder="Search subject or ID…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                />
              </div>

              {/* Category dropdown */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div
                  className="table-search"
                  style={{ width: 180, cursor: 'pointer' }}
                  onClick={() => setCatDropOpen(o => !o)}
                >
                  <Icon name="filter" size={14} />
                  <input
                    placeholder="Category…"
                    value={catDropOpen ? catSearch : (categoryFilter === 'All' ? '' : categoryFilter)}
                    onChange={e => { setCatSearch(e.target.value); setCatDropOpen(true) }}
                    onClick={e => { e.stopPropagation(); setCatDropOpen(true) }}
                    onBlur={() => setTimeout(() => setCatDropOpen(false), 150)}
                    readOnly={!catDropOpen}
                    style={{ cursor: catDropOpen ? 'text' : 'pointer' }}
                  />
                  <Icon name="chevD" size={13} />
                </div>
                {catDropOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 50,
                    background: 'var(--bg-surface)', border: '1px solid var(--border-soft)',
                    borderRadius: 10, boxShadow: 'var(--shadow-md)',
                    minWidth: 180, maxHeight: 240, overflowY: 'auto', padding: '4px 0',
                  }}>
                    {catDropOptions.map(c => (
                      <button
                        key={c}
                        onMouseDown={() => { setCategoryFilter(c); setCatSearch(''); setCatDropOpen(false); setPage(1) }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                          fontSize: 13, fontWeight: categoryFilter === c ? 700 : 400,
                          color: categoryFilter === c ? 'var(--brand-500, #3b82f6)' : 'var(--fg-primary)',
                          background: categoryFilter === c ? 'var(--brand-soft, rgba(59,130,246,0.08))' : 'transparent',
                        }}
                      >
                        <span>{c}</span>
                        {c !== 'All' && (
                          <span style={{ fontSize: 11, color: 'var(--fg-muted)', marginLeft: 8 }}>
                            {tickets.filter(t => t.category === c.toLowerCase()).length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Priority dropdown */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div
                  className="table-search"
                  style={{ width: 160, cursor: 'pointer' }}
                  onClick={() => setPriDropOpen(o => !o)}
                >
                  <Icon name="activity" size={14} />
                  <input
                    placeholder="Priority…"
                    value={priorityFilter === 'All' ? '' : priorityFilter}
                    readOnly
                    style={{ cursor: 'pointer' }}
                  />
                  <Icon name="chevD" size={13} />
                </div>
                {priDropOpen && (
                  <div
                    style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 50,
                      background: 'var(--bg-surface)', border: '1px solid var(--border-soft)',
                      borderRadius: 10, boxShadow: 'var(--shadow-md)',
                      minWidth: 160, padding: '4px 0',
                    }}
                    onMouseLeave={() => setPriDropOpen(false)}
                  >
                    {PRIORITY_OPTIONS.map(p => (
                      <button
                        key={p}
                        onMouseDown={() => { setPriorityFilter(p); setPriDropOpen(false); setPage(1) }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                          fontSize: 13, fontWeight: priorityFilter === p ? 700 : 400,
                          color: priorityFilter === p ? 'var(--brand-500, #3b82f6)' : 'var(--fg-primary)',
                          background: priorityFilter === p ? 'var(--brand-soft, rgba(59,130,246,0.08))' : 'transparent',
                        }}
                      >
                        <span>{p}</span>
                        {p !== 'All' && (
                          <span style={{ fontSize: 11, color: 'var(--fg-muted)', marginLeft: 8 }}>
                            {tickets.filter(t => t.priority === p.toLowerCase()).length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort toggle */}
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button
                  className={`btn btn-sm ${sort === 'latest' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSort('latest')}
                >Latest</button>
                <button
                  className={`btn btn-sm ${sort === 'priority' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSort('priority')}
                >Priority</button>
              </div>

              <button
                className="btn btn-primary btn-sm"
                style={{ flexShrink: 0 }}
                onClick={() => { setCreateOpen(true); setCreateError('') }}
              >
                <Icon name="plus" size={14} /> New ticket
              </button>
            </div>
          </div>

          {/* Table */}
          <table className="data">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Subject</th>
                <th>Category</th>
                <th>People</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--fg-muted)' }}>
                      <Icon name="lifebuoy" size={32} />
                      <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600 }}>No tickets found</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your filters</div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map(t => {
                  const ps = priorityStyle(t.priority)
                  const isUrgent = (t.priority === 'high' || t.priority === 'critical') &&
                    t.status !== 'resolved' && t.status !== 'closed'
                  return (
                    <tr key={t._id} style={isUrgent ? { background: 'rgba(229,62,62,0.04)' } : undefined}>

                      {/* Ticket ID */}
                      <td>
                        <code style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--fg-secondary)' }}>
                          {t.ticketId}
                        </code>
                      </td>

                      {/* Subject */}
                      <td>
                        <button
                          style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                          onClick={() => openView(t)}
                        >
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--teal-600)' }}>{t.subject}</div>
                          {t.messages.length > 0 && (
                            <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2 }}>
                              <Icon name="message" size={11} /> {t.messages.length} messages
                            </div>
                          )}
                        </button>
                      </td>

                      {/* Category */}
                      <td>
                        <span className="badge muted" style={{ fontSize: 11.5, textTransform: 'capitalize' }}>
                          {t.category}
                        </span>
                      </td>

                      {/* People */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div
                            className="av blue"
                            style={{ width: 26, height: 26, fontSize: 9.5 }}
                            title={`Submitted by ${t.submittedBy?.name ?? '?'}`}
                          >
                            {initials(t.submittedBy?.name)}
                          </div>
                          {t.assignedTo ? (
                            <>
                              <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>→</span>
                              <div
                                className="av teal"
                                style={{ width: 26, height: 26, fontSize: 9.5 }}
                                title={`Assigned to ${t.assignedTo.name}`}
                              >
                                {initials(t.assignedTo.name)}
                              </div>
                            </>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--fg-muted)', fontStyle: 'italic' }}>Unassigned</span>
                          )}
                        </div>
                      </td>

                      {/* Priority */}
                      <td>
                        <span style={{
                          ...ps,
                          padding: '3px 10px', borderRadius: 20,
                          fontSize: 11.5, fontWeight: 700, textTransform: 'capitalize',
                          boxShadow: isUrgent ? '0 0 0 2px rgba(229,62,62,0.2)' : 'none',
                        }}>
                          {t.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td><Badge variant={statusVariant(t.status) as never}>{t.status}</Badge></td>

                      {/* Created */}
                      <td style={{ fontSize: 12.5, color: 'var(--fg-secondary)' }}>
                        {dayjs(t.createdAt).format('DD MMM YYYY')}
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="row-actions" style={{ justifyContent: 'flex-end', position: 'relative' }}>
                          <button className="act" title="View" onClick={() => openView(t)}>
                            <Icon name="eye" size={14} />
                          </button>
                          <button className="act" title="Edit" onClick={() => openEdit(t)}>
                            <Icon name="edit" size={14} />
                          </button>
                          <div style={{ position: 'relative' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setPopoverId(id => id === t._id ? null : t._id)}
                            >
                              Status <Icon name="chevD" size={12} />
                            </button>
                            {popoverId === t._id && (
                              <StatusPopover
                                current={t.status}
                                onChange={s => handleStatusChange(t._id, s)}
                                onClose={() => setPopoverId(null)}
                              />
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderTop: '1px solid var(--border-light)',
            fontSize: 12.5, color: 'var(--fg-secondary)',
          }}>
            <span>
              Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} tickets
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
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
                >{p}</button>
              ))}
              <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                Next <Icon name="chevR" size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View panel */}
      {viewTicket && (
        <TicketPanel
          ticket={viewTicket}
          currentUserId={user?.id ?? ''}
          onClose={() => setViewTicket(null)}
          onStatusChange={handleStatusChange}
          onReload={reloadViewTicket}
          onEditOpen={openEdit}
        />
      )}

      {/* Edit modal */}
      {editTicket && (
        <Modal
          title={`Edit · ${editTicket.ticketId}`}
          onClose={() => setEditTicket(null)}
          size="lg"
          footer={
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setEditTicket(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={saving} onClick={handleEdit}>
                {saving ? 'Saving…' : 'Update ticket'}
              </button>
            </div>
          }
        >
          <TicketForm value={editForm} onChange={setEditForm} users={users} showStatus />
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
              {createError && (
                <span style={{ fontSize: 12.5, color: 'var(--danger-500)', flex: 1 }}>{createError}</span>
              )}
              <button className="btn btn-secondary" onClick={() => setCreateOpen(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={saving} onClick={handleCreate}>
                {saving ? 'Submitting…' : 'Submit ticket'}
              </button>
            </div>
          }
        >
          <TicketForm value={createForm} onChange={setCreateForm} users={users} />
        </Modal>
      )}
    </>
  )
}
