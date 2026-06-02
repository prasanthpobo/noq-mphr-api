import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ─── Request interceptor — attach JWT ──────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response interceptor — handle 401 ────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

/** Some backend endpoints return `T[]`, others return `{ data: T[] }`. Normalize. */
export function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  const wrapped = payload as { data?: T[] } | null
  return Array.isArray(wrapped?.data) ? (wrapped!.data as T[]) : []
}

/** Same idea for a single object: `T` or `{ data: T }`. */
export function unwrapOne<T>(payload: unknown): T | null {
  if (payload && typeof payload === 'object' && 'data' in (payload as object)) {
    const inner = (payload as { data: unknown }).data
    if (inner && typeof inner === 'object') return inner as T
  }
  return (payload as T) ?? null
}

/** Return clinic id regardless of whether backend used `id` or `_id`. */
export function clinicId(c: { id?: string; _id?: string } | null | undefined): string {
  return c?.id ?? c?._id ?? ''
}

export default api
