import { z } from 'zod';

// Customer Validators
export const createCustomerSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').max(255),
  legalName: z.string().min(1, 'Legal name is required').max(255),
  displayName: z.string().min(1, 'Display name is required').max(255),
  businessType: z.enum(['individual', 'company', 'government']).default('company'),
  taxId: z.string().optional(),
  registrationNumber: z.string().optional(),
  industryType: z.string().optional(),

  // Contact Information
  email: z.string().email('Invalid email format'),
  phone: z.string().min(1, 'Phone is required'),
  fax: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),

  // Primary Contact
  contactPersonName: z.string().optional(),
  contactPersonEmail: z.string().email().optional().or(z.literal('')),
  contactPersonPhone: z.string().optional(),
  contactPersonPosition: z.string().optional(),

  // Billing Address
  billingAddressLine1: z.string().min(1, 'Billing address is required'),
  billingAddressLine2: z.string().optional(),
  billingCity: z.string().min(1, 'Billing city is required'),
  billingState: z.string().min(1, 'Billing state is required'),
  billingCountry: z.string().min(1, 'Billing country is required'),
  billingPostalCode: z.string().min(1, 'Billing postal code is required'),

  // Shipping Address
  sameAsBillingAddress: z.boolean().default(true),
  shippingAddressLine1: z.string().optional(),
  shippingAddressLine2: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingCountry: z.string().optional(),
  shippingPostalCode: z.string().optional(),

  // Financial Settings
  currencyCode: z.string().length(3).default('USD'),
  paymentTerms: z.string().default('Net 30'),
  paymentTermDays: z.number().int().min(0).default(30),
  creditLimit: z.number().min(0).default(0),

  // GL Accounts
  defaultARAccountId: z.string().uuid('Invalid AR account ID'),
  defaultRevenueAccountId: z.string().uuid().optional(),

  // Banking
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankBranch: z.string().optional(),

  // Tax Settings
  isTaxable: z.boolean().default(true),
  taxRegistrationNumber: z.string().optional(),
  defaultTaxRate: z.number().min(0).max(100).default(0),
  taxExemptReason: z.string().optional(),

  // Classification
  customerType: z.enum(['retail', 'wholesale', 'corporate']).default('retail'),
  customerCategory: z.string().optional(),
  customerGroup: z.string().optional(),
  salesPersonId: z.string().uuid().optional(),

  // Settings
  isKeyAccount: z.boolean().default(false),
  allowCreditSales: z.boolean().default(true),
  autoEmailInvoices: z.boolean().default(false),
  autoEmailStatements: z.boolean().default(false),

  // Pricing
  discountPercent: z.number().min(0).max(100).default(0),

  // Additional
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const listCustomersQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default('50'),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'blocked']).optional(),
  customerType: z.enum(['retail', 'wholesale', 'corporate']).optional(),
  customerCategory: z.string().optional(),
  sortBy: z.enum(['name', 'code', 'balance', 'lastSale']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Sales Order Validators
export const salesOrderLineSchema = z.object({
  itemCode: z.string().optional(),
  itemName: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().default('EA'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  discountPercent: z.number().min(0).max(100).default(0),
  taxPercent: z.number().min(0).max(100).default(0),
  revenueAccountId: z.string().uuid().optional(),
  requestedDeliveryDate: z.string().or(z.date()).optional(),
  notes: z.string().optional(),
});

export const createSalesOrderSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  soDate: z.string().or(z.date()),
  expectedDeliveryDate: z.string().or(z.date()).optional(),
  customerPONumber: z.string().optional(),
  referenceNumber: z.string().optional(),
  currencyCode: z.string().length(3).default('USD'),
  exchangeRate: z.number().positive().default(1),
  paymentTerms: z.string().optional(),
  paymentTermDays: z.number().int().min(0).optional(),

  lines: z.array(salesOrderLineSchema).min(1, 'At least one line item is required'),

  shippingAmount: z.number().min(0).default(0),
  otherCharges: z.number().min(0).default(0),
  discountPercent: z.number().min(0).max(100).default(0),

  requiresApproval: z.boolean().default(false),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  terms: z.string().optional(),
});

export const updateSalesOrderSchema = createSalesOrderSchema.partial().extend({
  soId: z.string().uuid(),
});

export const listSalesOrdersQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default('50'),
  status: z.enum(['draft', 'pending_approval', 'approved', 'confirmed', 'partial_delivered', 'delivered', 'invoiced', 'closed', 'cancelled']).optional(),
  customerId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
});

// Invoice Validators
export const invoiceLineSchema = z.object({
  itemCode: z.string().optional(),
  itemName: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().default('EA'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  discountPercent: z.number().min(0).max(100).default(0),
  taxPercent: z.number().min(0).max(100).default(0),
  revenueAccountId: z.string().uuid('Invalid revenue account ID'),
  salesOrderLineId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const createInvoiceSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  invoiceDate: z.string().or(z.date()),
  dueDate: z.string().or(z.date()),
  salesOrderId: z.string().uuid().optional(),
  customerPONumber: z.string().optional(),
  referenceNumber: z.string().optional(),

  currencyCode: z.string().length(3).default('USD'),
  exchangeRate: z.number().positive().default(1),
  paymentTerms: z.string().optional(),
  paymentTermDays: z.number().int().min(0).optional(),

  lines: z.array(invoiceLineSchema).min(1, 'At least one line item is required'),

  taxAmount: z.number().min(0).default(0),
  shippingAmount: z.number().min(0).default(0),
  otherCharges: z.number().min(0).default(0),
  discountPercent: z.number().min(0).max(100).default(0),

  requiresApproval: z.boolean().default(false),
  description: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  terms: z.string().optional(),

  autoPost: z.boolean().default(false),
});

export const updateInvoiceSchema = createInvoiceSchema.partial().extend({
  invoiceId: z.string().uuid(),
});

export const listInvoicesQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default('50'),
  status: z.enum(['draft', 'pending_approval', 'approved', 'sent', 'void']).optional(),
  paymentStatus: z.enum(['unpaid', 'partial', 'paid', 'overpaid']).optional(),
  customerId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  overdue: z.string().transform(Boolean).optional(),
});

// Customer Payment Validators
export const paymentAllocationSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID'),
  allocatedAmount: z.number().positive('Allocation amount must be positive'),
  discountGiven: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export const createCustomerPaymentSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  paymentDate: z.string().or(z.date()),
  paymentMethod: z.enum(['cash', 'check', 'bank_transfer', 'credit_card', 'debit_card', 'e_wallet', 'other']).default('bank_transfer'),
  paymentAmount: z.number().positive('Payment amount must be positive'),

  currencyCode: z.string().length(3).default('USD'),
  exchangeRate: z.number().positive().default(1),

  bankAccountId: z.string().uuid().optional(),
  checkNumber: z.string().optional(),
  transactionId: z.string().optional(),
  referenceNumber: z.string().optional(),

  // Allocations
  allocations: z.array(paymentAllocationSchema).optional(),

  description: z.string().optional(),
  notes: z.string().optional(),

  autoPost: z.boolean().default(false),
}).refine((data) => {
  if (data.allocations && data.allocations.length > 0) {
    const totalAllocated = data.allocations.reduce(
      (sum, alloc) => sum + alloc.allocatedAmount + alloc.discountGiven,
      0
    );
    return totalAllocated <= data.paymentAmount;
  }
  return true;
}, {
  message: 'Total allocated amount cannot exceed payment amount',
  path: ['allocations'],
});

export const updateCustomerPaymentSchema = createCustomerPaymentSchema.partial().extend({
  paymentId: z.string().uuid(),
});

export const listCustomerPaymentsQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default('50'),
  status: z.enum(['draft', 'approved', 'posted', 'void', 'reconciled']).optional(),
  customerId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  paymentMethod: z.enum(['cash', 'check', 'bank_transfer', 'credit_card', 'debit_card', 'e_wallet', 'other']).optional(),
});

// Customer Ledger Query
export const customerLedgerQuerySchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  transactionType: z.enum(['invoice', 'payment', 'credit', 'debit']).optional(),
  includeDetails: z.string().transform(Boolean).default('true'),
});

// Aging Report Query
export const agingReportQuerySchema = z.object({
  customerId: z.string().uuid().optional(),
  asOfDate: z.string().or(z.date()).optional(),
  agingMethod: z.enum(['due_date', 'invoice_date']).default('due_date'),
});
