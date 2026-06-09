import mongoose, { Document, Schema } from 'mongoose'

export type FrontDeskShift  = 'morning' | 'evening' | 'night'
export type FrontDeskStatus = 'active' | 'inactive' | 'on-leave'

export interface IFrontDesk extends Document {
  name: string
  firstName?: string
  lastName?: string
  gender?: 'M' | 'F' | 'Other'
  dob?: Date

  email: string
  phone: string
  altPhone?: string
  address?: string

  designation?: string
  experience?: number
  employeeId?: string
  joinedAt?: Date

  shift: FrontDeskShift
  startTime?: string
  endTime?: string
  breakStart?: string
  breakEnd?: string
  availableDays?: string[]

  emergencyContact?: { name?: string; relation?: string; phone?: string }
  username?: string
  notes?: string

  status: FrontDeskStatus
  clinicId: mongoose.Types.ObjectId
  createdAt: Date
}

const FrontDeskSchema = new Schema<IFrontDesk>(
  {
    name:        { type: String, required: [true, 'Name is required'], trim: true },
    firstName:   { type: String, trim: true },
    lastName:    { type: String, trim: true },
    gender:      { type: String, enum: ['M', 'F', 'Other'] },
    dob:         { type: Date },

    email:       { type: String, required: [true, 'Email is required'], lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'] },
    phone:       { type: String, required: [true, 'Phone number is required'] },
    altPhone:    { type: String },
    address:     { type: String },

    designation: { type: String },
    experience:  { type: Number, min: [0, 'Experience cannot be negative'] },
    employeeId:  { type: String },
    joinedAt:    { type: Date },

    shift:       { type: String, enum: ['morning', 'evening', 'night'], required: [true, 'Shift is required'] },
    startTime:   { type: String },
    endTime:     { type: String },
    breakStart:  { type: String },
    breakEnd:    { type: String },
    availableDays: { type: [String], default: undefined },

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

const FrontDesk = mongoose.model<IFrontDesk>('FrontDesk', FrontDeskSchema)
export default FrontDesk
