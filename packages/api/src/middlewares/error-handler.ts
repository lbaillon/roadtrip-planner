import { env } from '#api/env.js'
import { AppError } from '#api/errors/app-errors.js'
import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction // eslint-disable-line @typescript-eslint/no-unused-vars
) {
  console.error(
    'Error:',
    JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
  )
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
    })
  }
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: error.errors,
    })
  }
  return res.status(500).json({
    error: env.isDev ? error.message : 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(env.isDev ? { stack: error.stack } : {}),
  })
}
