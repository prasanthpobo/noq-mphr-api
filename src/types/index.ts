export type Tone = 'blue' | 'indigo' | 'pink' | 'amber' | 'mint' | 'plum' | 'rose' | 'teal' | 'brand' | 'red' | 'green' | 'purple'

export type Status = 'active' | 'inactive' | 'on-leave' | 'pending'
export type TokenStatus = 'in-consultation' | 'waiting' | 'not-visited' | 'completed' | 'cancelled' | 'in-room' | 'priority'
export type Priority = 'normal' | 'priority' | 'emergency'
export type Gender = 'M' | 'F' | 'Other'
export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'blue' | 'brand' | 'amber' | 'green' | 'red' | 'gray' | 'teal' | 'purple' | 'pink'

export interface Doctor {
  id: number
  code: string
  name: string
  spec: string
  exp: string
  dept: string
  room: string
  status: 'on' | 'busy' | 'leave'
  fee: number
  today: number
  week: number
  rating: number
  av: string
  tone: Tone
  email: string
  phone: string
}

export interface Token {
  token: string
  emergency: boolean
  patient: string
  age: string
  doctor: string
  dept: string
  time: string
  status: TokenStatus
  wait: string
  av: string
  tone: Tone
}

export interface TokenQueue {
  id: string
  patient: string
  patientId: string
  clinic: string
  doctor: string
  slot: string
  status: TokenStatus
  priority: Priority
  pos: number
  created: string
  notes: string
  av: string
  tone: Tone
}

export interface Patient {
  id: string
  name: string
  age: number
  gender: Gender
  phone: string
  email: string
  last: string
  visits: number
  bg: string
  tag: 'active' | 'new' | 'follow-up' | 'critical'
  tone: Tone
}

export interface Clinic {
  id: string
  name: string
  area: string
  city: string
  state: string
  pincode: string
  phone: string
  email: string
  type: string
  doctors: number
  rooms: number
  status: Status
  rating: number
  hours: string
  established: string
  tone: Tone
  logo: string
}

export interface FrontDesk {
  id: string
  name: string
  role: string
  clinic: string
  shift: string
  phone: string
  email: string
  status: Status
  joined: string
  av: string
  tone: Tone
}

export interface Nurse {
  id: string
  name: string
  role: string
  dept: string
  ward: string
  clinic: string
  shift: string
  phone: string
  email: string
  status: Status
  joined: string
  av: string
  tone: Tone
}

export interface AdminUser {
  id: string
  name: string
  role: string
  scope: string
  clinic: string
  lastLogin: string
  phone: string
  email: string
  status: Status
  twoFactor: boolean
  joined: string
  av: string
  tone: Tone
}

export interface ChartDay {
  d: string
  tokens: number
  visits: number
}

export interface Alert {
  kind: 'warn' | 'danger' | 'info'
  t: string
  s: string
  when: string
}

export interface NavItem {
  k: string
  l: string
  ic: string
  badge?: number
  primary?: boolean
}

export interface NavGroup {
  g: string
  items: NavItem[]
}
