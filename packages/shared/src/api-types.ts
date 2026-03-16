import { z } from 'zod'
import { ParsedGpxSchema, WeatherDataSchema } from './validators.js'

// Params schemas

export const IdParamsSchema = z.object({ id: z.string() }).strict()

export const TrackOfTripParamsSchema = z.object({
  tripId: z.string().min(1, 'Cannot be empty'),
  trackId: z.string().min(1, 'Cannot be empty'),
})

export const WaypointParamsSchema = z.object({
  id: z.string(),
  index: z.coerce.number().int().nonnegative(),
})

// Request schemas

export const ParseGpxRequestSchema = z.object({
  gpxContent: z.string().min(1, 'GPX content cannot be empty'),
})

export const CreateUserRequestSchema = z.object({
  email: z.string().min(1, 'Cannot be empty'),
  username: z.string().min(1, 'Cannot be empty'),
  password: z.string().min(1, 'Cannot be empty'),
})

export const LogInRequestSchema = z.object({
  username: z.string().min(1, 'Cannot be empty'),
  password: z.string().min(1, 'Cannot be empty'),
})

export const CreateTrackRequestSchema = z.object({
  name: z.string().optional(),
  gpxContent: z.string().min(1, 'GPX content cannot be empty'),
})

export const UpdateTrackRequestSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  name: z.string(),
  description: z.string().optional(),
})

export const EditWaypointRequestSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
})

export const UpdateUserRequestSchema = z.object({
  email: z.string().min(1, 'Cannot be empty').optional(),
  password: z.string().min(1, 'Cannot be empty').optional(),
  username: z.string().min(1, 'Cannot be empty').optional(),
})

export const CreateTripRequestSchema = z.object({
  name: z.string().min(1, 'Cannot be empty'),
  description: z.string().optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})

export const AddTrackToTripRequestSchema = z.object({
  order: z.number(),
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

export const GetTrackResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  gpxContent: z.string(),
})

export type IdParams = z.infer<typeof IdParamsSchema>
export type TrackOfTripParams = z.infer<typeof TrackOfTripParamsSchema>
export type ParseGpxRequest = z.infer<typeof ParseGpxRequestSchema>
export type ParseGpxResponse = z.infer<typeof ParseGpxResponseSchema>
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>
export type CreateResponse = z.infer<typeof CreateResponseSchema>
export type LogInRequest = z.infer<typeof LogInRequestSchema>
export type LogInResponse = z.infer<typeof LogInResponseSchema>
export type CreateTrackRequest = z.infer<typeof CreateTrackRequestSchema>
export type UpdateTrackRequest = z.infer<typeof UpdateTrackRequestSchema>
export type EditWaypointRequest = z.infer<typeof EditWaypointRequestSchema>
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>
export type CreateTripRequest = z.infer<typeof CreateTripRequestSchema>
export type GetTrackResponse = z.infer<typeof GetTrackResponseSchema>
export type AddTrackToTripRequest = z.infer<typeof AddTrackToTripRequestSchema>
export type WaypointParams = z.infer<typeof WaypointParamsSchema>
