import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(128).optional(),
  purok: z.string().trim().max(64).optional(),
  status: z.enum(['active', 'archived']).optional(),
  classification: z.string().trim().max(64).optional(),
  sort: z.string().trim().max(64).optional(),
});

export const residentCreateSchema = z.object({
  firstName: z.string().trim().min(1).max(64),
  middleName: z.string().trim().max(64).optional().or(z.literal('')),
  lastName: z.string().trim().min(1).max(64),
  suffix: z.string().trim().max(16).optional().or(z.literal('')),
  birthdate: z.coerce.date().refine((d) => d.getTime() < Date.now(), 'Birthdate must be in the past'),
  sex: z.enum(['M', 'F']),
  civilStatus: z.enum(['single', 'married', 'widowed', 'separated', 'annulled', 'divorced']).default('single'),
  purok: z.string().trim().max(64).optional().or(z.literal('')),
  address: z.string().trim().max(256).optional().or(z.literal('')),
  contactNumber: z.string().trim().regex(/^[0-9+\-()\s]{6,32}$/, 'Invalid contact number').optional().or(z.literal('')),
  email: z.string().trim().email().max(128).optional().or(z.literal('')),
  occupation: z.string().trim().max(128).optional().or(z.literal('')),
  monthlyIncome: z.coerce.number().min(0).optional(),
  classifications: z.array(z.string().trim().max(64)).max(20).default([]),
  isHouseholdHead: z.boolean().default(false),
  notes: z.string().trim().max(1024).optional().or(z.literal('')),
});

export const residentUpdateSchema = residentCreateSchema.partial();
export const idParamSchema = z.object({ id: objectId });
