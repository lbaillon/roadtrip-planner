import Box from '#web/components/Box'
import BoxTitle from '#web/components/BoxTitle'
import { useForgotPassword } from '#web/hooks/useApi'
import { Alert, Button, Form, Input, message } from 'antd'
import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ForgotPassword() {
  const { mutate: forgotPassword, isPending } = useForgotPassword()
  const [messageApi, contextHolder] = message.useMessage()
  const [sent, setSent] = useState(false)

  const onFinish = (values: { email: string }) => {
    forgotPassword(
      { email: values.email },
      {
        onSuccess: () => setSent(true),
        onError: (e) => messageApi.error(`Erreur : ${e.message}`),
      }
    )
  }

  return (
    <Box>
      {contextHolder}
      <BoxTitle>Mot de passe oublié</BoxTitle>
      {sent ? (
        <Alert
          type="success"
          showIcon
          description="Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé (pensez à vérifier vos spams)."
        />
      ) : (
        <Form
          layout="vertical"
          onFinish={onFinish}
          style={{ maxWidth: 400, marginTop: 16 }}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: 'Requis' }]}
          >
            <Input autoComplete="email" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={isPending}>
            Envoyer le lien
          </Button>
        </Form>
      )}
      <p style={{ marginTop: 16 }}>
        <Link to="/login">Retour à la connexion</Link>
      </p>
    </Box>
  )
}
