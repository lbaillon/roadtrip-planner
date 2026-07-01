import type {
  GetSharesResponse,
  ShareRequest,
  TrackSummary,
  TripSummary,
} from '@roadtrip/shared'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useApi } from './useApi'

export function useGetSharedTracks() {
  const api = useApi()
  return useQuery({
    queryKey: ['tracks', 'shared'],
    queryFn: () => api<TrackSummary[]>('/api/tracks/shared'),
    placeholderData: keepPreviousData,
  })
}

export function useGetSharedTrips() {
  const api = useApi()
  return useQuery({
    queryKey: ['trips', 'shared'],
    queryFn: () => api<TripSummary[]>('/api/trips/shared'),
    placeholderData: keepPreviousData,
  })
}

export function useGetTrackShares(id: string | undefined, enabled = true) {
  const api = useApi()
  return useQuery({
    queryKey: ['tracks', id, 'shares'],
    queryFn: () => api<GetSharesResponse>(`/api/tracks/${id}/shares`),
    enabled: !!id && enabled,
    placeholderData: keepPreviousData,
  })
}

export function useGetTripShares(id: string | undefined, enabled = true) {
  const api = useApi()
  return useQuery({
    queryKey: ['trips', id, 'shares'],
    queryFn: () => api<GetSharesResponse>(`/api/trips/${id}/shares`),
    enabled: !!id && enabled,
    placeholderData: keepPreviousData,
  })
}

export function useShareTrack(id: string) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (emails: string[]) =>
      api<void>(`/api/tracks/${id}/shares`, {
        method: 'POST',
        body: JSON.stringify({ emails } satisfies ShareRequest),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['tracks', id, 'shares'] }),
  })
}

export function useShareTrip(id: string) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (emails: string[]) =>
      api<void>(`/api/trips/${id}/shares`, {
        method: 'POST',
        body: JSON.stringify({ emails } satisfies ShareRequest),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['trips', id, 'shares'] }),
  })
}
