import type { UpdateTripTracksOrderRequest } from '@roadtrip/shared'
import type { FlushHandler } from './types'

export interface ReorderTripTracksMutation {
  type: 'REORDER_TRIP_TRACKS'
  payload: { tripId: string } & UpdateTripTracksOrderRequest
}

export const flushReorderTripTracks: FlushHandler<
  ReorderTripTracksMutation['payload']
> = async ({ tripId, trackIds }, api) => {
  await api<void>(`/api/trips/${tripId}/tracks`, {
    method: 'PUT',
    body: JSON.stringify({ trackIds } satisfies UpdateTripTracksOrderRequest),
  })
}
