import styles from './SignUp-LogIn.module.css'
import { Header } from './Header'
import { Button, Input } from 'antd'

export function LogIn() {
  return (
    <div className={styles.main}>
      <Header />
      <div className={styles.inputBox}>
        <Input className={styles.input} placeholder="username"></Input>
        <Input
          className={styles.input}
          placeholder="password"
          type="password"
        ></Input>
        <Button className={styles.button}>Log in</Button>
      </div>
    </div>
  )
}
