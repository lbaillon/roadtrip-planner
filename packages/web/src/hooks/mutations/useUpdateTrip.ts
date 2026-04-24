import { enqueueMutation } from '#web/lib/mutation-queue'
import type { TripSummary, UpdateTripRequest } from '@roadtrip/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { FlushFn } from './types'
import { useApi } from '../useApi'

export interface UpdateTripMutation {
  type: 'UPDATE_TRIP'
  payload: { id: string } & UpdateTripRequest
}

export function useUpdateTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    networkMode: 'offlineFirst',
    mutationFn: async (
      request: { id: string } & UpdateTripRequest
    ): Promise<void> => {
      await enqueueMutation(
        {
          type: 'UPDATE_TRIP',
          payload: { ...request },
        },
        { dedupeKey: request.id }
      )
    },
    onSuccess: async (_, { id, name, description }) => {
      queryClient.setQueryData<TripSummary[]>(['trips'], (old = []) =>
        old.map((trip) =>
          trip.id === id
            ? {
                ...trip,
                name: name ?? trip.name,
                description: description ?? trip.description,
              }
            : trip
        )
      )
      queryClient.setQueryData<TripSummary>(['trips', id], (old) =>
        old
          ? {
              ...old,
              name: name ?? old.name,
              description: description ?? old.description,
            }
          : undefined
      )
      await queryClient.invalidateQueries({
        queryKey: ['mutation-queue', 'pending'],
      })
    },
  })
}

export function useFlushUpdateTrip(): FlushFn<UpdateTripMutation['payload']> {
  const api = useApi()
  return async ({ id, ...tripInfos }) => {
    await api<void>(`/api/trips/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tripInfos),
    })
  }
}
