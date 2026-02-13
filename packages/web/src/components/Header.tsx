import styles from '../App.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faBars } from '@fortawesome/free-solid-svg-icons'

export function Header() {
  return (
    <div className={styles.header}>
      <FontAwesomeIcon className={styles.headerIcon} icon={faBars} />
      <FontAwesomeIcon className={styles.headerIcon} icon={faUser} />
    </div>
  )
}
