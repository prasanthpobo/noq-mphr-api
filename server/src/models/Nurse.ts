import mongoose, { Document, Schema } from 'mongoose'

export type NurseShift  = 'morning' | 'evening' | 'night'
export type NurseStatus = 'active' | 'inactive' | 'on-leave'

export interface INurse extends Document {
  name: string
  firstName?: string
  lastName?: string
  gender?: 'M' | 'F' | 'Other'
  dob?: Date
  bloodGroup?: string

  email: string
  phone: string
  altPhone?: string
  address?: string

  qualification: string
  experience?: number
  employeeId?: string
  registrationNumber?: string
  joinedAt?: Date
  role?: string

  shift: NurseShift
  shiftType?: string
  departments?: string[]
  availableDays?: string[]
  startTime?: string
  endTime?: string
  breakStart?: string
  breakEnd?: string
  rotational?: boolean
  onCall?: boolean
  certifications?: string[]

  ward?: string
  emergencyContact?: { name?: string; relation?: string; phone?: string }
  username?: string
  notes?: string

  status: NurseStatus
  clinicId: mongoose.Types.ObjectId
  createdAt: Date
}

const NurseSchema = new Schema<INurse>(
  {
    name:        { type: String, required: [true, 'Name is required'], trim: true },
    firstName:   { type: String, trim: true },
    lastName:    { type: String, trim: true },
    gender:      { type: String, enum: ['M', 'F', 'Other'] },
    dob:         { type: Date },
    bloodGroup:  { type: String },

    email:       { type: String, required: [true, 'Email is required'], lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'] },
    phone:       { type: String, required: [true, 'Phone number is required'] },
    altPhone:    { type: String },
    address:     { type: String },

    qualification:      { type: String, required: [true, 'Qualification is required'] },
    experience:         { type: Number, min: [0, 'Experience cannot be negative'] },
    employeeId:         { type: String },
    registrationNumber: { type: String },
    joinedAt:           { type: Date },
    role:               { type: String },

    shift:        { type: String, enum: ['morning', 'evening', 'night'], required: [true, 'Shift is required'] },
    shiftType:    { type: String },
    departments:  { type: [String], default: undefined },
    availableDays:{ type: [String], default: undefined },
    startTime:    { type: String },
    endTime:      { type: String },
    breakStart:   { type: String },
    breakEnd:     { type: String },
    rotational:   { type: Boolean, default: false },
    onCall:       { type: Boolean, default: false },
    certifications:{ type: [String], default: undefined },

    ward:        { type: String },
    emergencyContact: {
      name:     { type: String },
      relation: { type: String },
      phone:    { type: String },
    },
    username:    { type: String },
    notes:       { type: String },

    status:      { type: String, enum: ['active', 'inactive', 'on-leave'], default: 'active' },
    clinicId:    { type: Schema.Types.ObjectId, ref: 'Clinic', required: [true, 'Clinic ID is required'] },
    createdAt:   { type: Date, default: Date.now },
  },
  { timestamps: false },
)

const Nurse = mongoose.model<INurse>('Nurse', NurseSchema)
export default Nurse
