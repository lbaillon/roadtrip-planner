import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  dismissFailedMutation,
  getFailedMutations,
  getMutations,
  retryFailedMutation,
} from '#web/lib/mutation-queue'

export function useMutationQueue() {
  const queryClient = useQueryClient()

  const { data: mutations = [] } = useQuery({
    queryKey: ['mutation-queue', 'pending'],
    queryFn: getMutations,
    staleTime: 0,
    gcTime: 0,
  })

  const { data: failedMutations = [] } = useQuery({
    queryKey: ['mutation-queue', 'failed'],
    queryFn: getFailedMutations,
    staleTime: 0,
    gcTime: 0,
  })

  const retryMutation = async (id: string) => {
    await retryFailedMutation(id)
    await queryClient.invalidateQueries({ queryKey: ['mutation-queue'] })
  }

  const dismissMutation = async (id: string) => {
    await dismissFailedMutation(id)
    await queryClient.invalidateQueries({
      queryKey: ['mutation-queue', 'failed'],
    })
  }

  return {
    pendingCount: mutations.length,
    failedMutations,
    retryMutation,
    dismissMutation,
  }
}
