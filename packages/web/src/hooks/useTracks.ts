import {
  type CreateResponse,
  type CreateTrackRequest,
  type GetTrackResponse,
  type GetWeatherRequest,
  type GetWeatherResponse,
  type TrackSummary,
} from '@roadtrip/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addWaypointToGpx,
  deleteWaypointFromGpx,
  editWaypointInGpx,
  parseGpxFile,
  sampleRoutePoints,
} from '../lib/gpx-utils'
import { enqueueMutation } from '../lib/mutation-queue'
import { useApi } from './useApi'

export function useCreateTrack() {
  const queryClient = useQueryClient()
  const api = useApi()
  return useMutation({
    mutationFn: (request: CreateTrackRequest) =>
      api<CreateResponse>('/api/tracks', {
        method: 'POST',
        body: JSON.stringify(request),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] })
    },
  })
}

export function useDeleteTrack() {
  const queryClient = useQueryClient()
  const api = useApi()
  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/api/tracks/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] })
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
  })
}

export function useGetParsedTrack(trackId: string | undefined) {
  const { data: track } = useGetTrack(trackId)
  return useQuery({
    queryKey: ['tracks', trackId, 'parsed'],
    queryFn: () => {
      if (!track?.gpxContent) throw new Error('GPX content not available')
      return parseGpxFile(track.gpxContent)
    },
    enabled: !!trackId && !!track?.gpxContent,
    gcTime: 7 * 24 * 60 * 60 * 1000,
    staleTime: Infinity,
  })
}

export function useGetTrackWeather(trackId: string | undefined) {
  const { data: parsed } = useGetParsedTrack(trackId)
  const api = useApi()
  const sampled = parsed ? sampleRoutePoints(parsed.coordinates) : undefined
  return useQuery({
    queryKey: ['tracks', trackId, 'weather'],
    queryFn: () =>
      api<GetWeatherResponse>('/api/weather', {
        method: 'POST',
        body: JSON.stringify({
          coordinates: sampled!,
        } satisfies GetWeatherRequest),
      }),
    enabled: !!trackId && !!sampled && sampled.length > 0,
    gcTime: 48 * 60 * 60 * 1000,
    staleTime: 60 * 60 * 1000,
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
      await enqueueMutation('PUT_TRACK_GPX', {
        trackId,
        gpxContent: updatedGpx,
      })
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
      await queryClient.invalidateQueries({ queryKey: ['mutation-queue'] })
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
