import type { AddTrackToTripRequest, TrackOfTripParams } from '@roadtrip/shared'
import type { FlushHandler } from './types'

export interface AddTrackToTripMutation {
  type: 'ADD_TRACK_TO_TRIP'
  payload: TrackOfTripParams & AddTrackToTripRequest
}

export const flushAddTrackToTrip: FlushHandler<
  AddTrackToTripMutation['payload']
> = async ({ tripId, trackId, order }, api) => {
  await api<void>(`/api/trips/${tripId}/tracks/${trackId}`, {
    method: 'POST',
    body: JSON.stringify({ order } satisfies AddTrackToTripRequest),
  })
}
