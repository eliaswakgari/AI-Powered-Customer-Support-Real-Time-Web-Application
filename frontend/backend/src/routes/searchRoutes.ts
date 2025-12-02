import { Router } from 'express';
import { authMiddleware, requireRoles } from '../middleware/auth';
import { searchChats } from '../controllers/searchController';
import { getAnalyticsSummary } from '../controllers/analyticsController';

const router = Router();

router.use(authMiddleware);
router.get('/chats', searchChats);
router.get('/analytics/summary', requireRoles('agent', 'admin'), getAnalyticsSummary);

export default router;
