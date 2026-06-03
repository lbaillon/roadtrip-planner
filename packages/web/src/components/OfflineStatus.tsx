import { useHealth } from '#web/hooks/useHealth'
import { useMutationQueue } from '#web/hooks/useMutationQueue'
import type { FailedMutation } from '#web/lib/mutation-queue'
import { useState } from 'react'
import styles from './OfflineStatus.module.css'

const MUTATION_LABELS: Record<FailedMutation['type'], string> = {
  CREATE_TRACK: 'Créer un circuit',
  PUT_TRACK_GPX: 'Modifier un circuit',
  DELETE_TRACK: 'Supprimer un circuit',
  UPDATE_TRACK_VISIBILITY: "Modifier la visibilité d'un circuit",
  CREATE_TRIP: 'Créer un voyage',
  DELETE_TRIP: 'Supprimer un voyage',
  ADD_TRACK_TO_TRIP: 'Ajouter un circuit au voyage',
  REMOVE_TRACK_FROM_TRIP: 'Retirer un circuit du voyage',
  REORDER_TRIP_TRACKS: 'Réorganiser les circuits',
  UPDATE_TRIP: "Modifer les infos d'un voyage",
  UPDATE_TRIP_VISIBILITY: 'Modifier la visibilité d\'un voyage'
}

interface Props {
  isSyncing: boolean
}

export default function OfflineStatus({ isSyncing }: Props) {
  const { isOnline, isServerReady } = useHealth()
  const { pendingCount, failedMutations, retryMutation, dismissMutation } =
    useMutationQueue()
  const [showFailed, setShowFailed] = useState(false)

  const base = !isOnline ? 'Hors ligne' : 'Serveur indisponible'
  const label =
    pendingCount > 0
      ? `${base} — ${pendingCount} modifications en attente`
      : base
  return (
    <div className={styles.container}>
      {isSyncing && <span className={styles.syncing}>Synchronisation...</span>}
      {(!isOnline || !isServerReady) && (
        <span className={styles.offline}>{label}</span>
      )}
      {failedMutations.length > 0 && (
        <button
          className={styles.errorToggle}
          onClick={() => setShowFailed((v) => !v)}
        >
          {failedMutations.length} erreur(s) de synchronisation{' '}
          {showFailed ? '▲' : '▼'}
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
                  Réessayer
                </button>
                <button onClick={async () => await dismissMutation(m.id)}>
                  Ignorer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
