import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { CorrectionRequest } from '../models/CorrectionRequest';
import { Resident } from '../models/Resident';
import { CertificateRequest } from '../models/CertificateRequest';
import { CertificateType } from '../models/CertificateType';
import { IssuedCertificate } from '../models/IssuedCertificate';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { logActivity } from '../services/activityLogService';
import { getSettingsSingleton } from '../services/controlNumberService';
import { certificatePdfBuffer } from '../services/pdfService';

const CORRECTABLE_FIELDS = ['contactNumber', 'email', 'address', 'purok', 'occupation', 'monthlyIncome', 'civilStatus', 'suffix'] as const;

function requireResident(req: Request, res: Response): Types.ObjectId | null {
  if (req.user?.role !== 'resident' || !req.user.residentRef) {
    res.status(403).json({ success: false, message: 'Your resident account is not linked to a resident record. Please visit the Barangay Hall.' });
    return null;
  }
  return req.user.residentRef as Types.ObjectId;
}

export const correctionCreateSchema = z.object({
  field: z.enum(CORRECTABLE_FIELDS),
  proposedValue: z.string().trim().min(1, 'Please describe the correction').max(1024),
});

export const myRequestCreateSchema = z.object({
  certificateType: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid certificate type'),
  purpose: z.string().trim().min(3, 'Purpose is required').max(512),
});

export async function getMyProfile(req: Request, res: Response): Promise<void> {
  const residentId = requireResident(req, res);
  if (!residentId) return;
  const resident = await Resident.findById(residentId).lean();
  if (!resident) {
    res.status(404).json({ success: false, message: 'Your resident record was not found. Please visit the Barangay Hall.' });
    return;
  }
  res.json({ success: true, data: resident });
}

export async function createCorrectionRequest(req: Request, res: Response): Promise<void> {
  const residentId = requireResident(req, res);
  if (!residentId) return;
  const { field, proposedValue } = req.body as z.infer<typeof correctionCreateSchema>;

  const correction = await CorrectionRequest.create({
    resident: residentId,
    requestedBy: req.user?.id,
    field,
    proposedValue,
  });

  await logActivity({ user: req.user?.id, action: 'correction_request.create', targetType: 'correctionRequest', targetId: String(correction._id), ip: req.ip });

  const secretaries = await User.find({ role: 'secretary', isActive: true }).select('_id');
  await Promise.all(
    secretaries.map((secretary) =>
      Notification.create({
        user: secretary._id,
        title: 'Resident correction request',
        message: `A resident requested a correction of "${field}".`,
        type: 'info',
        link: '/corrections',
      })
    )
  );

  res.status(201).json({ success: true, data: correction });
}

export async function listMyCorrectionRequests(req: Request, res: Response): Promise<void> {
  const residentId = requireResident(req, res);
  if (!residentId) return;
  const items = await CorrectionRequest.find({ resident: residentId }).sort({ createdAt: -1 }).limit(50).lean();
  res.json({ success: true, data: items });
}

export async function listMyRequests(req: Request, res: Response): Promise<void> {
  const residentId = requireResident(req, res);
  if (!residentId) return;
  const items = await CertificateRequest.find({ resident: residentId })
    .populate('certificateType', 'name fee')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  res.json({ success: true, data: items });
}

export async function createMyRequest(req: Request, res: Response): Promise<void> {
  const residentId = requireResident(req, res);
  if (!residentId) return;
  const { certificateType, purpose } = req.body as z.infer<typeof myRequestCreateSchema>;

  const residentDoc = await Resident.findById(residentId);
  if (!residentDoc) {
    res.status(404).json({ success: false, message: 'Your resident record was not found. Please visit the Barangay Hall.' });
    return;
  }
  const typeDoc = await CertificateType.findById(certificateType);
  if (!typeDoc || !typeDoc.active) {
    res.status(400).json({ success: false, message: 'Certificate type is not available' });
    return;
  }

  const request = await CertificateRequest.create({
    resident: residentDoc._id,
    certificateType: typeDoc._id,
    purpose,
    requestedBy: req.user?.id,
    status: 'pending',
  });

  if (typeDoc.requiresApproval) {
    const captains = await User.find({ role: 'captain', isActive: true }).select('_id');
    await Promise.all(
      captains.map((captain) =>
        Notification.create({
          user: captain._id,
          title: 'Certificate approval pending',
          message: `${residentDoc.firstName} ${residentDoc.lastName} requested ${typeDoc.name}.`,
          type: 'approval',
          link: '/certificates',
        })
      )
    );
  }

  await logActivity({ user: req.user?.id, action: 'certificate_request.create', targetType: 'certificateRequest', targetId: String(request._id), ip: req.ip, details: { via: 'resident-self-service' } });
  res.status(201).json({ success: true, data: request });
}

export async function listMyIssued(req: Request, res: Response): Promise<void> {
  const residentId = requireResident(req, res);
  if (!residentId) return;
  const items = await IssuedCertificate.find({ resident: residentId })
    .populate('certificateType', 'name')
    .sort({ issuedAt: -1 })
    .limit(100)
    .lean();
  res.json({ success: true, data: items });
}

export async function downloadMyIssuedPdf(req: Request, res: Response): Promise<void> {
  const residentId = requireResident(req, res);
  if (!residentId) return;
  const issued = await IssuedCertificate.findOne({ _id: req.params.id, resident: residentId })
    .populate('certificateType')
    .populate('request');
  if (!issued) {
    res.status(404).json({ success: false, message: 'Issued certificate not found' });
    return;
  }
  const residentDoc = await Resident.findById(residentId).lean();
  if (!residentDoc) {
    res.status(404).json({ success: false, message: 'Resident record not found' });
    return;
  }
  const typeDoc = issued.certificateType as unknown as { name: string };
  const requestDoc = issued.request as unknown as { purpose: string } | null;
  const settings = await getSettingsSingleton();
  const pdf = await certificatePdfBuffer({
    settings,
    resident: residentDoc,
    certificateTypeName: typeDoc.name,
    controlNumber: issued.controlNumber,
    purpose: requestDoc?.purpose ?? '',
    fee: issued.fee,
    orNumber: issued.orNumber,
    issuedAt: issued.issuedAt,
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="certificate-${issued.controlNumber}.pdf"`);
  res.send(pdf);
}

export async function listCorrectionRequests(req: Request, res: Response): Promise<void> {
  const { status } = req.query as { status?: string };
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  const items = await CorrectionRequest.find(filter)
    .populate('resident', 'firstName lastName purok')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  res.json({ success: true, data: items });
}

export const correctionResolveSchema = z.object({
  resolutionNote: z.string().trim().max(512).optional().or(z.literal('')),
});

export async function applyCorrectionRequest(req: Request, res: Response): Promise<void> {
  const correction = await CorrectionRequest.findById(req.params.id);
  if (!correction) {
    res.status(404).json({ success: false, message: 'Correction request not found' });
    return;
  }
  if (correction.status !== 'pending') {
    res.status(409).json({ success: false, message: `Correction request already ${correction.status}` });
    return;
  }
  const resident = await Resident.findById(correction.resident);
  if (!resident) {
    res.status(404).json({ success: false, message: 'Resident not found' });
    return;
  }
  const { resolutionNote } = req.body as z.infer<typeof correctionResolveSchema>;
  const update: Record<string, string | number | undefined> = {};
  if (correction.field === 'monthlyIncome') {
    const income = Number(correction.proposedValue);
    if (Number.isNaN(income) || income < 0) {
      res.status(400).json({ success: false, message: 'Proposed value is not a valid amount' });
      return;
    }
    update.monthlyIncome = income;
  } else {
    update[correction.field] = correction.proposedValue;
  }
  await Resident.findByIdAndUpdate(resident._id, { $set: update }, { runValidators: true });

  correction.status = 'applied';
  correction.resolvedBy = req.user?.id as unknown as Types.ObjectId;
  correction.resolvedAt = new Date();
  correction.resolutionNote = resolutionNote || undefined;
  await correction.save();

  await logActivity({ user: req.user?.id, action: 'correction_request.apply', targetType: 'correctionRequest', targetId: String(correction._id), details: { field: correction.field }, ip: req.ip });
  res.json({ success: true, data: correction });
}

export async function rejectCorrectionRequest(req: Request, res: Response): Promise<void> {
  const correction = await CorrectionRequest.findById(req.params.id);
  if (!correction) {
    res.status(404).json({ success: false, message: 'Correction request not found' });
    return;
  }
  if (correction.status !== 'pending') {
    res.status(409).json({ success: false, message: `Correction request already ${correction.status}` });
    return;
  }
  const { resolutionNote } = req.body as z.infer<typeof correctionResolveSchema>;
  correction.status = 'rejected';
  correction.resolvedBy = req.user?.id as unknown as Types.ObjectId;
  correction.resolvedAt = new Date();
  correction.resolutionNote = resolutionNote || undefined;
  await correction.save();

  await logActivity({ user: req.user?.id, action: 'correction_request.reject', targetType: 'correctionRequest', targetId: String(correction._id), details: { field: correction.field }, ip: req.ip });
  res.json({ success: true, data: correction });
}
