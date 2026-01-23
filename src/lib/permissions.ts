import { UserRole } from '@/types/auth';

// Define all resources and actions in the system
export const RESOURCES = {
  DASHBOARD: 'dashboard',
  VEHICLES: 'vehicles',
  DRIVERS: 'drivers',
  TRIPS: 'trips',
  MAINTENANCE: 'maintenance',
  DOCUMENTS: 'documents',
  COMPANIES: 'companies',
  USERS: 'users',
  SETTINGS: 'settings',
  REPORTS: 'reports',
  ANALYTICS: 'analytics',
  SECURITY: 'security',
  ADVERTISEMENTS: 'advertisements',
  INTEGRATIONS: 'integrations',
  NOTIFICATIONS: 'notifications',
} as const;

export const ACTIONS = {
  VIEW: 'view',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
  APPROVE: 'approve',
  EXPORT: 'export',
} as const;

export type Resource = typeof RESOURCES[keyof typeof RESOURCES];
export type Action = typeof ACTIONS[keyof typeof ACTIONS];

// Role hierarchy - higher roles inherit all permissions from lower roles
const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 100,
  company_admin: 80,
  supervisor: 50,
  driver: 10,
};

// Base permissions for each role (not inherited)
const BASE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: [
    // Super admin has ALL permissions - full system access
    '*:*', // Wildcard for all resources and actions
  ],
  company_admin: [
    // Company admin has full access within their company
    '*:*', // Full access to all resources
  ],
  supervisor: [
    `${RESOURCES.DASHBOARD}:${ACTIONS.VIEW}`,
    `${RESOURCES.VEHICLES}:${ACTIONS.VIEW}`,
    `${RESOURCES.VEHICLES}:${ACTIONS.UPDATE}`,
    `${RESOURCES.DRIVERS}:${ACTIONS.VIEW}`,
    `${RESOURCES.DRIVERS}:${ACTIONS.CREATE}`,
    `${RESOURCES.DRIVERS}:${ACTIONS.UPDATE}`,
    `${RESOURCES.TRIPS}:${ACTIONS.VIEW}`,
    `${RESOURCES.TRIPS}:${ACTIONS.CREATE}`,
    `${RESOURCES.TRIPS}:${ACTIONS.UPDATE}`,
    `${RESOURCES.TRIPS}:${ACTIONS.APPROVE}`,
    `${RESOURCES.MAINTENANCE}:${ACTIONS.VIEW}`,
    `${RESOURCES.MAINTENANCE}:${ACTIONS.CREATE}`,
    `${RESOURCES.DOCUMENTS}:${ACTIONS.VIEW}`,
    `${RESOURCES.DOCUMENTS}:${ACTIONS.CREATE}`,
    `${RESOURCES.DOCUMENTS}:${ACTIONS.UPDATE}`,
    `${RESOURCES.REPORTS}:${ACTIONS.VIEW}`,
    `${RESOURCES.REPORTS}:${ACTIONS.EXPORT}`,
    `${RESOURCES.ANALYTICS}:${ACTIONS.VIEW}`,
    `${RESOURCES.NOTIFICATIONS}:${ACTIONS.VIEW}`,
    `${RESOURCES.NOTIFICATIONS}:${ACTIONS.MANAGE}`,
  ],
  driver: [
    `${RESOURCES.DASHBOARD}:${ACTIONS.VIEW}`,
    `${RESOURCES.VEHICLES}:${ACTIONS.VIEW}`,
    `${RESOURCES.TRIPS}:${ACTIONS.VIEW}`,
    `${RESOURCES.TRIPS}:${ACTIONS.CREATE}`,
    `${RESOURCES.DOCUMENTS}:${ACTIONS.VIEW}`,
    `${RESOURCES.DOCUMENTS}:${ACTIONS.CREATE}`,
    `${RESOURCES.NOTIFICATIONS}:${ACTIONS.VIEW}`,
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole | null | undefined, resource: Resource | string, action: Action | string): boolean {
  if (!role) return false;
  
  const permissions = getPermissionsForRole(role);
  const permissionKey = `${resource}:${action}`;
  
  // Check for wildcard permission (super_admin and company_admin have this)
  if (permissions.includes('*:*')) {
    return true;
  }
  
  // Check for resource-level wildcard
  if (permissions.includes(`${resource}:*`)) {
    return true;
  }
  
  // Check for specific permission
  return permissions.includes(permissionKey);
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: UserRole): string[] {
  return BASE_PERMISSIONS[role] || [];
}

/**
 * Check if a role is admin level or above
 */
export function isAdminRole(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return role === 'super_admin' || role === 'company_admin';
}

/**
 * Check if a role is super admin
 */
export function isSuperAdmin(role: UserRole | null | undefined): boolean {
  return role === 'super_admin';
}

/**
 * Get the role hierarchy level
 */
export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY[role] || 0;
}

/**
 * Check if one role is higher than another
 */
export function isRoleHigherThan(role1: UserRole, role2: UserRole): boolean {
  return getRoleLevel(role1) > getRoleLevel(role2);
}

/**
 * Check if user can manage another user based on role hierarchy
 */
export function canManageUser(managerRole: UserRole | null | undefined, targetRole: UserRole): boolean {
  if (!managerRole) return false;
  
  // Super admin can manage everyone
  if (managerRole === 'super_admin') return true;
  
  // Company admin can manage everyone except super admin
  if (managerRole === 'company_admin' && targetRole !== 'super_admin') return true;
  
  return false;
}

/**
 * Get display name for a role
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    company_admin: 'Company Admin',
    supervisor: 'Supervisor',
    driver: 'Driver',
  };
  return displayNames[role] || role;
}

/**
 * Get all available roles (for dropdowns, etc.)
 */
export function getAllRoles(): UserRole[] {
  return ['super_admin', 'company_admin', 'supervisor', 'driver'];
}

/**
 * Get roles that a user with the given role can assign
 */
export function getAssignableRoles(currentRole: UserRole | null | undefined): UserRole[] {
  if (!currentRole) return [];
  
  switch (currentRole) {
    case 'super_admin':
      return ['super_admin', 'company_admin', 'supervisor', 'driver'];
    case 'company_admin':
      return ['company_admin', 'supervisor', 'driver'];
    default:
      return [];
  }
}
