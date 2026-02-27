import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const queryClient = useQueryClient()

  function logout() {
    setAccessToken(null)
    queryClient.clear()
  }

  return (
    <AuthContext.Provider value={{ accessToken, setAccessToken, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
