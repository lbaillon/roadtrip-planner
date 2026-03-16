# change order of tracks in trips (drag and drop)

source : <https://trello.com/c/xmL8RCmw/45-change-order-of-tracks-in-trips-drag-and-drop>

## Purpose

As a user planning his next roadtrip, I wan to reorder my tracks in my trip so that I can easily see what's next and all the steps in my trip.

## Description

The user can reorder the tracks in a trip.
This is only possible for authenticated users.
This is only possible on a trip details since tracks only have a order from within a trip.

## Notes

I want to use a drag and drop feature to reorder tracks on the frontend side (similar to what gitlab does for an issue tasks).
I want the update to use a PUT that sends the whole list of tracks ids for this trip so that everything is updated in a single request. This is useful for a future use case with offline capabilities for the app as it will allows multiple changes before a single save.
The code must follow existing code structure and be consistent with the current design.

---

## Implementation Plan

### Library

Install `@dnd-kit/core` + `@dnd-kit/sortable` in `packages/web`.
No `react-beautiful-dnd` (deprecated since 2022, incompatible with React 19).

### 1. `packages/shared/src/api-types.ts`

Add the schema and type for the reorder request:

```ts
export const UpdateTripTracksOrderRequestSchema = z.object({
  trackIds: z.array(z.string().min(1)),
})
export type UpdateTripTracksOrderRequest = z.infer<typeof UpdateTripTracksOrderRequestSchema>
```

Also fix the return type of `useGetTripTracks` to include `order: number` — the backend already returns it but it is not yet typed on the frontend. Actually, take this occasion to use correct types from `packages/shared/src/api-types.ts` for all endpoints calls in `packages/web/src/hooks/`, types between backend and frontend must be consistent. Besides, update the code and types to make order mandatory now, since we always save it. Remove it from the form in the modal and just append the new track at the end, allowing the user to reorder it only with the drag and drop.

### 2. `packages/api/src/routes/trips.ts`

Add a `PUT /:id/tracks` endpoint via `processPut` (already available in `route-handler.ts`):

- Verify the trip belongs to the authenticated user
- Verify all provided `trackId` values actually belong to this trip in a single sql request
- Update the `step` field in `tripTracks` for each track based on its index in the received array (0-based)
- Use a Drizzle transaction to guarantee consistency

```ts
router.put(
  '/:id/tracks',
  processPut({
    paramsSchema: IdParamsSchema,
    bodySchema: UpdateTripTracksOrderRequestSchema,
    handler: ({ params, body, user }) =>
      reorderTripTracks(params.id, body.trackIds, user),
  })
)
```

### 3. `packages/web/src/hooks/useTrips.ts`

- Fix the return type of `useGetTripTracks` to include `order: number`
- Add the `useUpdateTripTracksOrder(tripId)` hook:

```ts
export function useUpdateTripTracksOrder(tripId: string) {
  const queryClient = useQueryClient()
  const api = useApi()
  return useMutation({
    mutationFn: (trackIds: string[]) =>
      api<void>(`/api/trips/${tripId}/tracks`, {
        method: 'PUT',
        body: JSON.stringify({ trackIds }),
      }),
    onMutate: async (trackIds) => {
      // optimistic update: reorder locally immediately
      await queryClient.cancelQueries({ queryKey: ['trips', tripId, 'tracks'] })
      const previous = queryClient.getQueryData(['trips', tripId, 'tracks'])
      queryClient.setQueryData(['trips', tripId, 'tracks'], (old: Track[]) =>
        trackIds.map((id) => old.find((t) => t.id === id)!).filter(Boolean)
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      // rollback on error
      queryClient.setQueryData(['trips', tripId, 'tracks'], context?.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', tripId, 'tracks'] })
    },
  })
}
```

### 4. `packages/web/src/components/TracksList.tsx`

Transform the list into a sortable list using `@dnd-kit`:

- Add a dedicated drag handle (icon `faGripVertical`) on the left of each item to avoid conflicts with the clickable name link and to improve accessibility
- Wrap in `DndContext` + `SortableContext` (using `verticalListSortingStrategy`)
- Each item becomes an isolated `SortableItem` component
- On drag end (`onDragEnd`), call `onReorder(newOrder: string[])` to propagate the new order to the parent

Updated props:

```ts
{
  tracks: { id: string; name: string; order: number | null }[]
  onDelete: (id: string) => void
  onReorder: (trackIds: string[]) => void
}
```

Update the CSS (`TracksList.module.css`) to add the drag handle style.
Do all this only for tracks within a trip. This can be done by checking if property `onReorder` is passed to the component.

### 5. `packages/web/src/pages/TripDetails.tsx`

- Add `useUpdateTripTracksOrder`
- Pass `onReorder` to `TracksList`

```ts
const { mutate: updateTracksOrder } = useUpdateTripTracksOrder(id ?? '')

<TracksList
  tracks={tracks ?? []}
  onDelete={removeTrackFromTrip}
  onReorder={updateTracksOrder}
/>
```

### 6. `packages/web/src/components/AddTrackToTripModal.tsx`

- Remove order input: new tracks are appended at the end and can be reordered only by using drag and drop.

### Suggested implementation order

1. Shared (schema + type)
2. Backend (PUT endpoint)
3. Frontend hook
4. `TracksList` component
5. `TripDetails` page

---

## Checklist

- [x] Install `@dnd-kit/core` and `@dnd-kit/sortable` in `packages/web`
- [x] `packages/shared/src/api-types.ts` — add `TripSummary`, `TripTrack`, `TrackSummary` types and `UpdateTripTracksOrderRequestSchema` / `UpdateTripTracksOrderRequest`
- [x] `packages/api/src/errors/error-codes.ts` — add `INVALID_TRACKS_ORDER` error code
- [x] `packages/api/src/routes/trips.ts` — cast `order: tripTracks.step ?? 0` in `getTripTracks`; add `reorderTripTracks` function and `PUT /:id/tracks` endpoint
- [x] `packages/web/src/hooks/useTrips.ts` — use shared types for all hooks; add `useUpdateTripTracksOrder` with optimistic update
- [x] `packages/web/src/hooks/useTracks.ts` — use `TrackSummary` type in `useGetTracks`
- [x] `packages/web/src/components/AddTrackToTripModal.tsx` — remove order field from form; compute order automatically as `tripTracks.length`
- [x] `packages/web/src/components/TracksList.tsx` — add drag-and-drop with `@dnd-kit`; add `onReorder` optional prop; drag handle only shown when `onReorder` is provided
- [x] `packages/web/src/components/TracksList.module.css` — add drag handle styles
- [x] `packages/web/src/pages/TripDetails.tsx` — wire `useUpdateTripTracksOrder` and pass `onReorder` to `TracksList`
- [x] `pnpm type-check`, `pnpm lint`, `pnpm format` all pass
