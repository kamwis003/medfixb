import { Request, Response, NextFunction } from 'express'
import { helloService } from '../services/hello-service'
import { asyncHandler } from '../utils/functions/async-handler'

export const getHelloController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const message = helloService.getHelloMessage()

    res.status(200).json({
      status: 'success',
      data: {
        message,
      },
    })
  }
)
