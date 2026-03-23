import { flushAddTrackToTrip } from './add-track-to-trip'
import type { AddTrackToTripMutation } from './add-track-to-trip'
import { flushCreateTrack } from './create-track'
import type { CreateTrackMutation } from './create-track'
import { flushCreateTrip } from './create-trip'
import type { CreateTripMutation } from './create-trip'
import { flushDeleteTrack } from './delete-track'
import type { DeleteTrackMutation } from './delete-track'
import { flushDeleteTrip } from './delete-trip'
import type { DeleteTripMutation } from './delete-trip'
import { flushPutTrackGpx } from './put-track-gpx'
import type { PutTrackGpxMutation } from './put-track-gpx'
import { flushRemoveTrackFromTrip } from './remove-track-from-trip'
import type { RemoveTrackFromTripMutation } from './remove-track-from-trip'
import { flushReorderTripTracks } from './reorder-trip-tracks'
import type { ReorderTripTracksMutation } from './reorder-trip-tracks'
import type { ApiFn, FlushHandler } from './types'

export type MutationDefinition =
  | PutTrackGpxMutation
  | CreateTrackMutation
  | DeleteTrackMutation
  | CreateTripMutation
  | DeleteTripMutation
  | AddTrackToTripMutation
  | RemoveTrackFromTripMutation
  | ReorderTripTracksMutation

type FlushHandlerRegistry = {
  [K in MutationDefinition['type']]: FlushHandler<
    Extract<MutationDefinition, { type: K }>['payload']
  >
}

const flushHandlers: FlushHandlerRegistry = {
  PUT_TRACK_GPX: flushPutTrackGpx,
  CREATE_TRACK: flushCreateTrack,
  DELETE_TRACK: flushDeleteTrack,
  CREATE_TRIP: flushCreateTrip,
  DELETE_TRIP: flushDeleteTrip,
  ADD_TRACK_TO_TRIP: flushAddTrackToTrip,
  REMOVE_TRACK_FROM_TRIP: flushRemoveTrackFromTrip,
  REORDER_TRIP_TRACKS: flushReorderTripTracks,
}

export function applyFlushHandler(
  mutation: MutationDefinition,
  api: ApiFn
): Promise<void> {
  // Cast is safe: registry maps each mutation type to its corresponding payload handler
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (flushHandlers[mutation.type] as FlushHandler<any>)(
    mutation.payload,
    api
  )
}
