import api from './api'
import type { Consultation } from '@/types'

export const consultationService = {
  create: (data: Omit<Consultation, 'id' | 'createdAt'>) =>
    api.post<Consultation>('/consultations', data),

  save: (id: string, data: Partial<Consultation>) =>
    api.patch<Consultation>(`/consultations/${id}`, data),

  get: (id: string) =>
    api.get<Consultation>(`/consultations/${id}`),

  complete: (id: string) =>
    api.post(`/consultations/${id}/complete`),
}
