import { useAuth } from '#web/hooks/useAuth'
import styles from './UserGreeting.module.css'

export default function UserGreeting() {
  const { username } = useAuth()

  return <h2 className={styles.greet}>Hello {username ?? 'Anonymous'} !</h2>
}
