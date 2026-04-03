import { Router } from 'express'
import { requireAuth } from '../../../middlewares/auth-handler'
import { broadcastController } from '../../../controllers/broadcast-controller'

const router = Router()

/**
 * @swagger
 * /api/v1/broadcast:
 *   post:
 *     summary: Send an email broadcast to selected patients (admin only)
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Broadcast
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientIds
 *               - subject
 *               - body
 *             properties:
 *               patientIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               subject:
 *                 type: string
 *               body:
 *                 type: string
 *     responses:
 *       200:
 *         description: Broadcast sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     sent:
 *                       type: number
 *                     failed:
 *                       type: number
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/', requireAuth, broadcastController)

export { router as broadcastRouter }
