import { Types } from 'mongoose';
import { ActivityLog } from '../models/ActivityLog';

interface LogInput {
  user?: Types.ObjectId | string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ip?: string;
}

export async function logActivity(input: LogInput): Promise<void> {
  try {
    await ActivityLog.create({
      user: input.user ? new Types.ObjectId(input.user) : undefined,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      details: input.details,
      ip: input.ip,
    });
  } catch (error) {
    console.error('Failed to write activity log:', error);
  }
}
