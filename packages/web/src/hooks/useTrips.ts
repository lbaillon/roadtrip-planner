import { enqueueMutation } from '#web/lib/mutation-queue'
import type {
  AddTrackToTripRequest,
  CreateResponse,
  CreateTripRequest,
  GetTrackResponse,
  TrackSummary,
  TripSummary,
  TripTrack,
  UpdateTripTracksOrderRequest,
} from '@roadtrip/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { v7 as uuidv7 } from 'uuid'
import { useApi } from './useApi'

export function useGetTrips() {
  const api = useApi()
  return useQuery({
    queryKey: ['trips'],
    queryFn: () => api<TripSummary[]>('/api/trips'),
  })
}

export function useGetTrip(id: string | undefined) {
  const api = useApi()
  return useQuery({
    queryKey: ['trips', id],
    queryFn: () => api<TripSummary>(`/api/trips/${id}`),
    enabled: !!id,
  })
}

export function useGetTripTracks(id: string | undefined) {
  const api = useApi()
  return useQuery({
    queryKey: ['trips', id, 'tracks'],
    queryFn: () => api<TripTrack[]>(`/api/trips/${id}/tracks`),
    enabled: !!id,
  })
}

export function useCreateTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      request: Omit<CreateTripRequest, 'id'>
    ): Promise<CreateResponse> => {
      const tripId = uuidv7()
      await enqueueMutation({
        type: 'CREATE_TRIP',
        payload: { ...request, id: tripId },
      })
      return { id: tripId }
    },
    onSuccess: async ({ id: tripId }, { name }) => {
      queryClient.setQueryData<TripSummary[]>(['trips'], (old = []) => [
        ...old,
        { id: tripId, name },
      ])
      await queryClient.invalidateQueries({
        queryKey: ['mutation-queue', 'pending'],
      })
    },
  })
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
      // Resolve track name from cache (full data or summary)
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
