import { create } from 'zustand'
import type { Doctor } from '../services/doctorService'
import type { FamilyMember } from '../services/familyService'

interface BookingState {
  step: number
  selectedPatientType: 'self' | 'family'
  selectedFamilyMember: FamilyMember | null
  selectedDoctor: Doctor | null
  selectedDate: string
  selectedTime: string
  reason: string
}

interface BookingActions {
  setStep: (step: number) => void
  setPatientSelf: () => void
  setPatientFamily: (member: FamilyMember) => void
  setDoctor: (doctor: Doctor) => void
  setDate: (date: string) => void
  setTime: (time: string) => void
  setReason: (reason: string) => void
  reset: () => void
  // legacy compat
  setPatient: (id: string) => void
  setClinic: (id: string) => void
  setSchedule: (id: string) => void
}

type BookingStore = BookingState & BookingActions

const initialState: BookingState = {
  step: 1,
  selectedPatientType: 'self',
  selectedFamilyMember: null,
  selectedDoctor: null,
  selectedDate: '',
  selectedTime: '',
  reason: '',
}

export const useBookingStore = create<BookingStore>()((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  setPatientSelf: () => set({ selectedPatientType: 'self', selectedFamilyMember: null }),
  setPatientFamily: (member) => set({ selectedPatientType: 'family', selectedFamilyMember: member }),
  setDoctor: (doctor) => set({ selectedDoctor: doctor }),
  setDate: (date) => set({ selectedDate: date }),
  setTime: (time) => set({ selectedTime: time }),
  setReason: (reason) => set({ reason }),
  reset: () => set({ ...initialState }),

  // legacy stubs (unused in new flow)
  setPatient: () => undefined,
  setClinic: () => undefined,
  setSchedule: () => undefined,
}))
