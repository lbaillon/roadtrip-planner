import { enqueueMutation } from '#web/lib/mutation-queue'
import type { TripTrack, UpdateTripTracksOrderRequest } from '@roadtrip/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '../useApi'
import type { FlushFn } from './types'

export interface ReorderTripTracksMutation {
  type: 'REORDER_TRIP_TRACKS'
  payload: { tripId: string } & UpdateTripTracksOrderRequest
}

export function useUpdateTripTracksOrder(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (trackIds: UpdateTripTracksOrderRequest['trackIds']) => {
      await enqueueMutation(
        { type: 'REORDER_TRIP_TRACKS', payload: { tripId, trackIds } },
        { dedupeKey: tripId }
      )
    },
    onMutate: async (trackIds) => {
      await queryClient.cancelQueries({ queryKey: ['trips', tripId, 'tracks'] })
      const previous = queryClient.getQueryData<TripTrack[]>([
        'trips',
        tripId,
        'tracks',
      ])
      queryClient.setQueryData<TripTrack[]>(
        ['trips', tripId, 'tracks'],
        (old) =>
          trackIds
            .map((id: string) => old?.find((t: TripTrack) => t.id === id))
            .filter((t): t is TripTrack => t !== undefined)
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['trips', tripId, 'tracks'], context?.previous)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['mutation-queue', 'pending'],
      })
    },
  })
}

export function useFlushReorderTripTracks(): FlushFn<
  ReorderTripTracksMutation['payload']
> {
  const api = useApi()
  return async ({ tripId, trackIds }) => {
    await api<void>(`/api/trips/${tripId}/tracks`, {
      method: 'PUT',
      body: JSON.stringify({
        trackIds,
      } satisfies UpdateTripTracksOrderRequest),
    })
  }
}
