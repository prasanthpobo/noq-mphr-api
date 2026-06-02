import { create } from 'zustand'
import type { Clinic } from '@/types'

interface ClinicState {
  clinics: Clinic[]
  isLoading: boolean
  error: string | null
}

interface ClinicActions {
  setClinics: (clinics: Clinic[]) => void
  addClinic: (clinic: Clinic) => void
  removeClinic: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useClinicStore = create<ClinicState & ClinicActions>((set) => ({
  clinics: [],
  isLoading: false,
  error: null,

  setClinics: (clinics) => set({ clinics }),

  addClinic: (clinic) =>
    set((state) => ({ clinics: [...state.clinics, clinic] })),

  removeClinic: (id) =>
    set((state) => ({ clinics: state.clinics.filter((c) => c.id !== id) })),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}))
