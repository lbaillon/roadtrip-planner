import { useDeleteTrack, useGetTracks } from '#web/hooks/useApi'
import { faMotorcycle, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom'
import styles from './UserTracks.module.css'

export default function UserTracks() {
  const { data: tracks } = useGetTracks()

  const { mutate: deleteTrack } = useDeleteTrack()

  return (
    <div className={styles.tracksBox}>
      <h3 className={styles.tracksTitle}>My tracks</h3>
      {(tracks ?? []).map((track) => (
        <p className={styles.track} key={track.id}>
          <FontAwesomeIcon icon={faMotorcycle} className={styles.motoIcon} />
          <Link to={`/tracks/${track.id}`} className={styles.trackName}>
            {track.name}
          </Link>
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
