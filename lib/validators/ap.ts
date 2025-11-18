import { z } from 'zod';

// Vendor Validators
export const createVendorSchema = z.object({
  vendorName: z.string().min(1, 'Vendor name is required').max(255),
  vendorType: z.enum(['individual', 'company', 'government']).default('company'),
  taxId: z.string().optional(),
  registrationNumber: z.string().optional(),

  // Contact
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),

  // Billing Address
  billingAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCountry: z.string().optional(),

  // Shipping Address
  shippingAddress: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingPostalCode: z.string().optional(),
  shippingCountry: z.string().optional(),

  // Financial Settings
  currencyCode: z.string().length(3).default('USD'),
  paymentTerms: z.string().default('Net 30'),
  paymentTermDays: z.number().int().min(0).default(30),
  earlyPaymentDiscount: z.number().min(0).max(100).default(0),
  creditLimit: z.number().min(0).default(0),

  // Account Settings
  apAccountId: z.string().uuid().optional(),
  expenseAccountId: z.string().uuid().optional(),

  // Banking
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankSwiftCode: z.string().optional(),
  bankIban: z.string().optional(),

  // Tax
  isTaxExempt: z.boolean().default(false),
  taxExemptNumber: z.string().optional(),
  taxCategory: z.string().optional(),

  // Additional
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const updateVendorSchema = createVendorSchema.partial();

export const listVendorsQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default('50'),
  status: z.enum(['active', 'inactive', 'blocked']).optional(),
  search: z.string().optional(),
  vendorType: z.enum(['individual', 'company', 'government']).optional(),
});

// Bill Validators
export const billLineSchema = z.object({
  itemType: z.enum(['goods', 'service', 'expense']).default('expense'),
  itemCode: z.string().optional(),
  itemName: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  expenseAccountId: z.string().uuid('Invalid expense account ID'),
  quantity: z.number().positive('Quantity must be positive'),
  unitOfMeasure: z.string().default('EA'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  taxCode: z.string().optional(),
  taxRate: z.number().min(0).max(100).default(0),
  discountPercent: z.number().min(0).max(100).default(0),
  costCenterId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const createBillSchema = z.object({
  vendorId: z.string().uuid('Invalid vendor ID'),
  vendorInvoiceNumber: z.string().min(1, 'Vendor invoice number is required'),
  referenceNumber: z.string().optional(),
  purchaseOrderId: z.string().uuid().optional(),
  documentType: z.enum(['standard', 'credit_note', 'debit_note', 'prepayment']).default('standard'),
  billDate: z.string().or(z.date()),
  dueDate: z.string().or(z.date()),
  receivedDate: z.string().or(z.date()).optional(),
  currencyCode: z.string().length(3).default('USD'),
  exchangeRate: z.number().positive().default(1),
  apAccountId: z.string().uuid('Invalid AP account ID'),
  lines: z.array(billLineSchema).min(1, 'At least one line item is required'),

  // Optional amounts (can be calculated from lines)
  subtotalAmount: z.number().min(0).optional(),
  taxAmount: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  shippingAmount: z.number().min(0).default(0),
  otherCharges: z.number().min(0).default(0),

  requiresApproval: z.boolean().default(false),
  paymentTerms: z.string().optional(),
  paymentTermDays: z.number().int().min(0).optional(),
  earlyPaymentDiscount: z.number().min(0).max(100).default(0),

  description: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  autoPost: z.boolean().default(false),
});

export const updateBillSchema = createBillSchema.partial().extend({
  billId: z.string().uuid(),
});

export const listBillsQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default('50'),
  status: z.enum(['draft', 'pending_approval', 'approved', 'posted', 'partially_paid', 'paid', 'overdue', 'cancelled']).optional(),
  vendorId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  documentType: z.enum(['standard', 'credit_note', 'debit_note', 'prepayment']).optional(),
  overdue: z.string().transform(Boolean).optional(),
});

// Payment Validators
export const paymentAllocationSchema = z.object({
  billId: z.string().uuid('Invalid bill ID'),
  allocationAmount: z.number().positive('Allocation amount must be positive'),
  discountTaken: z.number().min(0).default(0),
  writeOffAmount: z.number().min(0).default(0),
  discountAccountId: z.string().uuid().optional(),
  writeOffAccountId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const createPaymentSchema = z.object({
  vendorId: z.string().uuid('Invalid vendor ID'),
  referenceNumber: z.string().optional(),
  checkNumber: z.string().optional(),
  paymentDate: z.string().or(z.date()),
  paymentMethod: z.enum(['check', 'bank_transfer', 'cash', 'credit_card', 'debit_card', 'online', 'other']).default('bank_transfer'),
  currencyCode: z.string().length(3).default('USD'),
  exchangeRate: z.number().positive().default(1),
  paymentAmount: z.number().positive('Payment amount must be positive'),
  bankAccountId: z.string().uuid('Invalid bank account ID'),
  apAccountId: z.string().uuid('Invalid AP account ID'),

  // Payment allocations
  allocations: z.array(paymentAllocationSchema).optional(),

  requiresApproval: z.boolean().default(false),
  description: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),

  payeeName: z.string().min(1, 'Payee name is required'),
  payeeAddress: z.string().optional(),

  autoPost: z.boolean().default(false),
}).refine((data) => {
  if (data.allocations && data.allocations.length > 0) {
    const totalAllocated = data.allocations.reduce(
      (sum, alloc) => sum + alloc.allocationAmount + alloc.discountTaken + alloc.writeOffAmount,
      0
    );
    return totalAllocated <= data.paymentAmount;
  }
  return true;
}, {
  message: 'Total allocated amount cannot exceed payment amount',
  path: ['allocations'],
});

export const updatePaymentSchema = createPaymentSchema.partial().extend({
  paymentId: z.string().uuid(),
});

export const listPaymentsQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default('50'),
  status: z.enum(['draft', 'pending', 'approved', 'posted', 'cleared', 'cancelled', 'voided']).optional(),
  vendorId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  paymentMethod: z.enum(['check', 'bank_transfer', 'cash', 'credit_card', 'debit_card', 'online', 'other']).optional(),
  uncleared: z.string().transform(Boolean).optional(),
});

// Vendor Ledger Query
export const vendorLedgerQuerySchema = z.object({
  vendorId: z.string().uuid('Invalid vendor ID'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  includeDetails: z.string().transform(Boolean).default('true'),
});

// Aging Report Query
export const agingReportQuerySchema = z.object({
  vendorId: z.string().uuid().optional(),
  asOfDate: z.string().or(z.date()).optional(),
  groupBy: z.enum(['vendor', 'bill']).default('vendor'),
});
