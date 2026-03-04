import { JWTPayload } from '#api/services/authentication.js'
import { Request, Response } from 'express'
import { z } from 'zod'

export function processPost<TInput, TOutput>(
  inputSchema: z.ZodSchema<TInput>,
  handler: (body: TInput, user?: JWTPayload) => Promise<TOutput>
) {
  return async (req: Request, res: Response) => {
    try {
      const validatedInput = inputSchema.parse(req.body) // validate input body using zod to parse with schema
      const result = await handler(validatedInput, req.user)
      res.status(201).json(result)
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
  handler: (body: TQuery, user?: JWTPayload) => Promise<TOutput>
) {
  return async (req: Request, res: Response) => {
    try {
      const validatedQuery = querySchema.parse(req.query)
      const result = await handler(validatedQuery, req.user)
      res.status(200).json(result)
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

export function processGetOne<TOutput>(
  handler: (id: string, user?: JWTPayload) => Promise<TOutput>
) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const result = await handler(id, req.user)
      res.status(200).json(result)
    } catch (error) {
      console.error(
        'Error:',
        JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      )
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}

export function processDelete(
  handler: (id: string, user?: JWTPayload) => Promise<void>
) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      await handler(id, req.user)
      return res.status(204)
    } catch (error) {
      console.error(
        'Error:',
        JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      )
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}

export function processPut<TInput>(
  inputSchema: z.ZodSchema<TInput>,
  handler: (id: string, body: TInput, user?: JWTPayload) => Promise<void>
) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const validatedInput = inputSchema.parse(req.body) // validate input body using zod to parse with schema
      await handler(id, validatedInput, req.user)
      res.status(204)
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
