import { useResetPassword } from '#web/hooks/useApi'
import { Alert, Button, Form, Input, message } from 'antd'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

type FormValues = { password: string; confirmPassword: string }

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const { mutate: resetPassword, isPending } = useResetPassword()
  const navigate = useNavigate()
  const [messageApi, contextHolder] = message.useMessage()

  const onFinish = (values: FormValues) => {
    resetPassword(
      { token, password: values.password },
      {
        onSuccess: () => navigate('/login?reset=1'),
        onError: () =>
          messageApi.error('Lien invalide ou expiré. Refaites une demande.'),
      }
    )
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 24 }}>
      {contextHolder}
      <h2>Réinitialiser le mot de passe</h2>
      {!token ? (
        <Alert type="error" showIcon description="Lien invalide." />
      ) : (
        <Form<FormValues> layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Nouveau mot de passe"
            name="password"
            rules={[{ required: true, message: 'Requis' }]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            label="Confirmer le nouveau mot de passe"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Requis' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(
                    new Error('Les mots de passe ne sont pas identiques')
                  )
                },
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={isPending}>
            Réinitialiser
          </Button>
        </Form>
      )}
      <p style={{ marginTop: 16 }}>
        <Link to="/login">Retour à la connexion</Link>
      </p>
    </div>
  )
}
