import styles from './Header.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faBars } from '@fortawesome/free-solid-svg-icons'
import type { MenuProps } from 'antd'
import { Dropdown } from 'antd'
import { useNavigate } from 'react-router-dom'

export function Header() {
  const navigate = useNavigate()

  const goToLogIn = () => {
    navigate('/login')
  }

  const goToSignUp = () => {
    navigate('/signup')
  }

  const goHome = () => {
    navigate('/')
  }

  const userMenu: MenuProps['items'] = [
    {
      label: <p onClick={goToLogIn}>log in</p>,
      key: '0',
    },
    {
      label: <p onClick={goToSignUp}>sign up</p>,
      key: '1',
    },
  ]

  const barsMenu: MenuProps['items'] = [
    {
      label: <p onClick={goHome}>Home</p>,
      key: '0',
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
