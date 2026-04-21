import {
  addWaypointToGpx,
  applyTrkptElevations,
  deleteWaypointFromGpx,
  editWaypointInGpx,
  getAllTrkpts,
  sampleTrkptsByIntervalKm,
  invertGpxTrack,
  setGpxName,
} from '#web/lib/gpx-utils'
import { fetchElevations } from '#web/lib/elevation'
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
import { ApiError } from '#web/lib/api-client'

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

export function useInvertTrack(trackId: string) {
  return useGpxMutation<void>(trackId, (gpx) => invertGpxTrack(gpx))
}

export function useEnrichTrackElevation() {
  const queryClient = useQueryClient()

  return async (trackId: string): Promise<void> => {
    const gpxContent =
      (await getGpxBlob(trackId)) ??
      queryClient.getQueryData<GetTrackResponse>(['tracks', trackId])
        ?.gpxContent
    if (!gpxContent) return

    const allTrkpts = getAllTrkpts(gpxContent)
    if (!allTrkpts.some((p) => p.ele == null)) return

    const totalDistanceKm = allTrkpts.at(-1)?.cumulativeKm ?? 0
    const sampleCount = Math.min(300, Math.max(100, allTrkpts.length))
    const intervalKm = Math.max(1, totalDistanceKm / sampleCount)
    const samples = sampleTrkptsByIntervalKm(allTrkpts, intervalKm)

    const missingSamples = samples.filter((s) => s.ele == null)
    if (missingSamples.length === 0) return

    let elevationValues: number[]
    try {
      elevationValues = await fetchElevations(missingSamples)
    } catch {
      return
    }

    const elevationsMap = new Map<number, number>()
    for (let i = 0; i < missingSamples.length; i++) {
      const elevation = elevationValues[i]
      if (elevation != null)
        elevationsMap.set(missingSamples[i].index, elevation)
    }
    if (elevationsMap.size === 0) return

    const enriched = applyTrkptElevations(gpxContent, elevationsMap)

    await saveGpxBlob(trackId, enriched)
    await enqueueMutation(
      { type: 'PUT_TRACK_GPX', payload: { id: trackId } },
      { dedupeKey: trackId }
    )
    const track = queryClient.getQueryData<GetTrackResponse>([
      'tracks',
      trackId,
    ])
    if (track) {
      queryClient.setQueryData<GetTrackResponse>(['tracks', trackId], {
        ...track,
        gpxContent: enriched,
      })
    }
    await queryClient.invalidateQueries({
      queryKey: ['mutation-queue', 'pending'],
    })
    await queryClient.invalidateQueries({ queryKey: ['weather'] })
  }
}

export function useFlushPutTrackGpx(): FlushFn<PutTrackGpxMutation['payload']> {
  const api = useApi()
  return async ({ id }) => {
    const gpxContent = await getGpxBlob(id)
    if (gpxContent === undefined) {
      throw new ApiError('GPX data lost — please re-upload the track', 422)
    }
    await api<void>(`/api/tracks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ gpxContent } satisfies UpdateTrackGpxRequest),
    })
  }
}

export function useRenameTrack(trackId: string) {
  return useGpxMutation<string>(trackId, (gpx, newName) => setGpxName(gpx, newName))
}
