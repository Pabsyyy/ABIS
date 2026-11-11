import { Schema, model, Document, Types } from 'mongoose';

export const REQUEST_STATUSES = ['pending', 'approved', 'rejected', 'issued', 'ready_for_release', 'released', 'cancelled'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export interface ICertificateRequest extends Document {
  resident: Types.ObjectId;
  certificateType: Types.ObjectId;
  purpose: string;
  status: RequestStatus;
  controlNumber?: string;
  requestedBy?: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  issuedCertificate?: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const certificateRequestSchema = new Schema<ICertificateRequest>(
  {
    resident: { type: Schema.Types.ObjectId, ref: 'Resident', required: true, index: true },
    certificateType: { type: Schema.Types.ObjectId, ref: 'CertificateType', required: true, index: true },
    purpose: { type: String, required: true, trim: true, maxlength: 512 },
    status: { type: String, enum: REQUEST_STATUSES, default: 'pending', index: true },
    controlNumber: { type: String, trim: true, unique: true, sparse: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String, trim: true, maxlength: 512 },
    issuedCertificate: { type: Schema.Types.ObjectId, ref: 'IssuedCertificate' },
    notes: { type: String, trim: true, maxlength: 1024 },
  },
  { timestamps: true }
);

certificateRequestSchema.index({ resident: 1, createdAt: -1 });

export const CertificateRequest = model<ICertificateRequest>('CertificateRequest', certificateRequestSchema);
