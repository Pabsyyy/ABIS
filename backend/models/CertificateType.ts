import { Schema, model, Document } from 'mongoose';

export interface ICertificateType extends Document {
  name: string;
  description?: string;
  fee: number;
  requiresApproval: boolean;
  templateKey?: string;
  active: boolean;
}

const certificateTypeSchema = new Schema<ICertificateType>(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 128 },
    description: { type: String, trim: true, maxlength: 512 },
    fee: { type: Number, required: true, min: 0, default: 0 },
    requiresApproval: { type: Boolean, default: true },
    templateKey: { type: String, trim: true, maxlength: 64, default: 'generic' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const CertificateType = model<ICertificateType>('CertificateType', certificateTypeSchema);
