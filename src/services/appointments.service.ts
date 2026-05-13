import api from '@/lib/axios'

const base = '/appointments'

export const appointmentsService = {
  list: (params?: Record<string, string>) =>
    api.get(base, { params }).then(r => r.data),
  get: (id: string) =>
    api.get(`${base}/${id}`).then(r => r.data.data),
  create: (data: unknown) =>
    api.post(base, data).then(r => r.data.data),
  update: (id: string, data: unknown) =>
    api.put(`${base}/${id}`, data).then(r => r.data.data),
  updatePrescription: (id: string, prescription: unknown[]) =>
    api.put(`${base}/${id}/prescription`, { prescription }).then(r => r.data.data),
  updateVitals: (id: string, vitals: unknown) =>
    api.put(`${base}/${id}/vitals`, { vitals }).then(r => r.data.data),
  remove: (id: string) =>
    api.delete(`${base}/${id}`).then(r => r.data),
}
