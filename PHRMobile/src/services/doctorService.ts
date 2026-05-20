import api from './api'

export interface Doctor {
  _id: string
  name: string
  specialization: string
  qualification: string
  experience?: number
  status: string
  consultationFee?: number
  availableDays: string[]
  shift: string
  workingHours?: { start: number; end: number }[]
  bio?: string
  avatar?: string
  clinicId: { _id: string; name: string; code?: string; city?: string } | string
}

interface ListResponse {
  success: boolean
  count: number
  data: Doctor[]
}

interface SlotItem {
  time: string
  available: boolean
}

interface SlotsResponse {
  success: boolean
  data: SlotItem[]
}

export function getDoctors(params?: { search?: string; clinicId?: string; status?: string }): Promise<ListResponse> {
  return api.get<never, ListResponse>('/doctors', { params })
}

export function getDoctorById(id: string): Promise<{ success: boolean; data: Doctor }> {
  return api.get(`/doctors/${id}`)
}

export function getSlots(doctorId: string, date: string): Promise<SlotsResponse> {
  return api.get<never, SlotsResponse>('/appointments/slots', { params: { doctorId, date } })
}

export interface BookingPayload {
  doctorId: string
  date: string
  time: string
  reason?: string
  familyMemberId?: string
}

export function bookAppointment(payload: BookingPayload): Promise<{ success: boolean; data: unknown }> {
  return api.post('/appointments/book', payload)
}

export function getFavouriteDoctors(): Promise<{ success: boolean; count: number; data: Doctor[] }> {
  return api.get('/doctors/favourites')
}

export function toggleFavouriteDoctor(doctorId: string): Promise<{ success: boolean; isFavourite: boolean; count: number }> {
  return api.post(`/doctors/${doctorId}/favourite`, {})
}

export function getFavouriteDoctorIds(): Promise<string[]> {
  return getFavouriteDoctors().then((r) => r.data.map((d) => d._id))
}

export function formatDoctorName(name: string): string {
  const stripped = name.replace(/^Dr\.?\s*/i, '')
  return `Dr. ${stripped}`
}
