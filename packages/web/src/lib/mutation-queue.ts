import { get, set } from 'idb-keyval'
import type { MutationDefinition } from './mutations'

const QUEUE_KEY = 'roadtrip:mutation-queue'

export type PendingMutation = MutationDefinition & {
  id: string
  enqueuedAt: number
}

export async function getMutations(): Promise<PendingMutation[]> {
  return (await get<PendingMutation[]>(QUEUE_KEY)) ?? []
}

export async function enqueueMutation(
  definition: MutationDefinition
): Promise<void> {
  const mutations = await getMutations()

  // PUT_TRACK_GPX: deduplicate by trackId — the new GPX supersedes the old
  let filtered = mutations
  if (definition.type === 'PUT_TRACK_GPX') {
    const { trackId } = definition.payload
    filtered = mutations.filter(
      (m) => !(m.type === 'PUT_TRACK_GPX' && m.payload.trackId === trackId)
    )
  }

  const mutation: PendingMutation = {
    ...definition,
    id: crypto.randomUUID(),
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
