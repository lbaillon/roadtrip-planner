import { useQuery } from '@tanstack/react-query'
import { fetchApi } from '../lib/api-client'

export function useHealth() {
  return useQuery({
    queryKey: ["/health"],
    queryFn:()=>fetchApi<{ status: 'ok' }>("/health"),
    refetchInterval: (query) => {
      if (!navigator.onLine) return false
      const status = query.state.data?.status
      return status === 'ok' ? 30000 : 5000
    },
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    staleTime: 10000,
  })
}
