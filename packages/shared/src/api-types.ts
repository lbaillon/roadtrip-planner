import { z } from 'zod'
import { WeatherDataSchema } from './validators.js'
import { number } from 'zod/v4'

// Params schemas

export const IdParamsSchema = z.object({ id: z.string() }).strict()

export const TrackOfTripParamsSchema = z.object({
  tripId: z.string().min(1, 'Cannot be empty'),
  trackId: z.string().min(1, 'Cannot be empty'),
})

// Request schemas

export const GetWeatherRequestSchema = z.object({
  coordinates: z.array(z.object({ lat: z.number(), lon: z.number() })).min(1),
})

export const UpdateTrackGpxRequestSchema = z.object({
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
  id: z.uuidv7(),
  name: z.string().min(1, 'Cannot be empty'),
  gpxContent: z.string().min(1, 'GPX content cannot be empty'),
})

export const UpdateUserRequestSchema = z.object({
  email: z.string().min(1, 'Cannot be empty').optional(),
  password: z.string().min(1, 'Cannot be empty').optional(),
  username: z.string().min(1, 'Cannot be empty').optional(),
})

export const CreateTripRequestSchema = z.object({
  id: z.uuidv7(),
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

export const UpdateTripTracksOrderRequestSchema = z.object({
  trackIds: z.array(z.string().min(1)),
})

// Response schemas

export const GetWeatherResponseSchema = z.array(WeatherDataSchema)

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

// Response types

export type TripSummary = { id: string; name: string }
export type TripTrack = { id: string; name: string; order: number }
export type TrackSummary = { id: string; name: string }

export type IdParams = z.infer<typeof IdParamsSchema>
export type TrackOfTripParams = z.infer<typeof TrackOfTripParamsSchema>
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>
export type CreateResponse = z.infer<typeof CreateResponseSchema>
export type LogInRequest = z.infer<typeof LogInRequestSchema>
export type LogInResponse = z.infer<typeof LogInResponseSchema>
export type CreateTrackRequest = z.infer<typeof CreateTrackRequestSchema>
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>
export type CreateTripRequest = z.infer<typeof CreateTripRequestSchema>
export type GetTrackResponse = z.infer<typeof GetTrackResponseSchema>
export type AddTrackToTripRequest = z.infer<typeof AddTrackToTripRequestSchema>
export type UpdateTripTracksOrderRequest = z.infer<
  typeof UpdateTripTracksOrderRequestSchema
>
export type GetWeatherRequest = z.infer<typeof GetWeatherRequestSchema>
export type GetWeatherResponse = z.infer<typeof GetWeatherResponseSchema>
export type UpdateTrackGpxRequest = z.infer<typeof UpdateTrackGpxRequestSchema>
