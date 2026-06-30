import { z } from 'zod'
import { WeatherDataSchema } from './validators.js'

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

export const UpdateTripRequestSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
})

export const AddTrackToTripRequestSchema = z.object({
  order: z.number(),
})

export const UpdateTripTracksOrderRequestSchema = z.object({
  trackIds: z.array(z.string().min(1)),
})

export const UpdateTrackPublicStatusRequestSchema = z.object({
  isPublic: z.boolean(),
})

export const UpdateTripPublicStatusRequestSchema = z.object({
  isPublic: z.boolean(),
})

export const ShareRequestSchema = z.object({
  emails: z.array(z.email()).min(1, 'At least one email is required'),
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
  gpxContent: z.string(),
  isPublic: z.boolean(),
})

export const GetTrackVisibilityResponseSchema = z.object({
  publicViaTrip: z.string().nullable(),
})

export const GetSharesResponseSchema = z.object({
  users: z.array(z.object({ email: z.string(), username: z.string() })),
  emails: z.array(z.string()),
})

// Response types

export type TripSummary = {
  id: string
  name: string
  description?: string
  isPublic: boolean
}
export type TripTrack = { id: string; order: number }
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
export type GetTrackVisibilityResponse = z.infer<
  typeof GetTrackVisibilityResponseSchema
>
export type AddTrackToTripRequest = z.infer<typeof AddTrackToTripRequestSchema>
export type UpdateTripTracksOrderRequest = z.infer<
  typeof UpdateTripTracksOrderRequestSchema
>
export type GetWeatherRequest = z.infer<typeof GetWeatherRequestSchema>
export type GetWeatherResponse = z.infer<typeof GetWeatherResponseSchema>
export type UpdateTrackGpxRequest = z.infer<typeof UpdateTrackGpxRequestSchema>
export type UpdateTripRequest = z.infer<typeof UpdateTripRequestSchema>
export type UpdateTrackPublicStatusRequest = z.infer<
  typeof UpdateTrackPublicStatusRequestSchema
>
export type UpdateTripPublicStatusRequest = z.infer<
  typeof UpdateTripPublicStatusRequestSchema
>
export type ShareRequest = z.infer<typeof ShareRequestSchema>
export type GetSharesResponse = z.infer<typeof GetSharesResponseSchema>
