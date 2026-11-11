import { Router } from 'express';
import { listCertificateTypes, createCertificateType, updateCertificateType } from '../controllers/certificateTypeController';
import { listRequests, getRequest, createRequest, approveRequest, rejectRequest, issueRequest, downloadCertificatePdf, releaseRequest, cancelRequest, listIssuedCertificates, recordPayment } from '../controllers/certificateRequestController';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { validateQuery } from '../middleware/validateQuery';
import { certificateTypeCreateSchema, certificateTypeUpdateSchema, requestCreateSchema, requestRejectSchema, requestReleaseSchema, requestCancelSchema, paymentRecordSchema } from '../validators/certificateValidators';
import { paginationSchema } from '../validators/residentValidators';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

router.get('/types', authorize('secretary', 'treasurer', 'captain', 'resident'), listCertificateTypes);
router.post('/types', authorize('secretary'), validateBody(certificateTypeCreateSchema), createCertificateType);
router.patch('/types/:id', authorize('secretary'), validateBody(certificateTypeUpdateSchema), updateCertificateType);

router.get('/requests', validateQuery(paginationSchema.extend({ status: z.string().optional(), residentId: z.string().optional() })), authorize('secretary', 'treasurer', 'captain'), listRequests);
router.post('/requests', authorize('secretary'), validateBody(requestCreateSchema), createRequest);
router.get('/requests/:id', authorize('secretary', 'treasurer', 'captain'), getRequest);
router.post('/requests/:id/approve', authorize('secretary', 'captain'), approveRequest);
router.post('/requests/:id/reject', authorize('secretary', 'captain'), validateBody(requestRejectSchema), rejectRequest);
router.post('/requests/:id/issue', authorize('secretary'), issueRequest);
router.post('/requests/:id/release', authorize('secretary'), validateBody(requestReleaseSchema), releaseRequest);
router.post('/requests/:id/cancel', authorize('secretary'), validateBody(requestCancelSchema), cancelRequest);

router.get('/issued', validateQuery(paginationSchema.extend({ paymentStatus: z.string().optional(), residentId: z.string().optional() })), authorize('secretary', 'treasurer', 'captain'), listIssuedCertificates);
router.get('/issued/:id/pdf', authorize('secretary', 'treasurer', 'captain'), downloadCertificatePdf);
router.post('/issued/:id/payment', authorize('secretary', 'treasurer'), validateBody(paymentRecordSchema), recordPayment);

export default router;
