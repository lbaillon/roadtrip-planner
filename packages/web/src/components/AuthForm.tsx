import { useCreateUser, useLogin } from '#web/hooks/useApi'
import { useAuth } from '#web/hooks/useAuth'
import type { FormProps } from 'antd'
import { Alert, Button, Form, Input } from 'antd'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './AuthForm.module.css'

type LoginFields = { username: string; password: string }
type SignUpFields = LoginFields & {
  email: string
  confirmPassword: string
}
type FieldType<M extends 'login' | 'signup'> = M extends 'login'
  ? LoginFields
  : SignUpFields

type AlertState = {
  type: 'success' | 'error'
  message: string
} | null

export default function AuthForm<M extends 'login' | 'signup'>({
  mode,
}: {
  mode: M
}) {
  const { mutate: login } = useLogin()
  const { mutate: postUser } = useCreateUser()
  const [alert, setAlert] = useState<AlertState>(null)
  const { setAccessToken } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (alert?.type !== 'success') return
    const timer = setTimeout(() => navigate('/'), 1500)
    return () => clearTimeout(timer)
  }, [alert, navigate])

  const onFinish = (values: FieldType<M>) => {
    if (mode === 'login') {
      const { username, password } = values as LoginFields
      login(
        { username, password },
        {
          onSuccess: (data) => {
            setAccessToken(data.accessToken)
            setAlert({ type: 'success', message: 'Connexion validée' })
          },
          onError: (err) =>
            setAlert({
              type: 'error',
              message: `Erreur de connexion: ${err.message}`,
            }),
        }
      )
    } else {
      const { username, password, email } = values as SignUpFields
      postUser(
        { username, password, email },
        {
          onSuccess: () =>
            // Auto-connexion juste après l'inscription pour que l'utilisateur
            // arrive authentifié (et déclenche la reprise d'une sauvegarde en
            // attente).
            login(
              { username, password },
              {
                onSuccess: (data) => {
                  setAccessToken(data.accessToken)
                  setAlert({
                    type: 'success',
                    message: 'Votre compte a été créé avec succès !',
                  })
                },
                onError: (err) =>
                  setAlert({
                    type: 'error',
                    message: `Compte créé, mais connexion impossible : ${err.message}`,
                  }),
              }
            ),
          onError: (err) =>
            setAlert({
              type: 'error',
              message: `Erreur dans la création du profil: ${err.message}`,
            }),
        }
      )
    }
  }

  const onFinishFailed: FormProps<FieldType<M>>['onFinishFailed'] = (
    errorInfo
  ) => {
    const prefix = mode === 'login' ? 'Connexion' : 'Création du profil'
    setAlert({
      type: 'error',
      message: `${prefix} erreur : ${errorInfo.message}`,
    })
  }

  return (
    <div className={styles.inputBox}>
      {alert && (
        <Alert description={alert.message} type={alert.type} showIcon />
      )}
      <Form<FieldType<M>>
        name={mode === 'login' ? 'login' : 'signup'}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        initialValues={{ remember: true }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
      >
        <Form.Item<LoginFields>
          label="Identifiant"
          name="username"
          rules={[
            { required: true, message: 'Veuillez entrer votre identifiant !' },
          ]}
        >
          <Input autoComplete="username" />
        </Form.Item>

        {mode === 'signup' && (
          <Form.Item<SignUpFields>
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Veuillez entrer votre email !' },
            ]}
          >
            <Input autoComplete="email" />
          </Form.Item>
        )}

        <Form.Item<LoginFields>
          label="Mot de passe"
          name="password"
          rules={[
            { required: true, message: 'Veuillez entrer votre mot de passe !' },
          ]}
        >
          <Input.Password
            autoComplete={
              mode === 'login' ? 'current-password' : 'new-password'
            }
          />
        </Form.Item>

        {mode === 'signup' && (
          <Form.Item<SignUpFields>
            label="Confirmer le mot de passe"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              {
                required: true,
                message: 'Veuillez confirmer votre mot de passe !',
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(
                    new Error('Les mots de passe ne sont pas identiques !')
                  )
                },
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        )}

        <Form.Item label={null}>
          <Button type="primary" htmlType="submit" className={styles.button}>
            Valider
          </Button>
        </Form.Item>
      </Form>
      {mode === 'login' ? (
        <p className={styles.switchMode}>
          Pas encore de compte ? <Link to="/signup">Créer un compte</Link>
        </p>
      ) : (
        <p className={styles.switchMode}>
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      )}
    </div>
  )
}
