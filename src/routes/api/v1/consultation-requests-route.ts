import { Router } from 'express'
import { requireAuth } from '../../../middlewares/auth-handler'
import {
  createConsultationRequestController,
  getMyConsultationRequestsController,
  getAllConsultationRequestsController,
  updateConsultationRequestStatusController,
  acceptConsultationRequestController,
  rejectConsultationRequestController,
} from '../../../controllers/consultation-requests-controller'

const router = Router()

/**
 * @swagger
 * /api/v1/consultation-requests:
 *   post:
 *     summary: Create a new consultation request (patient)
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - ConsultationRequests
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - specialistType
 *               - consentGiven
 *             properties:
 *               specialistType:
 *                 type: string
 *                 enum: [gynecologist, fertility_specialist, endocrinologist]
 *               doctorId:
 *                 type: string
 *               description:
 *                 type: string
 *               consentGiven:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Consultation request created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: Get all consultation requests (admin only)
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - ConsultationRequests
 *     responses:
 *       200:
 *         description: List of all consultation requests with patient data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/', requireAuth, createConsultationRequestController)
router.get('/', requireAuth, getAllConsultationRequestsController)

/**
 * @swagger
 * /api/v1/consultation-requests/my:
 *   get:
 *     summary: Get consultation requests for the authenticated patient
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - ConsultationRequests
 *     responses:
 *       200:
 *         description: List of patient's consultation requests
 *       401:
 *         description: Unauthorized
 */
router.get('/my', requireAuth, getMyConsultationRequestsController)

/**
 * @swagger
 * /api/v1/consultation-requests/{id}:
 *   patch:
 *     summary: Update consultation request status (admin only)
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - ConsultationRequests
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, rejected]
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Consultation request updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.patch('/:id', requireAuth, updateConsultationRequestStatusController)

/**
 * @swagger
 * /api/v1/consultation-requests/{id}/accept:
 *   patch:
 *     summary: Accept a consultation request (admin only)
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - ConsultationRequests
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Consultation request accepted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.patch('/:id/accept', requireAuth, acceptConsultationRequestController)

/**
 * @swagger
 * /api/v1/consultation-requests/{id}/reject:
 *   patch:
 *     summary: Reject a consultation request (admin only)
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - ConsultationRequests
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Consultation request rejected
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.patch('/:id/reject', requireAuth, rejectConsultationRequestController)

export { router as consultationRequestsRouter }
