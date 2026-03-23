import type { CreateTrackRequest } from '@roadtrip/shared'
import { getGpxBlob } from '../mutation-queue'
import type { FlushHandler } from './types'

export interface CreateTrackMutation {
  type: 'CREATE_TRACK'
  payload: Omit<CreateTrackRequest, 'gpxContent'>
}

export const flushCreateTrack: FlushHandler<
  CreateTrackMutation['payload']
> = async ({ id, name }, api) => {
  const gpxContent = await getGpxBlob(id)
  if (gpxContent === undefined) {
    throw new Error('GPX data lost — please re-upload the track')
  }
  await api<void>('/api/tracks', {
    method: 'POST',
    body: JSON.stringify({
      id,
      name,
      gpxContent,
    } satisfies CreateTrackRequest),
  })
}
