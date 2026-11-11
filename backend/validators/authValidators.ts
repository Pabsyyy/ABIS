import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().trim().min(3, 'Username must be at least 3 characters').max(64),
  password: z.string().min(1, 'Password is required').max(128),
});

export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(64)
    .regex(/^[a-z0-9._-]+$/, 'Username may only contain lowercase letters, numbers, dots, underscores and dashes'),
  fullName: z.string().trim().min(1, 'Full name is required').max(128),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  role: z.enum(['resident', 'secretary', 'treasurer', 'captain', 'other']),
  residentRef: z.string().trim().regex(/^[0-9a-fA-F]{24}$/, 'Invalid resident reference').optional(),
});

export const updateUserSchema = z.object({
  fullName: z.string().trim().min(1).max(128).optional(),
  role: z.enum(['resident', 'secretary', 'treasurer', 'captain', 'other']).optional(),
  isActive: z.boolean().optional(),
  residentRef: z.string().trim().regex(/^[0-9a-fA-F]{24}$/, 'Invalid resident reference').nullish(),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(128),
});
