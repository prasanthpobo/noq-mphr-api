import api from './api'
import type { Consultation } from '@/types'

export const historyService = {
  list: (clinicId: string, patientId?: string) =>
    api.get<Consultation[]>('/consultations', { params: { clinicId, patientId } }),

  get: (id: string) =>
    api.get<Consultation>(`/consultations/${id}`),
}
