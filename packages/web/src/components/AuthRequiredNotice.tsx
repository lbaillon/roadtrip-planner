import { POST_AUTH_REDIRECT_KEY } from '#web/lib/auth-redirect'
import { Button } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'

export default function AuthRequiredNotice({
  resource,
}: {
  resource: 'circuit' | 'voyage'
}) {
  const navigate = useNavigate()
  const location = useLocation()

  const goToAuth = (path: string) => {
    localStorage.setItem(POST_AUTH_REDIRECT_KEY, location.pathname)
    navigate(path)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        marginTop: 40,
        textAlign: 'center',
      }}
    >
      <p>Connectez-vous pour voir ce {resource}.</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <Button type="primary" onClick={() => goToAuth('/login')}>
          Se connecter
        </Button>
        <Button onClick={() => goToAuth('/signup')}>Créer un compte</Button>
      </div>
    </div>
  )
}
