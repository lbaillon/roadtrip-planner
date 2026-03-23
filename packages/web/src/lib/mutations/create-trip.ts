import type { CreateTripRequest } from '@roadtrip/shared'
import type { FlushHandler } from './types'

interface CreateTripPayload {
  tripId: string
  name: string
  description?: string
  startDate?: string
  endDate?: string
}

export interface CreateTripMutation {
  type: 'CREATE_TRIP'
  payload: CreateTripPayload
}

export const flushCreateTrip: FlushHandler<CreateTripPayload> = async (
  { tripId, name, description, startDate, endDate },
  api
) => {
  await api<void>('/api/trips', {
    method: 'POST',
    body: JSON.stringify({
      id: tripId,
      name,
      description,
      startDate,
      endDate,
    } satisfies CreateTripRequest),
  })
}
