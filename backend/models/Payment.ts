import { Schema, model, Document, Types } from 'mongoose';

export interface IPayment extends Document {
  issuedCertificate: Types.ObjectId;
  resident: Types.ObjectId;
  amount: number;
  orNumber?: string;
  paymentStatus: 'unpaid' | 'paid' | 'waived';
  recordedBy?: Types.ObjectId;
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    issuedCertificate: { type: Schema.Types.ObjectId, ref: 'IssuedCertificate', required: true, index: true },
    resident: { type: Schema.Types.ObjectId, ref: 'Resident', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    orNumber: { type: String, trim: true, maxlength: 64 },
    paymentStatus: { type: String, enum: ['unpaid', 'paid', 'waived'], default: 'paid' },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Payment = model<IPayment>('Payment', paymentSchema);
