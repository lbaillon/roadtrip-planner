import type {
  AddTrackToTripRequest,
  CreateResponse,
  CreateTripRequest,
  TripSummary,
  TripTrack,
  UpdateTripTracksOrderRequest,
} from '@roadtrip/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from './useApi'

export function useGetTrips() {
  const api = useApi()
  return useQuery({
    queryKey: ['trips'],
    queryFn: () => api<TripSummary[]>('/api/trips'),
  })
}

export function useGetTrip(id: string | undefined) {
  const api = useApi()
  return useQuery({
    queryKey: ['trips', id],
    queryFn: () => api<TripSummary>(`/api/trips/${id}`),
    enabled: !!id,
  })
}

export function useGetTripTracks(id: string | undefined) {
  const api = useApi()
  return useQuery({
    queryKey: ['trips', id, 'tracks'],
    queryFn: () => api<TripTrack[]>(`/api/trips/${id}/tracks`),
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
    mutationFn: ({
      trackId,
      order,
    }: { trackId: string } & AddTrackToTripRequest) =>
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

export function useUpdateTripTracksOrder(tripId: string) {
  const queryClient = useQueryClient()
  const api = useApi()
  return useMutation({
    mutationFn: (trackIds: UpdateTripTracksOrderRequest['trackIds']) =>
      api<void>(`/api/trips/${tripId}/tracks`, {
        method: 'PUT',
        body: JSON.stringify({ trackIds }),
      }),
    onMutate: async (trackIds) => {
      await queryClient.cancelQueries({ queryKey: ['trips', tripId, 'tracks'] })
      const previous = queryClient.getQueryData<TripTrack[]>([
        'trips',
        tripId,
        'tracks',
      ])
      queryClient.setQueryData<TripTrack[]>(
        ['trips', tripId, 'tracks'],
        (old) =>
          trackIds
            .map((id: string) => old?.find((t: TripTrack) => t.id === id))
            .filter((t): t is TripTrack => t !== undefined)
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['trips', tripId, 'tracks'], context?.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', tripId, 'tracks'] })
    },
  })
}
