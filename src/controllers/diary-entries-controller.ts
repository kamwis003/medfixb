import type { Request, Response } from "express";
import { ZodError } from "zod";
import { asyncHandler } from "../utils/functions/async-handler";
import { AppError, BadRequestError } from "../utils/errors/app-errors";
import {
  createDiaryEntry,
  getDiaryEntriesForUserPresentation,
} from "../services/diary-entries-service";
import { diaryEntrySchema } from "../libs/zod/schemas/diary-entry-schema";

export const getMyDiaryEntriesController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const entries = await getDiaryEntriesForUserPresentation(userId);

    return res.status(200).json({
      success: true,
      data: entries,
    });
  }
);

export const createDiaryEntryController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    try {
      const validatedData = diaryEntrySchema.parse(req.body);

      const entry = await createDiaryEntry(userId, {
        ...validatedData,
        cycleDay:
          validatedData.cycleDay === "" ? undefined : validatedData.cycleDay,
      });

      return res.status(201).json({
        success: true,
        data: entry,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestError(
          "Validation failed",
          { errors: error.issues },
          "errors.validation_failed"
        );
      }
      throw error;
    }
  }
);
