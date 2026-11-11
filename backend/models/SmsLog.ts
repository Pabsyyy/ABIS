import { Schema, model, Document } from 'mongoose';

export interface ISmsLog extends Document {
  recipient?: string;
  message?: string;
  status: 'disabled' | 'queued' | 'sent' | 'failed';
  error?: string;
  createdAt: Date;
}

const smsLogSchema = new Schema<ISmsLog>(
  {
    recipient: { type: String, trim: true, maxlength: 32 },
    message: { type: String, trim: true, maxlength: 1024 },
    status: { type: String, enum: ['disabled', 'queued', 'sent', 'failed'], default: 'disabled' },
    error: { type: String, trim: true, maxlength: 512 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const SmsLog = model<ISmsLog>('SmsLog', smsLogSchema);
