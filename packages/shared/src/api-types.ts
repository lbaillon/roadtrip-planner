import { z } from 'zod'
import { ParsedGpxSchema, WeatherDataSchema, UserSchema } from './validators.js'
import { email } from 'zod/v4'

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

// Response schemas
export const ParseGpxResponseSchema = z.object({
  route: ParsedGpxSchema,
  weather: z.array(WeatherDataSchema),
})

export const CreateResponseSchema = z.object({
  id: z.string(),
})

export const LogInResponseSchema = z.object({
  id: z.string(),
})

export type ParseGpxRequest = z.infer<typeof ParseGpxRequestSchema>
export type ParseGpxResponse = z.infer<typeof ParseGpxResponseSchema>
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>
export type CreateResponse = z.infer<typeof CreateResponseSchema>
export type LogInRequest = z.infer<typeof LogInRequestSchema>
export type LogInResponse = z.infer<typeof LogInResponseSchema>
