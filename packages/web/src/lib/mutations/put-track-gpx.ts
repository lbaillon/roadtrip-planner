import { getGpxBlob } from '../mutation-queue'
import type { IdParams, UpdateTrackGpxRequest } from '@roadtrip/shared'
import type { FlushHandler } from './types'

export interface PutTrackGpxMutation {
  type: 'PUT_TRACK_GPX'
  payload: IdParams
}

export const flushPutTrackGpx: FlushHandler<
  PutTrackGpxMutation['payload']
> = async ({ id }, api) => {
  const gpxContent = await getGpxBlob(id)
  if (gpxContent === undefined) {
    throw new Error('GPX data lost — please re-upload the track')
  }
  await api<void>(`/api/tracks/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ gpxContent } satisfies UpdateTrackGpxRequest),
  })
}
