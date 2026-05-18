import api from './api'

export interface AppointmentPatient {
  _id: string
  name: string
  phone?: string
  tag?: string
}

export interface AppointmentDoctor {
  _id: string
  name: string
  specialization?: string
}

export interface AppointmentClinic {
  _id: string
  name: string
}

export interface PrescriptionItem {
  medicine: string
  dosage: string
  duration: string
  instructions: string
}

export interface Vitals {
  bp?: string
  pulse?: number
  temp?: number
  weight?: number
  height?: number
}

export interface AppointmentDoctorFull extends AppointmentDoctor {
  phone?: string
  email?: string
}

export interface AppointmentClinicFull extends AppointmentClinic {
  address?: string
  phone?: string
}

export interface AppointmentPatientFull extends AppointmentPatient {
  gender?: string
  dob?: string
  bloodGroup?: string
}

export interface Appointment {
  _id: string
  patientId: AppointmentPatientFull | string
  doctorId: AppointmentDoctorFull | string
  clinicId: AppointmentClinicFull | string
  date: string
  time?: string
  type?: string
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'
  symptoms?: string[]
  notes?: string
  vitals?: Vitals
  prescription?: PrescriptionItem[]
  followUpOf?: string
  followUpReason?: string
  createdAt: string
}

export interface AppointmentSlot {
  time: string
  available: boolean
}

export interface AppointmentsResponse {
  success: boolean
  count: number
  data: Appointment[]
}

export interface AppointmentResponse {
  success: boolean
  data: Appointment
}

export interface SlotsResponse {
  success: boolean
  data: AppointmentSlot[]
}

export interface CreateAppointmentPayload {
  patientId: string
  doctorId: string
  clinicId: string
  date: string
  time?: string
  type?: string
  symptoms?: string[]
  notes?: string
}

/** GET /api/appointments/slots?doctorId=&date= */
export async function getSlots(doctorId: string, date: string): Promise<SlotsResponse> {
  return api.get<never, SlotsResponse>('/appointments/slots', { params: { doctorId, date } })
}

/** GET /api/appointments/mine?filter=upcoming|past — patient-scoped */
export async function getMyAppointments(filter: 'upcoming' | 'past'): Promise<AppointmentsResponse> {
  return api.get<never, AppointmentsResponse>('/appointments/mine', { params: { filter } })
}

/** GET /api/appointments — with optional filters */
export async function getAppointments(params?: {
  doctorId?: string
  patientId?: string
  clinicId?: string
  status?: string
  date?: string
  page?: number
  limit?: number
}): Promise<AppointmentsResponse> {
  return api.get<never, AppointmentsResponse>('/appointments', { params })
}

/** GET /api/appointments/:id */
export async function getAppointmentById(id: string): Promise<AppointmentResponse> {
  return api.get<never, AppointmentResponse>(`/appointments/${id}`)
}

/** POST /api/appointments */
export async function createAppointment(payload: CreateAppointmentPayload): Promise<AppointmentResponse> {
  return api.post<never, AppointmentResponse>('/appointments', payload)
}

/** PUT /api/appointments/:id */
export async function updateAppointment(
  id: string,
  payload: Partial<{ status: string; time: string; date: string; notes: string }>
): Promise<AppointmentResponse> {
  return api.put<never, AppointmentResponse>(`/appointments/${id}`, payload)
}

/** DELETE /api/appointments/:id */
export async function deleteAppointment(id: string): Promise<{ success: boolean; data: Record<string, never> }> {
  return api.delete<never, { success: boolean; data: Record<string, never> }>(`/appointments/${id}`)
}
