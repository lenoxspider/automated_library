import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
router.use(authenticate, authorize(['admin']));
router.get('/', getAuditLogs);

export default router;
