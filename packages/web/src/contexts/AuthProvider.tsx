import { ApiError, fetchApi, refreshAccessToken } from '#web/lib/api-client'
import { clearQueue } from '#web/lib/mutation-queue'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { AuthContext } from './AuthContext'

const USER_ID_KEY = 'roadtrip:user-id'
const USERNAME_KEY = 'roadtrip:username'

function decodeJwtPayload(
  token: string
): { userId: string; username: string } | null {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload)) as { userId: string; username: string }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(() =>
    localStorage.getItem(USER_ID_KEY)
  )
  const [username, setUsername] = useState<string | null>(() =>
    localStorage.getItem(USERNAME_KEY)
  )
  const queryClient = useQueryClient()
  const accessTokenRef = useRef(accessToken)
  useEffect(() => {
    accessTokenRef.current = accessToken
  }, [accessToken])

  const setAccessToken = (token: string | null) => {
    setAccessTokenState(token)
    if (token) {
      const payload = decodeJwtPayload(token)
      if (payload?.userId) {
        setUserId(payload.userId)
        localStorage.setItem(USER_ID_KEY, payload.userId)
      }
      if (payload?.username) {
        setUsername(payload.username)
        localStorage.setItem(USERNAME_KEY, payload.username)
      }
    }
  }

  // On mount, restore the access token from the refresh token cookie.
  // Retries on 'online' and 'focus' events to handle cold starts and
  // offline launches — only a 401 means the token is genuinely invalid.
  useEffect(() => {
    const tryRefresh = () => {
      if (accessTokenRef.current) return
      refreshAccessToken()
        .then(setAccessToken)
        .catch((error) => {
          if (error instanceof ApiError && error.status === 401) {
            // Refresh token is genuinely invalid — clear the session.
            setUserId(null)
            setUsername(null)
            localStorage.removeItem(USER_ID_KEY)
            localStorage.removeItem(USERNAME_KEY)
          }
          // Network/server errors: keep userId/username, retry on reconnection.
        })
    }

    tryRefresh()
    window.addEventListener('online', tryRefresh)
    window.addEventListener('focus', tryRefresh)
    return () => {
      window.removeEventListener('online', tryRefresh)
      window.removeEventListener('focus', tryRefresh)
    }
  }, [])

  const logout = async () => {
    try {
      // Request to clear refreshToken
      await fetchApi('/api/auth/logout', { method: 'POST' })
    } catch {
      // Best-effort — clean up locally even if offline or server unreachable.
    }
    setAccessTokenState(null)
    setUserId(null)
    setUsername(null)
    localStorage.removeItem(USER_ID_KEY)
    localStorage.removeItem(USERNAME_KEY)
    await clearQueue()
    queryClient.clear()
  }

  return (
    <AuthContext.Provider
      value={{ accessToken, userId, username, setAccessToken, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}
