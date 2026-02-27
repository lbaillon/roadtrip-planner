import {
  type CreateResponse,
  type CreateUserRequest,
  type LogInRequest,
  type LogInResponse,
  type ParseGpxRequest,
  type ParseGpxResponse,
  type CreateTrackRequest,
} from '@roadtrip/shared'
import { useMutation } from '@tanstack/react-query'
import { ApiError, fetchApi } from '../lib/api-client'
import { useAuth } from './useAuth'

export function useApi() {
  const { accessToken, setAccessToken, logout } = useAuth()
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
          throw new Error('Session expired', { cause: error })
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
function usePost<TRequest, TResponse>(endpoint: string, options?: RequestInit) {
  const fetch = useApi()
  return useMutation({
    mutationFn: (request: TRequest) =>
      fetch<TResponse>(endpoint, {
        ...options,
        method: 'POST',
        body: JSON.stringify(request),
      }),
  })
}

export function useParseGpx() {
  return usePost<ParseGpxRequest, ParseGpxResponse>('/api/gpx')
}

export function useCreateUser() {
  return usePost<CreateUserRequest, CreateResponse>('/api/users')
}

export function useLogin() {
  return usePost<LogInRequest, LogInResponse>('/api/auth/login')
}

export function useCreateTrack() {
  return usePost<CreateTrackRequest, CreateResponse>('/api/tracks')
}
