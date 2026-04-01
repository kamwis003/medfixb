import { Router } from 'express'
import {
  createArticleController,
  listArticlesController,
} from '@/controllers/endometriosis-articles-controller'
import { requireAuth } from '../../../middlewares/auth-handler'

export const endometriosisArticlesRouter = Router()

/**
 * @swagger
 * /api/v1/endometriosis-articles:
 *   get:
 *     summary: List all endometriosis articles
 *     tags:
 *       - EndometriosisArticles
 *     responses:
 *       200:
 *         description: List of articles
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
 *                     $ref: '#/components/schemas/Article'
 *   post:
 *     summary: Create a new endometriosis article
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - EndometriosisArticles
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ArticleInput'
 *     responses:
 *       201:
 *         description: Article created
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Authentication required
 */

endometriosisArticlesRouter.get('/', requireAuth, listArticlesController)
endometriosisArticlesRouter.post('/', requireAuth, createArticleController)
