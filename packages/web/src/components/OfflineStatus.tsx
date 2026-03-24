import { useHealth } from '#web/hooks/useHealth'
import { useMutationQueue } from '#web/hooks/useMutationQueue'
import type { FailedMutation } from '#web/lib/mutation-queue'
import { useState } from 'react'
import styles from './OfflineStatus.module.css'

const MUTATION_LABELS: Record<FailedMutation['type'], string> = {
  CREATE_TRACK: 'Create track',
  PUT_TRACK_GPX: 'Update track',
  DELETE_TRACK: 'Delete track',
  CREATE_TRIP: 'Create trip',
  DELETE_TRIP: 'Delete trip',
  ADD_TRACK_TO_TRIP: 'Add track to trip',
  REMOVE_TRACK_FROM_TRIP: 'Remove track from trip',
  REORDER_TRIP_TRACKS: 'Reorder trip tracks',
}

interface Props {
  isSyncing: boolean
}

export default function OfflineStatus({ isSyncing }: Props) {
  const { isOnline, isServerReady } = useHealth()
  const { pendingCount, failedMutations, retryMutation, dismissMutation } =
    useMutationQueue()
  const [showFailed, setShowFailed] = useState(false)

  const base = !isOnline ? 'Offline' : 'Server unavailable'
  const label =
    pendingCount > 0 ? `${base} — ${pendingCount} change(s) pending` : base
  return (
    <div className={styles.container}>
      {isSyncing && <span className={styles.syncing}>Syncing...</span>}
      {(!isOnline || !isServerReady) && (
        <span className={styles.offline}>{label}</span>
      )}
      {pendingCount > 0 && (
        <span className={styles.pending}>
          {pendingCount} change(s) pending sync
        </span>
      )}
      {failedMutations.length > 0 && (
        <button
          className={styles.errorToggle}
          onClick={() => setShowFailed((v) => !v)}
        >
          {failedMutations.length} sync error(s) {showFailed ? '▲' : '▼'}
        </button>
      )}
      {showFailed && failedMutations.length > 0 && (
        <ul className={styles.failedList}>
          {failedMutations.map((m) => (
            <li key={m.id} className={styles.failedItem}>
              <span className={styles.failedLabel}>
                {MUTATION_LABELS[m.type]}
              </span>
              <span className={styles.failedError}>{m.error}</span>
              <div className={styles.failedActions}>
                <button onClick={async () => await retryMutation(m.id)}>
                  Retry
                </button>
                <button onClick={async () => await dismissMutation(m.id)}>
                  Dismiss
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
