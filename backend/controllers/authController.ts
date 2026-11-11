import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models/User';
import { logActivity } from '../services/activityLogService';
import { AuthTokenPayload } from '../middleware/auth';

function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
}

function setAuthCookie(res: Response, token: string): void {
  res.cookie(env.cookieName, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 12 * 60 * 60 * 1000,
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body as { username: string; password: string };

  const user = await User.findOne({ username }).select('+passwordHash');
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !valid) {
    await logActivity({ action: 'auth.login_failed', ip: req.ip, details: { username } });
    res.status(401).json({ success: false, message: 'Invalid username or password' });
    return;
  }

  if (!user.isActive) {
    await logActivity({ user: user._id, action: 'auth.login_denied', ip: req.ip });
    res.status(403).json({ success: false, message: 'This account has been deactivated. Contact the Barangay Secretary.' });
    return;
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken({ sub: String(user._id), role: user.role });
  setAuthCookie(res, token);

  await logActivity({ user: user._id, action: 'auth.login', ip: req.ip });

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    },
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  if (req.user) {
    await logActivity({ user: req.user.id, action: 'auth.logout', ip: req.ip });
  }
  res.clearCookie(env.cookieName, { httpOnly: true, sameSite: 'lax', secure: env.isProduction, path: '/' });
  res.json({ success: true, message: 'Logged out' });
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }
  res.json({ success: true, data: { user: req.user } });
}
