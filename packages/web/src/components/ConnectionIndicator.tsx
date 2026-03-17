import { useHealth } from '#web/hooks/useHealth'
import { useMutationQueue } from '#web/hooks/useMutationQueue'
import styles from './ConnectionIndicator.module.css'

interface Props {
  isSyncing: boolean
}

export default function ConnectionIndicator({ isSyncing }: Props) {
  const { isOnline, isServerReady } = useHealth()
  const { pendingCount } = useMutationQueue()

  if (isSyncing) return <span className={styles.syncing}>Syncing...</span>

  if (!isOnline) {
    const label =
      pendingCount > 0
        ? `Offline — ${pendingCount} change(s) pending`
        : 'Offline'
    return <span className={styles.offline}>{label}</span>
  }

  if (!isServerReady) {
    const label =
      pendingCount > 0
        ? `Server unavailable — ${pendingCount} change(s) pending`
        : 'Server unavailable'
    return <span className={styles.offline}>{label}</span>
  }

  if (pendingCount > 0)
    return (
      <span className={styles.pending}>
        {pendingCount} change(s) pending sync
      </span>
    )

  return null
}
