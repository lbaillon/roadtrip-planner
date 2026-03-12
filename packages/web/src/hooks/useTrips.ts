import type { CreateResponse, CreateTripRequest } from '@roadtrip/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from './useApi'

export function useGetTrips() {
  const api = useApi()
  return useQuery({
    queryKey: ['trips'],
    queryFn: () => api<{ id: string; name: string }[]>('/api/trips'),
  })
}

export function useGetTrip(id: string | undefined) {
  const api = useApi()
  return useQuery({
    queryKey: ['trips', id],
    queryFn: () => api<{ id: string; name: string }>(`/api/trips/${id}`),
    enabled: !!id,
  })
}

export function useGetTripTracks(id: string | undefined) {
  const api = useApi()
  return useQuery({
    queryKey: ['trips', id, 'tracks'],
    queryFn: () =>
      api<{ id: string; name: string }[]>(`/api/trips/${id}/tracks`),
    enabled: !!id,
  })
}

export function useCreateTrip() {
  const queryClient = useQueryClient()
  const api = useApi()
  return useMutation({
    mutationFn: (request: CreateTripRequest) =>
      api<CreateResponse>('/api/trips', {
        method: 'POST',
        body: JSON.stringify(request),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useDeleteTrip() {
  const queryClient = useQueryClient()
  const api = useApi()
  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/api/trips/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useAddTrackToTrip(tripId: string) {
  const queryClient = useQueryClient()
  const api = useApi()
  return useMutation({
    mutationFn: ({ trackId, order }: { trackId: string; order: number }) =>
      api<void>(`/api/trips/${tripId}/tracks/${trackId}`, {
        method: 'POST',
        body: JSON.stringify({ order }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', tripId, 'tracks'] })
    },
  })
}

export function useRemoveTrackFromTrip(tripId: string) {
  const queryClient = useQueryClient()
  const api = useApi()
  return useMutation({
    mutationFn: (trackId: string) =>
      api<void>(`/api/trips/${tripId}/tracks/${trackId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', tripId, 'tracks'] })
    },
  })
}