import Box from '#web/components/Box'
import BoxTitle from '#web/components/BoxTitle'
import UserGreeting from '#web/components/UserGreeting'
import {
  useGetMe,
  useUpdateMe,
  useUpdateProfilePicture,
} from '#web/hooks/useAccount'
import { Avatar, Button, Form, Input, message, Modal, Upload } from 'antd'
import { useState } from 'react'

type InfoFormValues = {
  username: string
  email: string
  currentPassword?: string
}

type PasswordFormValues = {
  currentPassword: string
  password: string
  confirmPassword: string
}

export default function Account() {
  const { data: me, isLoading } = useGetMe()
  const { mutate: updateMe, isPending } = useUpdateMe()
  const { mutate: updatePhoto, isPending: isUploadingPhoto } =
    useUpdateProfilePicture()
  const [messageApi, contextHolder] = message.useMessage()

  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [infoForm] = Form.useForm<InfoFormValues>()
  const [passwordForm] = Form.useForm<PasswordFormValues>()

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

  const openInfo = () => {
    infoForm.setFieldsValue({
      username: me?.username,
      email: me?.email,
      currentPassword: '',
    })
    setIsInfoOpen(true)
  }

  const submitInfo = (values: InfoFormValues) => {
    const emailChanged = values.email !== me?.email
    updateMe(
      {
        username: values.username,
        email: values.email,
        currentPassword: values.currentPassword || undefined,
      },
      {
        onSuccess: () => {
          messageApi.success(
            emailChanged
              ? 'Compte mis à jour. Vérifiez votre nouvelle adresse email pour la confirmer.'
              : 'Compte mis à jour.'
          )
          setIsInfoOpen(false)
        },
        onError: (e) => messageApi.error(`Erreur : ${e.message}`),
      }
    )
  }

  const submitPassword = (values: PasswordFormValues) => {
    updateMe(
      { password: values.password, currentPassword: values.currentPassword },
      {
        onSuccess: () => {
          messageApi.success('Mot de passe mis à jour.')
          setIsPasswordOpen(false)
          passwordForm.resetFields()
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
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              alignItems: 'flex-start',
            }}
          >
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

            <div>
              <p>
                <strong>Nom d'utilisateur :</strong> {me.username}
              </p>
              <p>
                <strong>Email :</strong> {me.email}
              </p>
              <Button style={{ marginTop: 8 }} onClick={openInfo}>
                Modifier
              </Button>
            </div>

            <Button onClick={() => setIsPasswordOpen(true)}>
              Modifier le mot de passe
            </Button>
          </div>
        )}
      </Box>

      <Modal
        title="Modifier mes informations"
        open={isInfoOpen}
        onCancel={() => setIsInfoOpen(false)}
        onOk={() => infoForm.submit()}
        okText="Enregistrer"
        cancelText="Annuler"
        confirmLoading={isPending}
      >
        <Form form={infoForm} layout="vertical" onFinish={submitInfo}>
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
            label="Mot de passe actuel"
            name="currentPassword"
            dependencies={['email']}
            help="Requis pour changer l'email"
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (getFieldValue('email') !== me?.email && !value) {
                    return Promise.reject(
                      new Error(
                        'Mot de passe actuel requis pour changer l’email'
                      )
                    )
                  }
                  return Promise.resolve()
                },
              }),
            ]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Modifier le mot de passe"
        open={isPasswordOpen}
        onCancel={() => {
          setIsPasswordOpen(false)
          passwordForm.resetFields()
        }}
        onOk={() => passwordForm.submit()}
        okText="Enregistrer"
        cancelText="Annuler"
        confirmLoading={isPending}
      >
        <Form form={passwordForm} layout="vertical" onFinish={submitPassword}>
          <Form.Item
            label="Mot de passe actuel"
            name="currentPassword"
            rules={[{ required: true, message: 'Requis' }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
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
        </Form>
      </Modal>
    </>
  )
}
