import { useCreateUser, useLogin, useResendConfirmation } from '#web/hooks/useApi'
import { useAuth } from '#web/hooks/useAuth'
import type { FormProps } from 'antd'
import { Alert, Button, Form, Input, Modal, message } from 'antd'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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
  const { mutate: resendConfirmation, isPending: isResending } =
    useResendConfirmation()
  const [alert, setAlert] = useState<AlertState>(null)
  const [resendOpen, setResendOpen] = useState(false)
  const [resendEmail, setResendEmail] = useState('')
  const { setAccessToken } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const handleResend = () => {
    resendConfirmation(
      { email: resendEmail },
      {
        onSuccess: () => {
          message.success(
            'Si un compte non confirmé existe avec cet email, un nouveau lien vient d’être envoyé.'
          )
          setResendOpen(false)
          setResendEmail('')
        },
        onError: () => message.error('Erreur lors de l’envoi'),
      }
    )
  }

  useEffect(() => {
    if (alert?.type !== 'success') return
    const timer = setTimeout(
      () => navigate(mode === 'login' ? '/' : '/login?registered=1'),
      1500
    )
    return () => clearTimeout(timer)
  }, [alert, navigate, mode])

  const getNotice = (): AlertState => {
    if (mode !== 'login') return null
    const confirmed = searchParams.get('confirmed')
    if (confirmed === '1') {
      return {
        type: 'success',
        message: 'Email confirmé avec succès, vous pouvez vous connecter.',
      }
    }
    if (confirmed === '0') {
      return {
        type: 'error',
        message: 'Lien de confirmation invalide ou expiré.',
      }
    }
    if (searchParams.get('registered') === '1') {
      return {
        type: 'success',
        message:
          'Compte créé ! Confirmez votre email (pensez à vérifier les spams) avant de vous connecter.',
      }
    }
    return null
  }
  const notice = getNotice()

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
            setAlert({
              type: 'success',
              message: 'Votre compte a été créé avec succès !',
            }),
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
      {notice && (
        <Alert description={notice.message} type={notice.type} showIcon />
      )}
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
      {mode === 'login' && (
        <>
          <Button type="link" onClick={() => setResendOpen(true)}>
            Renvoyer l'email de confirmation
          </Button>
          <Modal
            title="Renvoyer l'email de confirmation"
            open={resendOpen}
            onCancel={() => setResendOpen(false)}
            onOk={handleResend}
            okText="Envoyer"
            cancelText="Annuler"
            confirmLoading={isResending}
          >
            <Input
              type="email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder="email@exemple.com"
              onPressEnter={handleResend}
            />
          </Modal>
        </>
      )}
    </div>
  )
}
