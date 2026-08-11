import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import * as borrowingsController from '../controllers/borrowings.controller';

const router = Router();

/**
 * @swagger
 * /fines:
 *   get:
 *     summary: Get all fines
 *     tags: [Fines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all fines
 */
router.get(
  '/',
  authenticate,
  authorize(['admin', 'librarian', 'member']),
  borrowingsController.getFines
);

/**
 * @swagger
 * /fines/{id}/pay:
 *   post:
 *     summary: Mark a fine as paid
 *     tags: [Fines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Fine paid successfully
 */
router.post('/:id/pay', authenticate, authorize(['librarian']), borrowingsController.payFine);

export default router;
