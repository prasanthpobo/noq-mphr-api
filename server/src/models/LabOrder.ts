import mongoose, { Document, Schema } from 'mongoose'

export interface ILabTest {
  name: string
  code?: string
  category?: string
  sampleType?: string
  tat?: string
  priority?: 'routine' | 'urgent' | 'stat'
  rate?: number
  amount?: number
  status: 'pending' | 'in-progress' | 'completed'
  result?: string
  unit?: string
  normalRange?: string
  notes?: string
}

export interface ILabOrder extends Document {
  patientId: mongoose.Types.ObjectId
  doctorId: mongoose.Types.ObjectId
  clinicId: mongoose.Types.ObjectId
  appointmentId?: mongoose.Types.ObjectId
  orderId: string
  tests: ILabTest[]
  priority: 'routine' | 'urgent' | 'stat'
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'paid'
  notes?: string
  collectedAt?: Date
  reportedAt?: Date
  subtotal: number
  discount: number
  gst: number
  total: number
  finalAmount: number
  paidAmount?: number
  paymentMethod?: string
  paidAt?: Date
  createdAt: Date
  updatedAt: Date
}

const LabTestSchema = new Schema<ILabTest>(
  {
    name:       { type: String },
    code:       { type: String },
    category:   { type: String },
    sampleType: { type: String },
    tat:        { type: String },
    priority:   { type: String, enum: ['routine', 'urgent', 'stat'], default: 'routine' },
    rate:       { type: Number, default: 0 },
    amount:     { type: Number, default: 0 },
    status:     { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
    result:     { type: String },
    unit:       { type: String },
    normalRange:{ type: String },
    notes:      { type: String },
  },
  { _id: true }
)

const LabOrderSchema = new Schema<ILabOrder>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient ID is required'],
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor ID is required'],
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: [true, 'Clinic ID is required'],
    },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    orderId:       { type: String, unique: true },
    tests:         { type: [LabTestSchema], default: [] },
    priority:      { type: String, enum: ['routine', 'urgent', 'stat'], default: 'routine' },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'cancelled', 'paid'],
      default: 'pending',
    },
    notes:        { type: String },
    collectedAt:  { type: Date },
    reportedAt:   { type: Date },
    subtotal:     { type: Number, default: 0 },
    discount:     { type: Number, default: 0 },
    gst:          { type: Number, default: 0 },
    total:        { type: Number, default: 0 },
    finalAmount:  { type: Number, default: 0 },
    paidAmount:   { type: Number, default: 0 },
    paymentMethod:{ type: String },
    paidAt:       { type: Date },
  },
  { timestamps: true }
)

const LabOrder = mongoose.model<ILabOrder>('LabOrder', LabOrderSchema)

export default LabOrder
