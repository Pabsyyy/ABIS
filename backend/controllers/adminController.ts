import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { ActivityLog } from '../models/ActivityLog';
import { getSettingsSingleton } from '../services/controlNumberService';
import { createBackup, listBackups, restoreBackup, listBackupFiles, backupsDir } from '../services/backupService';
import { User } from '../models/User';
import { logActivity } from '../services/activityLogService';

export async function listActivityLogs(req: Request, res: Response): Promise<void> {
  const { page, limit, action, userId } = req.query as unknown as { page: number; limit: number; action?: string; userId?: string };
  const filter: Record<string, unknown> = {};
  if (action) filter.action = new RegExp(action.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (userId) filter.user = userId;

  const [logs, total] = await Promise.all([
    ActivityLog.find(filter).populate('user', 'fullName username role').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ActivityLog.countDocuments(filter),
  ]);
  res.json({ success: true, data: logs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function getSettings(_req: Request, res: Response): Promise<void> {
  const settings = await getSettingsSingleton();
  res.json({ success: true, data: settings });
}

export async function updateSettings(req: Request, res: Response): Promise<void> {
  const settings = await getSettingsSingleton();
  const allowed = ['barangayName', 'municipality', 'province', 'captainName', 'contactNumber', 'letterheadText', 'officeHours', 'announcement', 'controlNumberScheme'] as const;
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      (settings as unknown as Record<string, unknown>)[key] = req.body[key];
    }
  }
  await settings.save();
  await logActivity({ user: req.user?.id, action: 'settings.update', targetType: 'systemSettings', targetId: 'barangay', ip: req.ip });
  res.json({ success: true, data: settings });
}

export async function createBackupController(req: Request, res: Response): Promise<void> {
  const result = await createBackup(req.user?.id);
  await logActivity({ user: req.user?.id, action: 'backup.create', targetType: 'backup', targetId: result.filename, details: { sizeBytes: result.sizeBytes }, ip: req.ip });
  res.status(201).json({ success: true, data: result });
}

export async function listBackupLogs(_req: Request, res: Response): Promise<void> {
  const logs = await listBackups();
  const files = await listBackupFiles();
  res.json({ success: true, data: { logs, files, directory: backupsDir() } });
}

export async function restoreBackupController(req: Request, res: Response): Promise<void> {
  const { filename, password, confirm } = req.body as { filename: string; password: string; confirm: string };
  if (confirm !== 'RESTORE') {
    res.status(400).json({ success: false, message: 'Type RESTORE to confirm the restore operation' });
    return;
  }
  const user = await User.findById(req.user?.id).select('+passwordHash');
  if (!user) {
    res.status(401).json({ success: false, message: 'User not found' });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ success: false, message: 'Incorrect password' });
    return;
  }
  const result = await restoreBackup(filename, req.user?.id);
  await logActivity({ user: req.user?.id, action: 'backup.restore', targetType: 'backup', targetId: filename, ip: req.ip });
  res.json({ success: true, data: result });
}

export async function listNotifications(req: Request, res: Response): Promise<void> {
  const { Notification } = await import('../models/Notification');
  const notifications = await Notification.find({ user: req.user?.id }).sort({ createdAt: -1 }).limit(30).lean();
  const unread = await Notification.countDocuments({ user: req.user?.id, read: false });
  res.json({ success: true, data: { notifications, unread } });
}

export async function markNotificationRead(req: Request, res: Response): Promise<void> {
  const { Notification } = await import('../models/Notification');
  await Notification.updateOne({ _id: req.params.id, user: req.user?.id }, { $set: { read: true } });
  res.json({ success: true, message: 'Notification marked as read' });
}

export async function markAllNotificationsRead(req: Request, res: Response): Promise<void> {
  const { Notification } = await import('../models/Notification');
  await Notification.updateMany({ user: req.user?.id }, { $set: { read: true } });
  res.json({ success: true, message: 'All notifications marked as read' });
}

export async function smsPlaceholder(_req: Request, res: Response): Promise<void> {
  const { SmsLog } = await import('../models/SmsLog');
  await SmsLog.create({ status: 'disabled', error: 'SMS integration is disabled by configuration' });
  res.status(501).json({ success: false, message: 'SMS integration is disabled. It can be enabled in system settings after Semaphore credentials are provided.' });
}

export async function resetOwnPassword(req: Request, res: Response): Promise<void> {
  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
  const user = await User.findById(req.user?.id).select('+passwordHash');
  if (!user) {
    res.status(401).json({ success: false, message: 'User not found' });
    return;
  }
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    res.status(401).json({ success: false, message: 'Current password is incorrect' });
    return;
  }
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.mustChangePassword = false;
  await user.save();
  await logActivity({ user: req.user?.id, action: 'user.change_password', ip: req.ip });
  res.json({ success: true, message: 'Password changed' });
}
