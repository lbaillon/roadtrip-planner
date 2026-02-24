import type {
  CreateResponse,
  CreateUserRequest,
  ParseGpxRequest,
  ParseGpxResponse,
} from '@roadtrip/shared'
import { useMutation } from '@tanstack/react-query'
import { fetchApi } from '../lib/api-client'

function usePost<TRequest, TResponse>(endpoint: string) {
  return useMutation({
    mutationFn: (request: TRequest) =>
      fetchApi<TResponse>(endpoint, {
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
