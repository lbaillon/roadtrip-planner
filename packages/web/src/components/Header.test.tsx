import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import Header from './Header'

vi.mock('#web/hooks/useAuth')

const { useAuth } = await import('#web/hooks/useAuth')
const mockUseAuth = vi.mocked(useAuth)

function renderHeader(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

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

    renderHeader(<Header />)

    const barsIcon = screen.getByRole('img', { name: 'Menu de navigation' })
    const userIcon = screen.getByLabelText('Menu utilisateur')

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

    renderHeader(<Header />)

    const barsIcon = screen.getByRole('img', { name: 'Menu de navigation' })
    const userIcon = screen.getByLabelText('Menu utilisateur')

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
