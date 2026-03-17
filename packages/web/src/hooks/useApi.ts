import {
  type CreateResponse,
  type CreateUserRequest,
  type GetWeatherRequest,
  type GetWeatherResponse,
  type LogInRequest,
  type LogInResponse,
} from '@roadtrip/shared'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ApiError, fetchApi, refreshAccessToken } from '../lib/api-client'
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
        let newAccessToken: string
        try {
          newAccessToken = await refreshAccessToken()
          setAccessToken(newAccessToken)
        } catch (refreshError) {
          // Only log out if the refresh token itself is invalid (401).
          // A network error means we're offline — keep the user logged in
          // so queued mutations can be replayed when connectivity returns.
          if (refreshError instanceof ApiError && refreshError.status === 401) {
            logout()
            navigate('/login')
          }
          throw refreshError
        }
        return await fetchApi(url, {
          ...options,
          headers: {
            ...options?.headers,
            Authorization: `Bearer ${newAccessToken}`,
          },
        })
      }
      throw error
    }
  }
}

export function useGetWeather() {
  const api = useApi()
  return useMutation({
    mutationFn: (request: GetWeatherRequest) =>
      api<GetWeatherResponse>('/api/weather', {
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
