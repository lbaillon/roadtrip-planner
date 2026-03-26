import type { TripSummary, TripTrack } from '@roadtrip/shared'
import { useQuery } from '@tanstack/react-query'
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
