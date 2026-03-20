import { get, set } from 'idb-keyval'
import type { MutationDefinition } from './mutations'

const QUEUE_KEY = 'roadtrip:mutation-queue'

export type PendingMutation = MutationDefinition & {
  id: string
  enqueuedAt: number
  dedupeKey?: string
}

export async function getMutations(): Promise<PendingMutation[]> {
  return (await get<PendingMutation[]>(QUEUE_KEY)) ?? []
}

export async function enqueueMutation(
  definition: MutationDefinition,
  options?: { dedupeKey?: string }
): Promise<void> {
  const mutations = await getMutations()

  const dedupeKey = options?.dedupeKey
  const filtered =
    dedupeKey !== undefined
      ? mutations.filter(
          (m) => !(m.type === definition.type && m.dedupeKey === dedupeKey)
        )
      : mutations

  const mutation: PendingMutation = {
    ...definition,
    id: crypto.randomUUID(),
    enqueuedAt: Date.now(),
    dedupeKey,
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
