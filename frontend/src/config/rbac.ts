/* ──────────────────────────────────────────────────────────────────────────
 *  RBAC — Role Based Access Control
 *  Single source of truth: role definitions, permission sets, route guards.
 * ────────────────────────────────────────────────────────────────────────── */

/* ── Roles ──────────────────────────────────────────────────────────────── */
export type Role =
  | 'super_admin'
  | 'clinic_admin'
  | 'doctor'
  | 'nurse'
  | 'frontdesk'
  | 'pharmacist'
  | 'lab_tech'
  | 'patient'
  | 'user'

/* ── Fine-grained permission tokens ─────────────────────────────────────── */
export type Permission =
  // Workspace dashboards
  | 'dashboard:admin'
  | 'dashboard:clinic'
  | 'dashboard:doctor'
  | 'dashboard:nurse'
  | 'dashboard:frontdesk'
  // Clinic operations
  | 'clinic:appointments'
  | 'clinic:live-tokens'
  | 'clinic:tokens'
  | 'clinic:token-display'
  // Management
  | 'manage:clinics'
  | 'manage:doctors'
  | 'manage:nurses'
  | 'manage:frontdesk'
  | 'manage:patients'
  | 'manage:users'
  // Operations
  | 'ops:pharmacy'
  | 'ops:lab'
  | 'ops:billing'
  | 'ops:reports'
  // System
  | 'system:masterdata'
  // Account
  | 'account:profile'
  | 'account:support'
  | 'account:settings'

/* ── Role → permission set ──────────────────────────────────────────────── */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {

  /** Full system access — platform administrators */
  super_admin: [
    'dashboard:admin', 'dashboard:clinic', 'dashboard:doctor',
    'dashboard:nurse', 'dashboard:frontdesk',
    'clinic:appointments', 'clinic:live-tokens', 'clinic:tokens', 'clinic:token-display',
    'manage:clinics', 'manage:doctors', 'manage:nurses', 'manage:frontdesk',
    'manage:patients', 'manage:users',
    'ops:pharmacy', 'ops:lab', 'ops:billing', 'ops:reports',
    'system:masterdata',
    'account:profile', 'account:support', 'account:settings',
  ],

  /** Manages a single clinic's staff, operations, and billing */
  clinic_admin: [
    'dashboard:clinic',
    'clinic:appointments', 'clinic:live-tokens', 'clinic:tokens', 'clinic:token-display',
    'manage:doctors', 'manage:nurses', 'manage:frontdesk', 'manage:patients',
    'ops:pharmacy', 'ops:lab', 'ops:billing', 'ops:reports',
    'account:profile', 'account:support', 'account:settings',
  ],

  /** Clinical work: own appointments, patient records, lab results */
  doctor: [
    'dashboard:doctor',
    'clinic:appointments', 'clinic:live-tokens',
    'manage:patients',
    'ops:lab',
    'account:profile', 'account:support', 'account:settings',
  ],

  /** Ward/bedside: token queue and patient monitoring */
  nurse: [
    'dashboard:nurse',
    'clinic:live-tokens', 'clinic:tokens',
    'manage:patients',
    'account:profile', 'account:support', 'account:settings',
  ],

  /** Reception: scheduling, queue management, billing */
  frontdesk: [
    'dashboard:frontdesk',
    'clinic:appointments', 'clinic:live-tokens', 'clinic:tokens', 'clinic:token-display',
    'manage:patients',
    'ops:billing',
    'account:profile', 'account:support', 'account:settings',
  ],

  /** Pharmacy dispensing and prescription management */
  pharmacist: [
    'ops:pharmacy',
    'manage:patients',
    'account:profile', 'account:support', 'account:settings',
  ],

  /** Lab technician: test requests and results */
  lab_tech: [
    'ops:lab',
    'manage:patients',
    'account:profile', 'account:support', 'account:settings',
  ],

  /** Patient self-service portal */
  patient: [
    'account:profile', 'account:support', 'account:settings',
  ],

  /** Generic authenticated user — minimal access */
  user: [
    'account:profile', 'account:support', 'account:settings',
  ],
}

/* ── Default landing route per role (after login / redirect) ────────────── */
export const DEFAULT_ROUTE: Record<Role, string> = {
  super_admin:  'dashboard',
  clinic_admin: 'dash-clinic',
  doctor:       'dash-doctor',
  nurse:        'dash-nurse',
  frontdesk:    'dash-frontdesk',
  pharmacist:   'pharmacy',
  lab_tech:     'lab',
  patient:      'support',
  user:         'support',
}

/* ── Route → required permission ────────────────────────────────────────── */
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  // Workspace
  'dashboard':        'dashboard:admin',
  'dash-clinic':      'dashboard:clinic',
  'dash-doctor':      'dashboard:doctor',
  'dash-nurse':       'dashboard:nurse',
  'dash-frontdesk':   'dashboard:frontdesk',
  // Clinic
  'appointments':     'clinic:appointments',
  'appt-view':        'clinic:appointments',
  'appt-edit':        'clinic:appointments',
  'book':             'clinic:appointments',
  'live-tokens':      'clinic:live-tokens',
  'tokens-mgr':       'clinic:tokens',
  'tokens':           'clinic:token-display',
  // Manage – clinics
  'clinics':          'manage:clinics',
  'clinic-new':       'manage:clinics',
  'clinic-edit':      'manage:clinics',
  'clinic-view':      'manage:clinics',
  // Manage – doctors
  'doctors':          'manage:doctors',
  'doctor-new':       'manage:doctors',
  'doctor-edit':      'manage:doctors',
  'doctor-view':      'manage:doctors',
  // Manage – nurses
  'nurses':           'manage:nurses',
  'nurse-new':        'manage:nurses',
  'nurse-edit':       'manage:nurses',
  'nurse-view':       'manage:nurses',
  // Manage – front desk staff
  'frontdesk':        'manage:frontdesk',
  'fd-new':           'manage:frontdesk',
  'fd-edit':          'manage:frontdesk',
  'fd-view':          'manage:frontdesk',
  // Manage – patients
  'patients':         'manage:patients',
  'patient-new':      'manage:patients',
  'patient-edit':     'manage:patients',
  'patient-view':     'manage:patients',
  // Manage – users
  'admin-users':      'manage:users',
  'admin-new':        'manage:users',
  'admin-edit':       'manage:users',
  'admin-view':       'manage:users',
  // Operations
  'pharmacy':         'ops:pharmacy',
  'pharmacy-detail':  'ops:pharmacy',
  'lab':              'ops:lab',
  'lab-detail':       'ops:lab',
  'lab-billing':      'ops:lab',
  'billing':          'ops:billing',
  'billing-detail':   'ops:billing',
  'reports':          'ops:reports',
  // System
  'master-data':      'system:masterdata',
  // Account
  'profile':          'account:profile',
  'support':          'account:support',
  'settings':         'account:settings',
}

/* ── Human-readable role labels ─────────────────────────────────────────── */
export const ROLE_LABELS: Record<Role, string> = {
  super_admin:  'Super Admin',
  clinic_admin: 'Clinic Admin',
  doctor:       'Doctor',
  nurse:        'Nurse',
  frontdesk:    'Front Desk',
  pharmacist:   'Pharmacist',
  lab_tech:     'Lab Tech',
  patient:      'Patient',
  user:         'User',
}

/* ── Role accent colours ─────────────────────────────────────────────────── */
export const ROLE_COLORS: Record<Role, { bg: string; fg: string }> = {
  super_admin:  { bg: 'var(--brand-gradient-soft)', fg: 'var(--teal-700)'  },
  clinic_admin: { bg: 'rgba(59,130,246,0.1)',        fg: '#3b82f6'          },
  doctor:       { bg: 'rgba(99,102,241,0.1)',         fg: '#6366f1'          },
  nurse:        { bg: 'rgba(236,72,153,0.1)',         fg: '#ec4899'          },
  frontdesk:    { bg: 'rgba(245,158,11,0.1)',         fg: '#f59e0b'          },
  pharmacist:   { bg: 'rgba(34,197,94,0.1)',          fg: '#16a34a'          },
  lab_tech:     { bg: 'rgba(168,85,247,0.1)',         fg: '#a855f7'          },
  patient:      { bg: 'rgba(20,184,166,0.1)',         fg: 'var(--teal-600)' },
  user:         { bg: 'var(--bg-section)',            fg: 'var(--fg-muted)' },
}
