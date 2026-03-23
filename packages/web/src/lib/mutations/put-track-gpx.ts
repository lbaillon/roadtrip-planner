import { getGpxBlob } from '#web/mutation-queue'
import type { UpdateTrackGpxRequest } from '@roadtrip/shared'
import type { FlushHandler } from './types'

interface PutTrackGpxPayload {
  trackId: string
}

export interface PutTrackGpxMutation {
  type: 'PUT_TRACK_GPX'
  payload: PutTrackGpxPayload
}

export const flushPutTrackGpx: FlushHandler<PutTrackGpxPayload> = async (
  { trackId },
  api
) => {
  const gpxContent = await getGpxBlob(trackId)
  if (gpxContent === undefined) {
    throw new Error('GPX data lost — please re-upload the track')
  }
  await api<void>(`/api/tracks/${trackId}`, {
    method: 'PUT',
    body: JSON.stringify({ gpxContent } satisfies UpdateTrackGpxRequest),
  })
}
