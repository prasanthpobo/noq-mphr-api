import api from '@/lib/axios'

const base = '/support'

export const supportService = {
  list: (params?: Record<string, string>) =>
    api.get(base, { params }).then(r => r.data),
  get: (id: string) =>
    api.get(`${base}/${id}`).then(r => r.data.data),
  create: (data: unknown) =>
    api.post(base, data).then(r => r.data.data),
  update: (id: string, data: unknown) =>
    api.put(`${base}/${id}`, data).then(r => r.data.data),
  updateStatus: (id: string, status: string) =>
    api.put(`${base}/${id}/status`, { status }).then(r => r.data.data),
  addMessage: (id: string, text: string, isStaff: boolean) =>
    api.post(`${base}/${id}/message`, { text, isStaff }).then(r => r.data.data),
  remove: (id: string) =>
    api.delete(`${base}/${id}`).then(r => r.data),
}
