import mongoose, { Document, Schema } from 'mongoose'

export type DoctorStatus = 'active' | 'inactive' | 'on-leave'
export type DoctorShift  = 'morning' | 'evening' | 'night'

export interface IWorkingHours {
  start: number  // 24h hour, e.g. 9
  end:   number  // exclusive, e.g. 14
}

export interface IDoctor extends Document {
  // ── Identity ────────────────────────────────────────
  name: string
  firstName?: string
  lastName?: string
  gender?: 'M' | 'F' | 'Other'
  dob?: Date

  // ── Auth/contact ────────────────────────────────────
  email: string
  phone: string
  altPhone?: string
  address?: string

  // ── Practice ────────────────────────────────────────
  specialization: string
  specializations?: string[]    // multi-select preserved
  qualification: string
  experience?: number
  consultationFee?: number
  followUpFee?: number
  languages?: string[]

  // ── Schedule ────────────────────────────────────────
  availableDays: string[]
  shift: DoctorShift
  workingHours?: IWorkingHours[]
  slotDuration?: number
  maxTokens?: number
  breakStart?: string           // 'HH:MM'
  breakEnd?: string
  scheduleActive?: boolean

  // ── About ───────────────────────────────────────────
  bio?: string
  achievements?: string
  notes?: string
  avatar?: string

  status: DoctorStatus
  clinicId: mongoose.Types.ObjectId
  createdAt: Date
}

const DoctorSchema = new Schema<IDoctor>(
  {
    name:           { type: String, required: [true, 'Name is required'], trim: true },
    firstName:      { type: String, trim: true },
    lastName:       { type: String, trim: true },
    gender:         { type: String, enum: ['M', 'F', 'Other'] },
    dob:            { type: Date },

    email:          { type: String, required: [true, 'Email is required'], lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'] },
    phone:          { type: String, required: [true, 'Phone number is required'] },
    altPhone:       { type: String },
    address:        { type: String },

    specialization:  { type: String, required: [true, 'Specialization is required'] },
    specializations: { type: [String], default: undefined },
    qualification:   { type: String, required: [true, 'Qualification is required'] },
    experience:      { type: Number, min: [0, 'Experience cannot be negative'] },
    consultationFee: { type: Number, min: [0, 'Consultation fee cannot be negative'] },
    followUpFee:     { type: Number, min: [0, 'Follow-up fee cannot be negative'] },
    languages:       { type: [String], default: undefined },

    availableDays:  { type: [String], default: [] },
    shift:          { type: String, enum: ['morning', 'evening', 'night'], required: [true, 'Shift is required'] },
    workingHours: {
      type: [{
        start: { type: Number, required: true, min: 0, max: 23 },
        end:   { type: Number, required: true, min: 1, max: 24 },
        _id:   false,
      }],
      default: undefined,
    },
    slotDuration:    { type: Number },
    maxTokens:       { type: Number },
    breakStart:      { type: String },
    breakEnd:        { type: String },
    scheduleActive:  { type: Boolean, default: true },

    bio:            { type: String },
    achievements:   { type: String },
    notes:          { type: String },
    avatar:         { type: String },

    status:         { type: String, enum: ['active', 'inactive', 'on-leave'], default: 'active' },
    clinicId:       { type: Schema.Types.ObjectId, ref: 'Clinic', required: [true, 'Clinic ID is required'] },
    createdAt:      { type: Date, default: Date.now },
  },
  { timestamps: false },
)

const Doctor = mongoose.model<IDoctor>('Doctor', DoctorSchema)
export default Doctor
