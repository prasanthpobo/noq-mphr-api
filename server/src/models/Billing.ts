import mongoose, { Document, Schema } from 'mongoose'

export interface IBillingItem {
  description: string
  quantity:    number
  rate:        number
  amount:      number
}

export interface IBilling extends Document {
  patientId:      mongoose.Types.ObjectId
  doctorId:       mongoose.Types.ObjectId
  clinicId:       mongoose.Types.ObjectId
  appointmentId?: mongoose.Types.ObjectId
  invoiceNumber:  string
  items:          IBillingItem[]
  subtotal:       number
  discount:       number
  tax:            number
  total:          number
  status:         'pending' | 'paid' | 'partial' | 'cancelled'
  paymentMethod?: 'cash' | 'card' | 'upi' | 'insurance' | 'online'
  paidAmount:     number
  paidAt?:        Date
  notes?:         string
  createdAt:      Date
  updatedAt:      Date
}

const BillingItemSchema = new Schema<IBillingItem>(
  {
    description: { type: String },
    quantity:    { type: Number },
    rate:        { type: Number },
    amount:      { type: Number },
  },
  { _id: false }
)

const BillingSchema = new Schema<IBilling>(
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
    invoiceNumber: { type: String, unique: true },
    items:         { type: [BillingItemSchema], default: [] },
    subtotal:      { type: Number, default: 0 },
    discount:      { type: Number, default: 0 },
    tax:           { type: Number, default: 0 },
    total:         { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'paid', 'partial', 'cancelled'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'insurance', 'online'],
    },
    paidAmount: { type: Number, default: 0 },
    paidAt:     { type: Date },
    notes:      { type: String },
  },
  { timestamps: true }
)

const Billing = mongoose.model<IBilling>('Billing', BillingSchema)

export default Billing
