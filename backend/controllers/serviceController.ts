import { Request, Response } from 'express';
import { ServiceCategory } from '../models/ServiceCategory';
import { ServiceRecord } from '../models/ServiceRecord';
import { Resident } from '../models/Resident';
import { logActivity } from '../services/activityLogService';
import { Types } from 'mongoose';

export async function listServiceCategories(_req: Request, res: Response): Promise<void> {
  const categories = await ServiceCategory.find().sort({ name: 1 }).lean();
  res.json({ success: true, data: categories });
}

export async function createServiceCategory(req: Request, res: Response): Promise<void> {
  const existing = await ServiceCategory.findOne({ name: new RegExp(`^${String(req.body.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
  if (existing) {
    res.status(409).json({ success: false, message: 'A service category with that name already exists' });
    return;
  }
  const category = await ServiceCategory.create(req.body);
  await logActivity({ user: req.user?.id, action: 'service_category.create', targetType: 'serviceCategory', targetId: String(category._id), ip: req.ip });
  res.status(201).json({ success: true, data: category });
}

export async function updateServiceCategory(req: Request, res: Response): Promise<void> {
  const category = await ServiceCategory.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!category) {
    res.status(404).json({ success: false, message: 'Service category not found' });
    return;
  }
  await logActivity({ user: req.user?.id, action: 'service_category.update', targetType: 'serviceCategory', targetId: String(category._id), ip: req.ip });
  res.json({ success: true, data: category });
}

export async function listServiceRecords(req: Request, res: Response): Promise<void> {
  const { page, limit, search, category, residentId, dateFrom, dateTo } = req.query as unknown as {
    page: number;
    limit: number;
    search?: string;
    category?: string;
    residentId?: string;
    dateFrom?: string;
    dateTo?: string;
  };

  const filter: Record<string, unknown> = {};
  if (category) filter.category = new Types.ObjectId(category);
  if (residentId) filter.resident = new Types.ObjectId(residentId);
  if (dateFrom || dateTo) {
    filter.serviceDate = {};
    if (dateFrom) (filter.serviceDate as Record<string, Date>).$gte = new Date(dateFrom);
    if (dateTo) (filter.serviceDate as Record<string, Date>).$lte = new Date(dateTo);
  }
  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const matching = await Resident.find({ $or: [{ firstName: regex }, { lastName: regex }] }).select('_id');
    filter.resident = { $in: matching.map((r) => r._id) };
  }

  const [records, total] = await Promise.all([
    ServiceRecord.find(filter)
      .populate('resident', 'firstName lastName purok')
      .populate('category', 'name')
      .populate('recordedBy', 'fullName')
      .sort({ serviceDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ServiceRecord.countDocuments(filter),
  ]);

  res.json({ success: true, data: records, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function getServiceRecord(req: Request, res: Response): Promise<void> {
  const record = await ServiceRecord.findById(req.params.id).populate('resident category recordedBy').lean();
  if (!record) {
    res.status(404).json({ success: false, message: 'Service record not found' });
    return;
  }
  res.json({ success: true, data: record });
}

export async function createServiceRecord(req: Request, res: Response): Promise<void> {
  const resident = await Resident.findById(req.body.resident);
  if (!resident) {
    res.status(400).json({ success: false, message: 'Resident not found' });
    return;
  }
  const record = await ServiceRecord.create({ ...req.body, recordedBy: req.user?.id });
  await logActivity({ user: req.user?.id, action: 'service.create', targetType: 'serviceRecord', targetId: String(record._id), ip: req.ip });
  res.status(201).json({ success: true, data: record });
}

export async function updateServiceRecord(req: Request, res: Response): Promise<void> {
  const record = await ServiceRecord.findById(req.params.id);
  if (!record) {
    res.status(404).json({ success: false, message: 'Service record not found' });
    return;
  }
  if (req.body.resident) {
    const resident = await Resident.findById(req.body.resident);
    if (!resident) {
      res.status(400).json({ success: false, message: 'Resident not found' });
      return;
    }
  }
  Object.assign(record, req.body);
  await record.save();
  await logActivity({ user: req.user?.id, action: 'service.update', targetType: 'serviceRecord', targetId: String(record._id), ip: req.ip });
  res.json({ success: true, data: record });
}

export async function serviceSummary(_req: Request, res: Response): Promise<void> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [byCategory, totalThisMonth] = await Promise.all([
    ServiceRecord.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'servicecategories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $project: { category: '$category.name', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]),
    ServiceRecord.countDocuments({ serviceDate: { $gte: monthStart } }),
  ]);
  res.json({ success: true, data: { byCategory, totalThisMonth } });
}
