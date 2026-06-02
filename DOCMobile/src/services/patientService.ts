import api from './api'
import type { Patient } from '@/types'

export interface CreatePatientPayload {
  name: string
  phone: string
  gender: 'M' | 'F' | 'Other'
  clinicId: string
  email?: string
  dob?: string
  bloodGroup?: string
  address?: string
  tag?: 'active' | 'new' | 'follow-up' | 'critical'
}

export const patientService = {
  /** GET /api/patients?clinicId=&search=&tag= — server returns { success, count, data } */
  list: (clinicId: string, search?: string, tag?: string) =>
    api.get<{ success: boolean; count: number; data: Patient[] }>('/patients', {
      params: { clinicId, search, tag },
    }),

  get: (id: string) =>
    api.get<{ success: boolean; data: Patient }>(`/patients/${id}`),

  create: (data: CreatePatientPayload) =>
    api.post<{ success: boolean; data: Patient }>('/patients', data),

  update: (id: string, data: Partial<CreatePatientPayload>) =>
    api.put<{ success: boolean; data: Patient }>(`/patients/${id}`, data),
}
