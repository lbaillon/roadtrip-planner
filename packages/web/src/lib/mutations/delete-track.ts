import type { FlushHandler } from './types'

interface DeleteTrackPayload {
  trackId: string
}

export interface DeleteTrackMutation {
  type: 'DELETE_TRACK'
  payload: DeleteTrackPayload
}

export const flushDeleteTrack: FlushHandler<DeleteTrackPayload> = async (
  { trackId },
  api
) => {
  await api<void>(`/api/tracks/${trackId}`, { method: 'DELETE' })
}
