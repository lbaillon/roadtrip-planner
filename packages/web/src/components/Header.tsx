import { faBars, faUser } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { MenuProps } from 'antd'
import { Alert, Dropdown } from 'antd'
import { Link } from 'react-router-dom'
import styles from './Header.module.css'
import { useAuth } from '#web/hooks/useAuth'
import { useEffect, useState } from 'react'

type AlertState = {
  type: 'success' | 'error'
  message: string
} | null

export default function Header() {
  const [alert, setAlert] = useState<AlertState>(null)
  const { userId, logout } = useAuth()

  useEffect(() => {
    if (!alert) return
    const timer = setTimeout(() => setAlert(null), 2000)
    return () => clearTimeout(timer)
  }, [alert])

  let userMenu: MenuProps['items'] = [
    {
      label: <Link to="/login">S'identifier</Link>,
      key: 'login',
    },
    {
      label: <Link to="/signup">S'inscrire</Link>,
      key: 'signup',
    },
  ]

  let barsMenu: MenuProps['items'] = [
    {
      label: <Link to="/">Accueil</Link>,
      key: 'home',
    },
    {
      label: <Link to="/about">À propos</Link>,
      key: 'about',
    },
  ]

  const onLogout = () => {
    logout()
    setAlert({ type: 'success', message: 'Déconnexion réussie' })
  }

  if (userId) {
    userMenu = [
      {
        label: <Link to="/account">Mon compte</Link>,
        key: 'account',
      },
      {
        label: (
          <Link to="/login" onClick={onLogout}>
            Se déconnecter
          </Link>
        ),
        key: 'logout',
      },
    ]

    barsMenu = [
      {
        label: <Link to="/">Accueil</Link>,
        key: 'home',
      },
      {
        label: <Link to="/tracks">Mes circuits</Link>,
        key: 'tracks',
      },
      {
        label: <Link to="/trips">Mes voyages</Link>,
        key: 'trips',
      },
      {
        label: <Link to="/about">À propos</Link>,
        key: 'about',
      },
    ]
  }

  return (
    <div className={styles.header}>
      <Dropdown menu={{ items: barsMenu }} trigger={['click']}>
        <FontAwesomeIcon
          className={styles.headerIcon}
          icon={faBars}
          aria-label="Menu de navigation"
        />
      </Dropdown>
      {alert && (
        <Alert description={alert.message} type={alert.type} showIcon />
      )}
      <Dropdown menu={{ items: userMenu }} trigger={['click']}>
        <FontAwesomeIcon
          className={styles.headerIcon}
          icon={faUser}
          aria-label="Menu utilisateur"
        />
      </Dropdown>
    </div>
  )
}
