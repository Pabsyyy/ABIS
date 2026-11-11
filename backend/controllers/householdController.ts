import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Household } from '../models/Household';
import { Resident } from '../models/Resident';
import { logActivity } from '../services/activityLogService';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function listHouseholds(req: Request, res: Response): Promise<void> {
  const { page, limit, search, purok, status } = req.query as unknown as {
    page: number;
    limit: number;
    search?: string;
    purok?: string;
    status?: 'active' | 'archived';
  };

  const filter: Record<string, unknown> = { status: status ?? 'active' };
  if (purok) filter.purok = purok;
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    const matchingResidents = await Resident.find({ $or: [{ firstName: regex }, { lastName: regex }] }).select('_id');
    filter.$or = [{ householdNumber: regex }, { address: regex }, { headResident: { $in: matchingResidents.map((r) => r._id) } }];
  }

  const [households, total] = await Promise.all([
    Household.find(filter).populate('headResident', 'firstName lastName').sort({ householdNumber: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Household.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: households.map((h) => ({ ...h, memberCount: h.members?.length ?? 0 })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getHousehold(req: Request, res: Response): Promise<void> {
  const household = await Household.findById(req.params.id)
    .populate('headResident', 'firstName lastName birthdate sex')
    .populate('members', 'firstName lastName birthdate sex civilStatus classifications status')
    .lean();
  if (!household) {
    res.status(404).json({ success: false, message: 'Household not found' });
    return;
  }
  res.json({ success: true, data: { ...household, memberCount: household.members?.length ?? 0 } });
}

export async function createHousehold(req: Request, res: Response): Promise<void> {
  const body = req.body;
  const head = await Resident.findById(body.headResident);
  if (!head) {
    res.status(400).json({ success: false, message: 'Head resident not found' });
    return;
  }
  const existingNumber = await Household.findOne({ householdNumber: body.householdNumber });
  if (existingNumber) {
    res.status(409).json({ success: false, message: 'A household with that number already exists' });
    return;
  }

  const household = await Household.create({ ...body, members: [head._id] });
  head.isHouseholdHead = true;
  head.householdRef = household._id as Types.ObjectId;
  await head.save();

  await logActivity({ user: req.user?.id, action: 'household.create', targetType: 'household', targetId: String(household._id), ip: req.ip });
  res.status(201).json({ success: true, data: household });
}

export async function updateHousehold(req: Request, res: Response): Promise<void> {
  const household = await Household.findById(req.params.id);
  if (!household) {
    res.status(404).json({ success: false, message: 'Household not found' });
    return;
  }
  const body = req.body;
  if (body.householdNumber && body.householdNumber !== household.householdNumber) {
    const existingNumber = await Household.findOne({ householdNumber: body.householdNumber });
    if (existingNumber) {
      res.status(409).json({ success: false, message: 'A household with that number already exists' });
      return;
    }
  }
  if (body.headResident && String(body.headResident) !== String(household.headResident)) {
    const head = await Resident.findById(body.headResident);
    if (!head) {
      res.status(400).json({ success: false, message: 'Head resident not found' });
      return;
    }
    await Resident.updateMany({ _id: household.headResident }, { $set: { isHouseholdHead: false } });
    head.isHouseholdHead = true;
    head.householdRef = household._id as Types.ObjectId;
    await head.save();
    household.headResident = head._id as Types.ObjectId;
    if (!household.members.some((m) => String(m) === String(head._id))) {
      household.members.push(head._id as Types.ObjectId);
    }
  }
  if (body.householdNumber !== undefined) household.householdNumber = body.householdNumber;
  if (body.purok !== undefined) household.purok = body.purok;
  if (body.address !== undefined) household.address = body.address;
  if (body.notes !== undefined) household.notes = body.notes;

  await household.save();
  await logActivity({ user: req.user?.id, action: 'household.update', targetType: 'household', targetId: String(household._id), ip: req.ip });
  res.json({ success: true, data: household });
}

export async function addMember(req: Request, res: Response): Promise<void> {
  const household = await Household.findById(req.params.id);
  if (!household) {
    res.status(404).json({ success: false, message: 'Household not found' });
    return;
  }
  const resident = await Resident.findById(req.body.residentId);
  if (!resident) {
    res.status(404).json({ success: false, message: 'Resident not found' });
    return;
  }
  if (household.members.some((m) => String(m) === String(resident._id))) {
    res.status(409).json({ success: false, message: 'Resident is already a member of this household' });
    return;
  }

  if (resident.householdRef && String(resident.householdRef) !== String(household._id)) {
    await Household.updateOne({ _id: resident.householdRef }, { $pull: { members: resident._id } });
  }

  household.members.push(resident._id as Types.ObjectId);
  await household.save();
  resident.householdRef = household._id as Types.ObjectId;
  await resident.save();

  await logActivity({ user: req.user?.id, action: 'household.add_member', targetType: 'household', targetId: String(household._id), details: { resident: String(resident._id) }, ip: req.ip });
  res.json({ success: true, message: 'Member added' });
}

export async function removeMember(req: Request, res: Response): Promise<void> {
  const household = await Household.findById(req.params.id);
  if (!household) {
    res.status(404).json({ success: false, message: 'Household not found' });
    return;
  }
  const resident = await Resident.findById(req.params.residentId);
  if (!resident) {
    res.status(404).json({ success: false, message: 'Resident not found' });
    return;
  }
  household.members = household.members.filter((m) => String(m) !== String(resident._id));
  await household.save();
  resident.householdRef = undefined;
  resident.isHouseholdHead = false;
  await resident.save();
  await logActivity({ user: req.user?.id, action: 'household.remove_member', targetType: 'household', targetId: String(household._id), details: { resident: String(resident._id) }, ip: req.ip });
  res.json({ success: true, message: 'Member removed' });
}

export async function transferMember(req: Request, res: Response): Promise<void> {
  const { residentId, toHouseholdId } = req.body as { residentId: string; toHouseholdId: string };
  const target = await Household.findById(toHouseholdId);
  if (!target) {
    res.status(404).json({ success: false, message: 'Target household not found' });
    return;
  }
  const resident = await Resident.findById(residentId);
  if (!resident) {
    res.status(404).json({ success: false, message: 'Resident not found' });
    return;
  }
  if (resident.householdRef) {
    await Household.updateOne({ _id: resident.householdRef }, { $pull: { members: resident._id } });
  }
  if (!target.members.some((m) => String(m) === String(resident._id))) {
    target.members.push(resident._id as Types.ObjectId);
    await target.save();
  }
  resident.householdRef = target._id as Types.ObjectId;
  await resident.save();
  await logActivity({ user: req.user?.id, action: 'household.transfer_member', targetType: 'household', targetId: String(target._id), details: { resident: String(resident._id) }, ip: req.ip });
  res.json({ success: true, message: 'Resident transferred' });
}

export async function archiveHousehold(req: Request, res: Response): Promise<void> {
  const household = await Household.findById(req.params.id);
  if (!household) {
    res.status(404).json({ success: false, message: 'Household not found' });
    return;
  }
  household.status = 'archived';
  await household.save();
  await logActivity({ user: req.user?.id, action: 'household.archive', targetType: 'household', targetId: String(household._id), ip: req.ip });
  res.json({ success: true, message: 'Household archived' });
}
