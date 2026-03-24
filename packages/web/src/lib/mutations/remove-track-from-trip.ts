import type { TrackOfTripParams } from '@roadtrip/shared'
import type { FlushHandler } from './types'

export interface RemoveTrackFromTripMutation {
  type: 'REMOVE_TRACK_FROM_TRIP'
  payload: TrackOfTripParams
}

export const flushRemoveTrackFromTrip: FlushHandler<
  RemoveTrackFromTripMutation['payload']
> = async ({ tripId, trackId }, api) => {
  await api<void>(`/api/trips/${tripId}/tracks/${trackId}`, {
    method: 'DELETE',
  })
}
