import { Schema, model, Document } from 'mongoose';

export interface IPurok extends Document {
  name: string;
  description?: string;
  isActive: boolean;
}

const purokSchema = new Schema<IPurok>(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 64 },
    description: { type: String, trim: true, maxlength: 256 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Purok = model<IPurok>('Purok', purokSchema);
