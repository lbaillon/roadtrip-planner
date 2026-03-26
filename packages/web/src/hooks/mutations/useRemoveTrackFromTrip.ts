import { enqueueMutation } from '#web/lib/mutation-queue'
import type { TripTrack } from '@roadtrip/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '../useApi'
import type { FlushFn } from './types'

export interface RemoveTrackFromTripMutation {
  type: 'REMOVE_TRACK_FROM_TRIP'
  payload: { tripId: string; trackId: string }
}

export function useRemoveTrackFromTrip(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (trackId: string) => {
      await enqueueMutation({
        type: 'REMOVE_TRACK_FROM_TRIP',
        payload: { tripId, trackId },
      })
    },
    onSuccess: async (_, trackId) => {
      queryClient.setQueryData<TripTrack[]>(
        ['trips', tripId, 'tracks'],
        (old = []) => old.filter((t) => t.id !== trackId)
      )
      await queryClient.invalidateQueries({
        queryKey: ['mutation-queue', 'pending'],
      })
    },
  })
}

export function useFlushRemoveTrackFromTrip(): FlushFn<
  RemoveTrackFromTripMutation['payload']
> {
  const api = useApi()
  return async ({ tripId, trackId }) => {
    await api<void>(`/api/trips/${tripId}/tracks/${trackId}`, {
      method: 'DELETE',
    })
  }
}
