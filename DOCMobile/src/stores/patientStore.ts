import { create } from 'zustand'
import type { Patient } from '@/types'

interface PatientState {
  patients: Patient[]
  selectedPatient: Patient | null
  searchQuery: string
  isLoading: boolean
  error: string | null
}

interface PatientActions {
  setPatients: (patients: Patient[]) => void
  selectPatient: (patient: Patient | null) => void
  setSearchQuery: (query: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const usePatientStore = create<PatientState & PatientActions>((set) => ({
  patients: [],
  selectedPatient: null,
  searchQuery: '',
  isLoading: false,
  error: null,

  setPatients: (patients) => set({ patients }),
  selectPatient: (patient) => set({ selectedPatient: patient }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}))
