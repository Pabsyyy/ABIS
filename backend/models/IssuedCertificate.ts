import { Schema, model, Document, Types } from 'mongoose';

export interface IIssuedCertificate extends Document {
  request: Types.ObjectId;
  resident: Types.ObjectId;
  certificateType: Types.ObjectId;
  controlNumber: string;
  issuedBy?: Types.ObjectId;
  issuedAt: Date;
  releasedAt?: Date;
  releasedTo?: string;
  orNumber?: string;
  fee: number;
  paymentStatus: 'unpaid' | 'paid' | 'waived';
  createdAt: Date;
  updatedAt: Date;
}

const issuedCertificateSchema = new Schema<IIssuedCertificate>(
  {
    request: { type: Schema.Types.ObjectId, ref: 'CertificateRequest', required: true, unique: true },
    resident: { type: Schema.Types.ObjectId, ref: 'Resident', required: true, index: true },
    certificateType: { type: Schema.Types.ObjectId, ref: 'CertificateType', required: true },
    controlNumber: { type: String, required: true, unique: true, trim: true },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    issuedAt: { type: Date, default: Date.now },
    releasedAt: { type: Date },
    releasedTo: { type: String, trim: true, maxlength: 256 },
    orNumber: { type: String, trim: true, maxlength: 64 },
    fee: { type: Number, required: true, min: 0, default: 0 },
    paymentStatus: { type: String, enum: ['unpaid', 'paid', 'waived'], default: 'unpaid' },
  },
  { timestamps: true }
);

issuedCertificateSchema.index({ resident: 1, issuedAt: -1 });

export const IssuedCertificate = model<IIssuedCertificate>('IssuedCertificate', issuedCertificateSchema);
