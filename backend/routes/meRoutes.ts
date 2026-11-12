import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { getMyProfile, createCorrectionRequest, listMyCorrectionRequests, listMyRequests, createMyRequest, listMyIssued, downloadMyIssuedPdf, getMyOverview, listMyNotifications, markMyNotificationRead, markAllMyNotificationsRead, correctionCreateSchema, myRequestCreateSchema } from '../controllers/meController';

const router = Router();

router.use(authenticate, authorize('resident'));

router.get('/overview', getMyOverview);
router.get('/profile', getMyProfile);
router.get('/notifications', listMyNotifications);
router.post('/notifications/read-all', markAllMyNotificationsRead);
router.post('/notifications/:id/read', markMyNotificationRead);
router.get('/correction-requests', listMyCorrectionRequests);
router.post('/correction-requests', validateBody(correctionCreateSchema), createCorrectionRequest);
router.get('/certificate-requests', listMyRequests);
router.post('/certificate-requests', validateBody(myRequestCreateSchema), createMyRequest);
router.get('/issued', listMyIssued);
router.get('/issued/:id/pdf', downloadMyIssuedPdf);

export default router;
