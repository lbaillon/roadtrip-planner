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
  return response.json()
}
