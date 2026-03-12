import {
  type CreateResponse,
  type CreateUserRequest,
  type LogInRequest,
  type LogInResponse,
  type ParseGpxRequest,
  type ParseGpxResponse,
} from '@roadtrip/shared'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ApiError, fetchApi } from '../lib/api-client'
import { useAuth } from './useAuth'

export function useApi() {
  const { accessToken, setAccessToken, logout } = useAuth()
  const navigate = useNavigate()
  return async <T>(url: string, options: RequestInit = {}): Promise<T> => {
    try {
      return await fetchApi(url, {
        ...options,
        headers: {
          ...options?.headers,
          Authorization: accessToken ? `Bearer ${accessToken}` : '',
        },
      })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        try {
          const { accessToken } = await fetchApi<{ accessToken: string }>(
            '/api/auth/refresh',
            {
              method: 'POST',
              credentials: 'include',
            }
          )
          setAccessToken(accessToken)
        } catch {
          logout()
          navigate('/login')
        }
        return await fetchApi(url, {
          ...options,
          headers: {
            ...options?.headers,
            Authorization: `Bearer ${accessToken}`,
          },
        })
      }
      throw error
    }
  }
}

export function useParseGpx() {
  const api = useApi()
  return useMutation({
    mutationFn: (request: ParseGpxRequest) =>
      api<ParseGpxResponse>('/api/gpx', {
        method: 'POST',
        body: JSON.stringify(request),
      }),
  })
}

export function useCreateUser() {
  const api = useApi()
  return useMutation({
    mutationFn: (request: CreateUserRequest) =>
      api<CreateResponse>('/api/users', {
        method: 'POST',
        body: JSON.stringify(request),
      }),
  })
}

export function useLogin() {
  const api = useApi()
  return useMutation({
    mutationFn: (request: LogInRequest) =>
      api<LogInResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(request),
      }),
  })
}
