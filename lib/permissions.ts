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

  // General Ledger - Chart of Accounts
  'gl.coa.view': 'View chart of accounts',
  'gl.coa.create': 'Create accounts',
  'gl.coa.edit': 'Edit accounts',
  'gl.coa.delete': 'Delete accounts',

  // General Ledger - Journal Entries
  'gl.je.view': 'View journal entries',
  'gl.je.create': 'Create journal entries',
  'gl.je.edit': 'Edit journal entries',
  'gl.je.delete': 'Delete journal entries',
  'gl.je.approve': 'Approve journal entries',
  'gl.je.post': 'Post journal entries',
  'gl.je.reverse': 'Reverse journal entries',

  // General Ledger - Reports
  'gl.reports.view': 'View GL reports',
  'gl.reports.export': 'Export GL reports',

  // General Ledger - Full Access
  'gl.*': 'Full access to General Ledger',

  // Accounts Payable - Vendors
  'ap.vendors.view': 'View vendors',
  'ap.vendors.create': 'Create vendors',
  'ap.vendors.edit': 'Edit vendors',
  'ap.vendors.delete': 'Delete vendors',
  'ap.vendors.block': 'Block/unblock vendors',

  // Accounts Payable - Bills
  'ap.bills.view': 'View bills',
  'ap.bills.create': 'Create bills',
  'ap.bills.edit': 'Edit bills',
  'ap.bills.delete': 'Delete bills',
  'ap.bills.approve': 'Approve bills',
  'ap.bills.post': 'Post bills to GL',
  'ap.bills.cancel': 'Cancel bills',

  // Accounts Payable - Payments
  'ap.payments.view': 'View payments',
  'ap.payments.create': 'Create payments',
  'ap.payments.edit': 'Edit payments',
  'ap.payments.delete': 'Delete payments',
  'ap.payments.approve': 'Approve payments',
  'ap.payments.post': 'Post payments to GL',
  'ap.payments.void': 'Void payments',

  // Accounts Payable - Reports
  'ap.reports.view': 'View AP reports',
  'ap.reports.export': 'Export AP reports',

  // Accounts Payable - Full Access
  'ap.*': 'Full access to Accounts Payable',

  // Accounts Receivable - Customers
  'ar.customers.view': 'View customers',
  'ar.customers.create': 'Create customers',
  'ar.customers.edit': 'Edit customers',
  'ar.customers.delete': 'Delete customers',
  'ar.customers.block': 'Block/unblock customers',

  // Accounts Receivable - Sales Orders
  'ar.sales_orders.view': 'View sales orders',
  'ar.sales_orders.create': 'Create sales orders',
  'ar.sales_orders.edit': 'Edit sales orders',
  'ar.sales_orders.delete': 'Delete sales orders',
  'ar.sales_orders.approve': 'Approve sales orders',
  'ar.sales_orders.confirm': 'Confirm sales orders',
  'ar.sales_orders.cancel': 'Cancel sales orders',

  // Accounts Receivable - Invoices
  'ar.invoices.view': 'View invoices',
  'ar.invoices.create': 'Create invoices',
  'ar.invoices.edit': 'Edit invoices',
  'ar.invoices.delete': 'Delete invoices',
  'ar.invoices.approve': 'Approve invoices',
  'ar.invoices.post': 'Post invoices to GL',
  'ar.invoices.void': 'Void invoices',
  'ar.invoices.send': 'Send invoices to customers',

  // Accounts Receivable - Payments
  'ar.payments.view': 'View customer payments',
  'ar.payments.create': 'Create customer payments',
  'ar.payments.edit': 'Edit customer payments',
  'ar.payments.delete': 'Delete customer payments',
  'ar.payments.approve': 'Approve customer payments',
  'ar.payments.post': 'Post customer payments to GL',
  'ar.payments.void': 'Void customer payments',

  // Accounts Receivable - Reports
  'ar.reports.view': 'View AR reports',
  'ar.reports.export': 'Export AR reports',

  // Accounts Receivable - Full Access
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
    'ap.*',
    'ar.*',
  ],
  staff: [
    'company.view',
    'gl.coa.view',
    'gl.je.view',
    'ap.vendors.view',
    'ap.bills.view',
    'ap.payments.view',
    'ar.customers.view',
    'ar.sales_orders.view',
    'ar.invoices.view',
    'ar.payments.view',
  ],
  viewer: [
    'company.view',
    'gl.coa.view',
    'gl.je.view',
    'ap.vendors.view',
    'ap.bills.view',
    'ap.payments.view',
    'ar.customers.view',
    'ar.sales_orders.view',
    'ar.invoices.view',
    'ar.payments.view',
    'audit_logs.view',
  ],
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
