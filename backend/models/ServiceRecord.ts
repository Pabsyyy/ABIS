import { Schema, model, Document, Types } from 'mongoose';

export interface IServiceRecord extends Document {
  resident: Types.ObjectId;
  category: Types.ObjectId;
  serviceDate: Date;
  description: string;
  beneficiaryInfo?: string;
  recordedBy?: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const serviceRecordSchema = new Schema<IServiceRecord>(
  {
    resident: { type: Schema.Types.ObjectId, ref: 'Resident', required: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: 'ServiceCategory', required: true, index: true },
    serviceDate: { type: Date, required: true, index: true },
    description: { type: String, required: true, trim: true, maxlength: 2048 },
    beneficiaryInfo: { type: String, trim: true, maxlength: 1024 },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true, maxlength: 1024 },
  },
  { timestamps: true }
);

serviceRecordSchema.index({ resident: 1, serviceDate: -1 });

export const ServiceRecord = model<IServiceRecord>('ServiceRecord', serviceRecordSchema);
