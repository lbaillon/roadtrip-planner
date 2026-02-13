import { z } from 'zod'
import { ParsedGpxSchema, WeatherDataSchema } from './validators'

// Request schemas
export const ParseGpxRequestSchema = z.object({
  gpxContent: z.string().min(1, 'GPX content cannot be empty'),
})

// Response schemas
export const ParseGpxResponseSchema = z.object({
  route: ParsedGpxSchema,
  weather: z.array(WeatherDataSchema),
})

export type ParseGpxRequest = z.infer<typeof ParseGpxRequestSchema>
export type ParseGpxResponse = z.infer<typeof ParseGpxResponseSchema>
