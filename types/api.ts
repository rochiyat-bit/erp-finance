import { User, Company, Role, Permission, AuditLog, SystemSetting, Currency, ExchangeRate, FiscalYear, FiscalPeriod } from './models';

// Generic API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    field?: string;
    details?: any;
  };
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Auth API Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user: Omit<User, 'password'>;
  token: string;
}

export interface RegisterRequest {
  company: {
    name: string;
    email: string;
    phone: string;
    taxId: string;
    baseCurrency: string;
  };
  user: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  company: Company;
  user: Omit<User, 'password'>;
  token: string;
}

// User API Types
export interface ListUsersParams extends PaginationParams {
  search?: string;
  role?: string;
  status?: string;
}

export interface ListUsersResponse {
  success: boolean;
  users: Omit<User, 'password'>[];
  pagination: PaginationResponse;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions?: string[];
}

// Audit Log API Types
export interface ListAuditLogsParams extends PaginationParams {
  userId?: string;
  module?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

export interface ListAuditLogsResponse {
  success: boolean;
  logs: AuditLog[];
  pagination: PaginationResponse;
}

// Currency API Types
export interface CreateCurrencyRequest {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
}

// Exchange Rate API Types
export interface CreateExchangeRateRequest {
  fromCurrencyCode: string;
  toCurrencyCode: string;
  rate: number;
  effectiveDate: string;
  source?: string;
}

// Fiscal Year API Types
export interface CreateFiscalYearRequest {
  year: number;
  startDate: string;
  endDate: string;
}

export interface CreateFiscalYearResponse {
  success: boolean;
  fiscalYear: FiscalYear;
  fiscalPeriods: FiscalPeriod[];
}
