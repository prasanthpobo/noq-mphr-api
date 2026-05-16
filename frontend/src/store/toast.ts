import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastState {
  toasts: Toast[]
  push: (message: string, type?: ToastType, duration?: number) => void
  remove: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, type = 'success', duration = 3500) => {
    const id = Date.now().toString()
    set(s => ({ toasts: [...s.toasts, { id, type, message, duration }] }))
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
    }, duration)
  },
  remove: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))

// Convenience helpers — call these anywhere without hooks
export const toast = {
  success: (msg: string) => useToastStore.getState().push(msg, 'success'),
  error:   (msg: string) => useToastStore.getState().push(msg, 'error'),
  info:    (msg: string) => useToastStore.getState().push(msg, 'info'),
  warning: (msg: string) => useToastStore.getState().push(msg, 'warning'),
}
