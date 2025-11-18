import { z } from 'zod';

// Chart of Account validation
export const createAccountSchema = z.object({
  code: z.string().min(1, 'Account code is required').max(50),
  name: z.string().min(1, 'Account name is required').max(255),
  description: z.string().optional(),
  accountType: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
  accountSubType: z.string().min(1, 'Account sub-type is required'),
  category: z.string().min(1, 'Category is required'),
  normalBalance: z.enum(['debit', 'credit']),
  parentAccountId: z.string().uuid().optional(),
  currencyCode: z.string().length(3).optional(),
  allowMultiCurrency: z.boolean().optional().default(false),
  allowManualEntry: z.boolean().optional().default(true),
  isHeader: z.boolean().optional().default(false),
  openingBalance: z.number().optional().default(0),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;

export const updateAccountSchema = createAccountSchema.partial();

export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

// Journal Entry Line validation
const journalEntryLineSchema = z.object({
  accountId: z.string().uuid('Invalid account ID'),
  debitAmount: z.number().min(0, 'Debit amount must be non-negative').default(0),
  creditAmount: z.number().min(0, 'Credit amount must be non-negative').default(0),
  description: z.string().optional(),
  currencyCode: z.string().length(3).optional(),
  exchangeRate: z.number().positive().optional(),
}).refine(
  (data) => {
    // Either debit or credit must be > 0, but not both
    return (data.debitAmount > 0 && data.creditAmount === 0) ||
           (data.creditAmount > 0 && data.debitAmount === 0);
  },
  {
    message: 'Each line must have either a debit OR credit amount (not both)',
  }
);

// Journal Entry validation
export const createJournalEntrySchema = z.object({
  documentType: z.enum(['manual', 'system', 'recurring', 'reversing', 'closing']).optional().default('manual'),
  transactionDate: z.string().or(z.date()),
  description: z.string().min(1, 'Description is required'),
  currencyCode: z.string().length(3, 'Currency code must be 3 characters'),
  exchangeRate: z.number().positive().optional().default(1),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(journalEntryLineSchema).min(2, 'At least 2 lines are required'),
  requiresApproval: z.boolean().optional().default(false),
  autoPost: z.boolean().optional().default(false),
}).refine(
  (data) => {
    // Total debits must equal total credits
    const totalDebit = data.lines.reduce((sum, line) => sum + line.debitAmount, 0);
    const totalCredit = data.lines.reduce((sum, line) => sum + line.creditAmount, 0);
    const difference = Math.abs(totalDebit - totalCredit);
    return difference < 0.01; // Allow for rounding errors
  },
  {
    message: 'Total debits must equal total credits',
    path: ['lines'],
  }
);

export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;

export const updateJournalEntrySchema = createJournalEntrySchema.partial();

export type UpdateJournalEntryInput = z.infer<typeof updateJournalEntrySchema>;

// Journal Entry approval/rejection
export const approveJournalEntrySchema = z.object({
  notes: z.string().optional(),
});

export const rejectJournalEntrySchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required'),
});

// Journal Entry reversal
export const reverseJournalEntrySchema = z.object({
  reversalDate: z.string().or(z.date()),
  description: z.string().optional(),
});

export type ReverseJournalEntryInput = z.infer<typeof reverseJournalEntrySchema>;

// Journal Entry Template validation
export const createTemplateSchema = z.object({
  code: z.string().min(1, 'Template code is required'),
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  lines: z.array(z.object({
    lineNumber: z.number().int().positive(),
    accountId: z.string().uuid(),
    accountCode: z.string(),
    description: z.string(),
    debitFormula: z.string().optional(),
    creditFormula: z.string().optional(),
    isVariable: z.boolean(),
  })).min(2, 'At least 2 lines are required'),
  defaultDescription: z.string().min(1, 'Default description is required'),
  requiresApproval: z.boolean().optional().default(false),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

// Use template validation
export const useTemplateSchema = z.object({
  transactionDate: z.string().or(z.date()),
  description: z.string().optional(),
  values: z.record(z.string(), z.number()).optional(),
});

export type UseTemplateInput = z.infer<typeof useTemplateSchema>;

// Query validations
export const listAccountsQuerySchema = z.object({
  includeInactive: z.coerce.boolean().optional().default(false),
  accountType: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']).optional(),
  parentAccountId: z.string().uuid().optional(),
  search: z.string().optional(),
  hierarchical: z.coerce.boolean().optional().default(false),
});

export type ListAccountsQuery = z.infer<typeof listAccountsQuerySchema>;

export const listJournalEntriesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  status: z.enum(['draft', 'pending_approval', 'approved', 'posted', 'rejected', 'reversed']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  fiscalPeriodId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  search: z.string().optional(),
  documentType: z.enum(['manual', 'system', 'recurring', 'reversing', 'closing']).optional(),
});

export type ListJournalEntriesQuery = z.infer<typeof listJournalEntriesQuerySchema>;
