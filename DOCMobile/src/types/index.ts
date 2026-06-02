// ─── Auth ──────────────────────────────────────────────────────────────────

export interface Doctor {
  id: string
  name: string
  email: string
  role: string
  status: string
  phone?: string
  avatar?: string
  gender?: string
  dob?: string
  clinicId?: string
  // Doctor-specific (populated from Doctor model after login)
  mciNumber?: string
  specialization?: string
  avatarUrl?: string
}

// ─── Clinic ────────────────────────────────────────────────────────────────

export interface Clinic {
  _id: string
  id?: string
  name: string
  address: string
  city?: string
  phone?: string
  email?: string
  status?: string
}

// ─── Queue ─────────────────────────────────────────────────────────────────

export type TokenStatus = 'waiting' | 'in-progress' | 'done' | 'skipped'

export interface QueueToken {
  id: string
  number: number
  patientId: string
  patientName: string
  status: TokenStatus
  appointmentId?: string
  issuedAt: string
}

// ─── Appointment ───────────────────────────────────────────────────────────

export type AppointmentStatus = 'scheduled' | 'waiting' | 'in-progress' | 'done' | 'cancelled'

export interface Appointment {
  id: string
  token: number
  patientId: string
  patientName: string
  patientPhone: string
  clinicId: string
  doctorId: string
  date: string            // ISO date string
  time: string            // "HH:mm"
  status: AppointmentStatus
  notes?: string
}

// ─── Patient ───────────────────────────────────────────────────────────────

export interface Patient {
  id: string
  name: string
  phone: string
  dob: string             // ISO date string
  gender: 'male' | 'female' | 'other'
  bloodGroup?: string
  address?: string
  createdAt: string
}

// ─── Consultation ──────────────────────────────────────────────────────────

export interface RxLine {
  id: string
  medicine: string
  dose: string
  frequency: string
  duration: string
  /** Tablet / Capsule / Syrup / Injection / Ointment … */
  type?: string
  /** Daily schedule toggles */
  schedule?: { morning?: boolean; afternoon?: boolean; night?: boolean }
  /** Free-text usage hint, e.g. "After food, with water" */
  instructions?: string
}

export interface Vitals {
  bp?: string             // e.g. "120/80"
  pulse?: number          // bpm
  temp?: number           // °C
  weight?: number         // kg
  height?: number         // cm
  spo2?: number           // %
}

export interface Consultation {
  id: string
  patientId: string
  patientName: string
  doctorId: string
  clinicId: string
  appointmentId?: string
  vitals?: Vitals
  complaints: string
  diagnosis: string
  notes: string
  rxLines: RxLine[]
  status: 'active' | 'completed'
  createdAt: string
}

// ─── API Responses ─────────────────────────────────────────────────────────

export interface ApiError {
  message: string
  code?: string
}
