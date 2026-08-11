import { Router } from 'express';
import { getMyContributions, submitContribution, getQueue, approveContribution, rejectContribution } from '../controllers/contributions.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

// Member routes
router.get('/me', authorize(['member', 'librarian', 'admin']), getMyContributions);
router.post('/', authorize(['member', 'librarian', 'admin']), submitContribution);

// Librarian routes
router.get('/queue', authorize(['librarian', 'admin']), getQueue);
router.put('/:id/approve', authorize(['librarian', 'admin']), approveContribution);
router.put('/:id/reject', authorize(['librarian', 'admin']), rejectContribution);

export default router;
