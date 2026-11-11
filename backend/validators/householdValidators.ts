import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const householdCreateSchema = z.object({
  householdNumber: z.string().trim().min(1).max(32).transform((v) => v.toUpperCase()),
  headResident: objectId,
  purok: z.string().trim().max(64).optional().or(z.literal('')),
  address: z.string().trim().max(256).optional().or(z.literal('')),
  notes: z.string().trim().max(1024).optional().or(z.literal('')),
});

export const householdUpdateSchema = householdCreateSchema.partial();

export const transferMemberSchema = z.object({
  residentId: objectId,
  toHouseholdId: objectId,
});

export const addMemberSchema = z.object({
  residentId: objectId,
});
