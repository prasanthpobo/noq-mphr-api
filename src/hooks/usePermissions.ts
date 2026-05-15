import { useAuthStore } from '@/store/auth'
import { ROLE_PERMISSIONS, type Role, type Permission } from '@/config/rbac'

export interface PermissionHook {
  /** Resolved role of the currently logged-in user */
  role: Role
  /** All permissions granted to this role */
  permissions: Permission[]
  /** Returns true if the user has the given permission */
  can: (permission: Permission) => boolean
  /** Returns true if the user has at least one of the given permissions */
  canAny: (permissions: Permission[]) => boolean
  /** Returns true if the user has ALL of the given permissions */
  canAll: (permissions: Permission[]) => boolean
  /** Returns true if the user's role matches any of the supplied roles */
  isRole: (...roles: Role[]) => boolean
}

export function usePermissions(): PermissionHook {
  const user = useAuthStore(s => s.user)
  const role = (user?.role ?? 'user') as Role
  const permissions: Permission[] = ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.user

  return {
    role,
    permissions,
    can:    (permission) => permissions.includes(permission),
    canAny: (perms)      => perms.some(p  => permissions.includes(p)),
    canAll: (perms)      => perms.every(p => permissions.includes(p)),
    isRole: (...roles)   => roles.includes(role),
  }
}
