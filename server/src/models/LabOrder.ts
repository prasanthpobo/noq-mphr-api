import mongoose, { Document, Schema } from 'mongoose'

export interface ILabTest {
  name: string
  code?: string
  status: 'pending' | 'in-progress' | 'completed'
  result?: string
  unit?: string
  normalRange?: string
}

export interface ILabOrder extends Document {
  patientId: mongoose.Types.ObjectId
  doctorId: mongoose.Types.ObjectId
  clinicId: mongoose.Types.ObjectId
  appointmentId?: mongoose.Types.ObjectId
  orderId: string
  tests: ILabTest[]
  priority: 'routine' | 'urgent' | 'stat'
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  notes?: string
  collectedAt?: Date
  reportedAt?: Date
  createdAt: Date
}

const LabTestSchema = new Schema<ILabTest>(
  {
    name: { type: String },
    code: { type: String },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending'
    },
    result: { type: String },
    unit: { type: String },
    normalRange: { type: String }
  },
  { _id: true }
)

const LabOrderSchema = new Schema<ILabOrder>(
  {
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
    orderId: {
      type: String,
      unique: true
    },
    tests: {
      type: [LabTestSchema],
      default: []
    },
    priority: {
      type: String,
      enum: ['routine', 'urgent', 'stat'],
      default: 'routine'
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'cancelled'],
      default: 'pending'
    },
    notes: {
      type: String
    },
    collectedAt: {
      type: Date
    },
    reportedAt: {
      type: Date
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: false }
)

const LabOrder = mongoose.model<ILabOrder>('LabOrder', LabOrderSchema)

export default LabOrder
