import { JWTPayload } from '#api/services/authentication.js'
import { NextFunction, Request, Response } from 'express'
import { z } from 'zod'

type HandlerArgs<TQuery, TParams, TBody> = (TQuery extends void
  ? Record<string, never>
  : { query: TQuery }) &
  (TParams extends void ? Record<string, never> : { params: TParams }) &
  (TBody extends void ? Record<string, never> : { body: TBody }) & {
    user?: JWTPayload
  }

const emptyObjectSchema = z.object({}).strict()

export function processPost<TBody = void, TParams = void, TOutput = unknown>({
  bodySchema,
  paramsSchema = emptyObjectSchema as unknown as z.ZodSchema<TParams>,
  handler,
}: {
  bodySchema: z.ZodSchema<TBody>
  paramsSchema?: z.ZodSchema<TParams>
  handler: (args: HandlerArgs<void, TParams, TBody>) => Promise<TOutput>
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedBody = bodySchema.parse(req.body) // validate input body using zod to parse with schema
      const validatedParams = paramsSchema.parse(req.params)
      const args = {
        ...(validatedBody !== undefined && { body: validatedBody }),
        ...(validatedParams !== undefined && { params: validatedParams }),
        user: req.user,
      } as HandlerArgs<void, TParams, TBody>
      const result = await handler(args)
      res.status(201).json(result)
    } catch (error) {
      next(error)
    }
  }
}

export function processGet<TQuery = void, TParams = void, TOutput = unknown>({
  querySchema = emptyObjectSchema as unknown as z.ZodSchema<TQuery>,
  paramsSchema = emptyObjectSchema as unknown as z.ZodSchema<TParams>,
  handler,
}: {
  querySchema?: z.ZodSchema<TQuery>
  paramsSchema?: z.ZodSchema<TParams>
  handler: (args: HandlerArgs<TQuery, TParams, void>) => Promise<TOutput>
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = querySchema.parse(req.query)
      const validatedParams = paramsSchema.parse(req.params)
      const args = {
        ...(validatedQuery !== undefined && { query: validatedQuery }),
        ...(validatedParams !== undefined && { params: validatedParams }),
        user: req.user,
      } as HandlerArgs<TQuery, TParams, void>
      const result = await handler(args)
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  }
}

export function processDelete<TParams>({
  paramsSchema,
  handler,
}: {
  paramsSchema: z.ZodSchema<TParams>
  handler: (args: HandlerArgs<void, TParams, void>) => Promise<void>
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedParams = paramsSchema.parse(req.params)
      const args = {
        ...(validatedParams !== undefined && { params: validatedParams }),
        user: req.user,
      } as HandlerArgs<void, TParams, void>
      await handler(args)
      return res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}

export function processPut<TBody = void, TParams = void>({
  bodySchema,
  paramsSchema = emptyObjectSchema as unknown as z.ZodSchema<TParams>,
  handler,
}: {
  bodySchema: z.ZodSchema<TBody>
  paramsSchema?: z.ZodSchema<TParams>
  handler: (args: HandlerArgs<void, TParams, TBody>) => Promise<void>
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedBody = bodySchema.parse(req.query)
      const validatedParams = paramsSchema.parse(req.params)
      const args = {
        ...(validatedBody !== undefined && { query: validatedBody }),
        ...(validatedParams !== undefined && { params: validatedParams }),
        user: req.user,
      } as HandlerArgs<void, TParams, TBody>
      await handler(args)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
