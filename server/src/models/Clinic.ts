import mongoose, { Document, Schema } from 'mongoose'

export type ClinicStatus = 'active' | 'inactive'

export interface IWorkingHour {
  day: string
  active: boolean
  start: string
  end: string
}

export interface IClinic extends Document {
  name: string
  code: string
  address: string
  city: string
  state: string
  pincode: string
  phone: string
  email: string
  type: string
  capacity?: number
  status: ClinicStatus
  openDays: string[]
  openTime?: string
  closeTime?: string
  logo?: string
  about?: string
  // Extended settings
  gstin?: string
  currency?: string
  defaultFee?: number
  taxRate?: number
  invoiceNotes?: string
  workingHours?: IWorkingHour[]
  notifications?: {
    sms: boolean
    email: boolean
    browser: boolean
    queueAlerts: boolean
  }
  createdAt: Date
}

const ClinicSchema = new Schema<IClinic>(
  {
    name: {
      type: String,
      required: [true, 'Clinic name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Clinic code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    type: {
      type: String,
      required: [true, 'Clinic type is required']
    },
    capacity: {
      type: Number
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    openDays: {
      type: [String],
      default: []
    },
    openTime: {
      type: String
    },
    closeTime: {
      type: String
    },
    logo: {
      type: String
    },
    about: {
      type: String
    },
    gstin: { type: String },
    currency: { type: String, default: 'INR' },
    defaultFee: { type: Number },
    taxRate: { type: Number },
    invoiceNotes: { type: String },
    workingHours: {
      type: [{
        day:    { type: String },
        active: { type: Boolean, default: true },
        start:  { type: String, default: '09:00' },
        end:    { type: String, default: '20:00' },
      }],
      default: undefined,
    },
    notifications: {
      type: {
        sms:         { type: Boolean, default: true  },
        email:       { type: Boolean, default: true  },
        browser:     { type: Boolean, default: false },
        queueAlerts: { type: Boolean, default: true  },
      },
      default: undefined,
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: false }
)

const Clinic = mongoose.model<IClinic>('Clinic', ClinicSchema)

export default Clinic
