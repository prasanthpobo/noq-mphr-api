import mongoose, { Document, Schema } from 'mongoose'

export type PatientTag = 'active' | 'new' | 'follow-up' | 'critical'
export type PatientGender = 'M' | 'F' | 'Other'

export interface IEmergencyContact {
  name?: string
  phone?: string
  relation?: string
}

export interface IAddress {
  street?: string
  city?: string
  state?: string
  pin?: string
}

export interface IGovernmentId {
  type?: string  // 'Aadhaar' | 'PAN' | 'Passport' | 'Voter ID' | …
  number?: string
}

export interface IInsurance {
  provider?: string
  policy?: string
  validTill?: string  // ISO date string
  cashless?: boolean
}

export interface IPatient extends Document {
  // ── Identity (Profile tab) ────────────────────────────────
  name: string
  firstName?: string
  lastName?: string
  dob?: Date
  gender: PatientGender
  bloodGroup?: string
  marital?: string
  occupation?: string
  tag: PatientTag

  // ── Contact (Contact & ID tab) ────────────────────────────
  phone: string
  altPhone?: string
  email?: string
  address?: IAddress
  emergencyContact?: IEmergencyContact
  governmentId?: IGovernmentId

  // ── Medical (Medical History tab) ─────────────────────────
  allergies: string[]
  conditions: string[]
  medications?: string
  surgeries?: string
  internalNotes?: string
  medicalHistory: string[]

  // ── Insurance ─────────────────────────────────────────────
  insurance?: IInsurance

  clinicId: mongoose.Types.ObjectId
  createdAt: Date
}

const PatientSchema = new Schema<IPatient>(
  {
    name:        { type: String, required: [true, 'Name is required'], trim: true },
    firstName:   { type: String, trim: true },
    lastName:    { type: String, trim: true },
    dob:         { type: Date },
    gender:      { type: String, enum: ['M', 'F', 'Other'], required: [true, 'Gender is required'] },
    bloodGroup:  { type: String },
    marital:     { type: String },
    occupation:  { type: String },
    tag:         { type: String, enum: ['active', 'new', 'follow-up', 'critical'], default: 'active' },

    phone:       { type: String, required: [true, 'Phone number is required'] },
    altPhone:    { type: String },
    email:       { type: String, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'] },

    address: {
      street: { type: String },
      city:   { type: String },
      state:  { type: String },
      pin:    { type: String },
    },

    emergencyContact: {
      name:     { type: String },
      phone:    { type: String },
      relation: { type: String },
    },

    governmentId: {
      type:   { type: String },
      number: { type: String },
    },

    allergies:      { type: [String], default: [] },
    conditions:     { type: [String], default: [] },
    medications:    { type: String },
    surgeries:      { type: String },
    internalNotes:  { type: String },
    medicalHistory: { type: [String], default: [] },

    insurance: {
      provider:  { type: String },
      policy:    { type: String },
      validTill: { type: String },
      cashless:  { type: Boolean, default: false },
    },

    clinicId:  { type: Schema.Types.ObjectId, ref: 'Clinic', required: [true, 'Clinic ID is required'] },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
)

const Patient = mongoose.model<IPatient>('Patient', PatientSchema)
export default Patient
