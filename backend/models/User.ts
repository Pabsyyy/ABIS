import { Schema, model, Document, Types } from 'mongoose';

export const USER_ROLES = ['secretary', 'treasurer', 'captain', 'resident', 'other'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  residentRef?: Types.ObjectId;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt?: Date;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 64,
      match: /^[a-z0-9._-]+$/,
    },
    passwordHash: { type: String, required: true, select: false },
    fullName: { type: String, required: true, trim: true, maxlength: 128 },
    role: { type: String, required: true, enum: USER_ROLES, index: true },
    residentRef: { type: Schema.Types.ObjectId, ref: 'Resident', unique: true, sparse: true },
    isActive: { type: Boolean, default: true, index: true },
    mustChangePassword: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, isActive: 1 });

export const User = model<IUser>('User', userSchema);
