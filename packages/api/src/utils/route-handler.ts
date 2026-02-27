import { JWTPayload } from '#api/services/authentication.js'
import { Request, Response } from 'express'
import { z, ZodSchema } from 'zod'

type Handler<TInput, TOutput> = (
  body: TInput,
  user?: JWTPayload
) => Promise<TOutput> | TOutput

export function processPost<TInput, TOutput>(
  inputSchema: z.ZodSchema<TInput>,
  handler: Handler<TInput, TOutput>
) {
  return async (req: Request, res: Response) => {
    try {
      const validatedInput = inputSchema.parse(req.body) // validate input body using zod to parse with schema
      const result = await handler(validatedInput, req.user)
      res.json(result)
    } catch (error) {
      console.error(
        'Error:',
        JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      )

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        })
      }
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}

export function processGet<TQuery, TOutput>(
  querySchema: z.ZodSchema<TQuery>,
  handler: Handler<TQuery, TOutput>
) {
  return async (req: Request, res: Response) => {
    try {
      const validatedQuery = querySchema.parse(req.query)
      const result = await handler(validatedQuery)
      res.json(result)
    } catch (error) {
      console.error(
        'Error:',
        JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      )

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        })
      }

      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}

export function processDelete(deleteFn: (id: string) => Promise<unknown>) {
  return async (req: Request, res: Response) => {
    const { id } = req.params

    const result = await deleteFn(id)

    if (!result) {
      return res.status(404).json({ message: 'Not found' })
    }

    return res.status(200).json(result)
  }
}

export function processPut<T>(
  schema: ZodSchema<T>,
  updateFn: (id: string, body: T) => Promise<unknown>
) {
  return async (req: Request, res: Response) => {
    const parsed = schema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error })
    }

    const { id } = req.params
    const result = await updateFn(id, parsed.data)

    if (!result) {
      return res.status(404).json({ message: 'Not found' })
    }

    return res.status(200).json(result)
  }
}
