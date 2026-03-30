import type { TripSummary, TripTrack } from '@roadtrip/shared'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useApi } from './useApi'

export function useGetTrips() {
  const api = useApi()
  return useQuery({
    queryKey: ['trips'],
    queryFn: () => api<TripSummary[]>('/api/trips'),
    placeholderData: keepPreviousData,
  })
}

export function useGetTrip(id: string | undefined) {
  const api = useApi()
  return useQuery({
    queryKey: ['trips', id],
    queryFn: () => api<TripSummary>(`/api/trips/${id}`),
    enabled: !!id,
    placeholderData: keepPreviousData,
  })
}

export function useGetTripTracks(id: string | undefined) {
  const api = useApi()
  return useQuery({
    queryKey: ['trips', id, 'tracks'],
    queryFn: () => api<TripTrack[]>(`/api/trips/${id}/tracks`),
    enabled: !!id,
    placeholderData: keepPreviousData,
  })
}
