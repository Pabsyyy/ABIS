import { Schema, model, Document, Types } from 'mongoose';

export const CORRECTION_STATUSES = ['pending', 'applied', 'rejected'] as const;
export type CorrectionStatus = (typeof CORRECTION_STATUSES)[number];

export interface ICorrectionRequest extends Document {
  resident: Types.ObjectId;
  requestedBy: Types.ObjectId;
  field: string;
  proposedValue: string;
  status: CorrectionStatus;
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  resolutionNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const correctionRequestSchema = new Schema<ICorrectionRequest>(
  {
    resident: { type: Schema.Types.ObjectId, ref: 'Resident', required: true, index: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    field: { type: String, required: true, trim: true, maxlength: 64 },
    proposedValue: { type: String, required: true, trim: true, maxlength: 1024 },
    status: { type: String, enum: CORRECTION_STATUSES, default: 'pending', index: true },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
    resolutionNote: { type: String, trim: true, maxlength: 512 },
  },
  { timestamps: true }
);

export const CorrectionRequest = model<ICorrectionRequest>('CorrectionRequest', correctionRequestSchema);
