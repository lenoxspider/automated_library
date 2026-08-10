import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import * as borrowingsController from '../controllers/borrowings.controller';

const router = Router();

/**
 * @swagger
 * /borrowings:
 *   get:
 *     summary: Retrieve a list of all borrowings
 *     tags: [Borrowings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of borrowings
 */
router.get('/', authenticate, authorize(['admin', 'librarian']), borrowingsController.getBorrowings);

/**
 * @swagger
 * /borrowings:
 *   post:
 *     summary: Create a new borrowing (checkout a book)
 *     tags: [Borrowings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               copy_id:
 *                 type: integer
 *               member_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: The created borrowing
 */
router.post('/', authenticate, authorize(['librarian']), borrowingsController.createBorrowing);

/**
 * @swagger
 * /borrowings/return/{id}:
 *   post:
 *     summary: Return a borrowed book
 *     tags: [Borrowings]
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
 *         description: Confirmation of return
 */
router.post('/return/:id', authenticate, authorize(['librarian']), borrowingsController.returnBorrowing);

export default router;
