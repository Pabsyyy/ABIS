import { Router } from 'express';
import { listServiceCategories, createServiceCategory, updateServiceCategory, listServiceRecords, getServiceRecord, createServiceRecord, updateServiceRecord, serviceSummary } from '../controllers/serviceController';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { validateQuery } from '../middleware/validateQuery';
import { serviceCategoryCreateSchema, serviceCategoryUpdateSchema, serviceRecordCreateSchema, serviceRecordUpdateSchema } from '../validators/serviceValidators';
import { paginationSchema } from '../validators/residentValidators';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

router.get('/categories', authorize('secretary', 'treasurer', 'captain'), listServiceCategories);
router.post('/categories', authorize('secretary'), validateBody(serviceCategoryCreateSchema), createServiceCategory);
router.patch('/categories/:id', authorize('secretary'), validateBody(serviceCategoryUpdateSchema), updateServiceCategory);

router.get('/summary', authorize('secretary', 'treasurer', 'captain'), serviceSummary);
router.get('/records', validateQuery(paginationSchema.extend({ category: z.string().optional(), residentId: z.string().optional(), dateFrom: z.string().optional(), dateTo: z.string().optional() })), authorize('secretary', 'treasurer', 'captain'), listServiceRecords);
router.post('/records', authorize('secretary'), validateBody(serviceRecordCreateSchema), createServiceRecord);
router.get('/records/:id', authorize('secretary', 'treasurer', 'captain'), getServiceRecord);
router.patch('/records/:id', authorize('secretary'), validateBody(serviceRecordUpdateSchema), updateServiceRecord);

export default router;
