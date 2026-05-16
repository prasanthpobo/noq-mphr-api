import api from '@/lib/axios'

export const reportsService = {
  summary: () =>
    api.get('/reports/summary').then(r => r.data.data),
  revenue: (period: string) =>
    api.get('/reports/revenue', { params: { period } }).then(r => r.data.data),
  appointments: (period: string) =>
    api.get('/reports/appointments', { params: { period } }).then(r => r.data.data),
  tokens: (period: string) =>
    api.get('/reports/tokens', { params: { period } }).then(r => r.data.data),
  topDoctors: () =>
    api.get('/reports/top-doctors').then(r => r.data.data),
}
