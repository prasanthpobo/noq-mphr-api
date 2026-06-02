import { create } from 'zustand'
import type { Appointment } from '@/types'

interface AppointmentState {
  appointments: Appointment[]
  selectedAppointment: Appointment | null
  isLoading: boolean
  error: string | null
}

interface AppointmentActions {
  setAppointments: (appointments: Appointment[]) => void
  selectAppointment: (appointment: Appointment | null) => void
  addAppointment: (appointment: Appointment) => void
  updateAppointment: (id: string, patch: Partial<Appointment>) => void
  removeAppointment: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useAppointmentStore = create<AppointmentState & AppointmentActions>((set) => ({
  appointments: [],
  selectedAppointment: null,
  isLoading: false,
  error: null,

  setAppointments: (appointments) => set({ appointments }),
  selectAppointment: (appointment) => set({ selectedAppointment: appointment }),

  addAppointment: (appointment) =>
    set((state) => ({ appointments: [...state.appointments, appointment] })),

  updateAppointment: (id, patch) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id ? { ...a, ...patch } : a
      ),
    })),

  removeAppointment: (id) =>
    set((state) => ({
      appointments: state.appointments.filter((a) => a.id !== id),
    })),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}))
