import { enqueueMutation } from '#web/lib/mutation-queue'
import type {
  CreateResponse,
  CreateTripRequest,
  TripSummary,
} from '@roadtrip/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { v7 as uuidv7 } from 'uuid'
import { useApi } from '../useApi'
import type { FlushFn } from './types'

export interface CreateTripMutation {
  type: 'CREATE_TRIP'
  payload: CreateTripRequest
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

export function useFlushCreateTrip(): FlushFn<CreateTripMutation['payload']> {
  const api = useApi()
  return async (payload) => {
    await api<void>('/api/trips', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }
}
