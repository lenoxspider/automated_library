import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import * as reservationsController from '../controllers/reservations.controller';

const router = Router();

/**
 * @swagger
 * /reservations:
 *   post:
 *     summary: Create a new reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               book_id:
 *                 type: integer
 *               member_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: The created reservation
 */
router.post('/', authenticate, authorize(['member', 'librarian']), reservationsController.createReservation);

/**
 * @swagger
 * /reservations/{id}:
 *   delete:
 *     summary: Cancel a reservation
 *     tags: [Reservations]
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
 *         description: Reservation cancelled successfully
 */
router.delete('/:id', authenticate, authorize(['member', 'librarian']), reservationsController.cancelReservation);

export default router;
