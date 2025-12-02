import { Router } from 'express';
import { authMiddleware, requireRoles } from '../middleware/auth';
import { analyzeSentimentHandler, smartRepliesHandler } from '../controllers/mlController';

const router = Router();

router.use(authMiddleware);

// Agents and admins can use ML helpers
router.post('/sentiment', requireRoles('agent', 'admin'), analyzeSentimentHandler);
router.post('/suggestions', requireRoles('agent', 'admin'), smartRepliesHandler);

export default router;
