import express, { Router } from 'express'
import helloRouter from './hello-route'
import { userRouter } from './user-route'
import { paymentRoutes as paymentRouter } from './payment-route'
import { productRouter } from './product-route'
import { diaryEntriesRouter } from './diary-entries-route'
import { endometriosisArticlesRouter } from './endometriosis-articles-route'
import patientsRouter from "./patients-route"
import { consultationRequestsRouter } from './consultation-requests-route'

const router: Router = express.Router()

router.use('/', helloRouter)
router.use('/users', userRouter)
router.use('/payments', paymentRouter)
router.use('/products', productRouter)
router.use('/diary-entries', diaryEntriesRouter)
router.use('/endometriosis-articles', endometriosisArticlesRouter)
router.use("/patients", patientsRouter)
router.use('/consultation-requests', consultationRequestsRouter)

export default router
