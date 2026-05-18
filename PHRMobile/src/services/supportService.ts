import api from './api'

// ── Backend raw types ─────────────────────────────────────────────────────────

interface BackendSender {
  _id: string
  name: string
  email: string
  role?: string
}

interface BackendMessage {
  _id: string
  sender: BackendSender | string
  text: string
  sentAt: string
  isStaff: boolean
}

interface BackendTicket {
  _id: string
  ticketId: string
  subject: string
  category: 'technical' | 'billing' | 'clinical' | 'general' | 'complaint'
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  messages: BackendMessage[]
  submittedBy: BackendSender | string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

// ── Frontend-friendly types ───────────────────────────────────────────────────

export interface TicketMessage {
  _id: string
  sender: 'patient' | 'support'
  senderName: string
  text: string
  createdAt: string
}

export interface SupportTicket {
  _id: string
  ticketNumber: string
  title: string
  category: string
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  messages: TicketMessage[]
  createdAt: string
  updatedAt: string
}

// ── Category maps ─────────────────────────────────────────────────────────────

const CATEGORY_TO_BACKEND: Record<string, string> = {
  'Payment':          'billing',
  'App issue':        'technical',
  'Booking issue':    'general',
  'Doctor / clinic':  'clinical',
  'Medical records':  'clinical',
  'Other':            'general',
}

const CATEGORY_FROM_BACKEND: Record<string, string> = {
  billing:    'Payment',
  technical:  'App issue',
  clinical:   'Doctor / clinic',
  general:    'General',
  complaint:  'Complaint',
}

// ── Data transformer ──────────────────────────────────────────────────────────

function transformTicket(raw: BackendTicket): SupportTicket {
  return {
    _id: raw._id,
    ticketNumber: raw.ticketId ?? 'TKT-0000',
    title: raw.subject,
    category: CATEGORY_FROM_BACKEND[raw.category] ?? raw.category,
    status: raw.status,
    messages: (raw.messages ?? []).map((m) => {
      const senderObj = typeof m.sender === 'object' ? m.sender : null
      return {
        _id: m._id,
        sender: m.isStaff ? 'support' : 'patient',
        senderName: m.isStaff ? 'NoQ Support' : (senderObj?.name ?? 'You'),
        text: m.text,
        createdAt: m.sentAt,
      }
    }),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt ?? raw.createdAt,
  }
}

// ── API calls ─────────────────────────────────────────────────────────────────

export const getTickets = async (): Promise<{ data: SupportTicket[] }> => {
  const res = await api.get<unknown, { data: BackendTicket[]; success: boolean }>('/support')
  return { data: (res.data ?? []).map(transformTicket) }
}

export const getTicketById = async (id: string): Promise<{ data: SupportTicket }> => {
  const res = await api.get<unknown, { data: BackendTicket; success: boolean }>(`/support/${id}`)
  return { data: transformTicket(res.data) }
}

export const createTicket = async (payload: {
  title: string
  category: string
  description: string
}): Promise<{ data: SupportTicket }> => {
  const res = await api.post<unknown, { data: BackendTicket; success: boolean }>('/support', {
    title: payload.title,
    category: CATEGORY_TO_BACKEND[payload.category] ?? 'general',
    description: payload.description,
  })
  return { data: transformTicket(res.data) }
}

export const replyToTicket = async (id: string, text: string): Promise<{ data: SupportTicket }> => {
  const res = await api.post<unknown, { data: BackendTicket; success: boolean }>(`/support/${id}/messages`, { text })
  return { data: transformTicket(res.data) }
}

export const closeTicket = async (id: string): Promise<{ data: SupportTicket }> => {
  const res = await api.patch<unknown, { data: BackendTicket; success: boolean }>(`/support/${id}`, { status: 'closed' })
  return { data: transformTicket(res.data) }
}
