import mongoose, { Document, Schema } from 'mongoose'

export interface IPrescriptionItem {
  medicine: string
  dosage: string
  duration: string
  instructions: string
}

export interface IVitals {
  bp?: string
  pulse?: number
  temp?: number
  weight?: number
  height?: number
}

export interface IAppointment extends Document {
  patientId: mongoose.Types.ObjectId
  doctorId: mongoose.Types.ObjectId
  clinicId: mongoose.Types.ObjectId
  date: Date
  time: string
  type: 'consultation' | 'follow-up' | 'emergency' | 'routine'
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'
  symptoms: string[]
  notes: string
  prescription: IPrescriptionItem[]
  vitals: IVitals
  followUpOf?: mongoose.Types.ObjectId
  followUpReason?: string
  createdAt: Date
}

const PrescriptionItemSchema = new Schema<IPrescriptionItem>(
  {
    medicine: { type: String },
    dosage: { type: String },
    duration: { type: String },
    instructions: { type: String }
  },
  { _id: false }
)

const VitalsSchema = new Schema<IVitals>(
  {
    bp: { type: String },
    pulse: { type: Number },
    temp: { type: Number },
    weight: { type: Number },
    height: { type: Number }
  },
  { _id: false }
)

const AppointmentSchema = new Schema<IAppointment>(
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
    date: {
      type: Date,
      required: [true, 'Appointment date is required']
    },
    time: {
      type: String
    },
    type: {
      type: String,
      enum: ['consultation', 'follow-up', 'emergency', 'routine'],
      default: 'consultation'
    },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled'
    },
    symptoms: {
      type: [String],
      default: []
    },
    notes: {
      type: String
    },
    prescription: {
      type: [PrescriptionItemSchema],
      default: []
    },
    vitals: {
      type: VitalsSchema,
      default: {}
    },
    followUpOf: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    followUpReason: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: false }
)

const Appointment = mongoose.model<IAppointment>('Appointment', AppointmentSchema)

export default Appointment
