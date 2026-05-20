import mongoose, { Document, Schema } from 'mongoose'

export type NotificationType =
  | 'appointment_booked'
  | 'appointment_cancelled'
  | 'appointment_completed'
  | 'appointment_rescheduled'
  | 'appointment_reminder'

export interface INotification extends Document {
  userId:        mongoose.Types.ObjectId
  type:          NotificationType
  title:         string
  body:          string
  appointmentId?: mongoose.Types.ObjectId
  read:          boolean
  createdAt:     Date
}

const NotificationSchema = new Schema<INotification>(
  {
    userId:        { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type:          { type: String, enum: ['appointment_booked','appointment_cancelled','appointment_completed','appointment_rescheduled','appointment_reminder'], required: true },
    title:         { type: String, required: true },
    body:          { type: String, required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    read:          { type: Boolean, default: false },
    createdAt:     { type: Date,    default: Date.now },
  },
  { timestamps: false }
)

const Notification = mongoose.model<INotification>('Notification', NotificationSchema)
export default Notification
