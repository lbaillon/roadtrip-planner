import { JWTPayload } from '#api/services/authentication.js'
import { NextFunction, Request, Response } from 'express'
import { z } from 'zod'

export function processPost<TInput, TOutput>(
  inputSchema: z.ZodSchema<TInput>,
  handler: (body: TInput, user?: JWTPayload) => Promise<TOutput>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedInput = inputSchema.parse(req.body) // validate input body using zod to parse with schema
      const result = await handler(validatedInput, req.user)
      res.status(201).json(result)
    } catch (error) {
      next(error)
    }
  }
}

export function processGet<TQuery, TOutput>(
  querySchema: z.ZodSchema<TQuery>,
  handler: (body: TQuery, user?: JWTPayload) => Promise<TOutput>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = querySchema.parse(req.query)
      const result = await handler(validatedQuery, req.user)
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  }
}

export function processGetOne<TOutput>(
  handler: (id: string, user?: JWTPayload) => Promise<TOutput>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const result = await handler(id, req.user)
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  }
}

export function processDelete(
  handler: (id: string, user?: JWTPayload) => Promise<void>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      await handler(id, req.user)
      return res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}

export function processPut<TInput>(
  inputSchema: z.ZodSchema<TInput>,
  handler: (id: string, body: TInput, user?: JWTPayload) => Promise<void>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const validatedInput = inputSchema.parse(req.body) // validate input body using zod to parse with schema
      await handler(id, validatedInput, req.user)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
