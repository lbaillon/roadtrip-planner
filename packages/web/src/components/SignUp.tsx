import styles from './SignUp-LogIn.module.css'
import { Header } from './Header'
import { Button, Input } from 'antd'
import { useMutation } from '@tanstack/react-query'
import { fetchApi } from '../lib/api-client'

export function SignUp() {

  const {mutate : postUser} =  useMutation({
      mutationFn: (request: any) =>
        fetchApi<any>('/api/users', {
          method: 'POST',
          body: JSON.stringify(request),
        }),
    })
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
        <Button className={styles.button} onClick={() => postUser({username : "Bob", email: "bob@poulet.fr", password: "azerty"})}>Sign up</Button>
      </div>
    </div>
  )
}
