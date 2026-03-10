import { faEarthEurope, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import styles from './TripsList.module.css';

export default function TripsList({trips, onDelete}:{trips:{id:string; name:string}[], onDelete:(id:string)=>void}) {
  return trips.map((trip) => (
        <p className={styles.trip} key={trip.id}>
          <FontAwesomeIcon icon={faEarthEurope} className={styles.itemIcon} />
          <Link to={`/trips/${trip.id}`} className={styles.tripName}>
            {trip.name}
          </Link>
          <FontAwesomeIcon
            icon={faXmark}
            className={styles.deleteIcon}
            onClick={(e) => {
              e.stopPropagation()
              onDelete(trip.id)
            }}
          />
        </p>
      )
  )
}
