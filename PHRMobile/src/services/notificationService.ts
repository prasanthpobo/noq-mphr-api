import api from './api'

export type NotificationType =
  | 'appointment_booked'
  | 'appointment_cancelled'
  | 'appointment_completed'
  | 'appointment_rescheduled'
  | 'appointment_reminder'

export interface AppNotification {
  _id: string
  type: NotificationType
  title: string
  body: string
  appointmentId?: string
  read: boolean
  createdAt: string
}

interface ListResponse {
  success: boolean
  count: number
  unreadCount: number
  data: AppNotification[]
}

export function getNotifications(page = 1, limit = 30): Promise<ListResponse> {
  return api.get('/notifications', { params: { page, limit } })
}

export function getUnreadCount(): Promise<{ success: boolean; count: number }> {
  return api.get('/notifications/unread-count')
}

export function markRead(id: string): Promise<{ success: boolean }> {
  return api.put(`/notifications/${id}/read`, {})
}

export function markAllRead(): Promise<{ success: boolean; modifiedCount: number }> {
  return api.put('/notifications/read-all', {})
}
