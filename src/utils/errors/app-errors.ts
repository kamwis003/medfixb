export class AppError extends Error {
  public readonly statusCode: number
  public readonly data?: unknown
  public readonly translationKey?: string

  constructor(message: string, statusCode: number, data?: unknown, translationKey?: string) {
    super(message)
    this.statusCode = statusCode
    this.data = data
    this.translationKey = translationKey
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', translationKey = 'errors.resource_not_found') {
    super(message, 404, undefined, translationKey)
  }
}

export class BadRequestError extends AppError {
  constructor(
    message = 'Invalid request. Please check your input and try again.',
    data?: unknown,
    translationKey = 'errors.bad_request'
  ) {
    super(message, 400, data, translationKey)
  }
}

export class ValidationError extends AppError {
  constructor(
    message = 'Please check your input and try again.',
    errors: unknown,
    translationKey = 'errors.validation_failed'
  ) {
    super(message, 422, { errors }, translationKey)
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    message = 'Please log in to access this resource.',
    translationKey = 'errors.unauthorized'
  ) {
    super(message, 401, undefined, translationKey)
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message = 'You do not have permission to access this resource.',
    translationKey = 'errors.forbidden'
  ) {
    super(message, 403, undefined, translationKey)
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(
    message = 'This service is temporarily unavailable. Please try again later.',
    data?: unknown,
    translationKey = 'errors.service_unavailable'
  ) {
    super(message, 503, data, translationKey)
  }
}

export class TimeoutError extends AppError {
  constructor(
    message = 'The request took too long to process. Please try again.',
    data?: unknown,
    translationKey = 'errors.timeout'
  ) {
    super(message, 408, data, translationKey)
  }
}
