import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import UserGreeting from './UserGreeting'

vi.mock('#web/hooks/useAuth')

const { useAuth } = await import('#web/hooks/useAuth')
const mockUseAuth = vi.mocked(useAuth)

describe('UserGreeting', () => {
  it('displays the username when logged in', () => {
    mockUseAuth.mockReturnValue({
      username: 'Alice',
      accessToken: null,
      userId: null,
      setAccessToken: vi.fn(),
      logout: vi.fn(),
    })

    render(<UserGreeting />)

    expect(screen.getByText('Hello Alice !')).toBeInTheDocument()
  })

  it('displays Anonymous when not logged in', () => {
    mockUseAuth.mockReturnValue({
      username: null,
      accessToken: null,
      userId: null,
      setAccessToken: vi.fn(),
      logout: vi.fn(),
    })

    render(<UserGreeting />)

    expect(screen.getByText('Hello Anonymous !')).toBeInTheDocument()
  })
})
