import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import * as usersController from '../controllers/users.controller';

const router = Router();

// Admin and Librarian routes
router.get('/', authenticate, authorize(['admin', 'librarian']), usersController.getUsers);
router.get('/:id/history', authenticate, usersController.getUserHistory);

// Admin and Librarian routes
router.post('/', authenticate, authorize(['admin', 'librarian']), usersController.createUser);
router.delete('/:id', authenticate, authorize(['admin', 'librarian']), usersController.deleteUser);

// Profile
router.get('/profile', authenticate, usersController.getProfile);
router.put('/profile', authenticate, usersController.updateProfile);

export default router;
