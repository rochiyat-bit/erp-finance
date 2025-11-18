// Company Model
export interface Company {
  id: string;
  name: string;
  displayName: string;
  taxId: string;
  registrationNumber: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  website?: string;
  logo?: string;

  baseCurrency: string;
  fiscalYearStart: number;
  fiscalYearEnd: number;
  dateFormat: string;
  numberFormat: string;
  timeZone: string;

  subscriptionPlan: 'trial' | 'basic' | 'professional' | 'enterprise';
  subscriptionStatus: 'active' | 'suspended' | 'cancelled';
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
  maxUsers: number;
  maxTransactionsPerMonth: number;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// User Model
export interface User {
  id: string;
  companyId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  displayName: string;
  phone?: string;
  avatar?: string;

  role: 'super_admin' | 'admin' | 'manager' | 'accountant' | 'staff' | 'viewer';
  permissions: string[];

  status: 'active' | 'inactive' | 'suspended';
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  lastLoginAt?: Date;
  lastLoginIp?: string;

  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  passwordChangedAt?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;

  language: string;
  theme: 'light' | 'dark' | 'system';
  notificationPreferences: object;

  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

// Role Model
export interface Role {
  id: string;
  companyId: string;
  name: string;
  code: string;
  description?: string;
  permissions: string[];
  isSystemRole: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Permission Model
export interface Permission {
  id: string;
  module: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Audit Log Model
export interface AuditLog {
  id: string;
  companyId: string;
  userId: string;
  action: string;
  module: string;
  entityType?: string;
  entityId?: string;
  oldValues?: object;
  newValues?: object;
  metadata?: object;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed';
  errorMessage?: string;
  createdAt: Date;
}

// System Setting Model
export interface SystemSetting {
  id: string;
  companyId: string;
  category: string;
  key: string;
  value: string;
  dataType: 'string' | 'number' | 'boolean' | 'json' | 'date';
  description?: string;
  isEditable: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

// Number Sequence Model
export interface NumberSequence {
  id: string;
  companyId: string;
  module: string;
  documentType: string;
  prefix: string;
  suffix?: string;
  nextNumber: number;
  minDigits: number;
  resetPeriod: 'never' | 'yearly' | 'monthly' | 'daily';
  lastResetDate?: Date;
  format: string;
  example: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Currency Model
export interface Currency {
  id: string;
  companyId: string;
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isBaseCurrency: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Exchange Rate Model
export interface ExchangeRate {
  id: string;
  companyId: string;
  fromCurrencyCode: string;
  toCurrencyCode: string;
  rate: number;
  effectiveDate: Date;
  source: 'manual' | 'api' | 'system';
  createdAt: Date;
  createdBy: string;
}

// Fiscal Year Model
export interface FiscalYear {
  id: string;
  companyId: string;
  year: number;
  startDate: Date;
  endDate: Date;
  status: 'open' | 'closed' | 'locked';
  closedAt?: Date;
  closedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Fiscal Period Model
export interface FiscalPeriod {
  id: string;
  companyId: string;
  fiscalYearId: string;
  periodNumber: number;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'open' | 'closed' | 'locked';
  closedAt?: Date;
  closedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
