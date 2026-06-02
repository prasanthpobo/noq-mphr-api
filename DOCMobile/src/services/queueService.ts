import api from './api'
import type { QueueToken, TokenStatus } from '@/types'

export const queueService = {
  /** Fetch current live queue for a clinic */
  getQueue: (clinicId: string) =>
    api.get<QueueToken[]>(`/clinics/${clinicId}/queue`),

  /** Update a token's status (waiting → in-progress → done) */
  updateStatus: (tokenId: string, status: TokenStatus) =>
    api.patch<QueueToken>(`/queue/${tokenId}/status`, { status }),

  /** Call the next waiting token */
  callNext: (clinicId: string) =>
    api.post<QueueToken>(`/clinics/${clinicId}/queue/next`),
}
