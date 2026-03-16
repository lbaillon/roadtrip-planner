import {
  type CreateResponse,
  type CreateTrackRequest,
  type EditWaypointRequest,
  type GetTrackResponse,
  type TrackSummary,
  type UpdateTrackRequest,
} from '@roadtrip/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

export function useAddWaypoint(trackId: string) {
  const queryClient = useQueryClient()
  const api = useApi()
  return useMutation({
    mutationFn: (request: UpdateTrackRequest) =>
      api<void>(`/api/tracks/${trackId}/waypoints`, {
        method: 'PUT',
        body: JSON.stringify(request),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks', trackId] })
    },
  })
}

export function useEditWaypoint(trackId: string) {
  const queryClient = useQueryClient()
  const api = useApi()
  return useMutation({
    mutationFn: ({ index, ...data }: EditWaypointRequest & { index: number }) =>
      api<void>(`/api/tracks/${trackId}/waypoints/${index}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks', trackId] })
    },
  })
}

export function useDeleteWaypoint(trackId: string) {
  const queryClient = useQueryClient()
  const api = useApi()
  return useMutation({
    mutationFn: (index: number) =>
      api<void>(`/api/tracks/${trackId}/waypoints/${index}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks', trackId] })
    },
  })
}
