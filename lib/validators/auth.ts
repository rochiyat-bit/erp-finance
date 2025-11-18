import { z } from 'zod';

// Password validation schema
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Login validation
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Registration validation
export const registerSchema = z.object({
  company: z.object({
    name: z.string().min(2, 'Company name must be at least 2 characters'),
    email: z.string().email('Invalid company email address'),
    phone: z.string().min(5, 'Phone number must be at least 5 characters'),
    taxId: z.string().min(3, 'Tax ID is required'),
    baseCurrency: z
      .string()
      .length(3, 'Currency code must be 3 characters')
      .toUpperCase(),
  }),
  user: z.object({
    email: z.string().email('Invalid email address'),
    password: passwordSchema,
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Forgot password validation
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// Reset password validation
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Change password validation
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// Update profile validation
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  phone: z.string().min(5, 'Phone number must be at least 5 characters').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
  language: z.string().length(2, 'Language code must be 2 characters').optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
