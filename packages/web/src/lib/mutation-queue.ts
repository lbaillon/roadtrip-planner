import { get, set } from 'idb-keyval'

const QUEUE_KEY = 'roadtrip:mutation-queue'

export interface PendingMutation<T = unknown> {
  id: string
  type: string
  payload: T
  enqueuedAt: number
}

export interface PutTrackGpxPayload {
  trackId: string
  gpxContent: string
}

export async function getMutations(): Promise<PendingMutation[]> {
  return (await get<PendingMutation[]>(QUEUE_KEY)) ?? []
}

export async function enqueueMutation(
  type: string,
  payload: unknown
): Promise<void> {
  const mutations = await getMutations()

  // PUT_TRACK_GPX: deduplicate by trackId — the new GPX supersedes the old
  let filtered = mutations
  if (type === 'PUT_TRACK_GPX') {
    const { trackId } = payload as PutTrackGpxPayload
    filtered = mutations.filter(
      (m) =>
        !(
          m.type === 'PUT_TRACK_GPX' &&
          (m.payload as PutTrackGpxPayload).trackId === trackId
        )
    )
  }

  const mutation: PendingMutation = {
    id: crypto.randomUUID(),
    type,
    payload,
    enqueuedAt: Date.now(),
  }

  await set(QUEUE_KEY, [...filtered, mutation])
  window.dispatchEvent(new Event('mutation-enqueued'))
}

export async function removeMutation(id: string): Promise<void> {
  const mutations = await getMutations()
  await set(
    QUEUE_KEY,
    mutations.filter((m) => m.id !== id)
  )
  window.dispatchEvent(new Event('mutation-dequeued'))
}

export async function clearQueue(): Promise<void> {
  await set(QUEUE_KEY, [])
  window.dispatchEvent(new Event('mutation-dequeued'))
}
