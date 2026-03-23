import type { FlushHandler } from './types'

interface RemoveTrackFromTripPayload {
  tripId: string
  trackId: string
}

export interface RemoveTrackFromTripMutation {
  type: 'REMOVE_TRACK_FROM_TRIP'
  payload: RemoveTrackFromTripPayload
}

export const flushRemoveTrackFromTrip: FlushHandler<
  RemoveTrackFromTripPayload
> = async ({ tripId, trackId }, api) => {
  await api<void>(`/api/trips/${tripId}/tracks/${trackId}`, {
    method: 'DELETE',
  })
}
