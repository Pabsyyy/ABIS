import { Request, Response } from 'express';
import { CertificateType } from '../models/CertificateType';
import { logActivity } from '../services/activityLogService';

export async function listCertificateTypes(_req: Request, res: Response): Promise<void> {
  const types = await CertificateType.find().sort({ name: 1 }).lean();
  res.json({ success: true, data: types });
}

export async function createCertificateType(req: Request, res: Response): Promise<void> {
  const body = req.body;
  const existing = await CertificateType.findOne({ name: new RegExp(`^${String(body.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
  if (existing) {
    res.status(409).json({ success: false, message: 'A certificate type with that name already exists' });
    return;
  }
  const type = await CertificateType.create(body);
  await logActivity({ user: req.user?.id, action: 'certificate_type.create', targetType: 'certificateType', targetId: String(type._id), ip: req.ip });
  res.status(201).json({ success: true, data: type });
}

export async function updateCertificateType(req: Request, res: Response): Promise<void> {
  const type = await CertificateType.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!type) {
    res.status(404).json({ success: false, message: 'Certificate type not found' });
    return;
  }
  await logActivity({ user: req.user?.id, action: 'certificate_type.update', targetType: 'certificateType', targetId: String(type._id), ip: req.ip });
  res.json({ success: true, data: type });
}
