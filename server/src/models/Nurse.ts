import mongoose, { Document, Schema } from 'mongoose'

export type NurseShift = 'morning' | 'evening' | 'night'
export type NurseStatus = 'active' | 'inactive' | 'on-leave'

export interface INurse extends Document {
  name: string
  email: string
  phone: string
  qualification: string
  shift: NurseShift
  status: NurseStatus
  clinicId: mongoose.Types.ObjectId
  ward?: string
  experience?: number
  createdAt: Date
}

const NurseSchema = new Schema<INurse>(
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
    qualification: {
      type: String,
      required: [true, 'Qualification is required']
    },
    shift: {
      type: String,
      enum: ['morning', 'evening', 'night'],
      required: [true, 'Shift is required']
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
    ward: {
      type: String
    },
    experience: {
      type: Number,
      min: [0, 'Experience cannot be negative']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: false }
)

const Nurse = mongoose.model<INurse>('Nurse', NurseSchema)

export default Nurse
