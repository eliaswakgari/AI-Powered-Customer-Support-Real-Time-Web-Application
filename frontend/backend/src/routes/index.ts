import { Router } from 'express';
import authRoutes from './authRoutes';
import chatRoutes from './chatRoutes';
import searchRoutes from './searchRoutes';
import mlRoutes from './mlRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/chats', chatRoutes);
router.use('/search', searchRoutes);
router.use('/ml', mlRoutes);
// TODO: router.use('/admin', adminRoutes);

export default router;
