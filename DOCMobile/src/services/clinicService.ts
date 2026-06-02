import api from './api'
import type { Clinic } from '@/types'

export const clinicService = {
  list: () =>
    api.get<Clinic[]>('/clinics'),

  get: (id: string) =>
    api.get<Clinic>(`/clinics/${id}`),

  create: (data: Omit<Clinic, 'id'>) =>
    api.post<Clinic>('/clinics', data),

  update: (id: string, data: Partial<Clinic>) =>
    api.patch<Clinic>(`/clinics/${id}`, data),

  remove: (id: string) =>
    api.delete(`/clinics/${id}`),
}
