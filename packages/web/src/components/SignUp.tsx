import styles from './SignUp-LogIn.module.css'
import { Header } from './Header'
import { Button, Input } from 'antd'

export function SignUp() {
  return (
    <div className={styles.main}>
      <Header />
      <div className={styles.inputBox}>
        <Input className={styles.input} placeholder="username"></Input>
        <Input className={styles.input} placeholder="email"></Input>
        <Input
          className={styles.input}
          placeholder="password"
          type="password"
        ></Input>
        <Input
          className={styles.input}
          placeholder="confirm password"
          type="password"
        ></Input>
        <Button className={styles.button}>Sign up</Button>
      </div>
    </div>
  )
}
