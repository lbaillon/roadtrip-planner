import {
  type GetTrackResponse,
  type GetTrackVisibilityResponse,
  type TrackSummary,
} from '@roadtrip/shared'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useApi } from './useApi'

export function useGetTracks() {
  const api = useApi()
  return useQuery({
    queryKey: ['tracks'],
    queryFn: () => api<TrackSummary[]>('/api/tracks'),
    placeholderData: keepPreviousData,
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
    placeholderData: keepPreviousData,
  })
}

export function useGetTrackVisibility(id: string | undefined, enabled = true) {
  const api = useApi()
  return useQuery({
    queryKey: ['tracks', id, 'visibility'],
    queryFn: () =>
      api<GetTrackVisibilityResponse>(`/api/tracks/${id}/visibility`),
    enabled: !!id && enabled,
  })
}
