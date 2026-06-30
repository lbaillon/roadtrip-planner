import type { GetSharesResponse, ShareRequest } from '@roadtrip/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from './useApi'

export function useGetTrackShares(id: string | undefined, enabled = true) {
  const api = useApi()
  return useQuery({
    queryKey: ['tracks', id, 'shares'],
    queryFn: () => api<GetSharesResponse>(`/api/tracks/${id}/shares`),
    enabled: !!id && enabled,
  })
}

export function useGetTripShares(id: string | undefined, enabled = true) {
  const api = useApi()
  return useQuery({
    queryKey: ['trips', id, 'shares'],
    queryFn: () => api<GetSharesResponse>(`/api/trips/${id}/shares`),
    enabled: !!id && enabled,
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
