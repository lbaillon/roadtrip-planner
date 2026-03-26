import { enqueueMutation } from '#web/lib/mutation-queue'
import type { IdParams, TripSummary } from '@roadtrip/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '../useApi'
import type { FlushFn } from './types'

export interface DeleteTripMutation {
  type: 'DELETE_TRIP'
  payload: IdParams
}

export function useDeleteTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await enqueueMutation(
        { type: 'DELETE_TRIP', payload: { id } },
        { dedupeKey: id }
      )
    },
    onSuccess: async (_, id) => {
      queryClient.setQueryData<TripSummary[]>(['trips'], (old = []) =>
        old.filter((t) => t.id !== id)
      )
      queryClient.removeQueries({ queryKey: ['trips', id] })
      await queryClient.invalidateQueries({
        queryKey: ['mutation-queue', 'pending'],
      })
    },
  })
}

export function useFlushDeleteTrip(): FlushFn<DeleteTripMutation['payload']> {
  const api = useApi()
  return async ({ id }) => {
    await api<void>(`/api/trips/${id}`, { method: 'DELETE' })
  }
}
