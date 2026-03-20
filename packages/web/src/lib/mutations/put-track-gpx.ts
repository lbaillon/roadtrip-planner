export interface PutTrackGpxPayload {
  trackId: string
  gpxContent: string
}

export interface PutTrackGpxMutation {
  type: 'PUT_TRACK_GPX'
  payload: PutTrackGpxPayload
}
