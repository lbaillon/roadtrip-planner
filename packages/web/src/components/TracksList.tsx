import { faMotorcycle, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import styles from './TracksList.module.css';

export default function TracksList({tracks, onDelete}:{tracks:{id:string; name:string}[], onDelete:(id:string)=>void}) {
  return tracks.map((track) => (
        <p className={styles.track} key={track.id}>
          <FontAwesomeIcon icon={faMotorcycle} className={styles.itemIcon} />
          <Link to={`/tracks/${track.id}`} className={styles.trackName}>
            {track.name}
          </Link>
          <FontAwesomeIcon
            icon={faXmark}
            className={styles.deleteIcon}
            onClick={(e) => {
              e.stopPropagation()
              onDelete(track.id)
            }}
          />
        </p>
      )
  )
}
