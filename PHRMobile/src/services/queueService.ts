import api from './api'

export interface TokenPatient {
  _id: string
  name: string
  phone?: string
  tag?: string
}

export interface TokenDoctor {
  _id: string
  name: string
  specialization?: string
  room?: string
}

export interface TokenClinic {
  _id: string
  name: string
  address?: string
}

export interface QueueToken {
  _id: string
  tokenNumber: number
  patientId: TokenPatient | string
  doctorId: TokenDoctor | string
  clinicId: TokenClinic | string
  appointmentId?: string
  status: 'waiting' | 'in-room' | 'in-consultation' | 'completed' | 'cancelled' | 'not-visited' | 'priority'
  priority: 'normal' | 'priority' | 'emergency'
  issuedAt: string
  calledAt?: string
  completedAt?: string
  notes?: string
}

export interface TokensResponse {
  success: boolean
  count: number
  data: QueueToken[]
}

export interface TokenResponse {
  success: boolean
  data: QueueToken
}

export interface MyTokenResponse {
  success: boolean
  data: QueueToken | null
  meta?: {
    aheadCount: number
    currentlyServing: number | null
  }
}

/** GET /api/tokens/mine — active token for logged-in patient today */
export async function getMyActiveToken(): Promise<MyTokenResponse> {
  return api.get<never, MyTokenResponse>('/tokens/mine')
}

/** GET /api/tokens — filtered by date, clinicId, doctorId, status, appointmentId */
export async function getTokens(params?: {
  date?: string
  clinicId?: string
  doctorId?: string
  status?: string
  appointmentId?: string
}): Promise<TokensResponse> {
  return api.get<never, TokensResponse>('/tokens', { params })
}

/** GET /api/tokens/:id */
export async function getTokenById(id: string): Promise<TokenResponse> {
  return api.get<never, TokenResponse>(`/tokens/${id}`)
}

export interface CreateTokenPayload {
  patientId: string
  doctorId: string
  clinicId: string
  appointmentId?: string
  priority?: 'normal' | 'priority' | 'emergency'
  notes?: string
}

/** POST /api/tokens */
export async function createToken(payload: CreateTokenPayload): Promise<TokenResponse> {
  return api.post<never, TokenResponse>('/tokens', payload)
}

export interface AssignTodayResponse {
  success: boolean
  created: number
  existing: number
  tokens: QueueToken[]
}

/** PUT /api/tokens/:id/status */
export async function updateTokenStatus(id: string, status: string): Promise<TokenResponse> {
  return api.put<never, TokenResponse>(`/tokens/${id}/status`, { status })
}

/** POST /api/tokens/assign-today — bulk-assign tokens to today's appointments in time order */
export async function assignTodayTokens(params?: { clinicId?: string; doctorId?: string }): Promise<AssignTodayResponse> {
  return api.post<never, AssignTodayResponse>('/tokens/assign-today', params ?? {})
}
