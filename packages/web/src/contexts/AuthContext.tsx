import { createContext } from 'react'

interface AuthContextType {
  accessToken: string | null
  setAccessToken: (token: string | null) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)
