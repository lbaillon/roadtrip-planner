# add possibility for user to add personalized markers on maps

source : <https://trello.com/c/H0hqhLnI/47-calculate-elevation-if-missing-in-gpx-file>

## Purpose

As a user planning my next roadtrip I want to get elevation added to my track automatically so that weather data is more accurate.

## Description

The user often adds GPX files without complete data. Elevation is generally missing from coordinates. The goal here is to edit the GPX file after it has been submitted by the user to fetch the correct elevation for the coordinates and add to the GPX.

## Notes

- The request to fetch missing elevation should happen after the GPX has been submitted and not block any other request. It has the lowest priority, the goal is to improve the data provided by the user. The weather and other features have an higher priority.
- The API to fetch the missing elevation should be decided among several choices provided when starting this task.
- The request to fetch the missing elevation should try as much as possible to group coordinates in a single request. If several requests must be made, all can be waited to get a single grouped result.
- If no elevation can reliably be found for a coordinate, it should not be added.
- Elevation must be fetched for a GPX only when the GPX is submitted, existing GPX should not be handled.
- Upon successfully adding elevation that was missing, these needs to happen:
  - a single edit request for the GPX should be enqueued with this new elevation data
  - the weather must be refetched for the coordinates with a new elevation after incorporating the new elevation in the request for weather

---

## Implementation Plan

### Decisions

- **Elevation API**: Open-Elevation (`https://api.open-elevation.com/api/v1/lookup`) — free, no key, supports batch POST. Isolated in its own service so it's easy to swap.
- **"Missing elevation"**: any track point (`<trkpt>`) without an `<ele>` tag. Points that already have `<ele>` are kept untouched.
- **Batch size**: 100 points per request (safe ceiling for the public Open-Elevation instance). Multiple requests are sent in parallel and awaited together before writing the GPX.
- **Trigger point**: `useFlushCreateTrack` — after the API call succeeds (network is available), fire-and-forget. Does not block the flush result.
- **Async mechanism**: the existing mutation queue (`enqueueMutation` + `PUT_TRACK_GPX`). No new queue needed.
- **Weather invalidation**: `queryClient.invalidateQueries({ queryKey: ['weather'] })` after the GPX blob is saved.

---

### Overview of changes

```text
packages/web/
  src/lib/elevation.ts                          ← new: pure service (Open-Elevation API)
  src/hooks/useEnrichTrackElevation.ts          ← new: React hook (orchestration)
  src/hooks/mutations/useCreateTrack.ts         ← update: call enricher after flush
```

---

### Step 1 — `src/lib/elevation.ts` (new file)

Pure TypeScript, no React, no direct query-cache access.

**`enrichGpxElevation(gpxContent: string): Promise<string>`**

1. Parse the GPX with the shared `XMLParser` config (same options as `gpx-utils.ts`).
2. Collect all `trkpt` elements across every `trk > trkseg` that are missing `ele`.
   Store `{ trkIndex, segIndex, ptIndex, lat, lon }` for each.
3. If none are missing, return the original `gpxContent` unchanged.
4. Split the missing points into chunks of 100.
5. `Promise.all` the chunks — each chunk calls `POST https://api.open-elevation.com/api/v1/lookup` with body `{ locations: [{ latitude, longitude }] }`.
   On network error or non-OK response, silently swallow and return original `gpxContent`.
6. Map each result back to the corresponding `trkpt` object (same order as input) and set `ele = result.elevation`.
7. Rebuild the GPX string with `XMLBuilder` and return it.

---

### Step 2 — `src/hooks/useEnrichTrackElevation.ts` (new file)

```typescript
export function useEnrichTrackElevation() {
  const queryClient = useQueryClient()

  return async (trackId: string): Promise<void> => {
    const gpxContent =
      (await getGpxBlob(trackId)) ??
      queryClient.getQueryData<GetTrackResponse>(['tracks', trackId])?.gpxContent
    if (!gpxContent) return

    const enriched = await enrichGpxElevation(gpxContent) // from Step 1
    if (enriched === gpxContent) return // nothing changed

    await saveGpxBlob(trackId, enriched)
    await enqueueMutation(
      { type: 'PUT_TRACK_GPX', payload: { id: trackId } },
      { dedupeKey: trackId }
    )
    await queryClient.invalidateQueries({ queryKey: ['weather'] })
  }
}
```

---

### Step 3 — update `useFlushCreateTrack`

```typescript
export function useFlushCreateTrack(): FlushFn<CreateTrackMutation['payload']> {
  const api = useApi()
  const enrichElevation = useEnrichTrackElevation()

  return async ({ id, name }) => {
    const gpxContent = await getGpxBlob(id)
    if (gpxContent === undefined) {
      throw new Error('GPX data lost — please re-upload the track')
    }
    await api<void>('/api/tracks', {
      method: 'POST',
      body: JSON.stringify({ id, name, gpxContent } satisfies CreateTrackRequest),
    })
    // Fire and forget — does not block the flush
    void enrichElevation(id)
  }
}
```

---

### Summary of files changed

| File | Change |
| ---- | ------ |
| `packages/web/src/lib/elevation.ts` | Create |
| `packages/web/src/hooks/useEnrichTrackElevation.ts` | Create |
| `packages/web/src/hooks/mutations/useCreateTrack.ts` | Update |
