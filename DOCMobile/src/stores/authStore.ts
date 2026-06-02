import { create } from 'zustand'
import type { Doctor, Clinic } from '@/types'

interface AuthState {
  user: Doctor | null
  token: string | null          // JWT in memory — never persisted
  selectedClinic: Clinic | null
  /** Resolved Doctor._id (separate from User._id, used to filter appointments) */
  doctorId: string | null
}

interface AuthActions {
  setAuth: (user: Doctor, token: string) => void
  setClinic: (clinic: Clinic) => void
  setDoctorId: (doctorId: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  token: null,
  selectedClinic: null,
  doctorId: null,

  setAuth: (user, token) => set({ user, token }),
  setClinic: (clinic) => set({ selectedClinic: clinic }),
  setDoctorId: (doctorId) => set({ doctorId }),
  logout: () => set({ user: null, token: null, selectedClinic: null, doctorId: null }),
}))
