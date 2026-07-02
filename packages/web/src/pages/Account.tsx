import Box from '#web/components/Box'
import BoxTitle from '#web/components/BoxTitle'
import UserGreeting from '#web/components/UserGreeting'
import {
  useGetMe,
  useUpdateMe,
  useUpdateProfilePicture,
} from '#web/hooks/useAccount'
import { Avatar, Button, Form, Input, message, Upload } from 'antd'

type FormValues = {
  username: string
  email: string
  password?: string
  currentPassword?: string
}

export default function Account() {
  const { data: me, isLoading } = useGetMe()
  const { mutate: updateMe, isPending } = useUpdateMe()
  const { mutate: updatePhoto, isPending: isUploadingPhoto } =
    useUpdateProfilePicture()
  const [messageApi, contextHolder] = message.useMessage()

  const handlePhoto = (file: File) => {
    if (!file.type.startsWith('image/')) {
      messageApi.error('Veuillez sélectionner une image')
      return
    }
    if (file.size > 1_000_000) {
      messageApi.error('Image trop volumineuse (max 1 Mo)')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      updatePhoto(reader.result as string, {
        onSuccess: () => messageApi.success('Photo de profil mise à jour'),
        onError: (e) => messageApi.error(`Erreur : ${e.message}`),
      })
    }
    reader.readAsDataURL(file)
  }

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
            <Avatar size={96} src={me.profilePicture ?? undefined}>
              {me.username?.[0]?.toUpperCase()}
            </Avatar>
            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={(file) => {
                handlePhoto(file)
                return false
              }}
            >
              <Button loading={isUploadingPhoto}>Changer la photo</Button>
            </Upload>
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
