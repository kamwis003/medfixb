import { Router } from 'express'
import { getHelloController } from '../../../controllers/hello-controller'

const router = Router()

/**
 * @swagger
 * /api/v1/hello:
 *   get:
 *     summary: Get hello message
 *     description: Returns a simple hello message to test the API
 *     tags: [Hello]
 *     responses:
 *       200:
 *         description: Success response with hello message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Hello from the service layer! Your architecture is working!
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/hello', getHelloController)

export default router
