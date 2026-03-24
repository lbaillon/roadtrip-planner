import { fetchApi, refreshAccessToken } from '#web/lib/api-client'
import { clearQueue } from '#web/lib/mutation-queue'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { AuthContext } from './AuthContext'

const USER_ID_KEY = 'roadtrip:user-id'

function decodeJwtPayload(token: string): { userId: string } | null {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload)) as { userId: string }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(() =>
    localStorage.getItem(USER_ID_KEY)
  )
  const queryClient = useQueryClient()

  const setAccessToken = (token: string | null) => {
    setAccessTokenState(token)
    if (token) {
      const payload = decodeJwtPayload(token)
      if (payload?.userId) {
        setUserId(payload.userId)
        localStorage.setItem(USER_ID_KEY, payload.userId)
      }
    }
  }

  // On mount, silently restore the access token from the refresh token cookie.
  // Without this, accessToken stays null until a 401 triggers a refresh —
  // which never happens on pages with no authenticated calls (e.g. Home).
  useEffect(() => {
    refreshAccessToken()
      .then(setAccessToken)
      .catch(() => {
        // No valid refresh token — user needs to log in, nothing to do.
      })
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
    localStorage.removeItem(USER_ID_KEY)
    await clearQueue()
    queryClient.clear()
  }

  return (
    <AuthContext.Provider
      value={{ accessToken, userId, setAccessToken, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}
