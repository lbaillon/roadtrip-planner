import type { CreateTripRequest } from '@roadtrip/shared'
import type { FlushHandler } from './types'

export interface CreateTripMutation {
  type: 'CREATE_TRIP'
  payload: CreateTripRequest
}

export const flushCreateTrip: FlushHandler<CreateTripRequest> = async (
  payload,
  api
) => {
  await api<void>('/api/trips', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
