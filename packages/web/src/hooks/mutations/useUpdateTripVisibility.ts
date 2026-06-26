import { enqueueMutation } from '#web/lib/mutation-queue'
import type {
  TripSummary,
  UpdateTripPublicStatusRequest,
} from '@roadtrip/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { FlushFn } from './types'
import { useApi } from '../useApi'

export interface UpdateTripVisibilityMutation {
  type: 'UPDATE_TRIP_VISIBILITY'
  payload: { id: string } & UpdateTripPublicStatusRequest
}

export function useUpdateTripVisibility() {
  const queryClient = useQueryClient()
  return useMutation({
    networkMode: 'offlineFirst',
    mutationFn: async (
      request: { id: string } & UpdateTripPublicStatusRequest
    ): Promise<void> => {
      await enqueueMutation(
        {
          type: 'UPDATE_TRIP_VISIBILITY',
          payload: { ...request },
        },
        { dedupeKey: request.id }
      )
    },
    onSuccess: async (_, { id, isPublic }) => {
      queryClient.setQueryData(
        ['trips', id],
        (old: TripSummary | undefined) => ({ ...old, isPublic: isPublic })
      )
      await queryClient.invalidateQueries({
        queryKey: ['mutation-queue', 'pending'],
      })
    },
  })
}

export function useFlushUpdateTripVisibility(): FlushFn<
  UpdateTripVisibilityMutation['payload']
> {
  const api = useApi()
  return async ({ id, isPublic }) => {
    await api<void>(`/api/trips/${id}/public`, {
      method: 'PUT',
      body: JSON.stringify({ isPublic }),
    })
  }
}
