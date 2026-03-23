import { get, set } from 'idb-keyval'
import type { MutationDefinition } from './mutations'

const QUEUE_KEY = 'roadtrip:mutation-queue'
const FAILED_KEY = 'roadtrip:failed-mutations'

export type PendingMutation = MutationDefinition & {
  id: string
  enqueuedAt: number
  dedupeKey?: string
}

export type FailedMutation = PendingMutation & {
  error: string
  failedAt: number
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
  await set(FAILED_KEY, [])
  window.dispatchEvent(new Event('mutation-dequeued'))
}

export async function getFailedMutations(): Promise<FailedMutation[]> {
  return (await get<FailedMutation[]>(FAILED_KEY)) ?? []
}

export async function addFailedMutation(
  mutation: PendingMutation,
  error: string
): Promise<void> {
  const failed = await getFailedMutations()
  const failedMutation: FailedMutation = {
    ...mutation,
    error,
    failedAt: Date.now(),
  }
  await set(FAILED_KEY, [...failed, failedMutation])
}

export async function retryFailedMutation(id: string): Promise<void> {
  const failed = await getFailedMutations()
  const mutation = failed.find((m) => m.id === id)
  if (!mutation) return
  await set(
    FAILED_KEY,
    failed.filter((m) => m.id !== id)
  )
  // Re-enqueue as a fresh pending mutation (FailedMutation extends PendingMutation)
  const mutations = await getMutations()
  await set(QUEUE_KEY, [...mutations, mutation as PendingMutation])
  window.dispatchEvent(new Event('mutation-enqueued'))
}

export async function dismissFailedMutation(id: string): Promise<void> {
  const failed = await getFailedMutations()
  await set(
    FAILED_KEY,
    failed.filter((m) => m.id !== id)
  )
  window.dispatchEvent(new Event('mutation-dequeued'))
}
