import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import * as reservationsController from '../controllers/reservations.controller';

const router = Router();

/**
 * @swagger
 * /reservations:
 *   get:
 *     summary: List reservations (staff)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of reservations
 */
router.get(
  '/my',
  authenticate,
  authorize(['member', 'librarian', 'admin']),
  reservationsController.getMyReservations
);

router.get(
  '/',
  authenticate,
  authorize(['librarian', 'admin']),
  reservationsController.getReservations
);

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
router.post(
  '/',
  authenticate,
  authorize(['member', 'librarian']),
  reservationsController.createReservation
);

/**
 * @swagger
 * /reservations/bulk:
 *   patch:
 *     summary: Bulk update reservations (staff)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/bulk',
  authenticate,
  authorize(['librarian', 'admin']),
  reservationsController.bulkUpdateReservations
);

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
router.delete(
  '/:id',
  authenticate,
  authorize(['member', 'librarian']),
  reservationsController.cancelReservation
);

/**
 * @swagger
 * /reservations/{id}/approve:
 *   post:
 *     summary: Approve a pending reservation (staff)
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
 *         description: The approved reservation
 */
router.post(
  '/:id/approve',
  authenticate,
  authorize(['librarian', 'admin']),
  reservationsController.approveReservation
);

export default router;
