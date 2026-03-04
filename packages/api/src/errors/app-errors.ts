import { codes } from './error-codes.js'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: (typeof codes)[keyof typeof codes],
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class NotFoundError extends AppError {
  constructor(
    message: string = 'Resource not found',
    code: (typeof codes)[keyof typeof codes],
    options?: ErrorOptions
  ) {
    super(404, message, code, options)
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message: string = 'Access forbidden',
    code: (typeof codes)[keyof typeof codes],
    options?: ErrorOptions
  ) {
    super(403, message, code, options)
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    message: string = 'Unauthorized',
    code: (typeof codes)[keyof typeof codes],
    options?: ErrorOptions
  ) {
    super(401, message, code, options)
  }
}

export class ConflictError extends AppError {
  constructor(
    message: string = 'Resource already exists',
    code: (typeof codes)[keyof typeof codes],
    options?: ErrorOptions
  ) {
    super(409, message, code, options)
  }
}

export class BadRequestError extends AppError {
  constructor(
    message: string = 'Bad request',
    code: (typeof codes)[keyof typeof codes],
    options?: ErrorOptions
  ) {
    super(400, message, code, options)
  }
}
