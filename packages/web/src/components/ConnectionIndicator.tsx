import { useHealth } from '#web/hooks/useHealth'
import { faCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import styles from './ConnectionIndicator.module.css'

export default function ConnectionIndicator() {
  const { data, isError } = useHealth()
  const isOk = !isError && data?.status === 'ok'
  const color = isOk ? styles.ok : styles.ko
  const title = isOk ? 'Server is connected' : 'Server is not yet connected'
  return (
    <span role="status" title={title}>
      <FontAwesomeIcon className={color} icon={faCircle} aria-hidden="true" />
    </span>
  )
}
