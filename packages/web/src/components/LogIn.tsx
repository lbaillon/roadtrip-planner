import styles from './SignUp-LogIn.module.css'
import { Header } from './Header'

export function LogIn() {
  return (
    <div className={styles.main}>
      <Header />
      <div className={styles.inputBox}>
        <input className={styles.input} placeholder="username"></input>
        <input
          className={styles.input}
          placeholder="password"
          type="password"
        ></input>
        <button className={styles.button}>Log in</button>
      </div>
    </div>
  )
}
