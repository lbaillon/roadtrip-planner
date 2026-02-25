import type { FormProps } from 'antd'
import { Alert, Button, Form, Input } from 'antd'
import { useState } from 'react'
import { useCreateUser } from '../hooks/useApi'
import styles from './SignUp-LogIn.module.css'

type FieldType = {
  username: string
  password: string
  confirmPassword: string
  email: string
}

type AlertState = {
  type: 'success' | 'error'
  message: string
} | null

export default function SignUp() {
  const { mutate: postUser } = useCreateUser()
  const [alert, setAlert] = useState<AlertState>(null)

  const onFinish: FormProps<FieldType>['onFinish'] = (values) => {
    postUser(values, {
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
    })
  }

  const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (
    errorInfo
  ) => {
    setAlert({
      type: 'error',
      message: `Profile creation failed: ${errorInfo.message}`,
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
          label="Email"
          name="email"
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

        <Form.Item<FieldType>
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
