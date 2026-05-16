import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '../services/authService'

export type { AuthUser as User }

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  token: string
  resetIdentifier: string
  resetToken: string
}

interface AuthActions {
  setToken: (token: string) => void
  setUser: (user: AuthUser) => void
  setResetIdentifier: (identifier: string) => void
  setResetToken: (token: string) => void
  logout: () => void
}

type AuthStore = AuthState & AuthActions

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  token: '',
  resetIdentifier: '',
  resetToken: '',
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      setToken: (token: string) => {
        localStorage.setItem('auth_token', token)
        set({ token, isAuthenticated: true })
      },

      setUser: (user: AuthUser) => set({ user, isAuthenticated: true }),

      setResetIdentifier: (identifier: string) => set({ resetIdentifier: identifier }),

      setResetToken: (token: string) => set({ resetToken: token }),

      logout: () => {
        localStorage.removeItem('auth_token')
        set({ ...initialState })
      },
    }),
    {
      name: 'noq-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
      }),
    }
  )
)
