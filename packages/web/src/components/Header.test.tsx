import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import Header from './Header'

vi.mock('#web/hooks/useAuth')

const { useAuth } = await import('#web/hooks/useAuth')
const mockUseAuth = vi.mocked(useAuth)

describe('Header', () => {
  it('displays logout, my tracks and my trips when logged in', async () => {
    mockUseAuth.mockReturnValue({
      username: null,
      accessToken: null,
      userId: 'user-1',
      setAccessToken: vi.fn(),
      logout: vi.fn(),
    })

    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )

    const barsIcon = screen.getByRole('img', { name: 'Navigation menu' })
    const userIcon = screen.getByRole('img', { name: 'User menu' })
    await user.click(barsIcon)

    expect(await screen.findByText('My tracks')).toBeInTheDocument()
    expect(await screen.findByText('My trips')).toBeInTheDocument()

    await user.click(userIcon)
    expect(await screen.findByText('Log out')).toBeInTheDocument()
  })
})
