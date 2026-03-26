import { enqueueMutation } from '#web/lib/mutation-queue'
import type { IdParams, TrackSummary } from '@roadtrip/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '../useApi'
import type { FlushFn } from './types'

export interface DeleteTrackMutation {
  type: 'DELETE_TRACK'
  payload: IdParams
}

export function useDeleteTrack() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await enqueueMutation(
        { type: 'DELETE_TRACK', payload: { id } },
        { dedupeKey: id }
      )
    },
    onSuccess: async (_, id) => {
      queryClient.setQueryData<TrackSummary[]>(['tracks'], (old = []) =>
        old.filter((t) => t.id !== id)
      )
      queryClient.removeQueries({ queryKey: ['tracks', id] })
      await queryClient.invalidateQueries({
        queryKey: ['mutation-queue', 'pending'],
      })
    },
  })
}

export function useFlushDeleteTrack(): FlushFn<DeleteTrackMutation['payload']> {
  const api = useApi()
  return async ({ id }) => {
    await api<void>(`/api/tracks/${id}`, { method: 'DELETE' })
  }
}
