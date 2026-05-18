import mongoose, { Document, Schema } from 'mongoose'
import bcrypt from 'bcryptjs'

export type UserRole =
  | 'super_admin'
  | 'clinic_admin'
  | 'doctor'
  | 'nurse'
  | 'frontdesk'
  | 'pharmacist'
  | 'lab_tech'
  | 'patient'

export type UserStatus = 'active' | 'inactive' | 'on-leave' | 'pending'

export interface ICondition {
  _id: mongoose.Types.ObjectId
  name: string
  diagnosedAt?: Date
  notes?: string
}

export interface IAllergy {
  _id: mongoose.Types.ObjectId
  name: string
  severity?: 'mild' | 'moderate' | 'severe'
  reaction?: string
}

export interface IMedication {
  _id: mongoose.Types.ObjectId
  name: string
  dose: string
  frequency: string
  since: string
  notes?: string
}

export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: UserRole
  status: UserStatus
  clinicId?: mongoose.Types.ObjectId
  avatar?: string
  phone?: string
  gender?: 'M' | 'F' | 'Other'
  dob?: Date
  bloodGroup?: string
  height?: number
  weight?: number
  conditions: ICondition[]
  allergies: IAllergy[]
  medications: IMedication[]
  createdAt: Date
  // Password reset flow
  resetOtp?: string
  resetOtpExpiry?: Date
  resetOtpVerified?: boolean
  resetToken?: string
  resetTokenExpiry?: Date
  matchPassword(enteredPassword: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    role: {
      type: String,
      enum: ['super_admin', 'clinic_admin', 'doctor', 'nurse', 'frontdesk', 'pharmacist', 'lab_tech', 'patient'],
      default: 'clinic_admin'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'on-leave', 'pending'],
      default: 'active'
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: false
    },
    avatar: {
      type: String
    },
    phone: {
      type: String
    },
    gender: {
      type: String,
      enum: ['M', 'F', 'Other']
    },
    dob: {
      type: Date
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    height: {
      type: Number,
      min: 0
    },
    weight: {
      type: Number,
      min: 0
    },
    conditions: [{
      name: { type: String, required: true, trim: true },
      diagnosedAt: { type: Date },
      notes: { type: String, trim: true },
    }],
    allergies: [{
      name: { type: String, required: true, trim: true },
      severity: { type: String, enum: ['mild', 'moderate', 'severe'] },
      reaction: { type: String, trim: true },
    }],
    medications: [{
      name: { type: String, required: true, trim: true },
      dose: { type: String, required: true, trim: true },
      frequency: { type: String, required: true, trim: true },
      since: { type: String, required: true, trim: true },
      notes: { type: String, trim: true },
    }],
    createdAt: {
      type: Date,
      default: Date.now
    },
    resetOtp:          { type: String,  select: false },
    resetOtpExpiry:    { type: Date,    select: false },
    resetOtpVerified:  { type: Boolean, select: false, default: false },
    resetToken:        { type: String,  select: false },
    resetTokenExpiry:  { type: Date,    select: false },
  },
  { timestamps: false }
)

UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) {
    return next()
  }
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

UserSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  return bcrypt.compare(enteredPassword, this.password)
}

const User = mongoose.model<IUser>('User', UserSchema)

export default User
