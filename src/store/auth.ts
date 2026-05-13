import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/axios'

interface AuthUser {
  id: string
  name: string
  email: string
  role: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      loading: false,
      error: null,
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
      logout: () => {
        localStorage.removeItem('noq_token')
        set({ user: null, token: null })
      },
      clearError: () => set({ error: null }),
    }),
    { name: 'noq-auth', partialize: (s) => ({ user: s.user, token: s.token }) }
  )
)
