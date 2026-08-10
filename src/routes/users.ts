import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import * as usersController from '../controllers/users.controller';

const router = Router();

// Admin and Librarian routes
router.get('/', authenticate, authorize(['admin', 'librarian']), usersController.getUsers);
router.get('/:id/history', authenticate, usersController.getUserHistory);

// Admin only routes
router.delete('/:id', authenticate, authorize(['admin']), usersController.deleteUser);

export default router;
