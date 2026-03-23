import { useCreateUser, useLogin } from '#web/hooks/useApi'
import { useAuth } from '#web/hooks/useAuth'
import type { FormProps } from 'antd'
import { Alert, Button, Form, Input } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
    const timer = setTimeout(
      () => navigate(mode === 'login' ? '/' : '/login'),
      1500
    )
    return () => clearTimeout(timer)
  }, [alert, navigate, mode])

  const onFinish = (values: FieldType<M>) => {
    if (mode === 'login') {
      const { username, password } = values as LoginFields
      login(
        { username, password },
        {
          onSuccess: (data) => {
            setAccessToken(data.accessToken)
            setAlert({ type: 'success', message: 'Login successful' })
          },
          onError: (err) =>
            setAlert({
              type: 'error',
              message: `Login failed: ${err.message}`,
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
              message: 'Your profile has been successfully created!',
            }),
          onError: (err) =>
            setAlert({
              type: 'error',
              message: `Profile creation failed: ${err.message}`,
            }),
        }
      )
    }
  }

  const onFinishFailed: FormProps<FieldType<M>>['onFinishFailed'] = (
    errorInfo
  ) => {
    const prefix = mode === 'login' ? 'Login' : 'Profile creation'
    setAlert({
      type: 'error',
      message: `${prefix} failed: ${errorInfo.message}`,
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
          label="Username"
          name="username"
          rules={[{ required: true, message: 'Please input your username!' }]}
        >
          <Input autoComplete="username" />
        </Form.Item>

        {mode === 'signup' && (
          <Form.Item<SignUpFields>
            label="Email"
            name="email"
            rules={[{ required: true, message: 'Please input your email!' }]}
          >
            <Input autoComplete="email" />
          </Form.Item>
        )}

        <Form.Item<LoginFields>
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password
            autoComplete={
              mode === 'login' ? 'current-password' : 'new-password'
            }
          />
        </Form.Item>

        {mode === 'signup' && (
          <Form.Item<SignUpFields>
            label="Confirm password"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('Passwords do not match!'))
                },
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        )}

        <Form.Item label={null}>
          <Button type="primary" htmlType="submit" className={styles.button}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}
