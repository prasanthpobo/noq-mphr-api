import { create } from 'zustand'

// Mirror of the screen-local definitions so Consent + ConsentNew can both consume them.
export type ScopeKey =
  | 'lab-reports'
  | 'prescriptions'
  | 'imaging'
  | 'vitals'
  | 'medications'
  | 'allergies'
  | 'abha-link'

export const SCOPE_LABELS: Record<ScopeKey, string> = {
  'lab-reports':   'Lab reports',
  prescriptions:   'Prescriptions',
  imaging:         'Imaging / scans',
  vitals:          'Vitals & device data',
  medications:     'Medication history',
  allergies:       'Allergies',
  'abha-link':     'ABHA consent link',
}

export interface AccessEvent {
  id: string
  at: string                                       // ISO timestamp
  scope: ScopeKey
  action: 'viewed' | 'downloaded' | 'shared' | 'edited'
  note?: string
}

export interface ConsentItem {
  id: string
  patientName: string
  patientPhone: string
  patientAge?: number
  patientGender?: 'M' | 'F' | 'Other'
  scopes: ScopeKey[]
  purpose: string
  requestedOn: string         // ISO
  respondedOn?: string        // ISO
  expiresOn?: string          // ISO
  status: 'pending' | 'active' | 'denied' | 'withdrawn' | 'expired'
  auditLog?: AccessEvent[]
}

function today(): string { return new Date().toISOString().slice(0, 10) }

const MOCK: ConsentItem[] = [
  {
    id: 'c1', patientName: 'Rohan Verma', patientPhone: '+91 99020 44117',
    patientAge: 42, patientGender: 'M',
    scopes: ['lab-reports', 'prescriptions', 'vitals'],
    purpose: 'Follow-up · chest tightness',
    requestedOn: '2026-05-18', status: 'pending',
  },
  {
    id: 'c2', patientName: 'Priya Ramesh', patientPhone: '+91 98450 21287',
    patientAge: 34, patientGender: 'F',
    scopes: ['lab-reports', 'imaging'],
    purpose: 'Pre-op cardiology screen',
    requestedOn: '2026-05-19', status: 'pending',
  },
  {
    id: 'c3', patientName: 'Kavya Menon', patientPhone: '+91 98450 21287',
    patientAge: 31, patientGender: 'F',
    scopes: ['lab-reports', 'prescriptions', 'vitals', 'allergies'],
    purpose: 'Ongoing cardiology follow-up',
    requestedOn: '2026-04-10', respondedOn: '2026-04-12',
    expiresOn: '2026-10-12', status: 'active',
    auditLog: [
      { id: 'a1', at: '2026-05-19T10:24:00', scope: 'lab-reports',   action: 'viewed',     note: 'Echocardiogram report' },
      { id: 'a2', at: '2026-05-19T10:31:00', scope: 'prescriptions', action: 'downloaded', note: 'Rx — Cardiology' },
      { id: 'a3', at: '2026-05-12T11:02:00', scope: 'vitals',        action: 'viewed' },
      { id: 'a4', at: '2026-04-30T16:18:00', scope: 'allergies',     action: 'viewed' },
      { id: 'a5', at: '2026-04-15T09:40:00', scope: 'lab-reports',   action: 'shared',     note: 'To Dr. Iyer for second opinion' },
    ],
  },
  {
    id: 'c4', patientName: 'Suresh Pillai', patientPhone: '+91 99888 12345',
    patientAge: 62, patientGender: 'M',
    scopes: ['lab-reports', 'medications'],
    purpose: 'Post-MI care',
    requestedOn: '2026-03-01', respondedOn: '2026-03-02',
    expiresOn: '2026-09-02', status: 'active',
    auditLog: [
      { id: 'b1', at: '2026-05-15T14:05:00', scope: 'lab-reports',  action: 'viewed' },
      { id: 'b2', at: '2026-05-15T14:08:00', scope: 'medications',  action: 'edited',     note: 'Updated statin dose' },
      { id: 'b3', at: '2026-04-22T10:00:00', scope: 'lab-reports',  action: 'downloaded' },
    ],
  },
  {
    id: 'c5', patientName: 'Aisha Khan', patientPhone: '+91 90080 33221',
    patientAge: 28, patientGender: 'F',
    scopes: ['allergies'],
    purpose: 'Allergy review',
    requestedOn: '2026-02-10', respondedOn: '2026-02-11',
    status: 'withdrawn',
  },
  {
    id: 'c6', patientName: 'Dakota Smith', patientPhone: '+91 98000 12234',
    patientAge: 46, patientGender: 'M',
    scopes: ['imaging'],
    purpose: 'X-ray review',
    requestedOn: '2026-01-22', respondedOn: '2026-01-22',
    status: 'denied',
  },
  {
    id: 'c7', patientName: 'Meera Joshi', patientPhone: '+91 73840 17762',
    patientAge: 35, patientGender: 'F',
    scopes: ['vitals'],
    purpose: 'Pregnancy vitals tracking',
    requestedOn: '2025-10-05', respondedOn: '2025-10-05',
    expiresOn: '2026-04-05', status: 'expired',
  },
]

export interface NewRequestPayload {
  patientName: string
  patientPhone: string
  scopes: ScopeKey[]
  purpose: string
  expiresOn?: string
}

interface ConsentState {
  items: ConsentItem[]
  addRequest:    (payload: NewRequestPayload) => void
  cancelRequest: (id: string) => void
  revokeAccess:  (id: string) => void
  resend:        (id: string) => void
  updateScopes:  (id: string, next: ScopeKey[]) => void
}

export const useConsentStore = create<ConsentState>((set) => ({
  items: MOCK,
  addRequest: (payload) => set((s) => ({
    items: [
      {
        id: `c${Date.now()}`,
        patientName:  payload.patientName,
        patientPhone: payload.patientPhone,
        scopes:       payload.scopes,
        purpose:      payload.purpose,
        requestedOn:  today(),
        expiresOn:    payload.expiresOn,
        status:       'pending',
      },
      ...s.items,
    ],
  })),
  cancelRequest: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  revokeAccess:  (id) => set((s) => ({
    items: s.items.map((i) => i.id === id ? { ...i, status: 'withdrawn', respondedOn: today() } : i),
  })),
  resend:        (id) => set((s) => ({
    items: s.items.map((i) => i.id === id ? { ...i, requestedOn: today() } : i),
  })),
  updateScopes:  (id, next) => set((s) => ({
    items: s.items.map((i) => i.id === id ? { ...i, scopes: next } : i),
  })),
}))
