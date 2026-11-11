import { Schema, model, Document } from 'mongoose';

export interface IServiceCategory extends Document {
  name: string;
  description?: string;
  isActive: boolean;
}

const serviceCategorySchema = new Schema<IServiceCategory>(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 128 },
    description: { type: String, trim: true, maxlength: 512 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ServiceCategory = model<IServiceCategory>('ServiceCategory', serviceCategorySchema);
