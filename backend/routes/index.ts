import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import residentRoutes from './residentRoutes';
import householdRoutes from './householdRoutes';
import certificateRoutes from './certificateRoutes';
import serviceRoutes from './serviceRoutes';
import reportRoutes from './reportRoutes';
import adminRoutes from './adminRoutes';
import meRoutes from './meRoutes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', service: 'abis-backend', timestamp: new Date().toISOString() } });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/residents', residentRoutes);
router.use('/households', householdRoutes);
router.use('/certificates', certificateRoutes);
router.use('/services', serviceRoutes);
router.use('/', reportRoutes);
router.use('/admin', adminRoutes);
router.use('/me', meRoutes);

export default router;
