import api from './api'
import type { Doctor } from '@/types'

interface LoginResponse {
  success: boolean
  token: string
  user: Doctor
}

export const authService = {
  /** Step 1 — send OTP to phone number */
  sendOtp: (phone: string) =>
    api.post<{ success: boolean; message: string; _dev_otp?: string }>('/auth/send-otp', { phone }),

  /** Step 2 — verify OTP and receive JWT */
  verifyOtp: (phone: string, otp: string) =>
    api.post<LoginResponse>('/auth/phone-login', { phone, otp }),

  /** Refresh JWT (call before expiry) */
  refreshToken: () =>
    api.post<{ token: string }>('/auth/refresh'),

  /** Invalidate session server-side */
  logout: () =>
    api.post('/auth/logout'),
}
