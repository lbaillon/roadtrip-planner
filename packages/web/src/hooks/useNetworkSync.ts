import { ApiError } from '#web/lib/api-client'
import {
  addFailedMutation,
  clearGpxBlobs,
  getMutations,
  removeMutation,
} from '#web/lib/mutation-queue'
import { applyFlushHandler } from '#web/lib/mutations'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useApi } from './useApi'
import { useHealth } from './useHealth'

export function useNetworkSync() {
  const api = useApi()
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
          await applyFlushHandler(mutation, api)
          await removeMutation(mutation.id)
        } catch (error) {
          allSucceeded = false
          if (error instanceof ApiError) {
            if ([401, 502, 503, 504].includes(error.status)) {
              // 401: auth expired — useApi already handled refresh/logout.
              // 502/503/504: server temporarily unavailable — preserve queue,
              // retry on reconnection.
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
  }, [api, queryClient])

  useEffect(() => {
    // When the device comes online, force an immediate health re-check rather
    // than waiting for the next poll interval. The flush itself is triggered
    // below when isReady becomes true — navigator.onLine alone is not enough
    // since the server may still be starting up (cold start).
    const onOnline = async () => {
      await queryClient.invalidateQueries({ queryKey: ['/health'] })
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('mutation-enqueued', flush)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('mutation-enqueued', flush)
    }
  }, [flush, queryClient])

  // Flush when the server becomes ready (network back + health check passed).
  // This is the single trigger for syncing pending mutations on reconnection.
  useEffect(() => {
    if (isReady) void flush()
  }, [isReady, flush])

  return { isSyncing }
}
