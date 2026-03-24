import type { IdParams } from '@roadtrip/shared'
import type { FlushHandler } from './types'

export interface DeleteTrackMutation {
  type: 'DELETE_TRACK'
  payload: IdParams
}

export const flushDeleteTrack: FlushHandler<
  DeleteTrackMutation['payload']
> = async ({ id }, api) => {
  await api<void>(`/api/tracks/${id}`, { method: 'DELETE' })
}
