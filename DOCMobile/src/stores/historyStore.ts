import { create } from 'zustand'
import type { Consultation } from '@/types'

interface HistoryState {
  pastConsults: Consultation[]
  selectedConsult: Consultation | null
  isLoading: boolean
  error: string | null
}

interface HistoryActions {
  setPastConsults: (consults: Consultation[]) => void
  selectConsult: (consult: Consultation | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useHistoryStore = create<HistoryState & HistoryActions>((set) => ({
  pastConsults: [],
  selectedConsult: null,
  isLoading: false,
  error: null,

  setPastConsults: (pastConsults) => set({ pastConsults }),
  selectConsult: (consult) => set({ selectedConsult: consult }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}))
