import { Router } from 'express';
import { getBackups, createBackup, restoreBackup } from '../controllers/backup.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
router.use(authenticate, authorize(['admin']));

router.get('/', getBackups);
router.post('/create', createBackup);
router.post('/restore', restoreBackup);

export default router;
