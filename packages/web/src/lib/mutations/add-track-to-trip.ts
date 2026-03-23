import type { AddTrackToTripRequest } from '@roadtrip/shared'
import type { FlushHandler } from './types'

interface AddTrackToTripPayload {
  tripId: string
  trackId: string
  order: number
}

export interface AddTrackToTripMutation {
  type: 'ADD_TRACK_TO_TRIP'
  payload: AddTrackToTripPayload
}

export const flushAddTrackToTrip: FlushHandler<AddTrackToTripPayload> = async (
  { tripId, trackId, order },
  api
) => {
  await api<void>(`/api/trips/${tripId}/tracks/${trackId}`, {
    method: 'POST',
    body: JSON.stringify({ order } satisfies AddTrackToTripRequest),
  })
}
