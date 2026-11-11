import { Router } from 'express';
import { dashboardSummaryController, generateReportController, exportReportController } from '../controllers/reportController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard/summary', authorize('secretary', 'treasurer', 'captain'), dashboardSummaryController);
router.get('/reports/:type', authorize('secretary', 'treasurer', 'captain'), generateReportController);
router.get('/reports/:type/export', authorize('secretary', 'treasurer', 'captain'), exportReportController);

export default router;
