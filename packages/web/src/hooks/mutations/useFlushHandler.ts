import { useFlushAddTrackToTrip } from './useAddTrackToTrip'
import { useFlushCreateTrack } from './useCreateTrack'
import { useFlushCreateTrip } from './useCreateTrip'
import { useFlushDeleteTrack } from './useDeleteTrack'
import { useFlushDeleteTrip } from './useDeleteTrip'
import { useFlushPutTrackGpx } from './usePutTrackGpx'
import { useFlushRemoveTrackFromTrip } from './useRemoveTrackFromTrip'
import { useFlushReorderTripTracks } from './useReorderTripTracks'
import type { FlushFn, FlushHandlerRegistry, MutationDefinition } from './types'
import { useFlushUpdateTrip } from './useUpdateTrip'
import { useFlushUpdateTrackVisibility } from './useUpdateTrackVisibility'

export function useFlushHandler() {
  const handlers: FlushHandlerRegistry = {
    CREATE_TRIP: useFlushCreateTrip(),
    DELETE_TRIP: useFlushDeleteTrip(),
    UPDATE_TRIP: useFlushUpdateTrip(),
    CREATE_TRACK: useFlushCreateTrack(),
    DELETE_TRACK: useFlushDeleteTrack(),
    UPDATE_TRACK_VISIBILITY: useFlushUpdateTrackVisibility(),
    PUT_TRACK_GPX: useFlushPutTrackGpx(),
    ADD_TRACK_TO_TRIP: useFlushAddTrackToTrip(),
    REMOVE_TRACK_FROM_TRIP: useFlushRemoveTrackFromTrip(),
    REORDER_TRIP_TRACKS: useFlushReorderTripTracks(),
  }

  return (mutation: MutationDefinition) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (handlers[mutation.type] as FlushFn<any>)(mutation.payload)
  }
}
