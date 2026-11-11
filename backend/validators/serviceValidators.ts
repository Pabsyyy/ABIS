import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const serviceCategoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(128),
  description: z.string().trim().max(512).optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export const serviceCategoryUpdateSchema = serviceCategoryCreateSchema.partial();

export const serviceRecordCreateSchema = z.object({
  resident: objectId,
  category: objectId,
  serviceDate: z.coerce.date().default(() => new Date()),
  description: z.string().trim().min(3, 'Description is required').max(2048),
  beneficiaryInfo: z.string().trim().max(1024).optional().or(z.literal('')),
  notes: z.string().trim().max(1024).optional().or(z.literal('')),
});

export const serviceRecordUpdateSchema = serviceRecordCreateSchema.partial();
