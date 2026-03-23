import { fetchApi } from '#web/lib/api-client'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

export function useHealth() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const query = useQuery({
    queryKey: ['/health'],
    queryFn: () =>
      fetchApi<{ status: 'ok' }>('/api/health', { cache: 'no-store' }),
    refetchInterval: (q) => {
      if (!navigator.onLine) return false
      return q.state.data?.status === 'ok' ? 30000 : 5000
    },
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    staleTime: 10000,
    throwOnError: false,
  })

  const isServerReady = !query.isError && query.data?.status === 'ok'
  const isReady = isOnline && isServerReady

  return { ...query, isOnline, isServerReady, isReady }
}
