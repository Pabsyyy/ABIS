import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { User } from '../models/User';
import { Resident } from '../models/Resident';
import { logActivity } from '../services/activityLogService';

function publicUser(user: {
  _id: unknown;
  username: string;
  fullName: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  residentRef?: { toString(): string } | null | undefined;
  lastLoginAt?: Date | null;
  createdAt?: Date;
}) {
  return {
    id: user._id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    residentRef: user.residentRef ? String(user.residentRef) : null,
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt ?? null,
  };
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
  const role = typeof req.query.role === 'string' ? req.query.role : undefined;
  const isActive = typeof req.query.isActive === 'string' ? req.query.isActive === 'true' : undefined;

  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive;

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ role: 1, username: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: users.map(publicUser),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const { username, fullName, password, role, residentRef } = req.body as {
    username: string;
    fullName: string;
    password: string;
    role: string;
    residentRef?: string;
  };

  const existing = await User.findOne({ username });
  if (existing) {
    res.status(409).json({ success: false, message: 'A user with that username already exists' });
    return;
  }

  let residentObjectId: Types.ObjectId | undefined;
  if (role === 'resident') {
    if (!residentRef) {
      res.status(400).json({ success: false, message: 'residentRef is required when role is "resident"' });
      return;
    }
    const resident = await Resident.findById(residentRef);
    if (!resident) {
      res.status(400).json({ success: false, message: 'Linked resident not found' });
      return;
    }
    const taken = await User.findOne({ residentRef: resident._id });
    if (taken) {
      res.status(409).json({ success: false, message: 'That resident already has a login account' });
      return;
    }
    residentObjectId = resident._id as Types.ObjectId;
  } else if (residentRef) {
    res.status(400).json({ success: false, message: 'residentRef may only be set when role is "resident"' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    username,
    fullName,
    passwordHash,
    role,
    residentRef: residentObjectId,
    mustChangePassword: true,
    createdBy: req.user?.id,
  });

  await logActivity({
    user: req.user?.id,
    action: 'user.create',
    targetType: 'user',
    targetId: String(user._id),
    details: { username, role, residentRef: residentObjectId ? String(residentObjectId) : undefined },
    ip: req.ip,
  });

  res.status(201).json({ success: true, data: { user: publicUser(user) } });
}

export async function getUser(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }
  res.json({ success: true, data: { user: publicUser(user) } });
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const { fullName, role, isActive, residentRef } = req.body as {
    fullName?: string;
    role?: string;
    isActive?: boolean;
    residentRef?: string | null;
  };

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  if (String(user._id) === String(req.user?.id) && isActive === false) {
    res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
    return;
  }

  const nextRole = (role ?? user.role) as typeof user.role;
  if (nextRole === 'resident') {
    const targetRef = residentRef !== undefined ? residentRef : user.residentRef ? String(user.residentRef) : null;
    if (!targetRef) {
      res.status(400).json({ success: false, message: 'A resident account must be linked to a resident record (residentRef)' });
      return;
    }
    const resident = await Resident.findById(targetRef);
    if (!resident) {
      res.status(400).json({ success: false, message: 'Linked resident not found' });
      return;
    }
    const taken = await User.findOne({ residentRef: resident._id, _id: { $ne: user._id } });
    if (taken) {
      res.status(409).json({ success: false, message: 'That resident already has a login account' });
      return;
    }
    user.residentRef = resident._id as Types.ObjectId;
  } else if (residentRef === null) {
    user.residentRef = undefined;
  } else if (residentRef) {
    res.status(400).json({ success: false, message: 'residentRef may only be set for resident accounts' });
    return;
  } else if (role && role !== 'resident' && user.role === 'resident') {
    user.residentRef = undefined;
  }

  if (fullName !== undefined) user.fullName = fullName;
  if (role !== undefined) user.role = role as typeof user.role;
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();

  await logActivity({
    user: req.user?.id,
    action: 'user.update',
    targetType: 'user',
    targetId: String(user._id),
    details: { fullName, role, isActive, residentRef },
    ip: req.ip,
  });

  res.json({ success: true, data: { user: publicUser(user) } });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { newPassword } = req.body as { newPassword: string };

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.mustChangePassword = true;
  await user.save();

  await logActivity({
    user: req.user?.id,
    action: 'user.reset_password',
    targetType: 'user',
    targetId: String(user._id),
    ip: req.ip,
  });

  res.json({ success: true, message: 'Password reset. The user must change it on next login.' });
}
