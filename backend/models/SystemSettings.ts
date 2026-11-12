import { Schema, model, Document } from 'mongoose';

export interface ISystemSettings extends Document {
  key: string;
  barangayName: string;
  municipality: string;
  province: string;
  captainName?: string;
  contactNumber?: string;
  letterheadText?: string;
  officeHours?: string;
  announcement?: string;
  controlNumberScheme: string;
  smsEnabled: boolean;
}

const systemSettingsSchema = new Schema<ISystemSettings>(
  {
    key: { type: String, required: true, unique: true, default: 'barangay' },
    barangayName: { type: String, required: true, default: 'Barangay Ambucao', trim: true, maxlength: 128 },
    municipality: { type: String, required: true, default: 'Santiago', trim: true, maxlength: 128 },
    province: { type: String, required: true, default: 'Ilocos Sur', trim: true, maxlength: 128 },
    captainName: { type: String, trim: true, maxlength: 128 },
    contactNumber: { type: String, trim: true, maxlength: 64 },
    letterheadText: { type: String, trim: true, maxlength: 1024 },
    officeHours: { type: String, trim: true, maxlength: 128 },
    announcement: { type: String, trim: true, maxlength: 1024 },
    controlNumberScheme: { type: String, trim: true, default: 'ABIS-YYYY-#####', maxlength: 64 },
    smsEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const SystemSettings = model<ISystemSettings>('SystemSettings', systemSettingsSchema);
