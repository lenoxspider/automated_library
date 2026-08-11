import { Router } from 'express';
import { getTickets, createTicket, resolveTicket } from '../controllers/support.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

// Members can create tickets
router.post('/', createTicket);

// Librarians/Admins can view and resolve
router.get('/', authorize(['librarian', 'admin']), getTickets);
router.put('/:id/resolve', authorize(['librarian', 'admin']), resolveTicket);

export default router;
