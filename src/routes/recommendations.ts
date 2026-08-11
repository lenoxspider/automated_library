import { Router } from 'express';
import { getRecommendations } from '../controllers/recommendations.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, getRecommendations);

export default router;
