import { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { asyncHandler } from '../utils/functions/async-handler'
import { userService } from '../services/user-service'
import { updateUserProfileSchema } from '../libs/zod/schemas/user-schema'
import { BadRequestError } from '../utils/errors/app-errors'

export const getUserController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user!
    const userData = await userService.getUser(user.id)

    res.status(200).json({
      success: true,
      data: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role,
      },
    })
  }
)

export const updateUserController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = updateUserProfileSchema.parse(req.body)
      const user = req.user!

      const updatedUser = await userService.updateUserProfile(
        user.id,
        validatedData.firstName,
        validatedData.lastName
      )

      res.status(200).json({
        success: true,
        data: {
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          role: updatedUser.role,
        },
      })
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestError(
          'Validation failed',
          { errors: error.issues },
          'errors.validation_failed'
        )
      }
      throw error
    }
  }
)

export const deleteUserController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user!
    await userService.deleteUser(user.id)
    res.status(204).send()
  }
)
