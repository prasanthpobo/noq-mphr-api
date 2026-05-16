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
