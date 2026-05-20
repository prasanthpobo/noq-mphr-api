import api from './api'

// ── Types matching server models ──────────────────────────────────────────────

export interface Clinic {
  _id: string
  name: string
  code: string
  address: string
  city: string
  state: string
  pincode: string
  phone: string
  email: string
  type: string
  status: 'active' | 'inactive'
  openDays: string[]
  openTime?: string
  closeTime?: string
  logo?: string
  about?: string
  defaultFee?: number
  createdAt: string
}

export interface ClinicDoctor {
  _id: string
  name: string
  specialization: string
  qualification: string
  experience?: number
  consultationFee?: number
  status: string
  shift: string
  availableDays: string[]
  bio?: string
  avatar?: string
  clinicId: string | { _id: string; name: string }
}

// ── Response wrappers ─────────────────────────────────────────────────────────

export interface ClinicsResponse {
  success: boolean
  count: number
  data: Clinic[]
}

export interface ClinicResponse {
  success: boolean
  data: Clinic
}

export interface ClinicDoctorsResponse {
  success: boolean
  count: number
  data: ClinicDoctor[]
}

// ── API functions ─────────────────────────────────────────────────────────────

export function getClinics(params?: { search?: string; status?: string }): Promise<ClinicsResponse> {
  return api.get<never, ClinicsResponse>('/clinics', { params })
}

export function getClinicById(id: string): Promise<ClinicResponse> {
  return api.get<never, ClinicResponse>(`/clinics/${id}`)
}

export function getDoctorsByClinic(clinicId: string, params?: { search?: string; status?: string }): Promise<ClinicDoctorsResponse> {
  return api.get<never, ClinicDoctorsResponse>('/doctors', { params: { clinicId, ...params } })
}
