import { Alert, Button, Form, Input, type FormProps } from 'antd'
import { useState } from 'react'
import { useLogin } from '../hooks/useApi'
import styles from './SignUp-LogIn.module.css'
import { useAuth } from '#web/hooks/useAuth'

type FieldType = {
  username: string
  password: string
  email: string
}

type AlertState = {
  type: 'success' | 'error'
  message: string
} | null

export default function LogIn() {
  const { mutate: login } = useLogin()
  const [alert, setAlert] = useState<AlertState>(null)
  const { setAccessToken } = useAuth()

  const onFinish: FormProps<FieldType>['onFinish'] = (values) => {
    login(values, {
      onSuccess: (data) => {
        setAccessToken(data.accessToken)
        setAlert({ type: 'success', message: 'Login successful' })
      },
      onError: (err) =>
        setAlert({ type: 'error', message: `Login failed: ${err.message}` }),
    })
  }

  const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (
    errorInfo
  ) => {
    setAlert({
      type: 'error',
      message: `Login failed: ${errorInfo.message}`,
    })
  }

  return (
    <div className={styles.inputBox}>
      {alert && (
        <Alert description={alert.message} type={alert.type} showIcon />
      )}
      <Form
        name="signup"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        initialValues={{ remember: true }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.Item<FieldType>
          label="Username"
          name="username"
          rules={[{ required: true, message: 'Please input your username!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item<FieldType>
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item label={null}>
          <Button type="primary" htmlType="submit" className={styles.button}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}
