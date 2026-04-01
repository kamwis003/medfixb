import { Router } from 'express'
import { requireAuth } from '../../../middlewares/auth-handler'
import {
  createDiaryEntryController,
  getMyDiaryEntriesController,
} from '../../../controllers/diary-entries-controller'

const router = Router()

/**
 * @swagger
 * /api/v1/diary-entries:
 *   get:
 *     summary: Returns diary entries for authenticated user
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - DiaryEntries
 *     responses:
 *       200:
 *         description: List of diary entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DiaryEntry'
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Creates a diary entry for authenticated user
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - DiaryEntries
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DiaryEntry'
 *     responses:
 *       201:
 *         description: Diary entry created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */

router.get('/', requireAuth, getMyDiaryEntriesController)
router.post('/', requireAuth, createDiaryEntryController)

export { router as diaryEntriesRouter }
