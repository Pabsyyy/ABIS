import { Schema, model, Document, Types } from 'mongoose';

export interface IResident extends Document {
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  birthdate: Date;
  sex: 'M' | 'F';
  civilStatus: string;
  purok?: string;
  address?: string;
  contactNumber?: string;
  email?: string;
  occupation?: string;
  monthlyIncome?: number;
  classifications: string[];
  isHouseholdHead: boolean;
  householdRef?: Types.ObjectId;
  status: 'active' | 'archived';
  archivedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const residentSchema = new Schema<IResident>(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 64 },
    middleName: { type: String, trim: true, maxlength: 64 },
    lastName: { type: String, required: true, trim: true, maxlength: 64 },
    suffix: { type: String, trim: true, maxlength: 16 },
    birthdate: { type: Date, required: true },
    sex: { type: String, required: true, enum: ['M', 'F'] },
    civilStatus: { type: String, required: true, enum: ['single', 'married', 'widowed', 'separated', 'annulled', 'divorced'], default: 'single' },
    purok: { type: String, trim: true, maxlength: 64, index: true },
    address: { type: String, trim: true, maxlength: 256 },
    contactNumber: { type: String, trim: true, maxlength: 32, match: /^[0-9+\-()\s]{6,32}$/ },
    email: { type: String, trim: true, lowercase: true, maxlength: 128 },
    occupation: { type: String, trim: true, maxlength: 128 },
    monthlyIncome: { type: Number, min: 0 },
    classifications: [{ type: String, trim: true, lowercase: true }],
    isHouseholdHead: { type: Boolean, default: false },
    householdRef: { type: Schema.Types.ObjectId, ref: 'Household', default: null },
    status: { type: String, enum: ['active', 'archived'], default: 'active', index: true },
    archivedAt: { type: Date },
    notes: { type: String, trim: true, maxlength: 1024 },
  },
  { timestamps: true }
);

residentSchema.index({ lastName: 1, firstName: 1 });
residentSchema.index({ lastName: 1, firstName: 1, birthdate: 1 }); // duplicate detection support
residentSchema.index({ classifications: 1 });
residentSchema.index({ purok: 1, status: 1 });

export const Resident = model<IResident>('Resident', residentSchema);
