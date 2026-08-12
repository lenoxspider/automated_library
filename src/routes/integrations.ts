import { Router } from 'express';
import {
  getIntegrations,
  createIntegration,
  deleteIntegration
} from '../controllers/integrations.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
router.use(authenticate, authorize(['admin']));

router.get('/', getIntegrations);
router.post('/', createIntegration);
router.delete('/:id', deleteIntegration);

export default router;
