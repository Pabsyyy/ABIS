import { Types } from 'mongoose';
import { Notification } from '../models/Notification';
import { User } from '../models/User';

interface ResidentNotification {
  title: string;
  message: string;
  type?: 'info' | 'approval' | 'alert';
  link?: string;
}

export async function notifyResident(residentId: Types.ObjectId | string, payload: ResidentNotification): Promise<void> {
  try {
    const user = await User.findOne({ residentRef: residentId, isActive: true }).select('_id').lean();
    if (!user) return;
    await Notification.create({ user: user._id, ...payload });
  } catch (error) {
    console.error('Failed to create resident notification', error);
  }
}
