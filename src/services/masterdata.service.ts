import api from '@/lib/axios'

const base = '/masterdata'

export const masterdataService = {
  list: (params?: Record<string, string>) =>
    api.get(base, { params }).then(r => r.data),
  categories: () =>
    api.get(`${base}/categories`).then(r => r.data.data),
  create: (data: unknown) =>
    api.post(base, data).then(r => r.data.data),
  update: (id: string, data: unknown) =>
    api.put(`${base}/${id}`, data).then(r => r.data.data),
  remove: (id: string) =>
    api.delete(`${base}/${id}`).then(r => r.data),
  bulk: (items: unknown[]) =>
    api.post(`${base}/bulk`, items).then(r => r.data),
}
