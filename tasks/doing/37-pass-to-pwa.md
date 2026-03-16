# migrate application to PWA

source : <https://trello.com/c/mfqJTEr0/37-pass-to-pwa>

## Purpose

As a user while on a roadtrip, I want to use the app offline and be sure it will get synchronized when connection comes back, so that I can check the trip info even without network during the trip.

## Description

To make it easier for users to use it on phone during their trips and make sure they can use the app even without network, it will migrate to a PWA.
The scenario is that users check the track in the morning to see what the weather is like on the road so we load all the info while there is network, then during the trip, they sometimes get to area without any connection but they must still be able to check the app and even make some edits. When they get network back, their changes get synchronized with the server.

## Notes

This will be an opportunity for a big refactoring of what we already have. Especially the waypoints update, I think it would be better to edit the GPX locally on the frontend and to send the whole GPX in a PUT update when the network is back.

---

## Implementation Plan

### Architecture decisions

- **vite-plugin-pwa** for the base PWA setup (Workbox included)
- **React Query persistence** via IndexedDB for offline cache (no network interception in SW)
- **GPX edited on the frontend**, a single `PUT /api/tracks/:id` with the full GPX content (no more individual waypoint endpoints)
- **IndexedDB mutation queue** replayed on reconnection (extensible for future offline actions)
- **Offline auth**: user identity persisted locally; refresh token attempted on reconnection — if expired, pending changes are lost and data is reloaded from the server
- **Weather cached 48h** via React Query `gcTime` + IndexedDB persistence
- **Map tiles**: Workbox runtime caching if straightforward, otherwise a separate ticket
- **Last write wins** for multi-device conflicts (acceptable since only the owner can modify a track)

### Key architectural finding

`TrackDetails` currently calls `POST /api/gpx` on **every page load** via `useParseGpx` (a mutation, not a query), meaning **neither the parsed route nor the weather data are cached** by React Query. The GPX refactoring in Phase 4 fixes this by replacing those calls with proper persistable queries.

---

### Phase 1 — Basic PWA setup

**Goal**: installable on mobile, app shell JS/CSS/HTML cached

- Install `vite-plugin-pwa`
- Configure in `vite.config.ts`: `generateSW`, app shell precache, inline manifest
- Create PWA icons (192×192, 512×512) in `packages/web/public/icons/`
- Configure manifest: name, `short_name`, `theme_color`, `display: standalone`, `start_url: /`
- Add a `SWUpdatePrompt` component to notify users of an available update

---

### Phase 2 — React Query persistence (IndexedDB)

**Goal**: trips/tracks/weather data survives page reloads, available offline

- Install `@tanstack/query-persist-client` + `idb-keyval`
- Replace `QueryClientProvider` with `PersistQueryClientProvider` in `main.tsx`
- Configure `gcTime` on the `QueryClient`:
  - tracks, trips: `7 days`
  - weather: `48h`
- Ensure all queries have stable, deterministic `queryKey` values

---

### Phase 3 — Offline auth

**Goal**: user stays "logged in" offline; authenticated sync on reconnection

- Persist `{ userId, username }` in `localStorage` on login (not the JWT token)
- Update `AuthContext` to restore identity from `localStorage` on startup, even without a valid access token in memory
- While offline: identity is available to the UI, but network mutations are enqueued rather than sent immediately
- Update `logout()` in `AuthContext` to also clear the mutation queue — this covers the case where a token expires during sync
- Create a `useNetworkSync` hook that:
  1. Listens to `window.addEventListener('online', …)`
  2. Replays each pending mutation using the existing `useApi()` hook
  3. `useApi` already handles the 401 → `POST /api/auth/refresh` → retry cycle transparently; no need to call refresh manually before flushing
  4. **If refresh fails during replay**: `useApi` calls `logout()`, which clears the queue and redirects to `/login` — the existing auth flow handles this automatically
  5. Invalidate all React Query caches after a successful sync to reload fresh data from the server

---

### Phase 4 — GPX frontend refactoring

**Goal**: the frontend owns all GPX parsing and editing; the API is reduced to storage and weather fetching

#### 4a — Move GPX utilities to `packages/web`

- Add `gpxparser` and `fast-xml-parser` as dependencies of `packages/web`
- Create `packages/web/src/lib/gpx-utils.ts` with:
  - `parseGpxFile(content: string): ParsedGpx` — extracts coordinates + waypoints
  - `sampleRoutePoints(coordinates): Array<{lat, lon}>` — moved from the API
  - `addWaypointToGpx(content, waypoint): string`
  - `editWaypointInGpx(content, index, data): string`
  - `deleteWaypointFromGpx(content, index): string`
- Adapt errors: replace `BadRequestError` (server-only) with standard `Error`
- Remove `gpxparser` and `fast-xml-parser` from `packages/api` — the API no longer needs to parse or manipulate GPX
- Delete `packages/api/src/services/gpx-parser.ts`

#### 4b — Refactor the weather API endpoint and add `PUT /api/tracks/:id`

The current `POST /api/gpx` accepts raw GPX content, parses it server-side, samples the route points, and returns both the parsed route and weather data. With GPX parsing moved to the frontend, this endpoint only needs to fetch weather for a list of coordinates provided by the client.

- Replace `ParseGpxRequestSchema` / `ParseGpxResponseSchema` in shared with:
  - `GetWeatherRequestSchema`: `{ coordinates: Array<{lat, lon}> }` (sampled points sent by the frontend)
  - `GetWeatherResponseSchema`: `WeatherData[]` (weather only, no route data)
- Rename route from `POST /api/gpx` to `POST /api/weather` (update route registration in `routes/index.ts`)
- Simplify the handler: receive coordinates, call `fetchWeatherForPoint` for each, return results — no more GPX parsing or sampling
- Add `UpdateTrackGpxRequestSchema` to shared: `{ gpxContent: string }`
- Implement `PUT /api/tracks/:id`:
  - Verify the track belongs to the authenticated user
  - Call `overwriteGpx(track.gpxFile, gpxContent)` on Cloudinary
  - Update `updatedAt` in the database
- Remove the old individual waypoint endpoints (`PUT /:id/waypoints`, `PATCH /:id/waypoints/:index`, `DELETE /:id/waypoints/:index`)

#### 4c — TrackDetails and hooks refactoring

**Replace `useParseGpx`** (mutation → two proper queries):

- Create `useGetParsedTrack(trackId)` — `useQuery` that:
  - Reads `gpxContent` from the `['tracks', id]` cache
  - Parses locally with `parseGpxFile` (from `gpx-utils.ts`) — synchronous, no network call
  - `queryKey: ['tracks', id, 'parsed']`
  - `gcTime: 7 days`
  - Enabled only when `gpxContent` is available in cache

- Create `useGetTrackWeather(trackId)` — `useQuery` that:
  - Reads parsed coordinates from the `['tracks', id, 'parsed']` cache
  - Samples route points locally with `sampleRoutePoints` (from `gpx-utils.ts`)
  - Calls the new `POST /api/weather` with the sampled coordinates
  - `queryKey: ['tracks', id, 'weather']`
  - `gcTime: 48h`, `staleTime: 1h`

**Update waypoint mutations** in `useTracks.ts`:

- `useAddWaypoint`, `useEditWaypoint`, `useDeleteWaypoint` become **local mutations** that:
  1. Read the current `gpxContent` from the `['tracks', id]` cache
  2. Call the appropriate GPX function (from `gpx-utils.ts`)
  3. Update the cache via `queryClient.setQueryData(['tracks', id], …)`
  4. Invalidate `['tracks', id, 'parsed']` to re-parse the displayed waypoints
  5. Enqueue a `PUT_TRACK_GPX` mutation via the mutation queue (Phase 5)
  6. **No longer make direct network calls**

**Update `TrackDetails.tsx`**:

- Replace `useParseGpx` + `useEffect` with `useGetParsedTrack` + `useGetTrackWeather`
- Graceful degradation: map renders as soon as the route is parsed; weather loads independently
- Replace `alert()` calls with proper UI messages (be consistent across the codebase)

---

### Phase 5 — Offline mutation queue

**Goal**: offline changes are persisted and replayed on reconnection

**Pending mutation shape**:

```typescript
interface PendingMutation<T = unknown> {
  id: string        // uuid
  type: string      // 'PUT_TRACK_GPX' | extensible for future actions
  payload: T
  enqueuedAt: number
}
```

- Create `packages/web/src/lib/mutation-queue.ts` (direct IndexedDB access via `idb-keyval`):
  - `getMutations(): Promise<PendingMutation[]>`
  - `enqueueMutation(type, payload): Promise<void>`
  - `removeMutation(id): Promise<void>`
  - `clearQueue(): Promise<void>`

- Create `packages/web/src/hooks/useMutationQueue.ts`:
  - Exposes `pendingCount: number` (for the UI badge)
  - Exposes `enqueueMutation(type, payload)` used by waypoint hooks
  - Sync is triggered by `useNetworkSync` (Phase 3)

**Sync logic in `useNetworkSync`** (completes Phase 3):

1. Fetch all pending mutations in chronological order
2. For each mutation:
   - `PUT_TRACK_GPX` → `PUT /api/tracks/:trackId` with `{ gpxContent }`
   - On success: `removeMutation(id)`
   - On network error: stop sync (retry on next reconnection)
3. Invalidate all React Query caches after a complete sync

In the case of `PUT_TRACK_GPX`, enqueuing a mutation if there is one already of the same type also removes the old one (since it is now obsolete).

---

### Phase 6 — 48h weather cache

Covered by Phase 4c (`gcTime: 48h` on `useGetTrackWeather`). With React Query persistence (Phase 2), this cache is automatically saved to IndexedDB.

*Nice-to-have*: display "Weather as of {date}" in the UI when data comes from cache while offline.

---

### Phase 7 — Map tile caching (optional)

The map uses `https://basemaps.cartocdn.com/` (CartoCDN).

Add a `runtimeCaching` entry in the `vite-plugin-pwa` Workbox config:

```js
{
  urlPattern: /^https:\/\/basemaps\.cartocdn\.com\//,
  handler: 'CacheFirst',
  options: {
    cacheName: 'map-tiles',
    expiration: { maxEntries: 500, maxAgeSeconds: 30 * 24 * 60 * 60 },
    cacheableResponse: { statuses: [0, 200] },
  },
}
```

Check that CartoCDN CORS headers allow caching. If not, defer to a separate ticket.

---

### Phase 8 — Offline UI

- Replace `alert()` in waypoint handlers with Ant Design notifications (see how it is done in `packages/web/src/components/NewTrackModal.tsx`)
- Add an offline banner in the layout: "Offline — {n} change(s) pending sync" (is it necessary then to keep the health status indicator `packages/web/src/components/ConnectionIndicator.tsx`?)
- Gracefully disable actions not yet supported offline (e.g. GPX upload from Home). This will be supported later along with all other actions.
- Show a syncing indicator when reconnecting and flushing the queue

---

### Recommended implementation order

| Step | Phase | Why |
| ------ | ------- | ----- |
| 1 | Phase 1 (basic PWA) | Quick win, fully independent |
| 2 | Phase 4a (GPX in shared) | Foundation for everything else |
| 3 | Phase 4b (PUT endpoint) | Required before frontend refactoring |
| 4 | Phase 4c (TrackDetails + hooks) | Large change, do in one go |
| 5 | Phase 2 (React Query persistence) | Queries must be well-structured first |
| 6 | Phase 5 (mutation queue) | Depends on 4c for PUT_TRACK_GPX |
| 7 | Phase 3 (offline auth) | Depends on 5 for sync |
| 8 | Phase 6 (weather gcTime) | Included in 4c, just verify |
| 9 | Phase 7 (map tiles) | Optional, Workbox config |
| 10 | Phase 8 (UI) | In parallel or at the end |
