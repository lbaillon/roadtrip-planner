import styles from './SignUp-LogIn.module.css'
import { Header } from './Header'

export function SignUp() {
  return (
    <div className={styles.main}>
      <Header />
      <div className={styles.inputBox}>
        <input className={styles.input} placeholder="username"></input>
        <input className={styles.input} placeholder="email"></input>
        <input
          className={styles.input}
          placeholder="password"
          type="password"
        ></input>
        <input
          className={styles.input}
          placeholder="confirm password"
          type="password"
        ></input>
        <button className={styles.button}>Sign up</button>
      </div>
    </div>
  )
}
