import type { UpdateTripTracksOrderRequest } from '@roadtrip/shared'
import type { FlushHandler } from './types'

interface ReorderTripTracksPayload {
  tripId: string
  trackIds: string[]
}

export interface ReorderTripTracksMutation {
  type: 'REORDER_TRIP_TRACKS'
  payload: ReorderTripTracksPayload
}

export const flushReorderTripTracks: FlushHandler<
  ReorderTripTracksPayload
> = async ({ tripId, trackIds }, api) => {
  await api<void>(`/api/trips/${tripId}/tracks`, {
    method: 'PUT',
    body: JSON.stringify({ trackIds } satisfies UpdateTripTracksOrderRequest),
  })
}
