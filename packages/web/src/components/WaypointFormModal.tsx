import { Form, Input, Modal } from 'antd'
import { useEffect } from 'react'

type WaypointFormInput = {
  name: string
  description?: string
}

type WaypointFormModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (data: WaypointFormInput) => void
  initialValues?: WaypointFormInput
  loading: boolean
}

export default function WaypointFormModal({
  open,
  onClose,
  onSubmit,
  initialValues,
  loading,
}: WaypointFormModalProps) {
  const [form] = Form.useForm<WaypointFormInput>()

  useEffect(() => {
    if (open) {
      form.setFieldsValue(initialValues ?? { name: '', description: '' })
    }
  }, [open, initialValues, form])

  return (
    <Modal
      title={initialValues ? 'Modifier le point' : 'Ajouter un point'}
      open={open}
      onCancel={() => {
        onClose()
        form.resetFields()
      }}
      onOk={() => form.submit()}
      confirmLoading={loading}
    >
      <Form<WaypointFormInput>
        form={form}
        layout="vertical"
        onFinish={(values) => onSubmit(values)}
      >
        <Form.Item<WaypointFormInput>
          label="Nom"
          name="name"
          rules={[{ required: true, message: 'Veuillez entrer un nom' }]}
        >
          <Input placeholder="Col de la Croix de Fer" />
        </Form.Item>
        <Form.Item<WaypointFormInput> label="Description" name="description">
          <Input.TextArea rows={3} placeholder="Description optionnelle" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
