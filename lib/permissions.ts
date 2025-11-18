import { User } from '@/types/models';

// Permission definitions
export const PERMISSIONS = {
  // User Management
  'users.view': 'View users',
  'users.create': 'Create users',
  'users.edit': 'Edit users',
  'users.delete': 'Delete users',
  'users.manage_roles': 'Manage user roles',

  // Role Management
  'roles.view': 'View roles',
  'roles.create': 'Create custom roles',
  'roles.edit': 'Edit custom roles',
  'roles.delete': 'Delete custom roles',

  // Company Management
  'company.view': 'View company details',
  'company.edit': 'Edit company settings',

  // Settings
  'settings.view': 'View system settings',
  'settings.edit': 'Edit system settings',

  // Audit Logs
  'audit_logs.view': 'View audit logs',
  'audit_logs.export': 'Export audit logs',

  // Currency Management
  'currencies.view': 'View currencies',
  'currencies.manage': 'Manage currencies',
  'exchange_rates.manage': 'Manage exchange rates',

  // Fiscal Year Management
  'fiscal_years.view': 'View fiscal years',
  'fiscal_years.create': 'Create fiscal years',
  'fiscal_years.close': 'Close fiscal years',

  // Future modules (placeholder)
  'gl.*': 'Full access to General Ledger',
  'ap.*': 'Full access to Accounts Payable',
  'ar.*': 'Full access to Accounts Receivable',
} as const;

// System roles with their permissions
export const SYSTEM_ROLES = {
  super_admin: ['*'], // All permissions
  admin: [
    'users.*',
    'roles.*',
    'company.*',
    'settings.*',
    'audit_logs.*',
    'currencies.*',
    'fiscal_years.*',
  ],
  manager: [
    'users.view',
    'company.view',
    'settings.view',
    'audit_logs.view',
    'currencies.view',
    'fiscal_years.view',
    'gl.*',
    'ap.*',
    'ar.*',
  ],
  accountant: [
    'company.view',
    'settings.view',
    'currencies.view',
    'fiscal_years.view',
    'gl.*',
    'ap.view',
    'ar.view',
  ],
  staff: ['company.view', 'gl.view', 'ap.view', 'ar.view'],
  viewer: ['company.view', 'gl.view', 'ap.view', 'ar.view', 'audit_logs.view'],
};

// Permission checking utilities
export function hasPermission(user: Partial<User>, permissionCode: string): boolean {
  if (!user || !user.permissions) return false;

  // Super admin has all permissions
  if (user.role === 'super_admin') return true;

  // Check if user has wildcard permission
  if (user.permissions.includes('*')) return true;

  // Check for exact match
  if (user.permissions.includes(permissionCode)) return true;

  // Check for wildcard module permissions (e.g., users.* for users.view)
  const parts = permissionCode.split('.');
  if (parts.length === 2) {
    const wildcardPermission = `${parts[0]}.*`;
    if (user.permissions.includes(wildcardPermission)) return true;
  }

  return false;
}

export function hasAnyPermission(user: Partial<User>, permissionCodes: string[]): boolean {
  return permissionCodes.some((code) => hasPermission(user, code));
}

export function hasAllPermissions(user: Partial<User>, permissionCodes: string[]): boolean {
  return permissionCodes.every((code) => hasPermission(user, code));
}

export function isAdmin(user: Partial<User>): boolean {
  return user.role === 'super_admin' || user.role === 'admin';
}

export function expandWildcardPermissions(permissions: string[]): string[] {
  const expanded: string[] = [];

  for (const permission of permissions) {
    if (permission === '*') {
      // Add all permissions
      return Object.keys(PERMISSIONS);
    } else if (permission.endsWith('.*')) {
      // Expand module wildcard
      const module = permission.slice(0, -2);
      const modulePermissions = Object.keys(PERMISSIONS).filter((p) =>
        p.startsWith(`${module}.`)
      );
      expanded.push(...modulePermissions);
    } else {
      expanded.push(permission);
    }
  }

  return [...new Set(expanded)]; // Remove duplicates
}
