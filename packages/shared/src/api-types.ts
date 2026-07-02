import { z } from 'zod'
import { WeatherDataSchema } from './validators.js'

// Params schemas

export const IdParamsSchema = z.object({ id: z.string() }).strict()

export const TrackOfTripParamsSchema = z.object({
  tripId: z.string().min(1, 'Cannot be empty'),
  trackId: z.string().min(1, 'Cannot be empty'),
})

export const TripParticipantParamsSchema = z.object({
  id: z.string().min(1, 'Cannot be empty'),
  userId: z.string().min(1, 'Cannot be empty'),
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

export const UpdateMeRequestSchema = z.object({
  username: z.string().min(1).optional(),
  email: z.email().optional(),
  password: z.string().min(1).optional(),
  currentPassword: z.string().optional(),
})

export const UpdateProfilePictureRequestSchema = z.object({
  image: z.string().min(1),
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

export const SetParticipationRequestSchema = z.object({
  status: z.enum(['accepted', 'declined']),
})

export const ResendConfirmationRequestSchema = z.object({
  email: z.email(),
})

export const ForgotPasswordRequestSchema = z.object({
  email: z.email(),
})

export const ResetPasswordRequestSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(1),
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
  isOwner: z.boolean().optional(),
  sharedBy: z.string().optional(),
})

export const GetTrackVisibilityResponseSchema = z.object({
  publicViaTrip: z.string().nullable(),
})

export const GetSharesResponseSchema = z.object({
  users: z.array(z.object({ email: z.string(), username: z.string() })),
  emails: z.array(z.string()),
})

export const GetMeResponseSchema = z.object({
  username: z.string(),
  email: z.string(),
  profilePicture: z.string().nullable(),
})

// Response types

export type TripSummary = {
  id: string
  name: string
  description?: string
  isPublic: boolean
  isOwner?: boolean
  sharedBy?: string
}
export type TripTrack = { id: string; order: number }
export type TrackSummary = { id: string; name: string }

export type ParticipationStatus = 'pending' | 'accepted' | 'declined'
export type TripParticipant = {
  userId: string
  username: string
  profilePicture: string | null
  status: ParticipationStatus
  isOwner: boolean
}
export type GetTripParticipantsResponse = TripParticipant[]
export type SetParticipationRequest = z.infer<
  typeof SetParticipationRequestSchema
>

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
export type GetMeResponse = z.infer<typeof GetMeResponseSchema>
export type UpdateMeRequest = z.infer<typeof UpdateMeRequestSchema>
export type UpdateProfilePictureRequest = z.infer<
  typeof UpdateProfilePictureRequestSchema
>
export type ResendConfirmationRequest = z.infer<
  typeof ResendConfirmationRequestSchema
>
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>
