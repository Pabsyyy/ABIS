import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Resident } from '../models/Resident';
import { Household } from '../models/Household';
import { logActivity } from '../services/activityLogService';
import { buildResidentsExcel, parseResidentsImport } from '../services/excelService';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function duplicateWarning(lastName: string, firstName: string, birthdate: Date, excludeId?: string) {
  const filter: Record<string, unknown> = {
    lastName: new RegExp(`^${escapeRegex(lastName.trim())}$`, 'i'),
    firstName: new RegExp(`^${escapeRegex(firstName.trim())}$`, 'i'),
    birthdate,
    status: 'active',
  };
  if (excludeId) filter._id = { $ne: new Types.ObjectId(excludeId) };
  return Resident.findOne(filter).select('firstName lastName birthdate purok');
}

export async function listResidents(req: Request, res: Response): Promise<void> {
  const { page, limit, search, purok, status, classification, sort } = req.query as unknown as {
    page: number;
    limit: number;
    search?: string;
    purok?: string;
    status?: 'active' | 'archived';
    classification?: string;
    sort?: string;
  };

  const filter: Record<string, unknown> = { status: status ?? 'active' };
  if (purok) filter.purok = purok;
  if (classification) filter.classifications = classification;
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ firstName: regex }, { lastName: regex }, { middleName: regex }, { contactNumber: regex }, { purok: regex }];
  }

  const sortField: Record<string, 1 | -1> = {};
  if (sort) {
    const [field, direction] = sort.split(':');
    if (field) sortField[field] = direction === 'desc' ? -1 : 1;
  }
  if (Object.keys(sortField).length === 0) {
    sortField.lastName = 1;
    sortField.firstName = 1;
  }

  const [residents, total] = await Promise.all([
    Resident.find(filter).sort(sortField).skip((page - 1) * limit).limit(limit).lean(),
    Resident.countDocuments(filter),
  ]);

  res.json({ success: true, data: residents, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function getResident(req: Request, res: Response): Promise<void> {
  const resident = await Resident.findById(req.params.id).lean();
  if (!resident) {
    res.status(404).json({ success: false, message: 'Resident not found' });
    return;
  }
  res.json({ success: true, data: resident });
}

export async function createResident(req: Request, res: Response): Promise<void> {
  const body = req.body;
  const duplicate = await duplicateWarning(body.lastName, body.firstName, new Date(body.birthdate));
  if (duplicate) {
    res.status(409).json({ success: false, message: 'A resident with the same name and birthdate already exists', data: { existing: duplicate } });
    return;
  }

  const resident = await Resident.create({ ...body, status: 'active' });
  await logActivity({ user: req.user?.id, action: 'resident.create', targetType: 'resident', targetId: String(resident._id), details: { name: `${body.firstName} ${body.lastName}` }, ip: req.ip });
  res.status(201).json({ success: true, data: resident.toObject() });
}

export async function updateResident(req: Request, res: Response): Promise<void> {
  const resident = await Resident.findById(req.params.id);
  if (!resident) {
    res.status(404).json({ success: false, message: 'Resident not found' });
    return;
  }
  const body = req.body;
  if (body.firstName || body.lastName || body.birthdate) {
    const duplicate = await duplicateWarning(body.lastName ?? resident.lastName, body.firstName ?? resident.firstName, body.birthdate ? new Date(body.birthdate) : resident.birthdate, String(resident._id));
    if (duplicate) {
      res.status(409).json({ success: false, message: 'Another resident with the same name and birthdate already exists', data: { existing: duplicate } });
      return;
    }
  }
  Object.assign(resident, body);
  await resident.save();
  await logActivity({ user: req.user?.id, action: 'resident.update', targetType: 'resident', targetId: String(resident._id), ip: req.ip });
  res.json({ success: true, data: resident.toObject() });
}

export async function archiveResident(req: Request, res: Response): Promise<void> {
  const resident = await Resident.findById(req.params.id);
  if (!resident) {
    res.status(404).json({ success: false, message: 'Resident not found' });
    return;
  }
  resident.status = 'archived';
  resident.archivedAt = new Date();
  await resident.save();
  await logActivity({ user: req.user?.id, action: 'resident.archive', targetType: 'resident', targetId: String(resident._id), ip: req.ip });
  res.json({ success: true, message: 'Resident archived' });
}

export async function restoreResident(req: Request, res: Response): Promise<void> {
  const resident = await Resident.findById(req.params.id);
  if (!resident) {
    res.status(404).json({ success: false, message: 'Resident not found' });
    return;
  }
  resident.status = 'active';
  resident.archivedAt = undefined;
  await resident.save();
  await logActivity({ user: req.user?.id, action: 'resident.restore', targetType: 'resident', targetId: String(resident._id), ip: req.ip });
  res.json({ success: true, message: 'Resident restored' });
}

export async function exportResidents(req: Request, res: Response): Promise<void> {
  const residents = await Resident.find({ status: 'active' }).sort({ lastName: 1, firstName: 1 }).lean();
  const buffer = await buildResidentsExcel(residents as unknown as Record<string, unknown>[]);
  await logActivity({ user: req.user?.id, action: 'resident.export', ip: req.ip, details: { count: residents.length } });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="abis-residents.xlsx"');
  res.send(buffer);
}

export async function importResidents(req: Request, res: Response): Promise<void> {
  const file = (req as unknown as { file?: { buffer: Buffer; originalname: string } }).file;
  if (!file) {
    res.status(400).json({ success: false, message: 'No file uploaded (field name: "file")' });
    return;
  }

  const result = await parseResidentsImport(file.buffer);
  const created: string[] = [];
  const skippedDuplicates: { row: number; name: string }[] = [];

  for (const [index, doc] of result.validRows.entries()) {
    const duplicate = await Resident.findOne({
      lastName: new RegExp(`^${escapeRegex(String(doc.lastName))}$`, 'i'),
      firstName: new RegExp(`^${escapeRegex(String(doc.firstName))}$`, 'i'),
      birthdate: doc.birthdate,
      status: 'active',
    });
    if (duplicate) {
      skippedDuplicates.push({ row: index + 2, name: `${doc.firstName} ${doc.lastName}` });
      continue;
    }
    const resident = await Resident.create(doc);
    created.push(String(resident._id));
  }

  await logActivity({ user: req.user?.id, action: 'resident.import', ip: req.ip, details: { created: created.length, duplicates: skippedDuplicates.length, errors: result.errors.length } });

  res.json({
    success: true,
    data: {
      created: created.length,
      duplicatesSkipped: skippedDuplicates,
      errors: result.errors,
      totalRows: result.totalRows,
    },
  });
}

export async function listClassifications(_req: Request, res: Response): Promise<void> {
  const { Classification } = await import('../models/Classification');
  const classifications = await Classification.find({ isActive: true }).sort({ label: 1 }).lean();
  res.json({ success: true, data: classifications });
}

export async function listPuroks(_req: Request, res: Response): Promise<void> {
  const { Purok } = await import('../models/Purok');
  const puroks = await Purok.find({ isActive: true }).sort({ name: 1 }).lean();
  res.json({ success: true, data: puroks });
}

export async function householdOfResident(req: Request, res: Response): Promise<void> {
  const resident = await Resident.findById(req.params.id).lean();
  if (!resident) {
    res.status(404).json({ success: false, message: 'Resident not found' });
    return;
  }
  const household = resident.householdRef ? await Household.findById(resident.householdRef).populate('members', 'firstName lastName birthdate sex').lean() : null;
  res.json({ success: true, data: household });
}
