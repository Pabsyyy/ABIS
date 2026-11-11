import { Schema, model, Document } from 'mongoose';

export interface IClassification extends Document {
  key: string;
  label: string;
  description?: string;
  isActive: boolean;
}

const classificationSchema = new Schema<IClassification>(
  {
    key: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 64 },
    label: { type: String, required: true, trim: true, maxlength: 128 },
    description: { type: String, trim: true, maxlength: 256 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Classification = model<IClassification>('Classification', classificationSchema);
