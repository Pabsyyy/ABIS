import { Router } from 'express';
import { z } from 'zod';
import { listActivityLogs, getSettings, updateSettings, createBackupController, listBackupLogs, restoreBackupController, listNotifications, markNotificationRead, markAllNotificationsRead, smsPlaceholder, resetOwnPassword } from '../controllers/adminController';
import { listCorrectionRequests, applyCorrectionRequest, rejectCorrectionRequest, correctionResolveSchema } from '../controllers/meController';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { validateQuery } from '../middleware/validateQuery';
import { paginationSchema } from '../validators/residentValidators';

const router = Router();

router.use(authenticate);

router.get('/correction-requests', authorize('secretary'), listCorrectionRequests);
router.post('/correction-requests/:id/apply', authorize('secretary'), validateBody(correctionResolveSchema), applyCorrectionRequest);
router.post('/correction-requests/:id/reject', authorize('secretary'), validateBody(correctionResolveSchema), rejectCorrectionRequest);

router.get('/logs', authorize('secretary'), validateQuery(paginationSchema.extend({ action: z.string().optional(), userId: z.string().optional() })), listActivityLogs);
router.get('/settings', authorize('secretary', 'treasurer', 'captain', 'other'), getSettings);
router.patch('/settings', authorize('secretary'), validateBody(z.object({
  barangayName: z.string().trim().min(1).max(128).optional(),
  municipality: z.string().trim().min(1).max(128).optional(),
  province: z.string().trim().min(1).max(128).optional(),
  captainName: z.string().trim().max(128).optional(),
  contactNumber: z.string().trim().max(64).optional(),
  letterheadText: z.string().trim().max(1024).optional(),
  officeHours: z.string().trim().max(128).optional().or(z.literal('')),
  announcement: z.string().trim().max(1024).optional().or(z.literal('')),
  controlNumberScheme: z.string().trim().min(4).max(64).optional(),
})), updateSettings);

router.post('/backup', authorize('secretary'), createBackupController);
router.get('/backup/logs', authorize('secretary'), listBackupLogs);
router.post('/backup/restore', authorize('secretary'), validateBody(z.object({
  filename: z.string().trim().min(1).max(256),
  password: z.string().min(1).max(128),
  confirm: z.string().trim().min(1),
})), restoreBackupController);

router.get('/notifications', authorize('secretary', 'treasurer', 'captain', 'other'), listNotifications);
router.post('/notifications/read-all', authorize('secretary', 'treasurer', 'captain', 'other'), markAllNotificationsRead);
router.post('/notifications/:id/read', authorize('secretary', 'treasurer', 'captain', 'other'), markNotificationRead);

router.post('/sms/send', authorize('secretary'), smsPlaceholder);
router.post('/me/password', validateBody(z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(128),
})), resetOwnPassword);

export default router;
