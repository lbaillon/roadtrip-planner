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

    const barsIcon = screen.getByRole('img', { name: 'Menu de navigation' })
    const userIcon = screen.getByRole('img', { name: 'Menu utilisateur' })

    await user.click(barsIcon)

    expect(await screen.findByText('Accueil')).toBeInTheDocument()
    expect(await screen.findByText('Mes circuits')).toBeInTheDocument()
    expect(await screen.findByText('Mes voyages')).toBeInTheDocument()
    expect(await screen.findByText('À propos')).toBeInTheDocument()

    await user.click(userIcon)
    expect(await screen.findByText('Se déconnecter')).toBeInTheDocument()
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

    const barsIcon = screen.getByRole('img', { name: 'Menu de navigation' })
    const userIcon = screen.getByRole('img', { name: 'Menu utilisateur' })

    await user.click(barsIcon)

    expect(await screen.findByText('Accueil')).toBeInTheDocument()
    expect(screen.queryByText('Mes circuits')).not.toBeInTheDocument()
    expect(screen.queryByText('Mes voyages')).not.toBeInTheDocument()
    expect(await screen.findByText('À propos')).toBeInTheDocument()

    await user.click(userIcon)
    expect(await screen.findByText("S'identifier")).toBeInTheDocument()
    expect(await screen.findByText("S'inscrire")).toBeInTheDocument()
  })
})
