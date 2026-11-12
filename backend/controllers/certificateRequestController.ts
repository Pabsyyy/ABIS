import { Request, Response } from 'express';
import { CertificateRequest } from '../models/CertificateRequest';
import { CertificateType } from '../models/CertificateType';
import { Resident } from '../models/Resident';
import { IssuedCertificate } from '../models/IssuedCertificate';
import { Payment } from '../models/Payment';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { logActivity } from '../services/activityLogService';
import { generateControlNumber, getSettingsSingleton } from '../services/controlNumberService';
import { certificatePdfBuffer } from '../services/pdfService';
import { notifyResident } from '../services/notificationService';
import { Types } from 'mongoose';

export async function listRequests(req: Request, res: Response): Promise<void> {
  const { page, limit, search, status, residentId } = req.query as unknown as {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    residentId?: string;
  };

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (residentId) filter.resident = new Types.ObjectId(residentId);
  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const matching = await Resident.find({ $or: [{ firstName: regex }, { lastName: regex }] }).select('_id');
    filter.resident = { $in: matching.map((r) => r._id) };
  }

  const [requests, total] = await Promise.all([
    CertificateRequest.find(filter)
      .populate('resident', 'firstName lastName birthdate sex purok')
      .populate('certificateType', 'name fee requiresApproval')
      .populate('requestedBy', 'fullName')
      .populate('approvedBy', 'fullName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    CertificateRequest.countDocuments(filter),
  ]);

  res.json({ success: true, data: requests, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function getRequest(req: Request, res: Response): Promise<void> {
  const request = await CertificateRequest.findById(req.params.id)
    .populate('resident')
    .populate('certificateType')
    .populate('requestedBy', 'fullName')
    .populate('approvedBy', 'fullName')
    .populate('issuedCertificate')
    .lean();
  if (!request) {
    res.status(404).json({ success: false, message: 'Request not found' });
    return;
  }
  res.json({ success: true, data: request });
}

export async function createRequest(req: Request, res: Response): Promise<void> {
  const { resident, certificateType, purpose, notes } = req.body as {
    resident: string;
    certificateType: string;
    purpose: string;
    notes?: string;
  };

  const residentDoc = await Resident.findById(resident);
  if (!residentDoc) {
    res.status(400).json({ success: false, message: 'Resident not found' });
    return;
  }
  const typeDoc = await CertificateType.findById(certificateType);
  if (!typeDoc) {
    res.status(400).json({ success: false, message: 'Certificate type not found' });
    return;
  }

  const request = await CertificateRequest.create({
    resident: residentDoc._id,
    certificateType: typeDoc._id,
    purpose,
    notes,
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
          link: `/certificates?request=${request._id}`,
        })
      )
    );
  }

  await logActivity({ user: req.user?.id, action: 'certificate_request.create', targetType: 'certificateRequest', targetId: String(request._id), ip: req.ip });
  res.status(201).json({ success: true, data: request });
}

export async function approveRequest(req: Request, res: Response): Promise<void> {
  const request = await CertificateRequest.findById(req.params.id);
  if (!request) {
    res.status(404).json({ success: false, message: 'Request not found' });
    return;
  }
  if (request.status !== 'pending') {
    res.status(409).json({ success: false, message: `Only pending requests can be approved (current status: ${request.status})` });
    return;
  }
  request.status = 'approved';
  request.approvedBy = req.user?.id as unknown as Types.ObjectId;
  request.approvedAt = new Date();
  await request.save();

  const resident = await Resident.findById(request.resident).select('firstName lastName');
  const secretaries = await User.find({ role: 'secretary', isActive: true }).select('_id');
  await Promise.all(
    secretaries.map((secretary) =>
      Notification.create({
        user: secretary._id,
        title: 'Certificate request approved',
        message: `Request for ${resident?.firstName ?? ''} ${resident?.lastName ?? ''} was approved and is ready for issuance.`,
        type: 'info',
        link: `/certificates?request=${request._id}`,
      })
    )
  );

  await logActivity({ user: req.user?.id, action: 'certificate_request.approve', targetType: 'certificateRequest', targetId: String(request._id), ip: req.ip });
  await notifyResident(request.resident, {
    title: 'Certificate request approved',
    message: 'Your certificate request was approved. Please wait for issuance and pickup instructions.',
    type: 'approval',
    link: '/my-requests',
  });
  res.json({ success: true, data: request });
}

export async function rejectRequest(req: Request, res: Response): Promise<void> {
  const { reason } = req.body as { reason: string };
  const request = await CertificateRequest.findById(req.params.id);
  if (!request) {
    res.status(404).json({ success: false, message: 'Request not found' });
    return;
  }
  if (request.status !== 'pending' && request.status !== 'approved') {
    res.status(409).json({ success: false, message: `Request cannot be rejected in status ${request.status}` });
    return;
  }
  request.status = 'rejected';
  request.rejectionReason = reason;
  request.approvedBy = req.user?.id as unknown as Types.ObjectId;
  request.approvedAt = new Date();
  await request.save();
  await logActivity({ user: req.user?.id, action: 'certificate_request.reject', targetType: 'certificateRequest', targetId: String(request._id), details: { reason }, ip: req.ip });
  await notifyResident(request.resident, {
    title: 'Certificate request rejected',
    message: `Your certificate request was rejected. Reason: ${reason}`,
    type: 'alert',
    link: '/my-requests',
  });
  res.json({ success: true, data: request });
}

export async function issueRequest(req: Request, res: Response): Promise<void> {
  const request = await CertificateRequest.findById(req.params.id).populate('certificateType');
  if (!request) {
    res.status(404).json({ success: false, message: 'Request not found' });
    return;
  }
  if (request.status !== 'approved') {
    res.status(409).json({ success: false, message: `Only approved requests can be issued (current status: ${request.status})` });
    return;
  }
  const typeDoc = request.certificateType as unknown as { _id: Types.ObjectId; name: string; fee: number };
  const residentDoc = await Resident.findById(request.resident);
  if (!residentDoc) {
    res.status(400).json({ success: false, message: 'Resident not found' });
    return;
  }

  const controlNumber = await generateControlNumber();
  const issued = await IssuedCertificate.create({
    request: request._id,
    resident: residentDoc._id,
    certificateType: typeDoc._id,
    controlNumber,
    issuedBy: req.user?.id,
    fee: typeDoc.fee ?? 0,
    paymentStatus: typeDoc.fee > 0 ? 'unpaid' : 'waived',
  });

  request.status = 'ready_for_release';
  request.controlNumber = controlNumber;
  request.issuedCertificate = issued._id as Types.ObjectId;
  await request.save();

  await logActivity({ user: req.user?.id, action: 'certificate_request.issue', targetType: 'issuedCertificate', targetId: String(issued._id), details: { controlNumber }, ip: req.ip });
  await notifyResident(residentDoc._id, {
    title: 'Certificate ready for pickup',
    message: `Your ${typeDoc.name} is ready for pickup. Control No. ${controlNumber}.`,
    type: 'approval',
    link: '/my-requests',
  });
  res.status(201).json({ success: true, data: issued });
}

export async function downloadCertificatePdf(req: Request, res: Response): Promise<void> {
  const issued = await IssuedCertificate.findById(req.params.id)
    .populate('resident')
    .populate('certificateType')
    .populate('request');
  if (!issued) {
    res.status(404).json({ success: false, message: 'Issued certificate not found' });
    return;
  }
  const residentDoc = issued.resident as unknown as { firstName: string; middleName?: string; lastName: string; suffix?: string; birthdate?: Date; address?: string; purok?: string; civilStatus?: string };
  const typeDoc = issued.certificateType as unknown as { name: string };
  const requestDoc = issued.request as unknown as { purpose: string };
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

export async function releaseRequest(req: Request, res: Response): Promise<void> {
  const { releasedTo } = req.body as { releasedTo: string };
  const request = await CertificateRequest.findById(req.params.id);
  if (!request) {
    res.status(404).json({ success: false, message: 'Request not found' });
    return;
  }
  if (request.status !== 'ready_for_release' && request.status !== 'issued') {
    res.status(409).json({ success: false, message: `Only certificates ready for release can be released (current status: ${request.status})` });
    return;
  }
  const issued = await IssuedCertificate.findOne({ request: request._id });
  if (!issued) {
    res.status(400).json({ success: false, message: 'No issued certificate linked to this request' });
    return;
  }
  issued.releasedAt = new Date();
  issued.releasedTo = releasedTo;
  await issued.save();
  request.status = 'released';
  await request.save();
  await logActivity({ user: req.user?.id, action: 'certificate_request.release', targetType: 'issuedCertificate', targetId: String(issued._id), details: { releasedTo }, ip: req.ip });
  await notifyResident(request.resident, {
    title: 'Certificate released',
    message: `Your ${issued.controlNumber} certificate was marked as released.`,
    type: 'info',
    link: '/my-requests',
  });
  res.json({ success: true, data: issued });
}

export async function cancelRequest(req: Request, res: Response): Promise<void> {
  const request = await CertificateRequest.findById(req.params.id);
  if (!request) {
    res.status(404).json({ success: false, message: 'Request not found' });
    return;
  }
  if (request.status === 'released') {
    res.status(409).json({ success: false, message: 'A released certificate cannot be cancelled' });
    return;
  }
  request.status = 'cancelled';
  await request.save();
  await logActivity({ user: req.user?.id, action: 'certificate_request.cancel', targetType: 'certificateRequest', targetId: String(request._id), ip: req.ip });
  res.json({ success: true, data: request });
}

export async function listIssuedCertificates(req: Request, res: Response): Promise<void> {
  const { page, limit, search, paymentStatus, residentId } = req.query as unknown as {
    page: number;
    limit: number;
    search?: string;
    paymentStatus?: string;
    residentId?: string;
  };

  const filter: Record<string, unknown> = {};
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (residentId) filter.resident = new Types.ObjectId(residentId);
  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.controlNumber = regex;
  }

  const [items, total] = await Promise.all([
    IssuedCertificate.find(filter)
      .populate('resident', 'firstName lastName purok')
      .populate('certificateType', 'name')
      .sort({ issuedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    IssuedCertificate.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function recordPayment(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { amount, orNumber, paymentStatus } = req.body as { amount: number; orNumber?: string; paymentStatus: 'unpaid' | 'paid' | 'waived' };

  const issued = await IssuedCertificate.findById(id);
  if (!issued) {
    res.status(404).json({ success: false, message: 'Issued certificate not found' });
    return;
  }

  issued.fee = amount;
  issued.orNumber = orNumber || issued.orNumber;
  issued.paymentStatus = paymentStatus;
  await issued.save();

  const payment = await Payment.create({
    issuedCertificate: issued._id,
    resident: issued.resident,
    amount,
    orNumber,
    paymentStatus,
    recordedBy: req.user?.id,
  });

  await logActivity({ user: req.user?.id, action: 'payment.record', targetType: 'payment', targetId: String(payment._id), details: { orNumber, amount, paymentStatus }, ip: req.ip });
  res.status(201).json({ success: true, data: { issued, payment } });
}
