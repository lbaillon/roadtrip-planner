import { ApiError } from '#web/lib/api-client'
import {
  addFailedMutation,
  clearGpxBlobs,
  getMutations,
  removeMutation,
} from '#web/lib/mutation-queue'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useFlushHandler } from './mutations/useFlushHandler'
import { useHealth } from './useHealth'

export function useNetworkSync() {
  const applyFlush = useFlushHandler()
  const queryClient = useQueryClient()
  const [isSyncing, setIsSyncing] = useState(false)
  // Ref (not state) so the guard is visible synchronously on the next call,
  // before React batches state updates. Prevents concurrent flushes.
  const isSyncingRef = useRef(false)
  const { isReady } = useHealth()
  const isReadyRef = useRef(isReady)
  useEffect(() => {
    isReadyRef.current = isReady
  }, [isReady])

  const flush = useCallback(async () => {
    if (isSyncingRef.current || !isReadyRef.current) return
    const mutations = await getMutations()
    if (mutations.length === 0) return

    isSyncingRef.current = true
    setIsSyncing(true)
    let allSucceeded = true
    try {
      for (const mutation of mutations) {
        try {
          await applyFlush(mutation)
          await removeMutation(mutation.id)
        } catch (error) {
          allSucceeded = false
          if (error instanceof ApiError) {
            // 401: auth expired — useApi already handled refresh/logout so this needs new login.
            if (error.status === 401) return
            // 502/503/504: server temporarily unavailable — preserve queue,
            // retry on reconnection.
            if ([502, 503, 504].includes(error.status)) {
              void queryClient.invalidateQueries({ queryKey: ['health'] })
              return
            }
            // Other HTTP errors (404, 409, 4xx, 5xx) — record as failed and continue.
            await addFailedMutation(mutation, error.message)
            await removeMutation(mutation.id)
          } else {
            // Network error — stop sync, will retry on reconnection.
            return
          }
        }
      }
      if (allSucceeded) {
        await clearGpxBlobs()
      }
      // Reload fresh data from server after a successful sync
      await queryClient.invalidateQueries()
    } finally {
      isSyncingRef.current = false
      setIsSyncing(false)
      await queryClient.invalidateQueries({ queryKey: ['mutation-queue'] })
    }
  }, [applyFlush, queryClient])

  // Keep a ref to the latest flush so event listeners and the isReady effect
  // always call the current version without being listed as dependencies
  // (which would cause the effects to re-run — and re-trigger flush — on every
  // render when api is recreated).
  const flushRef = useRef(flush)
  useEffect(() => {
    flushRef.current = flush
  }, [flush])

  useEffect(() => {
    // When the device comes online, force an immediate health re-check rather
    // than waiting for the next poll interval. The flush itself is triggered
    // below when isReady becomes true — navigator.onLine alone is not enough
    // since the server may still be starting up (cold start).
    const onOnline = async () => {
      await queryClient.invalidateQueries({ queryKey: ['health'] })
    }
    const onMutationEnqueued = async () => await flushRef.current()
    window.addEventListener('online', onOnline)
    window.addEventListener('mutation-enqueued', onMutationEnqueued)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('mutation-enqueued', onMutationEnqueued)
    }
  }, [queryClient])

  // Flush when the server becomes ready (network back + health check passed).
  // This is the single trigger for syncing pending mutations on reconnection.
  useEffect(() => {
    if (isReady) void flushRef.current()
  }, [isReady])

  return { isSyncing }
}
