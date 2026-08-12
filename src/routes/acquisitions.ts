import { Router } from 'express';
import { getOrders, createOrder, updateOrderStatus, receiveOrder } from '../controllers/acquisitions.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// Only librarians and admins should access acquisitions
router.use(authenticate, authorize(['librarian', 'admin']));

router.get('/', getOrders);
router.post('/', createOrder);
router.put('/:id/status', updateOrderStatus);
router.post('/:id/receive', receiveOrder);

export default router;
