import {
  addWaypointToGpx,
  deleteWaypointFromGpx,
  editWaypointInGpx,
  parseGpxFile,
} from '#web/lib/gpx-utils'
import { enqueueMutation, saveGpxBlob } from '#web/lib/mutation-queue'
import {
  type CreateResponse,
  type CreateTrackRequest,
  type GetTrackResponse,
  type TrackSummary,
} from '@roadtrip/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { v7 as uuidv7 } from 'uuid'
import { useApi } from './useApi'

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

export function useDeleteTrack() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await enqueueMutation(
        { type: 'DELETE_TRACK', payload: { id } },
        { dedupeKey: id }
      )
    },
    onSuccess: async (_, id) => {
      queryClient.setQueryData<TrackSummary[]>(['tracks'], (old = []) =>
        old.filter((t) => t.id !== id)
      )
      queryClient.removeQueries({ queryKey: ['tracks', id] })
      await queryClient.invalidateQueries({
        queryKey: ['mutation-queue', 'pending'],
      })
    },
  })
}

export function useGetTracks() {
  const api = useApi()
  return useQuery({
    queryKey: ['tracks'],
    queryFn: () => api<TrackSummary[]>('/api/tracks'),
  })
}

export function useGetTrack(id: string | undefined) {
  const api = useApi()
  return useQuery({
    queryKey: ['tracks', id],
    queryFn: () => api<GetTrackResponse>(`/api/tracks/${id}`),
    enabled: !!id,
    gcTime: 7 * 24 * 60 * 60 * 1000,
    staleTime: Infinity,
  })
}

function useGpxMutation<TRequest>(
  trackId: string,
  transform: (gpxContent: string, request: TRequest) => string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: TRequest) => {
      const track = queryClient.getQueryData<GetTrackResponse>([
        'tracks',
        trackId,
      ])
      if (!track?.gpxContent) throw new Error('Track GPX not available')
      const updatedGpx = transform(track.gpxContent, request)
      await saveGpxBlob(trackId, updatedGpx)
      await enqueueMutation(
        { type: 'PUT_TRACK_GPX', payload: { id: trackId } },
        { dedupeKey: trackId }
      )
      return updatedGpx
    },
    onSuccess: async (updatedGpx) => {
      const track = queryClient.getQueryData<GetTrackResponse>([
        'tracks',
        trackId,
      ])
      if (track) {
        queryClient.setQueryData<GetTrackResponse>(['tracks', trackId], {
          ...track,
          gpxContent: updatedGpx,
        })
      }
      // Set the parsed result directly instead of invalidating — invalidating
      // would refetch using a stale closure of `track` in useGetParsedTrack
      // (the component hasn't re-rendered yet with the new gpxContent).
      queryClient.setQueryData(
        ['tracks', trackId, 'parsed'],
        parseGpxFile(updatedGpx)
      )
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
