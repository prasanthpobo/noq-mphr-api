import mongoose, { Document, Schema } from 'mongoose'

export type ClinicStatus = 'active' | 'inactive'

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
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: false }
)

const Clinic = mongoose.model<IClinic>('Clinic', ClinicSchema)

export default Clinic
