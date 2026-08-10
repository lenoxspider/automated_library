import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import * as settingsController from '../controllers/settings.controller';

const router = Router();

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Get library settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of settings
 */
router.get('/', authenticate, authorize(['admin']), settingsController.getSettings);

/**
 * @swagger
 * /settings/{key}:
 *   put:
 *     summary: Update a specific library setting
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated setting
 */
router.put('/:key', authenticate, authorize(['admin']), settingsController.updateSetting);

export default router;
