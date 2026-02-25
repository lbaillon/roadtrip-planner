import { useHealth } from "#web/hooks/useHealth";
import { faCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from './ConnectionIndicator.module.css';

export default function ConnectionIndicator() {
  const { data } = useHealth()
  const color = data?.status === "ok" ? styles.ok : styles.ko
  const title = data?.status === "ok" ? "Server is connected" : "Server is not yet connected"
  return <span role="status" title={title}><FontAwesomeIcon className={color} icon={faCircle} aria-hidden="true" /></span>
}