import mongoose, { Document, Schema } from 'mongoose'

export type DoctorStatus = 'active' | 'inactive' | 'on-leave'
export type DoctorShift = 'morning' | 'evening' | 'night'

export interface IDoctor extends Document {
  name: string
  email: string
  phone: string
  specialization: string
  qualification: string
  experience?: number
  status: DoctorStatus
  clinicId: mongoose.Types.ObjectId
  consultationFee?: number
  availableDays: string[]
  shift: DoctorShift
  bio?: string
  avatar?: string
  createdAt: Date
}

const DoctorSchema = new Schema<IDoctor>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required']
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required']
    },
    qualification: {
      type: String,
      required: [true, 'Qualification is required']
    },
    experience: {
      type: Number,
      min: [0, 'Experience cannot be negative']
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'on-leave'],
      default: 'active'
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: [true, 'Clinic ID is required']
    },
    consultationFee: {
      type: Number,
      min: [0, 'Consultation fee cannot be negative']
    },
    availableDays: {
      type: [String],
      default: []
    },
    shift: {
      type: String,
      enum: ['morning', 'evening', 'night'],
      required: [true, 'Shift is required']
    },
    bio: {
      type: String
    },
    avatar: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: false }
)

const Doctor = mongoose.model<IDoctor>('Doctor', DoctorSchema)

export default Doctor
