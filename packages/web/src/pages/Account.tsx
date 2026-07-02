import Box from '#web/components/Box'
import BoxTitle from '#web/components/BoxTitle'
import UserGreeting from '#web/components/UserGreeting'
import { useGetMe, useUpdateMe } from '#web/hooks/useAccount'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Avatar, Button, Form, Input, message } from 'antd'

type FormValues = {
  username: string
  email: string
  password?: string
  currentPassword?: string
}

export default function Account() {
  const { data: me, isLoading } = useGetMe()
  const { mutate: updateMe, isPending } = useUpdateMe()
  const [messageApi, contextHolder] = message.useMessage()

  const handleSubmit = (values: FormValues) => {
    const emailChanged = values.email !== me?.email
    updateMe(
      {
        username: values.username,
        email: values.email,
        password: values.password || undefined,
        currentPassword: values.currentPassword || undefined,
      },
      {
        onSuccess: () => {
          messageApi.success(
            emailChanged
              ? 'Compte mis à jour. Vérifiez votre nouvelle adresse email pour la confirmer.'
              : 'Compte mis à jour.'
          )
        },
        onError: (e) => messageApi.error(`Erreur : ${e.message}`),
      }
    )
  }

  return (
    <>
      {contextHolder}
      <UserGreeting />
      <Box>
        <BoxTitle>Mon compte</BoxTitle>
        {isLoading || !me ? (
          <p>Chargement...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Avatar
              size={96}
              src={me.profilePicture ?? undefined}
              icon={<FontAwesomeIcon icon={faUser} />}
            />
            <Form<FormValues>
              layout="vertical"
              initialValues={{ username: me.username, email: me.email }}
              onFinish={handleSubmit}
              style={{ maxWidth: 400, width: '100%' }}
            >
              <Form.Item
                label="Nom d'utilisateur"
                name="username"
                rules={[{ required: true, message: 'Requis' }]}
              >
                <Input autoComplete="username" />
              </Form.Item>
              <Form.Item
                label="Email"
                name="email"
                rules={[{ required: true, message: 'Requis' }]}
              >
                <Input autoComplete="email" />
              </Form.Item>
              <Form.Item
                label="Nouveau mot de passe"
                name="password"
                help="Laisser vide pour ne pas changer"
              >
                <Input.Password autoComplete="new-password" />
              </Form.Item>
              <Form.Item
                label="Mot de passe actuel"
                name="currentPassword"
                help="Requis pour changer l'email ou le mot de passe"
              >
                <Input.Password autoComplete="current-password" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={isPending}>
                  Enregistrer
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </Box>
    </>
  )
}
