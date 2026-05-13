import mongoose, { Document, Schema } from 'mongoose'

export type FrontDeskShift = 'morning' | 'evening' | 'night'
export type FrontDeskStatus = 'active' | 'inactive' | 'on-leave'

export interface IFrontDesk extends Document {
  name: string
  email: string
  phone: string
  shift: FrontDeskShift
  status: FrontDeskStatus
  clinicId: mongoose.Types.ObjectId
  designation?: string
  experience?: number
  createdAt: Date
}

const FrontDeskSchema = new Schema<IFrontDesk>(
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
    designation: {
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

const FrontDesk = mongoose.model<IFrontDesk>('FrontDesk', FrontDeskSchema)

export default FrontDesk
