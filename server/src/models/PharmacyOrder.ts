import mongoose, { Document, Schema } from 'mongoose'

export interface IPharmacyMedicine {
  name: string
  dosage?: string
  quantity?: number
  unit?: string
  rate?: number
  amount?: number
  status: 'available' | 'partial' | 'out-of-stock'
}

export interface IPharmacyOrder extends Document {
  patientId: mongoose.Types.ObjectId
  doctorId: mongoose.Types.ObjectId
  clinicId: mongoose.Types.ObjectId
  appointmentId?: mongoose.Types.ObjectId
  orderId: string
  medicines: IPharmacyMedicine[]
  status: 'pending' | 'dispensed' | 'partial' | 'paid' | 'cancelled'
  subtotal: number
  discount: number
  gst: number
  total: number
  finalAmount: number
  paidAmount: number
  paymentMethod?: 'cash' | 'upi' | 'card' | 'insurance' | 'online'
  paidAt?: Date
  notes?: string
  createdAt: Date
}

const PharmacyMedicineSchema = new Schema<IPharmacyMedicine>(
  {
    name:     { type: String },
    dosage:   { type: String },
    quantity: { type: Number },
    unit:     { type: String },
    rate:     { type: Number },
    amount:   { type: Number },
    status:   { type: String, enum: ['available', 'partial', 'out-of-stock'], default: 'available' },
  },
  { _id: false }
)

const PharmacyOrderSchema = new Schema<IPharmacyOrder>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: [true, 'Patient is required'] },
    doctorId:  { type: Schema.Types.ObjectId, ref: 'Doctor',  required: [true, 'Doctor is required']  },
    clinicId:  { type: Schema.Types.ObjectId, ref: 'Clinic',  required: [true, 'Clinic is required']  },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    orderId:  { type: String, unique: true },
    medicines: { type: [PharmacyMedicineSchema], default: [] },
    status: {
      type: String,
      enum: ['pending', 'dispensed', 'partial', 'paid', 'cancelled'],
      default: 'pending',
    },
    subtotal:    { type: Number, default: 0 },
    discount:    { type: Number, default: 0 },
    gst:         { type: Number, default: 0 },
    total:       { type: Number, default: 0 },
    finalAmount: { type: Number, default: 0 },
    paidAmount:  { type: Number, default: 0 },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'card', 'insurance', 'online'],
    },
    paidAt: { type: Date },
    notes:  { type: String },
  },
  { timestamps: true }
)

export default mongoose.model<IPharmacyOrder>('PharmacyOrder', PharmacyOrderSchema)
