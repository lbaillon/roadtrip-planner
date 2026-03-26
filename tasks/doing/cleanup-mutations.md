# Cleanup mutations : colocaliser hooks + flush handlers

## Objectif

Aujourd'hui, chaque mutation est éclatée en 3 endroits :

1. **Hook React** (`useMutation`) → `hooks/useTrips.ts` ou `hooks/useTracks.ts`
2. **Flush handler** (fonction pure appelée au sync réseau) → `lib/mutations/<name>.ts`
3. **Registre** (dispatch vers le bon handler) → `lib/mutations/index.ts`

On veut **colocaliser** le hook et le flush handler dans un même fichier par mutation, sous `hooks/mutations/`. Le registre devient un hook `useFlushHandler` dans `hooks/mutations/useFlushHandler.ts`.

> **Note :** React Compiler est activé — pas besoin de `useMemo` / `useCallback`.

---

## Architecture cible

```
hooks/
├── mutations/
│   ├── useFlushHandler.ts              ← useFlushHandler (registre) + export type MutationDefinition
│   ├── types.ts              ← FlushFn<P> (nouvelle signature sans api)
│   ├── useCreateTrip.ts      ← useCreateTrip + useFlushCreateTrip + CreateTripMutation
│   ├── useDeleteTrip.ts      ← useDeleteTrip + useFlushDeleteTrip + DeleteTripMutation
│   ├── useCreateTrack.ts     ← useCreateTrack + useFlushCreateTrack + CreateTrackMutation
│   ├── useDeleteTrack.ts     ← useDeleteTrack + useFlushDeleteTrack + DeleteTrackMutation
│   ├── usePutTrackGpx.ts     ← useFlushPutTrackGpx + PutTrackGpxMutation (pas de hook useMutation ici, utilisé via useGpxMutation dans useTracks.ts)
│   ├── useAddTrackToTrip.ts  ← useAddTrackToTrip + useFlushAddTrackToTrip + AddTrackToTripMutation
│   ├── useRemoveTrackFromTrip.ts ← useRemoveTrackFromTrip + useFlushRemoveTrackFromTrip + RemoveTrackFromTripMutation
│   └── useReorderTripTracks.ts   ← useUpdateTripTracksOrder + useFlushReorderTripTracks + ReorderTripTracksMutation
├── useTracks.ts              ← garde uniquement les queries (useGetTracks, useGetTrack) + useGpxMutation, useAddWaypoint, useEditWaypoint, useDeleteWaypoint
├── useTrips.ts               ← garde uniquement les queries (useGetTrips, useGetTrip, useGetTripTracks)
├── useNetworkSync.ts         ← adapté pour utiliser useFlushHandler
└── ...
```

---

## Étapes détaillées

### Étape 1 : Créer `hooks/mutations/types.ts`

Ce fichier contient la nouvelle signature de flush, le type union `MutationDefinition`, et le type du registre. Centraliser ces types évite les imports circulaires et rend `useFlushHandler.ts` plus lisible.

```ts
import type { AddTrackToTripMutation } from './useAddTrackToTrip'
import type { CreateTrackMutation } from './useCreateTrack'
import type { CreateTripMutation } from './useCreateTrip'
import type { DeleteTrackMutation } from './useDeleteTrack'
import type { DeleteTripMutation } from './useDeleteTrip'
import type { PutTrackGpxMutation } from './usePutTrackGpx'
import type { RemoveTrackFromTripMutation } from './useRemoveTrackFromTrip'
import type { ReorderTripTracksMutation } from './useReorderTripTracks'

export type FlushFn<P> = (payload: P) => Promise<void>

export type MutationDefinition =
  | CreateTripMutation
  | DeleteTripMutation
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
```

> **Note :** les `import type` depuis les fichiers mutation ne créent pas de dépendance circulaire car les fichiers mutation importent `FlushFn` depuis `types.ts` (qui est un type simple sans dépendance sur les mutations). TypeScript résout les `import type` au compile-time uniquement.

L'ancien `ApiFn` dans `lib/mutations/types.ts` n'a plus besoin d'être exporté une fois la migration terminée.

---

### Étape 2 : Créer les fichiers par mutation dans `hooks/mutations/`

Pour chaque mutation, créer un fichier qui exporte :
- L'interface `XxxMutation` (type + payload) — identique à l'actuelle
- Un hook `useFlushXxx()` qui appelle `useApi()` et retourne une `FlushFn<Payload>`
- Le hook `useXxx()` (le `useMutation` actuel, déplacé depuis `useTrips.ts` / `useTracks.ts`)

**Modèle pour un cas simple** (ex: `useDeleteTrip.ts`) :

```ts
import { enqueueMutation } from '#web/lib/mutation-queue'
import type { IdParams, TripSummary } from '@roadtrip/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '../useApi'
import type { FlushFn } from './types'

// --- Mutation type ---
export interface DeleteTripMutation {
  type: 'DELETE_TRIP'
  payload: IdParams
}

// --- Mutation hook (UI) ---
export function useDeleteTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await enqueueMutation(
        { type: 'DELETE_TRIP', payload: { id } },
        { dedupeKey: id }
      )
    },
    onSuccess: async (_, id) => {
      queryClient.setQueryData<TripSummary[]>(['trips'], (old = []) =>
        old.filter((t) => t.id !== id)
      )
      queryClient.removeQueries({ queryKey: ['trips', id] })
      await queryClient.invalidateQueries({
        queryKey: ['mutation-queue', 'pending'],
      })
    },
  })
}

// --- Flush handler (hook) ---
export function useFlushDeleteTrip(): FlushFn<DeleteTripMutation['payload']> {
  const api = useApi()
  return async ({ id }) => {
    await api<void>(`/api/trips/${id}`, { method: 'DELETE' })
  }
}
```

**Liste complète des fichiers à créer :**

| Fichier | useFlush hook | useMutation hook (déplacé depuis) |
|---|---|---|
| `useCreateTrip.ts` | `useFlushCreateTrip` — POST `/api/trips` avec body JSON du payload | `useCreateTrip` depuis `useTrips.ts` |
| `useDeleteTrip.ts` | `useFlushDeleteTrip` — DELETE `/api/trips/${id}` | `useDeleteTrip` depuis `useTrips.ts` |
| `useCreateTrack.ts` | `useFlushCreateTrack` — récupère GPX blob via `getGpxBlob(id)`, POST `/api/tracks` | `useCreateTrack` depuis `useTracks.ts` |
| `useDeleteTrack.ts` | `useFlushDeleteTrack` — DELETE `/api/tracks/${id}` | `useDeleteTrack` depuis `useTracks.ts` |
| `usePutTrackGpx.ts` | `useFlushPutTrackGpx` — récupère GPX blob via `getGpxBlob(id)`, PUT `/api/tracks/${id}` | **Aucun** — le hook `useMutation` pour GPX est `useGpxMutation` dans `useTracks.ts`, il reste là-bas |
| `useAddTrackToTrip.ts` | `useFlushAddTrackToTrip` — POST `/api/trips/${tripId}/tracks/${trackId}` avec body `{ order }` | `useAddTrackToTrip` depuis `useTrips.ts` |
| `useRemoveTrackFromTrip.ts` | `useFlushRemoveTrackFromTrip` — DELETE `/api/trips/${tripId}/tracks/${trackId}` | `useRemoveTrackFromTrip` depuis `useTrips.ts` |
| `useReorderTripTracks.ts` | `useFlushReorderTripTracks` — PUT `/api/trips/${tripId}/tracks` avec body `{ trackIds }` | `useUpdateTripTracksOrder` depuis `useTrips.ts` |

---

### Étape 3 : Créer `hooks/mutations/useFlushHandler.ts` — le registre hook

Ce fichier remplace `lib/mutations/index.ts`. Les types `MutationDefinition` et `FlushHandlerRegistry` sont dans `types.ts` (étape 1). Ce fichier n'exporte que le hook.

```ts
import { useFlushAddTrackToTrip } from './useAddTrackToTrip'
import { useFlushCreateTrack } from './useCreateTrack'
import { useFlushCreateTrip } from './useCreateTrip'
import { useFlushDeleteTrack } from './useDeleteTrack'
import { useFlushDeleteTrip } from './useDeleteTrip'
import { useFlushPutTrackGpx } from './usePutTrackGpx'
import { useFlushRemoveTrackFromTrip } from './useRemoveTrackFromTrip'
import { useFlushReorderTripTracks } from './useReorderTripTracks'
import type {
  FlushFn,
  FlushHandlerRegistry,
  MutationDefinition,
} from './types'

export function useFlushHandler() {
  const handlers: FlushHandlerRegistry = {
    CREATE_TRIP: useFlushCreateTrip(),
    DELETE_TRIP: useFlushDeleteTrip(),
    CREATE_TRACK: useFlushCreateTrack(),
    DELETE_TRACK: useFlushDeleteTrack(),
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
```

> Le cast `as FlushFn<any>` reste nécessaire car TypeScript ne peut pas narrower le type du payload depuis `mutation.type` à travers un accès dynamique au registre. C'est le même pattern que l'actuel.

---

### Étape 4 : Adapter `useNetworkSync.ts`

Remplacer :
```ts
import { applyFlushHandler } from '#web/lib/mutations'
```
par :
```ts
import { useFlushHandler } from './mutations/useFlushHandler'
```

Dans le hook `useNetworkSync`, appeler le hook en haut :
```ts
const applyFlush = useFlushHandler()
```

Et dans la boucle de flush (ligne 38), remplacer :
```ts
await applyFlushHandler(mutation, api)
```
par :
```ts
await applyFlush(mutation)
```

La variable `api` n'est plus utilisée directement dans `useNetworkSync` pour les mutations (elle est capturée par chaque `useFlushXxx`). **Mais** `api` est toujours importée via `useApi` dans ce hook — vérifier si elle est utilisée ailleurs dans le fichier. Si non, supprimer l'import `useApi` et la ligne `const api = useApi()`.

---

### Étape 5 : Nettoyer `useTrips.ts` et `useTracks.ts`

**`useTrips.ts`** — supprimer les hooks mutations déplacés, garder uniquement :
- `useGetTrips`
- `useGetTrip`
- `useGetTripTracks`

Supprimer les imports devenus inutiles (`enqueueMutation`, `v7 as uuidv7`, types liés aux mutations, etc.).

**`useTracks.ts`** — supprimer `useCreateTrack` et `useDeleteTrack`, garder :
- `useGetTracks`
- `useGetTrack`
- `useGpxMutation` (helper interne)
- `useAddWaypoint`
- `useEditWaypoint`
- `useDeleteWaypoint`

Supprimer les imports devenus inutiles.

---

### Étape 6 : Mettre à jour les imports des consommateurs

Les composants/pages qui importent les hooks mutations doivent pointer vers les nouveaux fichiers :

| Fichier | Import actuel | Nouvel import |
|---|---|---|
| `pages/Trips.tsx:6` | `import { useDeleteTrip, useGetTrips } from '#web/hooks/useTrips'` | `useGetTrips` reste dans `#web/hooks/useTrips`, `useDeleteTrip` vient de `#web/hooks/mutations/useDeleteTrip` |
| `pages/TripDetails.tsx:11` | Plusieurs imports depuis `#web/hooks/useTrips` | Séparer : queries depuis `useTrips`, mutations depuis `hooks/mutations/` |
| `pages/Tracks.tsx:6` | `import { useDeleteTrack, useGetTracks } from '#web/hooks/useTracks'` | `useGetTracks` reste dans `useTracks`, `useDeleteTrack` vient de `hooks/mutations/useDeleteTrack` |
| `components/NewTrackModal.tsx:1` | `import { useCreateTrack } from '#web/hooks/useTracks'` | `#web/hooks/mutations/useCreateTrack` |
| `components/NewTripModal.tsx:1` | `import { useCreateTrip } from '#web/hooks/useTrips'` | `#web/hooks/mutations/useCreateTrip` |
| `components/AddTrackToTripModal.tsx:2` | `import { useAddTrackToTrip, useGetTripTracks } from '#web/hooks/useTrips'` | `useGetTripTracks` reste dans `useTrips`, `useAddTrackToTrip` vient de `hooks/mutations/useAddTrackToTrip` |

---

### Étape 7 : Supprimer les anciens fichiers

Supprimer tout le dossier `lib/mutations/` :
- `lib/mutations/index.ts`
- `lib/mutations/types.ts`
- `lib/mutations/create-trip.ts`
- `lib/mutations/create-track.ts`
- `lib/mutations/delete-trip.ts`
- `lib/mutations/delete-track.ts`
- `lib/mutations/put-track-gpx.ts`
- `lib/mutations/add-track-to-trip.ts`
- `lib/mutations/remove-track-from-trip.ts`
- `lib/mutations/reorder-trip-tracks.ts`

---

### Étape 8 : Vérification

Lancer dans l'ordre :
```bash
pnpm type-check
pnpm lint
pnpm format
```

Corriger les erreurs éventuelles (imports manquants, types non exportés, etc.).

---

## Résumé des changements

- **8 fichiers créés** : `hooks/mutations/*.ts` (7 mutations + index)
- **1 fichier créé** : `hooks/mutations/types.ts`
- **2 fichiers modifiés** : `useTrips.ts`, `useTracks.ts` (retrait des mutations)
- **1 fichier modifié** : `useNetworkSync.ts` (utilise `useFlushHandler` hook)
- **6 fichiers modifiés** : pages/composants (imports mis à jour)
- **10 fichiers supprimés** : `lib/mutations/*`
- **1 fichier supprimé** : `hooks/useDeleteTrip.ts` (prototype)
