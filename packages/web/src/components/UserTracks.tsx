import styles from './UserTracks.module.css'
import { faMotorcycle, faXmark} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default function UserTracks() {
  return (
    <div className={styles.tracksBox}>
      <h3>My tracks</h3>
      <p className={styles.track}>
        <FontAwesomeIcon icon={faMotorcycle} className={styles.motoIcon} />
        Parnac loop
        <FontAwesomeIcon icon={faXmark} className={styles.deleteIcon} />
      </p>
      <p className={styles.track}>
        <FontAwesomeIcon icon={faMotorcycle} className={styles.motoIcon} />
        Perpignan loop
        <FontAwesomeIcon icon={faXmark} className={styles.deleteIcon} />
      </p>
      <p className={styles.track}>
        <FontAwesomeIcon icon={faMotorcycle} className={styles.motoIcon} />
        London - Edinburgh
        <FontAwesomeIcon icon={faXmark} className={styles.deleteIcon} />
      </p>
      <p className={styles.track}>
        <FontAwesomeIcon icon={faMotorcycle} className={styles.motoIcon} />
        Brest loop
        <FontAwesomeIcon icon={faXmark} className={styles.deleteIcon} />
      </p>
    </div>
  )
}
