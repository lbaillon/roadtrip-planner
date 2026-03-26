import { type GetTrackResponse, type TrackSummary } from '@roadtrip/shared'
import { useQuery } from '@tanstack/react-query'
import { useApi } from './useApi'

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
