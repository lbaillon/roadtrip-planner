import {
  type CreateResponse,
  type CreateTrackRequest,
  type GetTrackResponse,
  type GetWeatherRequest,
  type GetWeatherResponse,
  type TrackSummary,
  type UpdateTrackGpxRequest,
} from '@roadtrip/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addWaypointToGpx,
  deleteWaypointFromGpx,
  editWaypointInGpx,
  parseGpxFile,
  sampleRoutePoints,
} from '../lib/gpx-utils'
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

export function useAddWaypoint(trackId: string) {
  const queryClient = useQueryClient()
  const api = useApi()
  return useMutation({
    mutationFn: async (request: {
      lat: number
      lon: number
      name: string
      description?: string
    }) => {
      const track = queryClient.getQueryData<GetTrackResponse>([
        'tracks',
        trackId,
      ])
      if (!track?.gpxContent) throw new Error('Track GPX not available')
      const updatedGpx = addWaypointToGpx(track.gpxContent, request)
      await api<void>(`/api/tracks/${trackId}`, {
        method: 'PUT',
        body: JSON.stringify({
          gpxContent: updatedGpx,
        } satisfies UpdateTrackGpxRequest),
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
      await queryClient.invalidateQueries({
        queryKey: ['tracks', trackId, 'parsed'],
      })
    },
    onError: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tracks', trackId] })
    },
  })
}

export function useEditWaypoint(trackId: string) {
  const queryClient = useQueryClient()
  const api = useApi()
  return useMutation({
    mutationFn: async (request: {
      index: number
      name: string
      description?: string
    }) => {
      const track = queryClient.getQueryData<GetTrackResponse>([
        'tracks',
        trackId,
      ])
      if (!track?.gpxContent) throw new Error('Track GPX not available')
      const updatedGpx = editWaypointInGpx(track.gpxContent, request.index, {
        name: request.name,
        description: request.description,
      })
      await api<void>(`/api/tracks/${trackId}`, {
        method: 'PUT',
        body: JSON.stringify({
          gpxContent: updatedGpx,
        } satisfies UpdateTrackGpxRequest),
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
      await queryClient.invalidateQueries({
        queryKey: ['tracks', trackId, 'parsed'],
      })
    },
    onError:async () => {
      await queryClient.invalidateQueries({ queryKey: ['tracks', trackId] })
    },
  })
}

export function useDeleteWaypoint(trackId: string) {
  const queryClient = useQueryClient()
  const api = useApi()
  return useMutation({
    mutationFn: async (index: number) => {
      const track = queryClient.getQueryData<GetTrackResponse>([
        'tracks',
        trackId,
      ])
      if (!track?.gpxContent) throw new Error('Track GPX not available')
      const updatedGpx = deleteWaypointFromGpx(track.gpxContent, index)
      await api<void>(`/api/tracks/${trackId}`, {
        method: 'PUT',
        body: JSON.stringify({
          gpxContent: updatedGpx,
        } satisfies UpdateTrackGpxRequest),
      })
      return updatedGpx
    },
    onSuccess:async (updatedGpx) => {
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
      await queryClient.invalidateQueries({
        queryKey: ['tracks', trackId, 'parsed'],
      })
    },
    onError:async () => {
      await queryClient.invalidateQueries({ queryKey: ['tracks', trackId] })
    },
  })
}
