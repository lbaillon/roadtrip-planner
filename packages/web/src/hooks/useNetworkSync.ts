import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { clearGpxBlobs } from '../lib/gpx-blob-store'
import { applyFlushHandler } from '../lib/mutations'
import { getMutations, removeMutation } from '../lib/mutation-queue'
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
    try {
      for (const mutation of mutations) {
        await applyFlushHandler(mutation, api)
        await removeMutation(mutation.id)
      }
      await clearGpxBlobs()
      // Reload fresh data from server after a successful sync
      await queryClient.invalidateQueries()
    } catch {
      // Stop on any error — network error or unresolvable auth error (logout
      // already called by useApi). Will retry on next reconnection.
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
