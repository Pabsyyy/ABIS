import { Router } from 'express';
import { listHouseholds, getHousehold, createHousehold, updateHousehold, addMember, removeMember, transferMember, archiveHousehold } from '../controllers/householdController';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { validateQuery } from '../middleware/validateQuery';
import { householdCreateSchema, householdUpdateSchema, addMemberSchema, transferMemberSchema } from '../validators/householdValidators';
import { paginationSchema } from '../validators/residentValidators';

const router = Router();

router.use(authenticate, authorize('secretary', 'treasurer', 'captain', 'other'));

router.get('/', validateQuery(paginationSchema), listHouseholds);
router.post('/', authorize('secretary'), validateBody(householdCreateSchema), createHousehold);
router.get('/:id', getHousehold);
router.patch('/:id', authorize('secretary'), validateBody(householdUpdateSchema), updateHousehold);
router.post('/:id/members', authorize('secretary'), validateBody(addMemberSchema), addMember);
router.delete('/:id/members/:residentId', authorize('secretary'), removeMember);
router.post('/transfer', authorize('secretary'), validateBody(transferMemberSchema), transferMember);
router.post('/:id/archive', authorize('secretary'), archiveHousehold);

export default router;
