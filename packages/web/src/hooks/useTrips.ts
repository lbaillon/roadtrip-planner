import type { CreateResponse, CreateTripRequest } from "@roadtrip/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";

export function useGetTrips() {
  const api = useApi()
  return useQuery({
    queryKey: ['trips'],
    queryFn: () => api<{ id: string; name: string }[]>('/api/trips'),
  })
}

export function useCreateTrip() {
  const queryClient = useQueryClient()
  const api = useApi()
  return useMutation({
    mutationFn: (request:CreateTripRequest) =>
      api<CreateResponse>('/api/trips', {
        method: 'POST',
        body: JSON.stringify(request)
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