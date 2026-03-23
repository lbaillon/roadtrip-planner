import type { FlushHandler } from './types'

interface DeleteTripPayload {
  tripId: string
}

export interface DeleteTripMutation {
  type: 'DELETE_TRIP'
  payload: DeleteTripPayload
}

export const flushDeleteTrip: FlushHandler<DeleteTripPayload> = async (
  { tripId },
  api
) => {
  await api<void>(`/api/trips/${tripId}`, { method: 'DELETE' })
}
