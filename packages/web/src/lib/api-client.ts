const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export class ApiError extends Error {
  public status
  public details
  constructor(message: string, status: number, details?: object) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

// Module-level singleton: ensures only one refresh request is in flight at a
// time. Concurrent 401s share the same promise instead of each making their
// own refresh call (which would fail if refresh tokens are single-use).
let pendingRefresh: Promise<string> | null = null

export function refreshAccessToken(): Promise<string> {
  if (!pendingRefresh) {
    pendingRefresh = fetchApi<{ accessToken: string }>('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })
      .then((data) => data.accessToken)
      .finally(() => {
        pendingRefresh = null
      })
  }
  return pendingRefresh
}

export async function fetchApi<TResponse>(
  endpoint: string,
  options?: RequestInit
): Promise<TResponse> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new ApiError(
      error.error || 'Request failed',
      response.status,
      error.details
    )
  }
  if (response.status === 204) {
    return null as TResponse
  }
  const text = await response.text()
  return text ? JSON.parse(text) : (null as TResponse)
}
