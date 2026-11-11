import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { env } from '../config/env';
import { User, UserRole } from '../models/User';

export interface AuthTokenPayload {
  sub: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  id: Types.ObjectId;
  username: string;
  fullName: string;
  role: UserRole;
  residentRef?: Types.ObjectId;
  mustChangePassword: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.[env.cookieName];
    if (!token) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const payload = jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
    const user = await User.findById(payload.sub).select('username fullName role residentRef isActive mustChangePassword');

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Account is disabled or no longer exists' });
      return;
    }

    req.user = {
      id: user._id as Types.ObjectId,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      residentRef: user.residentRef,
      mustChangePassword: user.mustChangePassword,
    };
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired session' });
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'You do not have permission to perform this action' });
      return;
    }
    next();
  };
}
