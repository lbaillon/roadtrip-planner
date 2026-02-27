import { useAuth } from '#web/hooks/useAuth'
import styles from './UserGreeting.module.css'

function decodeJwtPayload(token: string) {
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('')
  )

  return JSON.parse(jsonPayload)
}

export default function UserGreeting() {
  const { accessToken } = useAuth()

  let username = "Anonymous"

  if (accessToken) {
    try {
      const payload = decodeJwtPayload(accessToken)
      username = payload.email ?? "Anonymous"
    } catch {
      username = "Anonymous"
    }
  }

  return (
    <h2 className={styles.greet}>
      Hello {username} !
    </h2>
  )
}