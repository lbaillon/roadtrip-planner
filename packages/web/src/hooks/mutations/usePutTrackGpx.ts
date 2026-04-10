import {
  addWaypointToGpx,
  deleteWaypointFromGpx,
  editWaypointInGpx,
  invertGpxTrack,
} from '#web/lib/gpx-utils'
import {
  enqueueMutation,
  getGpxBlob,
  saveGpxBlob,
} from '#web/lib/mutation-queue'
import type { IdParams, UpdateTrackGpxRequest } from '@roadtrip/shared'
import { type GetTrackResponse } from '@roadtrip/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '../useApi'
import type { FlushFn } from './types'

export interface PutTrackGpxMutation {
  type: 'PUT_TRACK_GPX'
  payload: IdParams
}

function useGpxMutation<TRequest>(
  trackId: string,
  transform: (gpxContent: string, request: TRequest) => string
) {
  const queryClient = useQueryClient()
  return useMutation({
    networkMode: 'offlineFirst',
    mutationFn: async (request: TRequest) => {
      const gpxContent =
        (await getGpxBlob(trackId)) ??
        queryClient.getQueryData<GetTrackResponse>(['tracks', trackId])
          ?.gpxContent
      if (!gpxContent) throw new Error('Track GPX not available')
      const updatedGpx = transform(gpxContent, request)
      await saveGpxBlob(trackId, updatedGpx)
      await enqueueMutation(
        { type: 'PUT_TRACK_GPX', payload: { id: trackId } },
        { dedupeKey: trackId }
      )
      return updatedGpx
    },
    onSuccess: async () => {
      const gpxContent = await getGpxBlob(trackId)
      const track = queryClient.getQueryData<GetTrackResponse>([
        'tracks',
        trackId,
      ])
      if (track && gpxContent) {
        queryClient.setQueryData<GetTrackResponse>(['tracks', trackId], {
          ...track,
          gpxContent,
        })
      }
      await queryClient.invalidateQueries({
        queryKey: ['mutation-queue', 'pending'],
      })
    },
  })
}

export function useAddWaypoint(trackId: string) {
  return useGpxMutation<{
    lat: number
    lon: number
    name: string
    description?: string
  }>(trackId, (gpx, request) => addWaypointToGpx(gpx, request))
}

export function useEditWaypoint(trackId: string) {
  return useGpxMutation<{ index: number; name: string; description?: string }>(
    trackId,
    (gpx, request) =>
      editWaypointInGpx(gpx, request.index, {
        name: request.name,
        description: request.description,
      })
  )
}

export function useDeleteWaypoint(trackId: string) {
  return useGpxMutation<number>(trackId, (gpx, index) =>
    deleteWaypointFromGpx(gpx, index)
  )
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

export function useInvertTrack(trackId: string) {
  return useGpxMutation<void>(trackId, (gpx) => invertGpxTrack(gpx))
}
