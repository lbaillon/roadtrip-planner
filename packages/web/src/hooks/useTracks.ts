import {
  type CreateResponse,
  type CreateTrackRequest,
  type GetTrackResponse,
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
    queryFn: () => api<{ id: string; name: string }[]>('/api/tracks'),
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
