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

export type UserStatus = 'active' | 'inactive' | 'on-leave' | 'pending'

export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: UserRole
  status: UserStatus
  clinicId?: mongoose.Types.ObjectId
  avatar?: string
  phone?: string
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
      enum: ['super_admin', 'clinic_admin', 'doctor', 'nurse', 'frontdesk', 'pharmacist', 'lab_tech'],
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
