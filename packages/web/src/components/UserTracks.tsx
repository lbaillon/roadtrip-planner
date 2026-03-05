import { useDeleteTrack, useGetTracks } from '#web/hooks/useApi'
import styles from './UserTracks.module.css'
import { faMotorcycle, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default function UserTracks() {
  const { data: tracks } = useGetTracks()

  const { mutate: deleteTrack } = useDeleteTrack()

  return (
    <div className={styles.tracksBox}>
      <h3 className={styles.tracksTitle}>My tracks</h3>
      {(tracks ?? []).map((track) => (
        <p className={styles.track} key={track.id}>
          <FontAwesomeIcon icon={faMotorcycle} className={styles.motoIcon} />
          {track.name}
          <FontAwesomeIcon
            icon={faXmark}
            className={styles.deleteIcon}
            onClick={() => deleteTrack(track.id)}
          />
        </p>
      ))}
    </div>
  )
}
