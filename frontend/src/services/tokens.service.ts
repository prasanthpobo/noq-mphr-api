import api from '@/lib/axios'

const base = '/tokens'

export const tokensService = {
  list: (params?: Record<string, string>) =>
    api.get(base, { params }).then(r => r.data),
  get: (id: string) =>
    api.get(`${base}/${id}`).then(r => r.data.data),
  create: (data: unknown) =>
    api.post(base, data).then(r => r.data.data),
  updateStatus: (id: string, status: string) =>
    api.put(`${base}/${id}/status`, { status }).then(r => r.data.data),
  updatePriority: (id: string, priority: string) =>
    api.put(`${base}/${id}/priority`, { priority }).then(r => r.data.data),
  move: (id: string, direction: 'up' | 'down') =>
    api.put(`${base}/${id}/move`, { direction }).then(r => r.data.data),
  remove: (id: string) =>
    api.delete(`${base}/${id}`).then(r => r.data),
}
