# add possibility for user to add personalized markers on maps

source : https://trello.com/c/eOadG52J/12-add-possibility-for-user-to-add-personalized-markers-on-maps

## Purpose

As a user planning my next roadtrip I want to add routepoints on my track by taping on the map so that I can know where to stop during my trip.

## Description

The user should be able to activate the edit mode for any track. 
It should not be on the same place as the existing toggles on map. 
It should not be possible for a user to edit if not logged in.
In edit mode, the user should be able to click on the map after loading a track. 
It should display a popup allowing the user to enter name and description (optionnal) and submit.
The GPX file should then be edited to include the new routepoint.
The user should be able to edit and delete existing routepoints, the GPX file will be then saved accordingly.
The user should be able to download the edited GPX file.

## Notes

There already is an API endpoint to add waypoints/routepoints.
This feature must make use of it. The endpoint can be editied if needed.
The code must follow existing code structure and be consistent with the current design.

---

## Implementation Plan

### Open Questions

Before proceeding, I need clarification on:

1. **Edit mode button placement**: The existing toggles (Location, Waypoints, Weather) live in a dropdown at the top-right of the map. Where should the edit mode toggle go?
   - Floating button at the bottom-right of the map (e.g. ✏️ icon)
   - Button on the `TrackDetails` page above the map (outside the map component)
   - *My recommendation*: floating button at the bottom-right, visually separate from the layers dropdown
   > I validate the recommendation

2. **Waypoint identification for edit/delete**: Waypoints have no ID in the GPX format. The API will need to identify them by their index in the array. Is that acceptable, or should we handle edge cases like duplicate names?
> it is ok to use their index since we do not modify it

3. **Download GPX button placement**:
   - Only visible when edit mode is active?
   - Always visible on the TrackDetails page?
> it should be always visible on the trackdetails page
---

### Overview of Changes

```
packages/shared/    → Update schemas (description, edit, delete)
packages/api/       → 2 new endpoints (edit + delete waypoint)
                    → Update addWaypointToGpx (+ description)
packages/web/       → Edit mode in TrackDetails + MapView
                    → Create/edit popup modal
                    → New API hooks
                    → Download button
```

---

### Step 1 — `packages/shared`: update schemas

**File:** `src/api-types.ts`

**1a.** Add optional `description` to `UpdateTrackRequestSchema`:
```typescript
export const UpdateTrackRequestSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  name: z.string(),
  description: z.string().optional(),  // ← new
})
```

**1b.** Create `EditWaypointRequestSchema` (for updating an existing waypoint):
```typescript
export const EditWaypointRequestSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
})
```

**1c.** Create `WaypointParamsSchema` (for routes `/:id/waypoints/:index`):
```typescript
export const WaypointParamsSchema = IdParamsSchema.extend({
  index: z.coerce.number().int().nonnegative(),
})
```

---

### Step 2 — `packages/api`: update GPX service

**File:** `src/services/gpx-parser.ts`

**2a.** Update `addWaypointToGpx` to include `<desc>` when provided:
```typescript
const newPoint = {
  '@_lat': waypoint.lat,
  '@_lon': waypoint.lon,
  name: waypoint.name,
  ...(waypoint.description ? { desc: waypoint.description } : {}),
}
```

**2b.** Create `editWaypointInGpx(gpxContent, index, data)`:
- Parse GPX
- Retrieve the waypoint array (`wpt` or `rtept`)
- Update the element at the given index (name + desc)
- Return the modified GPX string

**2c.** Create `deleteWaypointFromGpx(gpxContent, index)`:
- Parse GPX
- Remove the element at the given index
- Return the modified GPX string

---

### Step 3 — `packages/api`: new endpoints

**File:** `src/routes/tracks.ts`

**3a.** Update `PUT /:id/waypoints` to pass `description` through to `addWaypointToGpx` (schema already updated in Step 1, no signature change needed).

**3b.** Add `PATCH /:id/waypoints/:index` — edit an existing waypoint:
```
PATCH /api/tracks/:id/waypoints/:index
Body: { name, description? }
Auth: required
```
- Verify track ownership
- Fetch GPX from storage
- Call `editWaypointInGpx`
- Overwrite GPX in storage (in cloudinary)

**3c.** Add `DELETE /:id/waypoints/:index` — delete a waypoint:
```
DELETE /api/tracks/:id/waypoints/:index
Auth: required
```
- Verify track ownership
- Fetch GPX from storage
- Call `deleteWaypointFromGpx`
- Overwrite GPX in storage

---

### Step 4 — `packages/web`: new API hooks

**File:** `src/hooks/useTracks.ts`

Create 3 React Query mutations following the existing pattern:
- `useAddWaypoint(trackId)` → `PUT /api/tracks/:id/waypoints`
- `useEditWaypoint(trackId)` → `PATCH /api/tracks/:id/waypoints/:index`
- `useDeleteWaypoint(trackId)` → `DELETE /api/tracks/:id/waypoints/:index`

Each mutation invalidates the track query (`['track', trackId]`) to trigger a GPX re-parse after modification.

---

### Step 5 — `packages/web`: edit mode in `TrackDetails`

**File:** `src/pages/TrackDetails.tsx`

**5a.** Add `isEditMode: boolean` state (default `false`).

**5b.** Gate edit mode behind authentication: hide the button when the user is not logged in (use the existing auth hook).

**5c.** Add an "Edit mode" toggle button — *placement TBD per question 1* — styled separately from the layers dropdown (e.g. Ant Design button with `EditOutlined` icon).

**5d.** Pass `isEditMode` and the mutation callbacks down to `MapView` as props.

**5e.** Add a "Download GPX" button — *placement TBD per question 3*. Uses the already-available `track.gpxContent` to create a `Blob` and trigger a browser download (no new endpoint needed).

---

### Step 6 — `packages/web`: update `MapView`

**File:** `src/components/MapView.tsx`

**6a.** Add new props:
```typescript
isEditMode?: boolean
onMapClick?: (lat: number, lon: number) => void
onEditWaypoint?: (index: number) => void
onDeleteWaypoint?: (index: number) => void
```

**6b.** In edit mode, attach an `onClick` handler to the `Map` component → calls `onMapClick(lat, lon)`. Switch cursor to `crosshair` when `isEditMode` is active.

**6c.** In edit mode, update the existing waypoint popup to show "Edit" and "Delete" buttons.

**6d.** Add a visual indicator when edit mode is active (colored border on the map) so the user knows they are in edit mode.

---

### Step 7 — `packages/web`: waypoint create/edit modal

Create `WaypointFormModal` component (Ant Design `Modal` + `Form`, consistent with `NewTripModal` and `NewTrackModal`):

**Props:**
```typescript
type WaypointFormModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (data: { name: string; description?: string }) => void
  initialValues?: { name: string; description?: string }  // for edit
  loading: boolean
}
```

**Fields:**
- `name`: text input, required
- `description`: textarea, optional

**Create flow**: map click → store coordinates in state → open `WaypointFormModal` → submit → `useAddWaypoint` → GPX re-parsed → modal closes.

**Edit flow**: click "Edit" on waypoint popup → open `WaypointFormModal` with current values → submit → `useEditWaypoint` → GPX re-parsed.

---

### Summary of Files Changed

| Package | File | Change |
|---------|------|--------|
| shared | `src/api-types.ts` | Update |
| api | `src/services/gpx-parser.ts` | Update |
| api | `src/routes/tracks.ts` | Update |
| web | `src/hooks/useTracks.ts` | Update |
| web | `src/pages/TrackDetails.tsx` | Update |
| web | `src/components/MapView.tsx` | Update |
| web | `src/components/WaypointFormModal.tsx` | Create |