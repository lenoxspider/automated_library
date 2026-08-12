import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
const healthController = new HealthController();

// Only admins should access detailed health metrics
router.get(
  '/',
  authenticate,
  authorize(['admin']),
  healthController.getHealthMetrics.bind(healthController)
);
router.post(
  '/process/:pid/:action',
  authenticate,
  authorize(['admin']),
  healthController.manageProcess.bind(healthController)
);

export default router;
