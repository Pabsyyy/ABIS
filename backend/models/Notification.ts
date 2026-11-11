import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
  user: Types.ObjectId;
  title: string;
  message: string;
  type: 'info' | 'approval' | 'alert';
  read: boolean;
  link?: string;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 256 },
    message: { type: String, required: true, trim: true, maxlength: 1024 },
    type: { type: String, enum: ['info', 'approval', 'alert'], default: 'info' },
    read: { type: Boolean, default: false, index: true },
    link: { type: String, trim: true, maxlength: 512 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Notification = model<INotification>('Notification', notificationSchema);
