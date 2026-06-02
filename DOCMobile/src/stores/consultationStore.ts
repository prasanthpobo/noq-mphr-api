import { create } from 'zustand'
import type { Consultation, RxLine, Vitals } from '@/types'

interface ConsultationState {
  active: Consultation | null
  rxLines: RxLine[]
  vitals: Vitals | null
  notes: string
  isLoading: boolean
  error: string | null
}

interface ConsultationActions {
  startConsultation: (consultation: Consultation) => void
  setVitals: (vitals: Vitals) => void
  setNotes: (notes: string) => void
  addRxLine: () => void
  updateRxLine: (index: number, patch: Partial<RxLine>) => void
  removeRxLine: (index: number) => void
  clearConsultation: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

const emptyRxLine = (): RxLine => ({
  id: crypto.randomUUID(),
  medicine: '',
  dose: '',
  frequency: '',
  duration: '',
})

export const useConsultationStore = create<ConsultationState & ConsultationActions>((set) => ({
  active: null,
  rxLines: [emptyRxLine()],
  vitals: null,
  notes: '',
  isLoading: false,
  error: null,

  startConsultation: (consultation) =>
    set({ active: consultation, rxLines: [emptyRxLine()], notes: '', vitals: null }),

  setVitals: (vitals) => set({ vitals }),
  setNotes: (notes) => set({ notes }),

  addRxLine: () =>
    set((state) => ({ rxLines: [...state.rxLines, emptyRxLine()] })),

  updateRxLine: (index, patch) =>
    set((state) => ({
      rxLines: state.rxLines.map((line, i) =>
        i === index ? { ...line, ...patch } : line
      ),
    })),

  removeRxLine: (index) =>
    set((state) => ({
      rxLines: state.rxLines.filter((_, i) => i !== index),
    })),

  clearConsultation: () =>
    set({ active: null, rxLines: [emptyRxLine()], vitals: null, notes: '' }),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}))
