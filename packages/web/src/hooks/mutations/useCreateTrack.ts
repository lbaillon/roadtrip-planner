import { enqueueMutation, saveGpxBlob } from '#web/lib/mutation-queue'
import type {
  CreateResponse,
  CreateTrackRequest,
  GetTrackResponse,
  TrackSummary,
} from '@roadtrip/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { v7 as uuidv7 } from 'uuid'
import { useApi } from '../useApi'
import type { FlushFn } from './types'
import { getGpxBlob } from '#web/lib/mutation-queue'

export interface CreateTrackMutation {
  type: 'CREATE_TRACK'
  payload: Omit<CreateTrackRequest, 'gpxContent'>
}

export function useCreateTrack() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      request: Omit<CreateTrackRequest, 'id' | 'name'> & { name?: string }
    ): Promise<CreateResponse> => {
      const trackId = uuidv7()
      const trackName = request.name ?? 'Unnamed Track'
      await saveGpxBlob(trackId, request.gpxContent)
      await enqueueMutation({
        type: 'CREATE_TRACK',
        payload: { id: trackId, name: trackName },
      })
      return { id: trackId }
    },
    onSuccess: async ({ id: trackId }, { name, gpxContent }) => {
      const trackName = name ?? 'Unnamed Track'
      queryClient.setQueryData<TrackSummary[]>(['tracks'], (old = []) => [
        ...old,
        { id: trackId, name: trackName },
      ])
      queryClient.setQueryData<GetTrackResponse>(['tracks', trackId], {
        id: trackId,
        name: trackName,
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
  return async ({ id, name }) => {
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
}
