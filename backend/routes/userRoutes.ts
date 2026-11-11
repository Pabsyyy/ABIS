import { Router } from 'express';
import { listUsers, createUser, getUser, updateUser, resetPassword } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createUserSchema, updateUserSchema, resetPasswordSchema } from '../validators/authValidators';

const router = Router();

router.use(authenticate, authorize('secretary'));

router.get('/', listUsers);
router.post('/', validateBody(createUserSchema), createUser);
router.get('/:id', getUser);
router.patch('/:id', validateBody(updateUserSchema), updateUser);
router.post('/:id/reset-password', validateBody(resetPasswordSchema), resetPassword);

export default router;
