import styles from './Header.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faBars } from '@fortawesome/free-solid-svg-icons'
import type { MenuProps } from 'antd'
import { Dropdown } from 'antd'
import { Link } from 'react-router-dom'

export function Header() {
  const userMenu: MenuProps['items'] = [
    {
      label: <Link to="/login">Log in</Link>,
      key: 'login',
    },
    {
      label: <Link to="/signup">Sign up</Link>,
      key: 'signup',
    },
  ]

  const barsMenu: MenuProps['items'] = [
    {
      label: <Link to="/">Home</Link>,
      key: 'home',
    },
  ]

  return (
    <div className={styles.header}>
      <Dropdown menu={{ items: barsMenu }} trigger={['click']}>
        <a onClick={(e) => e.preventDefault()}>
          <FontAwesomeIcon className={styles.headerIcon} icon={faBars} />
        </a>
      </Dropdown>
      <Dropdown menu={{ items: userMenu }} trigger={['click']}>
        <a onClick={(e) => e.preventDefault()}>
          <FontAwesomeIcon className={styles.headerIcon} icon={faUser} />
        </a>
      </Dropdown>
    </div>
  )
}
