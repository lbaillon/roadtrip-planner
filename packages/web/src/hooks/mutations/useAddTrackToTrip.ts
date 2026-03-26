import { enqueueMutation } from '#web/lib/mutation-queue'
import type {
  AddTrackToTripRequest,
  GetTrackResponse,
  TrackSummary,
  TripTrack,
} from '@roadtrip/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '../useApi'
import type { FlushFn } from './types'

export interface AddTrackToTripMutation {
  type: 'ADD_TRACK_TO_TRIP'
  payload: { tripId: string; trackId: string } & AddTrackToTripRequest
}

export function useAddTrackToTrip(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      trackId,
      order,
    }: { trackId: string } & AddTrackToTripRequest) => {
      await enqueueMutation({
        type: 'ADD_TRACK_TO_TRIP',
        payload: { tripId, trackId, order },
      })
    },
    onSuccess: async (_, { trackId, order }) => {
      const full = queryClient.getQueryData<GetTrackResponse>([
        'tracks',
        trackId,
      ])
      const summary = queryClient
        .getQueryData<TrackSummary[]>(['tracks'])
        ?.find((t) => t.id === trackId)
      const name = full?.name ?? summary?.name ?? 'Unknown Track'
      queryClient.setQueryData<TripTrack[]>(
        ['trips', tripId, 'tracks'],
        (old = []) => [...old, { id: trackId, name, order }]
      )
      await queryClient.invalidateQueries({
        queryKey: ['mutation-queue', 'pending'],
      })
    },
  })
}

export function useFlushAddTrackToTrip(): FlushFn<
  AddTrackToTripMutation['payload']
> {
  const api = useApi()
  return async ({ tripId, trackId, order }) => {
    await api<void>(`/api/trips/${tripId}/tracks/${trackId}`, {
      method: 'POST',
      body: JSON.stringify({ order } satisfies AddTrackToTripRequest),
    })
  }
}
