import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import * as reportsController from '../controllers/reports.controller';

const router = Router();

/**
 * @swagger
 * /reports/circulation:
 *   get:
 *     summary: Get the circulation log
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Circulation logs
 */
router.get('/circulation', authenticate, authorize(['admin', 'librarian']), reportsController.getCirculationLog);

/**
 * @swagger
 * /reports/blocked:
 *   get:
 *     summary: Get a list of blocked members
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Blocked members
 */
router.get('/blocked', authenticate, authorize(['admin', 'librarian']), reportsController.getBlockedMembers);

/**
 * @swagger
 * /reports/roster-audit:
 *   get:
 *     summary: Audit users against the student roster
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit results
 */
router.get('/roster-audit', authenticate, authorize(['admin']), reportsController.getRosterAudit);

export default router;
