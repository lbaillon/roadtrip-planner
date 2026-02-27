import { z } from 'zod'
import { ParsedGpxSchema, WeatherDataSchema } from './validators.js'

// Request schemas
export const ParseGpxRequestSchema = z.object({
  gpxContent: z.string().min(1, 'GPX content cannot be empty'),
})

export const CreateUserRequestSchema = z.object({
  email: z.string(),
  username: z.string(),
  password: z.string(),
})

export const LogInRequestSchema = z.object({
  username: z.string(),
  password: z.string(),
})

export const CreateTrackRequestSchema = z.object({
  name: z.string().optional(),
  gpxContent: z.string().min(1, 'GPX content cannot be empty'),
  userId: z.string(),
})

export const UpdateTrackRequestSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  name: z.string(),
})

// Response schemas
export const ParseGpxResponseSchema = z.object({
  route: ParsedGpxSchema,
  weather: z.array(WeatherDataSchema),
})

export const CreateResponseSchema = z.object({
  id: z.string(),
})

export const LogInResponseSchema = z.object({
  accessToken: z.string(),
})

export type ParseGpxRequest = z.infer<typeof ParseGpxRequestSchema>
export type ParseGpxResponse = z.infer<typeof ParseGpxResponseSchema>
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>
export type CreateResponse = z.infer<typeof CreateResponseSchema>
export type LogInRequest = z.infer<typeof LogInRequestSchema>
export type LogInResponse = z.infer<typeof LogInResponseSchema>
export type CreateTrackRequest = z.infer<typeof CreateTrackRequestSchema>
export type UpdateTrackRequest = z.infer<typeof UpdateTrackRequestSchema>
