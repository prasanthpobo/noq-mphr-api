/* ──────────────────────────────────────────────────────────────────────────
 *  Menu Configuration — scalable, permission-gated sidebar nav
 *  Each item declares exactly one Permission; the sidebar filters by role.
 * ────────────────────────────────────────────────────────────────────────── */
import type { Permission } from './rbac'

/* ── Types ──────────────────────────────────────────────────────────────── */
export interface MenuItem {
  /** Route key used by useAppStore().setRoute() */
  key: string
  /** Display label */
  label: string
  /** Icon name passed to <Icon /> */
  icon: string
  /** Optional badge count (e.g. pending appointments) */
  badge?: number
  /** Permission required to see this item */
  permission: Permission
}

export interface MenuGroup {
  group: string
  items: MenuItem[]
}

/* ── Master menu config ─────────────────────────────────────────────────── */
export const MENU_CONFIG: MenuGroup[] = [
  // ── Workspace ────────────────────────────────────────────────────────────
  {
    group: 'Workspace',
    items: [
      {
        key: 'dashboard',
        label: 'Admin dashboard',
        icon: 'dashboard',
        permission: 'dashboard:admin',
      },
      {
        key: 'dash-clinic',
        label: 'Clinic dashboard',
        icon: 'building',
        permission: 'dashboard:clinic',
      },
      {
        key: 'dash-doctor',
        label: 'Doctor dashboard',
        icon: 'stethoscope',
        permission: 'dashboard:doctor',
      },
      {
        key: 'dash-nurse',
        label: 'Nurse dashboard',
        icon: 'heart',
        permission: 'dashboard:nurse',
      },
      {
        key: 'dash-frontdesk',
        label: 'Front desk dashboard',
        icon: 'user',
        permission: 'dashboard:frontdesk',
      },
    ],
  },

  // ── Clinic ───────────────────────────────────────────────────────────────
  {
    group: 'Clinic',
    items: [
      {
        key: 'tokens-mgr',
        label: 'Token',
        icon: 'ticket',
        permission: 'clinic:tokens',
      },
      {
        key: 'appointments',
        label: 'Appointments',
        icon: 'calendar',
        permission: 'clinic:appointments',
      },
    ],
  },

  // ── Display ──────────────────────────────────────────────────────────────
  {
    group: 'Display',
    items: [
      {
        key: 'live-tokens',
        label: 'Live Token',
        icon: 'ticket',
        permission: 'clinic:live-tokens',
      },
    ],
  },

  // ── Manage ───────────────────────────────────────────────────────────────
  {
    group: 'Manage',
    items: [
      {
        key: 'clinics',
        label: 'Clinics',
        icon: 'building',
        permission: 'manage:clinics',
      },
      {
        key: 'doctors',
        label: 'Doctors',
        icon: 'stethoscope',
        permission: 'manage:doctors',
      },
      {
        key: 'nurses',
        label: 'Nurses',
        icon: 'heart',
        permission: 'manage:nurses',
      },
      {
        key: 'frontdesk',
        label: 'Front desk',
        icon: 'user',
        permission: 'manage:frontdesk',
      },
      {
        key: 'patients',
        label: 'Patients',
        icon: 'users',
        permission: 'manage:patients',
      },
      {
        key: 'admin-users',
        label: 'Users',
        icon: 'shield',
        permission: 'manage:users',
      },
    ],
  },

  // ── Operations ───────────────────────────────────────────────────────────
  {
    group: 'Operations',
    items: [
      {
        key: 'pharmacy',
        label: 'Pharmacy',
        icon: 'pill',
        permission: 'ops:pharmacy',
      },
      {
        key: 'lab',
        label: 'Lab',
        icon: 'flask',
        permission: 'ops:lab',
      },
      {
        key: 'lab-billing',
        label: 'Lab Billing',
        icon: 'receipt',
        permission: 'ops:lab',
      },
      {
        key: 'billing',
        label: 'Clinic Billing',
        icon: 'receipt',
        permission: 'ops:billing',
      },
      {
        key: 'reports',
        label: 'Reports',
        icon: 'chart',
        permission: 'ops:reports',
      },
    ],
  },

  // ── System ───────────────────────────────────────────────────────────────
  {
    group: 'System',
    items: [
      {
        key: 'master-data',
        label: 'Master data',
        icon: 'database',
        permission: 'system:masterdata',
      },
    ],
  },

  // ── Account ──────────────────────────────────────────────────────────────
  {
    group: 'Account',
    items: [
      {
        key: 'support',
        label: 'Support tickets',
        icon: 'lifebuoy',
        permission: 'account:support',
      },
      {
        key: 'settings',
        label: 'Settings',
        icon: 'settings',
        permission: 'account:settings',
      },
    ],
  },
]
