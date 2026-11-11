import { Schema, model, Document, Types } from 'mongoose';

export interface IActivityLog extends Document {
  user?: Types.ObjectId;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ip?: string;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true, trim: true, index: true, maxlength: 128 },
    targetType: { type: String, trim: true, maxlength: 64 },
    targetId: { type: String, trim: true, maxlength: 64 },
    details: { type: Schema.Types.Mixed },
    ip: { type: String, trim: true, maxlength: 64 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ user: 1, createdAt: -1 });

export const ActivityLog = model<IActivityLog>('ActivityLog', activityLogSchema);
