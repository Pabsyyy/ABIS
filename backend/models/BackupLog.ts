import { Schema, model, Document, Types } from 'mongoose';

export interface IBackupLog extends Document {
  filename: string;
  path: string;
  sizeBytes?: number;
  createdBy?: Types.ObjectId;
  status: 'success' | 'failed';
  type: 'full' | 'collection';
  error?: string;
  createdAt: Date;
}

const backupLogSchema = new Schema<IBackupLog>(
  {
    filename: { type: String, required: true, trim: true },
    path: { type: String, required: true, trim: true },
    sizeBytes: { type: Number, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['success', 'failed'], default: 'success' },
    type: { type: String, enum: ['full', 'collection'], default: 'full' },
    error: { type: String, trim: true, maxlength: 1024 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const BackupLog = model<IBackupLog>('BackupLog', backupLogSchema);
