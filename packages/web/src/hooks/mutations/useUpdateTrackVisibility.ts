import { enqueueMutation } from "#web/lib/mutation-queue"
import type {  GetTrackResponse,  UpdateTrackPublicStatusRequest } from "@roadtrip/shared"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { FlushFn } from "./types"
import { useApi } from "../useApi"


export interface UpdateTrackVisibilityMutation {
  type: 'UPDATE_TRACK_VISIBILITY'
  payload: {id: string} & UpdateTrackPublicStatusRequest
}


export function useUpdateTrackVisibility() {
  const queryClient = useQueryClient()
  return useMutation({
    networkMode: 'offlineFirst',
    mutationFn: async (
      request : {id : string} & UpdateTrackPublicStatusRequest
    ): Promise<void> => {
      await enqueueMutation(
        {
          type: 'UPDATE_TRACK_VISIBILITY',
          payload: { ...request}
        },
        {dedupeKey: request.id}
      )
    },
  onSuccess: async (_, {id, isPublic}) => {
    queryClient.setQueryData(['tracks', id], (old : GetTrackResponse | undefined) => ({ ...old, isPublic: isPublic }))
    await queryClient.invalidateQueries({ queryKey: ['mutation-queue', 'pending'] })
  }
  })
}

export function useFlushUpdateTrackVisibility(): FlushFn<UpdateTrackVisibilityMutation['payload']> {
  const api = useApi()
  return async ({ id,  isPublic}) => {
    await api<void>(`/api/tracks/${id}/public`, {
      method: 'PUT',
      body: JSON.stringify({isPublic}),
    })
  }
}