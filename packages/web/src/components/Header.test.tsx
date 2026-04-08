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

    expect(await screen.findByText('Home')).toBeInTheDocument()
    expect(await screen.findByText('My tracks')).toBeInTheDocument()
    expect(await screen.findByText('My trips')).toBeInTheDocument()
    expect(await screen.findByText('About')).toBeInTheDocument()


    await user.click(userIcon)
    expect(await screen.findByText('Log out')).toBeInTheDocument()
  })

  it('displays log in, sign up and not my trips/ my tracks when logged out', async () => {
    mockUseAuth.mockReturnValue({
      username: null,
      accessToken: null,
      userId: null,
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

    expect(await screen.findByText('Home')).toBeInTheDocument()
    expect(screen.queryByText('My tracks')).not.toBeInTheDocument()
    expect(screen.queryByText('My trips')).not.toBeInTheDocument()
    expect(await screen.findByText('About')).toBeInTheDocument()

    await user.click(userIcon)
    expect(await screen.findByText('Log in')).toBeInTheDocument()
    expect(await screen.findByText('Sign up')).toBeInTheDocument()
  })
})
