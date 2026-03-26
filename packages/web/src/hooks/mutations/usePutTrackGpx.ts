import { getGpxBlob } from '#web/lib/mutation-queue'
import type { IdParams, UpdateTrackGpxRequest } from '@roadtrip/shared'
import { useApi } from '../useApi'
import type { FlushFn } from './types'

export interface PutTrackGpxMutation {
  type: 'PUT_TRACK_GPX'
  payload: IdParams
}

export function useFlushPutTrackGpx(): FlushFn<PutTrackGpxMutation['payload']> {
  const api = useApi()
  return async ({ id }) => {
    const gpxContent = await getGpxBlob(id)
    if (gpxContent === undefined) {
      throw new Error('GPX data lost — please re-upload the track')
    }
    await api<void>(`/api/tracks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ gpxContent } satisfies UpdateTrackGpxRequest),
    })
  }
}
