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
    } else {
      form.resetFields()
    }
  }, [open, initialValues, form])

  return (
    <Modal
      title={initialValues ? 'Edit waypoint' : 'Add waypoint'}
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
          label="Name"
          name="name"
          rules={[{ required: true, message: 'Please enter a name' }]}
        >
          <Input placeholder="Col de la Croix de Fer" />
        </Form.Item>
        <Form.Item<WaypointFormInput> label="Description" name="description">
          <Input.TextArea rows={3} placeholder="Optional description" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
