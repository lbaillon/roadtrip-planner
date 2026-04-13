import { enqueueMutation, saveGpxBlob } from '#web/lib/mutation-queue'
import type {
  CreateResponse,
  CreateTrackRequest,
  GetTrackResponse,
  TrackSummary,
} from '@roadtrip/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { v7 as uuidv7 } from 'uuid'
import { useEnrichTrackElevation } from './usePutTrackGpx'
import { useApi } from '../useApi'
import type { FlushFn } from './types'
import { getGpxBlob } from '#web/lib/mutation-queue'
import { getGpxName } from '#web/lib/gpx-utils'
import { ApiError } from '#web/lib/api-client'

export interface CreateTrackMutation {
  type: 'CREATE_TRACK'
  payload: Omit<CreateTrackRequest, 'gpxContent'>
}

export function useCreateTrack() {
  const queryClient = useQueryClient()
  return useMutation({
    networkMode: 'offlineFirst',
    mutationFn: async (
      request: Omit<CreateTrackRequest, 'id'>
    ): Promise<CreateResponse> => {
      const trackId = uuidv7()
      await saveGpxBlob(trackId, request.gpxContent)
      await enqueueMutation({
        type: 'CREATE_TRACK',
        payload: { id: trackId },
      })
      return { id: trackId }
    },
    onSuccess: async ({ id: trackId }, { gpxContent }) => {
      queryClient.setQueryData<TrackSummary[]>(['tracks'], (old = []) => [
        ...old,
        { id: trackId, name: getGpxName(gpxContent) ?? 'Route inconnue' },
      ])
      queryClient.setQueryData<GetTrackResponse>(['tracks', trackId], {
        id: trackId,
        gpxContent,
      })
      await queryClient.invalidateQueries({
        queryKey: ['mutation-queue', 'pending'],
      })
    },
  })
}

export function useFlushCreateTrack(): FlushFn<CreateTrackMutation['payload']> {
  const api = useApi()
  const enrichElevation = useEnrichTrackElevation()
  return async ({ id }) => {
    const gpxContent = await getGpxBlob(id)
    if (gpxContent === undefined) {
      throw new ApiError('GPX data lost — please re-upload the track', 422)
    }
    await api<void>('/api/tracks', {
      method: 'POST',
      body: JSON.stringify({
        id,
        gpxContent,
      } satisfies CreateTrackRequest),
    })
    void enrichElevation(id)
  }
}
