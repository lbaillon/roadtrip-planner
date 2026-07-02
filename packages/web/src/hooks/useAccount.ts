import type { GetMeResponse } from '@roadtrip/shared'
import { useQuery } from '@tanstack/react-query'
import { useApi } from './useApi'

export function useGetMe() {
  const api = useApi()
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api<GetMeResponse>('/api/users/me'),
  })
}
