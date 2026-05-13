import api from '@/lib/axios'

const base = '/pharmacy'

export const pharmacyService = {
  list: (params?: Record<string, string>) =>
    api.get(base, { params }).then(r => r.data),
  get: (id: string) =>
    api.get(`${base}/${id}`).then(r => r.data.data),
  create: (data: unknown) =>
    api.post(base, data).then(r => r.data.data),
  update: (id: string, data: unknown) =>
    api.put(`${base}/${id}`, data).then(r => r.data.data),
  dispense: (id: string) =>
    api.put(`${base}/${id}/dispense`).then(r => r.data.data),
  remove: (id: string) =>
    api.delete(`${base}/${id}`).then(r => r.data),
}
