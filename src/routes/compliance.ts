import { Router } from 'express';
import { getRequests, processRequest } from '../controllers/compliance.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
router.use(authenticate, authorize(['admin']));

router.get('/', getRequests);
router.put('/:id/process', processRequest);

export default router;
