import api from '@/lib/axios'

export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then(r => r.data),
  me: () =>
    api.get('/auth/me').then(r => r.data.data),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { oldPassword, newPassword }).then(r => r.data),
}
