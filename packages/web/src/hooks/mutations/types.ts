import type { AddTrackToTripMutation } from './useAddTrackToTrip'
import type { CreateTrackMutation } from './useCreateTrack'
import type { CreateTripMutation } from './useCreateTrip'
import type { DeleteTrackMutation } from './useDeleteTrack'
import type { DeleteTripMutation } from './useDeleteTrip'
import type { PutTrackGpxMutation } from './usePutTrackGpx'
import type { RemoveTrackFromTripMutation } from './useRemoveTrackFromTrip'
import type { ReorderTripTracksMutation } from './useReorderTripTracks'
import type { UpdateTripMutation } from './useUpdateTrip'

export type FlushFn<P> = (payload: P) => Promise<void>

export type MutationDefinition =
  | CreateTripMutation
  | DeleteTripMutation
  | UpdateTripMutation
  | CreateTrackMutation
  | DeleteTrackMutation
  | PutTrackGpxMutation
  | AddTrackToTripMutation
  | RemoveTrackFromTripMutation
  | ReorderTripTracksMutation

export type FlushHandlerRegistry = {
  [K in MutationDefinition['type']]: FlushFn<
    Extract<MutationDefinition, { type: K }>['payload']
  >
}
