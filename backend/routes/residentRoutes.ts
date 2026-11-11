import { Router } from 'express';
import multer from 'multer';
import { listResidents, getResident, createResident, updateResident, archiveResident, restoreResident, exportResidents, importResidents, listClassifications, listPuroks, householdOfResident } from '../controllers/residentController';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { validateQuery } from '../middleware/validateQuery';
import { residentCreateSchema, residentUpdateSchema, paginationSchema } from '../validators/residentValidators';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

router.use(authenticate);

router.get('/classifications', authorize('secretary', 'treasurer', 'captain', 'other'), listClassifications);
router.get('/puroks', authorize('secretary', 'treasurer', 'captain', 'other'), listPuroks);
router.get('/export', authorize('secretary'), exportResidents);
router.post('/import', authorize('secretary'), upload.single('file'), importResidents);

router.get('/', validateQuery(paginationSchema), authorize('secretary', 'treasurer', 'captain', 'other'), listResidents);
router.post('/', authorize('secretary'), validateBody(residentCreateSchema), createResident);
router.get('/:id', authorize('secretary', 'treasurer', 'captain', 'other'), getResident);
router.patch('/:id', authorize('secretary'), validateBody(residentUpdateSchema), updateResident);
router.post('/:id/archive', authorize('secretary'), archiveResident);
router.post('/:id/restore', authorize('secretary'), restoreResident);
router.get('/:id/household', authorize('secretary', 'treasurer', 'captain', 'other'), householdOfResident);

export default router;
