import type {
  GetMeResponse,
  LogInResponse,
  UpdateMeRequest,
} from '@roadtrip/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from './useApi'
import { useAuth } from './useAuth'

export function useGetMe() {
  const api = useApi()
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api<GetMeResponse>('/api/users/me'),
  })
}

export function useUpdateMe() {
  const api = useApi()
  const queryClient = useQueryClient()
  const { setAccessToken } = useAuth()
  return useMutation({
    mutationFn: (request: UpdateMeRequest) =>
      api<LogInResponse>('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify(request),
      }),
    onSuccess: async (data) => {
      setAccessToken(data.accessToken)
      await queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })
}
