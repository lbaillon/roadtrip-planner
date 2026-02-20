import { Request, Response } from 'express'
import { z } from 'zod'

type Handler<TInput, TOutput> = (body: TInput) => Promise<TOutput> | TOutput

export function processPost<TInput, TOutput>(
  inputSchema: z.ZodSchema<TInput>,
  handler: Handler<TInput, TOutput>
) {
  return async (req: Request, res: Response) => {
    try {
      const validatedInput = inputSchema.parse(req.body) // validate input body using zod to parse with schema
      const result = await handler(validatedInput)
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
