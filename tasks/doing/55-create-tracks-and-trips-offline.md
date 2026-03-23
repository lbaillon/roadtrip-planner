# create tracks and trips offline

source : <https://trello.com/c/aeoI4mHy/55-create-tracks-and-trips-offline>

## Purpose

As a user while on a roadtrip, I want to use the app offline and be sure it will get synchronized when connection comes back, so that I can manipulate my tracks and trips even without network during the trip.

## Description

The user should be able to manipulate tracks and trips without being connected and everything should synchronize in the correct order once the backend comes back online. Not all features are critical for offline, for now we are mostly interested in tracks and trips (signing up for example is certainly NOT something that should work offline). But adding new tracks and GPX files, creating or modifying trips, adding or removing tracks to a trip, etc. should be possible even offline. For the weather data, it is only accessible online but we still want it to be cached for the next 48 hours. All mutable actions that are made offline should be replayed in correct order once server is back on. Some actions are idempotent and as such can be overwritten when added in the queue, we added a dedupeKey attribute to identify them. Tasks in the queue should be acknowledged and removed only once the server confirms that it has saved the new state (with 20x reponse status codes).

## Notes

We already used uuids in the backend so it should not be an issue to generate uuids on the frontend to make it work offline. We could migrate to uuid-V7 since generation time is not sensitive. Make sure to write down any concern you have, especially security-related, and possible remediation.
Existing work has been done, you can find the current implementation mostly in these files:

- packages/web/src/lib/mutation-queue.ts
- packages/web/src/hooks/useMutationQueue.ts
- packages/web/src/hooks/useNetworkSync.ts

---

## Implementation plan

### Overview

Extend the existing offline mutation queue to support all track and trip CRUD operations. The main changes are:

1. Add new mutation types for all track/trip operations
2. Introduce a GPX blob store to avoid duplicating large GPX content between the React Query cache and the mutation queue
3. Migrate to UUID v7 (frontend + backend) so the client can generate IDs for offline-created resources
4. Improve error handling in the sync flush with per-status strategies and a failed-mutations UI
5. Add optimistic updates for all new mutations

### Security concerns

- **Client-generated UUIDs**: A malicious user could send arbitrary UUIDs in POST requests. Mitigation: all resources are scoped by `userId` from the JWT, so a user can only affect their own data. The PK constraint prevents collisions. Backend should validate that the provided ID is a valid UUID format (add Zod validation).
- **Replay attacks**: The mutation queue is persisted in IndexedDB, which is not encrypted. A user with physical access to the device could inspect or tamper with queued mutations. This is acceptable since the JWT is required for replay and the user can only affect their own data.
- **Stale tokens**: Long offline periods could expire the refresh token. The existing 401 handling (stop sync, let user re-login) covers this case. Queued mutations are preserved across re-login since we only clear the queue on explicit logout.

### Step 1 — GPX blob store

**Why**: GPX files can be several MB. Currently `PUT_TRACK_GPX` stores the full `gpxContent` in the mutation queue (IndexedDB). The same content is also in the React Query cache (also IndexedDB). With `CREATE_TRACK` coming, we'd triple-store it. A blob store avoids this duplication.

**Files to create/modify**:

- `packages/web/src/lib/gpx-blob-store.ts` (new)

**Design**:

- Use `idb-keyval` with a custom store (`createStore('roadtrip-gpx-blobs', 'blobs')`)
- API: `saveGpxBlob(trackId: string, content: string)`, `getGpxBlob(trackId: string)`, `deleteGpxBlob(trackId: string)`
- Key = trackId (natural deduplication: latest GPX for a track always overwrites the previous blob)
- Blobs are cleaned up after successful sync of the corresponding mutation
- **Missing blob at flush time**: If `getGpxBlob` returns `undefined` for a `CREATE_TRACK` or `PUT_TRACK_GPX` mutation (e.g., user cleared browser storage), the mutation is moved to the failed mutations list with the error message "GPX data lost — please re-upload the track". Same error flow as Step 4.

**Impact on existing code**:

- `PUT_TRACK_GPX` mutation payload changes from `{ trackId, gpxContent }` to `{ trackId }` — the GPX is fetched from the blob store at flush time
- `useGpxMutation` calls `saveGpxBlob(trackId, updatedGpx)` before enqueuing
- `useNetworkSync.flush()` reads the blob from the store when processing `PUT_TRACK_GPX` and `CREATE_TRACK`

### Step 2 — New mutation types with co-located flush handlers

**Files to create/modify**:

- `packages/web/src/lib/mutations/create-track.ts` (new)
- `packages/web/src/lib/mutations/delete-track.ts` (new)
- `packages/web/src/lib/mutations/create-trip.ts` (new)
- `packages/web/src/lib/mutations/delete-trip.ts` (new)
- `packages/web/src/lib/mutations/add-track-to-trip.ts` (new)
- `packages/web/src/lib/mutations/remove-track-from-trip.ts` (new)
- `packages/web/src/lib/mutations/reorder-trip-tracks.ts` (new)
- `packages/web/src/lib/mutations/put-track-gpx.ts` (modify — remove gpxContent from payload, add flush handler)
- `packages/web/src/lib/mutations/index.ts` (modify — re-export all, union type, build handler registry)

**Mutation definitions**:

| Type | Payload | dedupeKey | Idempotent |
| ------ | --------- | ----------- | ------------ |
| `CREATE_TRACK` | `{ trackId, name }` | none | no |
| `PUT_TRACK_GPX` | `{ trackId }` | `trackId` | yes |
| `DELETE_TRACK` | `{ trackId }` | `trackId` | yes |
| `CREATE_TRIP` | `{ tripId, name, description?, startDate?, endDate? }` | none | no |
| `DELETE_TRIP` | `{ tripId }` | `tripId` | yes |
| `ADD_TRACK_TO_TRIP` | `{ tripId, trackId, order }` | none | no |
| `REMOVE_TRACK_FROM_TRIP` | `{ tripId, trackId }` | none | no |
| `REORDER_TRIP_TRACKS` | `{ tripId, trackIds }` | `tripId` | yes |

Note: `ADD_TRACK_TO_TRIP` and `REMOVE_TRACK_FROM_TRIP` are NOT deduplicated to preserve correct ordering (add → remove → add must replay all 3).

**Flush handler pattern (Open/Closed principle)**:

Each mutation file co-locates its type definition AND its flush handler. A flush handler is a function that receives the mutation payload and an `api` function, and performs the API call:

```typescript
// Example: packages/web/src/lib/mutations/delete-track.ts
export interface DeleteTrackPayload { trackId: string }
export interface DeleteTrackMutation { type: 'DELETE_TRACK'; payload: DeleteTrackPayload }

export const flushDeleteTrack: FlushHandler<DeleteTrackPayload> = async (payload, api) => {
  await api(`/api/tracks/${payload.trackId}`, { method: 'DELETE' })
}
```

The `index.ts` barrel builds a `flushHandlers` registry (a `Record<MutationType, FlushHandler>`) from all individual modules. Adding a new mutation type only requires creating a new file and adding it to the registry — no modification of the flush loop in `useNetworkSync`.

The `FlushHandler` type signature: `(payload: P, api: ApiFn) => Promise<void>`. The `useNetworkSync` flush loop becomes: `await flushHandlers[mutation.type](mutation.payload, api)`.

### Step 3 — UUID v7 migration

**Why**: Offline-created resources need client-generated IDs so the frontend can reference them immediately (e.g., add a track to a trip right after creating it, all offline).

**Files to modify**:

- `packages/web/package.json` — add `uuid` dependency (v7 support)
- `packages/shared/src/api-types.ts` — add `id: z.string().uuid()` to `CreateTrackRequestSchema` and `CreateTripRequestSchema` (required field)
- `packages/api/src/db/schema.ts` — remove `$defaultFn(() => crypto.randomUUID())` from tracks, trips, tripTracks tables; use the client-provided ID instead
- `packages/api/src/routes/tracks.ts` — use `body.id` instead of relying on Drizzle default
- `packages/api/src/routes/trips.ts` — same

**Backend ID handling**:

- POST routes receive `id` in the request body (validated as UUID by Zod)
- The backend uses this ID directly in the INSERT
- If a collision occurs (duplicate PK), the DB constraint returns an error; the API returns 409 Conflict
- The `users` table keeps server-side UUID generation (no offline signup)

### Step 4 — Sync error handling

**Why**: Currently, any error during flush stops the entire sync silently. We need per-mutation error tracking with clear user feedback and manual retry.

**Files to create/modify**:

- `packages/web/src/lib/mutation-queue.ts` (modify — add error tracking)
- `packages/web/src/hooks/useNetworkSync.ts` (modify — per-status error handling)
- `packages/web/src/hooks/useMutationQueue.ts` (modify — expose failed mutations)
- `packages/web/src/components/OfflineStatus.tsx` (modify — show errors, allow retry)

**Error strategy by HTTP status**:

| Status | Action | Rationale |
| -------- | -------- | ----------- |
| 2xx | Remove mutation from queue + clean up blob | Success |
| 401 | **Stop sync entirely** | Auth expired; user must re-login. All mutations are preserved. |
| 404 | Remove mutation from queue, record as failed | Resource already deleted server-side |
| 409 | Remove mutation from queue, record as failed | Conflict (e.g., duplicate ID) |
| Other (4xx/5xx) | Remove mutation from queue, record as failed | Unrecoverable; user can inspect and retry |
| Network error | **Stop sync entirely** | Connection lost again; will auto-retry on reconnection |

**Failed mutations tracking**:

- Add a `FailedMutation` type: `PendingMutation & { error: string, failedAt: number }`
- Store in a separate IDB key `roadtrip:failed-mutations`
- Functions: `getFailedMutations()`, `addFailedMutation(mutation, error)`, `retryFailedMutation(id)` (moves back to pending queue), `dismissFailedMutation(id)`
- The `useMutationQueue` hook exposes both `pendingCount` and `failedMutations`

**UI**:

- `OfflineStatus` shows a warning icon when there are failed mutations
- Clicking opens a list of failed mutations with the error message and retry/dismiss buttons
- Retrying moves the mutation back to the pending queue and triggers a flush

### Step 5 — Optimistic updates in hooks

**Files to modify**:

- `packages/web/src/hooks/useTracks.ts` — offline support for `useCreateTrack`, `useDeleteTrack`
- `packages/web/src/hooks/useTrips.ts` — offline support for all mutations
- `packages/web/src/hooks/useTracks.ts` — update `useGpxMutation` to use blob store

**Pattern for each hook** (example: `useCreateTrack`):

1. Generate UUID v7 for the new track
2. Save GPX blob: saveGpxBlob(trackId, gpxContent)
3. Enqueue mutation: { type: 'CREATE_TRACK', payload: { trackId, name } }
4. Optimistic update: add to React Query cache ['tracks'] list + set ['tracks', trackId] data
5. Return the generated ID so the UI can navigate to the new track immediately

**Detailed per-hook changes**:

- **useCreateTrack**: Generate UUID v7, save GPX blob, enqueue `CREATE_TRACK`, optimistically add track to `['tracks']` list and set `['tracks', trackId]` with full data. Return `{ id: trackId }`.

- **useDeleteTrack**: Enqueue `DELETE_TRACK` (dedupeKey: trackId), optimistically remove from `['tracks']` list and remove `['tracks', trackId]`. Clean up any pending GPX blob for this track.

- **useGpxMutation** (existing, modify): Save GPX to blob store instead of embedding in mutation payload. Mutation payload becomes just `{ trackId }`.

- **useCreateTrip**: Generate UUID v7, enqueue `CREATE_TRIP`, optimistically add to `['trips']` list. Return `{ id: tripId }`.

- **useDeleteTrip**: Enqueue `DELETE_TRIP` (dedupeKey: tripId), optimistically remove from `['trips']` list.

- **useAddTrackToTrip**: Enqueue `ADD_TRACK_TO_TRIP` (no dedupeKey), optimistically add track to `['trips', tripId, 'tracks']`.

- **useRemoveTrackFromTrip**: Enqueue `REMOVE_TRACK_FROM_TRIP` (no dedupeKey), optimistically remove from `['trips', tripId, 'tracks']`.

- **useUpdateTripTracksOrder** (existing, modify): Already has optimistic update. Add enqueue `REORDER_TRIP_TRACKS` (dedupeKey: tripId) to make it work offline.

### Step 6 — Wire up flush loop with handler registry

**File to modify**: `packages/web/src/hooks/useNetworkSync.ts`

Replace the current `if (mutation.type === 'PUT_TRACK_GPX')` block with a single generic call to the handler registry defined in Step 2:

```typescript
for (const mutation of mutations) {
  const handler = flushHandlers[mutation.type]
  await handler(mutation.payload, api)
  await removeMutation(mutation.id)
}
```

The flush loop itself has no knowledge of individual mutation types — it delegates to the handler registry. Adding a new mutation type never requires modifying `useNetworkSync`.

**Error handling** wraps each iteration with the strategy from Step 4 (try/catch, inspect status, stop or record as failed).

**GPX blob cleanup**: Handlers that use the blob store (`CREATE_TRACK`, `PUT_TRACK_GPX`) call `deleteGpxBlob(trackId)` internally after a successful API call, keeping the cleanup co-located with the handler rather than in the flush loop.

### Step 7 — Cleanup and final touches

- Remove the TODO comment in `useNetworkSync.ts` about unknown mutation types (they'll be handled)
- Ensure `clearQueue()` (called on logout) also clears the GPX blob store and failed mutations store
- Update `OfflineStatus` to reflect the richer state (pending + failed counts)
- Run `pnpm type-check`, `pnpm lint`, `pnpm format` to ensure CI passes

### Execution order

Steps 1-3 are foundational and should be done first (in order). Steps 4-6 build on them and can be done in sequence. Step 7 is cleanup.

The recommended PR breakdown:

1. **PR 1**: Steps 1 + 2 — GPX blob store + new mutation type definitions (no functional change yet, just the infrastructure)
2. **PR 2**: Step 3 — UUID v7 migration (backend + frontend, breaking change to API contract)
3. **PR 3**: Steps 4 + 5 + 6 — Error handling + optimistic updates + flush implementation (the main feature PR)
4. **PR 4**: Step 7 — Cleanup and polish
