import type { IdParams } from '@roadtrip/shared'
import type { FlushHandler } from './types'

export interface DeleteTripMutation {
  type: 'DELETE_TRIP'
  payload: IdParams
}

export const flushDeleteTrip: FlushHandler<
  DeleteTripMutation['payload']
> = async ({ id }, api) => {
  await api<void>(`/api/trips/${id}`, { method: 'DELETE' })
}
