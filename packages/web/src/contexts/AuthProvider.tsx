import { fetchApi } from '#web/lib/api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { clearQueue } from '../lib/mutation-queue'
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

  const { mutate: logout } = useMutation({
    mutationFn: () =>
      fetchApi(`/api/auth/logout`, {
        method: 'POST',
      }),
    onSuccess: async () => {
      setAccessTokenState(null)
      setUserId(null)
      localStorage.removeItem(USER_ID_KEY)
      await clearQueue()
      queryClient.clear()
    },
  })

  return (
    <AuthContext.Provider
      value={{ accessToken, userId, setAccessToken, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}
