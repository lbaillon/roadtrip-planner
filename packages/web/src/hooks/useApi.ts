import {
  type CreateResponse,
  type CreateUserRequest,
  type LogInRequest,
  type LogInResponse,
  type ParseGpxRequest,
  type ParseGpxResponse,
  type CreateTrackRequest,
  type GetTrackResponse,
} from '@roadtrip/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, fetchApi } from '../lib/api-client'
import { useAuth } from './useAuth'
import { useNavigate } from 'react-router-dom'

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

export function useDeleteTrack() {
  const queryClient = useQueryClient()
  const api = useApi()
  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/api/tracks/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] })
    },
  })
}

export function useGetTracks() {
  const api = useApi()
  return useQuery({
    queryKey: ['tracks'],
    queryFn: () => api<{ id: string; name: string }[]>('/api/tracks'),
  })
}

export function useGetTrack(id: string|undefined) {
  const api = useApi()
  return useQuery({
    queryKey: ['tracks', id],
    queryFn: () => api<GetTrackResponse>(`/api/tracks/${id}`),
    enabled: !!id,
  })
}