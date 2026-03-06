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

type HandlerArgs<TQuery, TParams> = (TQuery extends void
  ? Record<string, never>
  : { query: TQuery }) &
  (TParams extends void ? Record<string, never> : { params: TParams }) & {
    user?: JWTPayload
  }
export function processGet<TQuery = void, TParams = void, TOutput = unknown>({
  querySchema = z.void() as unknown as z.ZodSchema<TQuery>,
  paramsSchema = z.void() as unknown as z.ZodSchema<TParams>,
  handler,
}: {
  querySchema?: z.ZodSchema<TQuery>
  paramsSchema?: z.ZodSchema<TParams>
  handler: (args: HandlerArgs<TQuery, TParams>) => Promise<TOutput>
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = querySchema.parse(req.query)
      const validatedParams = paramsSchema.parse(req.params)

      const args = {
        ...(validatedQuery !== undefined && { query: validatedQuery }),
        ...(validatedParams !== undefined && { params: validatedParams }),
        user: req.user,
      } as HandlerArgs<TQuery, TParams>

      const result = await handler(args)

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
      return res.status(204)
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
      res.status(204)
    } catch (error) {
      next(error)
    }
  }
}
