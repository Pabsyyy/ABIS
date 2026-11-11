import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const certificateTypeCreateSchema = z.object({
  name: z.string().trim().min(1).max(128),
  description: z.string().trim().max(512).optional().or(z.literal('')),
  fee: z.coerce.number().min(0).default(0),
  requiresApproval: z.boolean().default(true),
  templateKey: z.string().trim().max(64).default('generic'),
  active: z.boolean().default(true),
});

export const certificateTypeUpdateSchema = certificateTypeCreateSchema.partial();

export const requestCreateSchema = z.object({
  resident: objectId,
  certificateType: objectId,
  purpose: z.string().trim().min(3, 'Purpose is required').max(512),
  notes: z.string().trim().max(1024).optional().or(z.literal('')),
});

export const requestRejectSchema = z.object({
  reason: z.string().trim().min(3, 'A rejection reason is required').max(512),
});

export const requestReleaseSchema = z.object({
  releasedTo: z.string().trim().min(1).max(256).default('Resident'),
});

export const requestCancelSchema = z.object({
  reason: z.string().trim().max(512).optional().or(z.literal('')),
});

export const paymentRecordSchema = z.object({
  amount: z.coerce.number().min(0),
  orNumber: z.string().trim().max(64).optional().or(z.literal('')),
  paymentStatus: z.enum(['unpaid', 'paid', 'waived']).default('paid'),
});
