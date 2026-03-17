import { useQuery } from '@tanstack/react-query'
import { getMutations } from '../lib/mutation-queue'

export function useMutationQueue() {
  const { data: mutations = [] } = useQuery({
    queryKey: ['mutation-queue'],
    queryFn: getMutations,
    staleTime: 0,
    gcTime: 0,
  })

  return { pendingCount: mutations.length }
}
