import type { CreateTrackRequest } from '@roadtrip/shared'
import { getGpxBlob } from '../gpx-blob-store'
import type { FlushHandler } from './types'

interface CreateTrackPayload {
  trackId: string
  name: string
}

export interface CreateTrackMutation {
  type: 'CREATE_TRACK'
  payload: CreateTrackPayload
}

export const flushCreateTrack: FlushHandler<CreateTrackPayload> = async (
  { trackId, name },
  api
) => {
  const gpxContent = await getGpxBlob(trackId)
  if (gpxContent === undefined) {
    throw new Error('GPX data lost — please re-upload the track')
  }
  await api<void>('/api/tracks', {
    method: 'POST',
    body: JSON.stringify({
      id: trackId,
      name,
      gpxContent,
    } satisfies CreateTrackRequest),
  })
}
