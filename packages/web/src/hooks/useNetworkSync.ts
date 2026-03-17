import { type UpdateTrackGpxRequest } from '@roadtrip/shared'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getMutations,
  removeMutation,
  type PutTrackGpxPayload,
} from '../lib/mutation-queue'
import { useApi } from './useApi'

export function useNetworkSync() {
  const api = useApi()
  const queryClient = useQueryClient()
  const [isSyncing, setIsSyncing] = useState(false)
  // Ref (not state) so the guard is visible synchronously on the next call,
  // before React batches state updates. Prevents concurrent flushes.
  const isSyncingRef = useRef(false)

  const flush = useCallback(async () => {
    if (isSyncingRef.current || !navigator.onLine) return
    const mutations = await getMutations()
    if (mutations.length === 0) return

    isSyncingRef.current = true
    setIsSyncing(true)
    try {
      for (const mutation of mutations) {
        // Only PUT_TRACK_GPX is implemented so far — unknown types are skipped.
        // TODO: remove or log unknown mutations instead of leaving them in the queue forever.
        if (mutation.type === 'PUT_TRACK_GPX') {
          const { trackId, gpxContent } = mutation.payload as PutTrackGpxPayload
          await api<void>(`/api/tracks/${trackId}`, {
            method: 'PUT',
            body: JSON.stringify({
              gpxContent,
            } satisfies UpdateTrackGpxRequest),
          })
          await removeMutation(mutation.id)
        }
      }
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
    window.addEventListener('online', flush)
    window.addEventListener('mutation-enqueued', flush)
    if (navigator.onLine) void flush()
    return () => {
      window.removeEventListener('online', flush)
      window.removeEventListener('mutation-enqueued', flush)
    }
  }, [flush])

  return { isSyncing }
}
