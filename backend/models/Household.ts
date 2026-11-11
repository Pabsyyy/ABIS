import { Schema, model, Document, Types } from 'mongoose';

export interface IHousehold extends Document {
  householdNumber: string;
  headResident: Types.ObjectId;
  purok?: string;
  address?: string;
  members: Types.ObjectId[];
  status: 'active' | 'archived';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const householdSchema = new Schema<IHousehold>(
  {
    householdNumber: { type: String, required: true, unique: true, trim: true, uppercase: true, maxlength: 32 },
    headResident: { type: Schema.Types.ObjectId, ref: 'Resident', required: true, index: true },
    purok: { type: String, trim: true, maxlength: 64, index: true },
    address: { type: String, trim: true, maxlength: 256 },
    members: [{ type: Schema.Types.ObjectId, ref: 'Resident' }],
    status: { type: String, enum: ['active', 'archived'], default: 'active', index: true },
    notes: { type: String, trim: true, maxlength: 1024 },
  },
  { timestamps: true }
);

export const Household = model<IHousehold>('Household', householdSchema);
