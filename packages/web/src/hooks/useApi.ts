import { ApiError, fetchApi, refreshAccessToken } from '#web/lib/api-client'
import {
  type CreateResponse,
  type CreateUserRequest,
  type GetWeatherRequest,
  type GetWeatherResponse,
  type LogInRequest,
  type LogInResponse,
} from '@roadtrip/shared'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'

export function useApi() {
  const { accessToken, setAccessToken, logout } = useAuth()
  const navigate = useNavigate()
  // Ref so the token is always current inside async callbacks (avoids stale
  // closure when multiple mutations flush in sequence and the token is
  // refreshed mid-loop — React state updates are async, the ref is not).
  const accessTokenRef = useRef(accessToken)
  useEffect(() => {
    accessTokenRef.current = accessToken
  }, [accessToken])

  return async <T>(url: string, options: RequestInit = {}): Promise<T> => {
    try {
      return await fetchApi(url, {
        ...options,
        headers: {
          ...options?.headers,
          Authorization: accessTokenRef.current
            ? `Bearer ${accessTokenRef.current}`
            : '',
        },
      })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        let newAccessToken: string
        try {
          newAccessToken = await refreshAccessToken()
          setAccessToken(newAccessToken)
          // Update the ref immediately so subsequent calls in the same
          // flush loop use the fresh token without waiting for a re-render.
          accessTokenRef.current = newAccessToken
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

export function useGetWeather(request: GetWeatherRequest) {
  const api = useApi()
  return  useQuery({
    queryKey:['weather', request],
    queryFn: () => 
      api<GetWeatherResponse>('/api/weather', {
        method: 'POST',
        body: JSON.stringify(request)}),
    
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
