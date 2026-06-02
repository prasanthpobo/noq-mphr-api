import api from './api'
import type { Appointment } from '@/types'

export interface AppointmentListParams {
  doctorId?: string
  clinicId?: string
  patientId?: string
  date?: string         // YYYY-MM-DD
  status?: string
}

export const appointmentService = {
  /** GET /api/appointments — server returns { success, count, data } */
  list: (params: AppointmentListParams = {}) =>
    api.get<{ success: boolean; count: number; data: Appointment[] }>('/appointments', { params }),

  /** Back-compat helper that mirrors the old (clinicId, date) signature */
  listByClinic: (clinicId: string, date?: string) =>
    api.get<{ success: boolean; count: number; data: Appointment[] }>('/appointments', {
      params: { clinicId, date },
    }),

  get: (id: string) =>
    api.get<{ success: boolean; data: Appointment }>(`/appointments/${id}`),

  create: (data: Omit<Appointment, 'id' | 'token'>) =>
    api.post<{ success: boolean; data: Appointment }>('/appointments', data),

  update: (id: string, data: Partial<Appointment>) =>
    api.put<{ success: boolean; data: Appointment }>(`/appointments/${id}`, data),

  cancel: (id: string) =>
    api.delete(`/appointments/${id}`),
}
