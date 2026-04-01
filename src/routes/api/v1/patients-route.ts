import { Router } from "express"
import { requireAuth } from '../../../middlewares/auth-handler'
import {
  listProfilesController,
  getProfileByIdController,
  getPatientDiaryEntriesController,
} from '@/controllers/profile-controller'

const router = Router()

router.get("/", requireAuth, listProfilesController)
router.get("/:id", requireAuth, getProfileByIdController)
router.get("/:id/diary-entries", requireAuth, getPatientDiaryEntriesController)

export default router
