import mongoose from 'mongoose'
import Notification, { NotificationType } from '../models/Notification'

export async function createAppointmentNotification(params: {
  userId:        string | mongoose.Types.ObjectId
  type:          NotificationType
  appointmentId?: string | mongoose.Types.ObjectId
  doctorName:    string
  date:          string
  time?:         string
}): Promise<void> {
  const { userId, type, appointmentId, doctorName, date, time } = params

  let title: string
  let body: string

  switch (type) {
    case 'appointment_booked':
      title = 'Appointment Confirmed ✅'
      body  = `Your appointment with ${doctorName} on ${date}${time ? ` at ${time}` : ''} has been confirmed.`
      break

    case 'appointment_cancelled':
      title = 'Appointment Cancelled ❌'
      body  = `Your appointment with ${doctorName} on ${date} has been cancelled.`
      break

    case 'appointment_completed':
      title = 'Appointment Completed 🎉'
      body  = `Your visit with ${doctorName} on ${date} is now complete.`
      break

    case 'appointment_rescheduled':
      title = 'Appointment Rescheduled 📅'
      body  = `Your appointment with ${doctorName} has been rescheduled to ${date}${time ? ` at ${time}` : ''}.`
      break

    case 'appointment_reminder':
      title = 'Appointment Reminder ⏰'
      body  = `Reminder: You have an appointment with ${doctorName} tomorrow at ${time ?? 'the scheduled time'}.`
      break

    default:
      title = ''
      body  = ''
  }

  await Notification.create({ userId, type, title, body, appointmentId })
}
