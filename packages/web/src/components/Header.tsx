import { faBars, faUser } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { MenuProps } from 'antd'
import { Dropdown } from 'antd'
import { Link } from 'react-router-dom'
import styles from './Header.module.css'

export default function Header() {
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
        <FontAwesomeIcon className={styles.headerIcon} icon={faBars} />
      </Dropdown>
      <Dropdown menu={{ items: userMenu }} trigger={['click']}>
        <FontAwesomeIcon className={styles.headerIcon} icon={faUser} />
      </Dropdown>
    </div>
  )
}
