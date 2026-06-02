import api from './api'

export interface DoctorProfile {
  _id: string
  id?: string
  name: string
  email: string
  phone: string
  specialization: string
  qualification?: string
  experience?: number
  status: string
  clinicId: string | { _id: string; name: string; code?: string; city?: string }
  consultationFee?: number
  availableDays?: string[]
  shift?: string
  bio?: string
  avatar?: string
  createdAt?: string
}

export const doctorService = {
  /** Get the Doctor record for the logged-in user (matched server-side by phone/email) */
  me: () => api.get<{ success: boolean; data: DoctorProfile }>('/doctors/me'),

  get: (id: string) => api.get<{ success: boolean; data: DoctorProfile }>(`/doctors/${id}`),
}
