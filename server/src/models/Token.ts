import mongoose, { Document, Schema, Model } from 'mongoose'

export interface IToken extends Document {
  tokenNumber: number
  patientId: mongoose.Types.ObjectId
  doctorId: mongoose.Types.ObjectId
  clinicId: mongoose.Types.ObjectId
  appointmentId?: mongoose.Types.ObjectId
  status: 'waiting' | 'in-room' | 'in-consultation' | 'completed' | 'cancelled' | 'not-visited' | 'priority'
  priority: 'normal' | 'priority' | 'emergency'
  issuedAt: Date
  calledAt?: Date
  completedAt?: Date
  notes?: string
}

export interface ITokenModel extends Model<IToken> {
  getNextTokenNumber(clinicId: mongoose.Types.ObjectId | string, date: Date): Promise<number>
}

const TokenSchema = new Schema<IToken>(
  {
    tokenNumber: {
      type: Number,
      required: [true, 'Token number is required']
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient ID is required']
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor ID is required']
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: [true, 'Clinic ID is required']
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    status: {
      type: String,
      enum: ['waiting', 'in-room', 'in-consultation', 'completed', 'cancelled', 'not-visited', 'priority'],
      default: 'waiting'
    },
    priority: {
      type: String,
      enum: ['normal', 'priority', 'emergency'],
      default: 'normal'
    },
    issuedAt: {
      type: Date,
      default: Date.now
    },
    calledAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    notes: {
      type: String
    }
  },
  { timestamps: false }
)

TokenSchema.statics.getNextTokenNumber = async function (
  clinicId: mongoose.Types.ObjectId | string,
  date: Date
): Promise<number> {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const count = await this.countDocuments({
    clinicId,
    issuedAt: { $gte: startOfDay, $lte: endOfDay }
  })

  return count + 1
}

const Token = mongoose.model<IToken, ITokenModel>('Token', TokenSchema)

export default Token
