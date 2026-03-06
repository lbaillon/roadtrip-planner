import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { AuthContext } from './AuthContext'
import { fetchApi } from '#web/lib/api-client'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { mutate: logout } = useMutation({
    mutationFn: () =>
      fetchApi(`/api/auth/logout`, {
        method: 'POST',
      }),
    onSuccess: () => {
      setAccessToken(null)
      queryClient.clear()
    },
  })

  return (
    <AuthContext.Provider value={{ accessToken, setAccessToken, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
