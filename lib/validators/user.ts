import { z } from 'zod';

// Create user validation
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['super_admin', 'admin', 'manager', 'accountant', 'staff', 'viewer']),
  permissions: z.array(z.string()).optional(),
  phone: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// Update user validation
export const updateUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  role: z.enum(['super_admin', 'admin', 'manager', 'accountant', 'staff', 'viewer']).optional(),
  permissions: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  phone: z.string().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// List users query validation
export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  role: z.enum(['super_admin', 'admin', 'manager', 'accountant', 'staff', 'viewer']).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

// Reset password validation
export const resetUserPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type ResetUserPasswordInput = z.infer<typeof resetUserPasswordSchema>;
