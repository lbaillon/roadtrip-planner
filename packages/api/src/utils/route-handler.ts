import { JWTPayload } from '#api/services/authentication.js'
import { NextFunction, Request, Response } from 'express'
import { z } from 'zod'

type HandlerArgs<TQuery, TParams, TBody> = (TQuery extends void
  ? object
  : { query: TQuery }) &
  (TParams extends void ? object : { params: TParams }) &
  (TBody extends void ? object : { body: TBody }) & {
    user?: JWTPayload
  }

const emptyObjectSchema = z.object({}).strict()
type VoidSchema = z.ZodVoid

export function processPost<
  TBodySchema extends z.ZodType,
  TParamsSchema extends z.ZodType = VoidSchema,
  TOutput = unknown,
>({
  bodySchema,
  paramsSchema = emptyObjectSchema as unknown as TParamsSchema,
  handler,
}: {
  bodySchema: TBodySchema
  paramsSchema?: TParamsSchema
  handler: (
    args: HandlerArgs<void, z.infer<TParamsSchema>, z.infer<TBodySchema>>
  ) => Promise<TOutput>
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedBody = bodySchema.parse(req.body) as z.infer<TBodySchema>
      const validatedParams = paramsSchema.parse(
        req.params
      ) as z.infer<TParamsSchema>
      const args = {
        ...(validatedBody !== undefined && { body: validatedBody }),
        ...(validatedParams !== undefined && { params: validatedParams }),
        user: req.user,
      } as HandlerArgs<void, z.infer<TParamsSchema>, z.infer<TBodySchema>>
      const result = await handler(args)
      res.status(201).json(result)
    } catch (error) {
      next(error)
    }
  }
}

export function processGet<
  TQuerySchema extends z.ZodType = VoidSchema,
  TParamsSchema extends z.ZodType = VoidSchema,
  TOutput = unknown,
>({
  querySchema = emptyObjectSchema as unknown as TQuerySchema,
  paramsSchema = emptyObjectSchema as unknown as TParamsSchema,
  handler,
}: {
  querySchema?: TQuerySchema
  paramsSchema?: TParamsSchema
  handler: (
    args: HandlerArgs<z.infer<TQuerySchema>, z.infer<TParamsSchema>, void>
  ) => Promise<TOutput>
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = querySchema.parse(
        req.query
      ) as z.infer<TQuerySchema>
      const validatedParams = paramsSchema.parse(
        req.params
      ) as z.infer<TParamsSchema>
      const args = {
        ...(validatedQuery !== undefined && { query: validatedQuery }),
        ...(validatedParams !== undefined && { params: validatedParams }),
        user: req.user,
      } as HandlerArgs<z.infer<TQuerySchema>, z.infer<TParamsSchema>, void>
      const result = await handler(args)
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  }
}

export function processDelete<TParamsSchema extends z.ZodType>({
  paramsSchema,
  handler,
}: {
  paramsSchema: TParamsSchema
  handler: (
    args: HandlerArgs<void, z.infer<TParamsSchema>, void>
  ) => Promise<void>
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedParams = paramsSchema.parse(
        req.params
      ) as z.infer<TParamsSchema>
      const args = {
        params: validatedParams,
        user: req.user,
      } as unknown as HandlerArgs<void, z.infer<TParamsSchema>, void>
      await handler(args)
      return res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}

export function processPut<
  TBodySchema extends z.ZodType,
  TParamsSchema extends z.ZodType = VoidSchema,
>({
  bodySchema,
  paramsSchema = emptyObjectSchema as unknown as TParamsSchema,
  handler,
}: {
  bodySchema: TBodySchema
  paramsSchema?: TParamsSchema
  handler: (
    args: HandlerArgs<void, z.infer<TParamsSchema>, z.infer<TBodySchema>>
  ) => Promise<void>
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedBody = bodySchema.parse(req.body) as z.infer<TBodySchema>
      const validatedParams = paramsSchema.parse(
        req.params
      ) as z.infer<TParamsSchema>
      const args = {
        ...(validatedBody !== undefined && { body: validatedBody }),
        ...(validatedParams !== undefined && { params: validatedParams }),
        user: req.user,
      } as HandlerArgs<void, z.infer<TParamsSchema>, z.infer<TBodySchema>>
      await handler(args)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
