import type { Request, Response } from "express"
import { asyncHandler } from "@/utils/functions/async-handler"
import { listProfiles, getProfileById, getDiaryEntriesByUserId } from "@/services/profile-service"
import { AppError } from "@/utils/errors/app-errors"
import { mapDiaryEntry } from "@/services/diary-entries-service"

export const listProfilesController = asyncHandler(
  async (_req: Request, res: Response) => {
    const profiles = await listProfiles()
    return res.status(200).json({ success: true, data: profiles })
  }
)

export const getProfileByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params['id'] as string
    const profile = await getProfileById(id)
    if (!profile) throw new AppError('Not found', 404)
    return res.status(200).json({ success: true, data: profile })
  }
)

export const getPatientDiaryEntriesController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params['id'] as string
    const entries = await getDiaryEntriesByUserId(id)
    const mapped = entries.map(mapDiaryEntry)
    return res.status(200).json({ success: true, data: mapped })
  }
)
