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
  const { accessToken, logout } = useAuth()

  useEffect(() => {
    if (!alert) return
    const timer = setTimeout(() => setAlert(null), 2000)
    return () => clearTimeout(timer)
  }, [alert])

  let userMenu: MenuProps['items'] = [
    {
      label: <Link to="/login">Log in</Link>,
      key: 'login',
    },
    {
      label: <Link to="/signup">Sign up</Link>,
      key: 'signup',
    },
  ]

  let barsMenu: MenuProps['items'] = [
    {
      label: <Link to="/">Home</Link>,
      key: 'home',
    },
    {
      label: <Link to="/about">About</Link>,
      key: 'about',
    },
  ]

  const onLogout = () => {
    logout()
    setAlert({ type: 'success', message: 'Logout successful' })
  }

  if (accessToken) {
    userMenu = [
      {
        label: (
          <Link to="/login" onClick={onLogout}>
            Log out
          </Link>
        ),
        key: 'logout',
      },
    ]

    barsMenu = [
      {
        label: <Link to="/">Home</Link>,
        key: 'home',
      },
      {
        label: <Link to="/tracks">My tracks</Link>,
        key: 'tracks',
      },
      {
        label: <Link to="/trips">My trips</Link>,
        key: 'trips',
      },
      {
        label: <Link to="/about">About</Link>,
        key: 'about',
      },
    ]
  }

  return (
    <div className={styles.header}>
      <Dropdown menu={{ items: barsMenu }} trigger={['click']}>
        <FontAwesomeIcon className={styles.headerIcon} icon={faBars} />
      </Dropdown>
      {alert && (
        <Alert description={alert.message} type={alert.type} showIcon />
      )}
      <Dropdown menu={{ items: userMenu }} trigger={['click']}>
        <FontAwesomeIcon className={styles.headerIcon} icon={faUser} />
      </Dropdown>
    </div>
  )
}
