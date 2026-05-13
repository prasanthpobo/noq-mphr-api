import mongoose, { Document, Schema } from 'mongoose'

export type PatientTag = 'active' | 'new' | 'follow-up' | 'critical'
export type PatientGender = 'M' | 'F' | 'Other'

export interface IEmergencyContact {
  name: string
  phone: string
}

export interface IPatient extends Document {
  name: string
  email?: string
  phone: string
  dob?: Date
  gender: PatientGender
  bloodGroup?: string
  address?: string
  clinicId: mongoose.Types.ObjectId
  tag: PatientTag
  medicalHistory: string[]
  allergies: string[]
  emergencyContact?: IEmergencyContact
  createdAt: Date
}

const PatientSchema = new Schema<IPatient>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required']
    },
    dob: {
      type: Date
    },
    gender: {
      type: String,
      enum: ['M', 'F', 'Other'],
      required: [true, 'Gender is required']
    },
    bloodGroup: {
      type: String
    },
    address: {
      type: String
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: [true, 'Clinic ID is required']
    },
    tag: {
      type: String,
      enum: ['active', 'new', 'follow-up', 'critical'],
      default: 'active'
    },
    medicalHistory: {
      type: [String],
      default: []
    },
    allergies: {
      type: [String],
      default: []
    },
    emergencyContact: {
      name: { type: String },
      phone: { type: String }
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: false }
)

const Patient = mongoose.model<IPatient>('Patient', PatientSchema)

export default Patient
