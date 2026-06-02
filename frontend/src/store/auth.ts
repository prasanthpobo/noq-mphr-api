import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/axios'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  phone?: string
  avatar?: string
  clinicId?: string
  createdAt?: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  loading: boolean
  error: string | null
  /** OTP echoed back by the server when OTP_ENABLE=true on the API. */
  previewOtp: string | null
  login:     (email: string, password: string) => Promise<void>
  sendOtp:   (phone: string) => Promise<{ success: boolean }>
  verifyOtp: (phone: string, otp: string) => Promise<void>
  logout:    () => void
  clearError: () => void
  fetchMe: () => Promise<void>
  updateProfile: (data: Partial<Pick<AuthUser, 'name' | 'phone' | 'avatar'>>) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,
      previewOtp: null,

      login: async (email, password) => {
        set({ loading: true, error: null })
        try {
          const { data } = await api.post('/auth/login', { email, password })
          localStorage.setItem('noq_token', data.token)
          set({ user: data.user, token: data.token, loading: false })
        } catch (err: any) {
          set({ error: err.response?.data?.message || 'Login failed', loading: false })
        }
      },

      sendOtp: async (phone) => {
        set({ loading: true, error: null, previewOtp: null })
        try {
          const { data } = await api.post('/auth/send-otp', { phone })
          set({ loading: false, previewOtp: data?._dev_otp ?? null })
          return { success: !!data?.success }
        } catch (err: any) {
          set({ error: err.response?.data?.message || 'Could not send OTP', loading: false })
          return { success: false }
        }
      },

      verifyOtp: async (phone, otp) => {
        set({ loading: true, error: null })
        try {
          const { data } = await api.post('/auth/phone-login', { phone, otp })
          localStorage.setItem('noq_token', data.token)
          set({ user: data.user, token: data.token, loading: false, previewOtp: null })
        } catch (err: any) {
          set({ error: err.response?.data?.message || 'OTP verification failed', loading: false })
        }
      },

      logout: () => {
        localStorage.removeItem('noq_token')
        set({ user: null, token: null, previewOtp: null })
      },

      clearError: () => set({ error: null }),

      fetchMe: async () => {
        try {
          const { data } = await api.get('/auth/me')
          set(s => ({ user: { ...s.user, ...data.data } }))
        } catch {
          // silently ignore — store already has persisted user
        }
      },

      updateProfile: async (updates) => {
        const user = get().user
        if (!user) return
        try {
          const { data } = await api.put(`/users/${user.id}`, updates)
          set(s => ({ user: s.user ? { ...s.user, ...data.data } : s.user }))
        } catch (err: any) {
          throw new Error(err.response?.data?.message || 'Update failed')
        }
      },
    }),
    { name: 'noq-auth', partialize: (s) => ({ user: s.user, token: s.token }) }
  )
)
