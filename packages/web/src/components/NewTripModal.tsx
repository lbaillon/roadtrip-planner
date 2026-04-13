import { useCreateTrip } from '#web/hooks/mutations/useCreateTrip'
import { Button, Form, Input, Modal } from 'antd'
import { useState } from 'react'
import styles from './NewTripModal.module.css'

type CreateTripInput = {
  name: string
  description?: string
}
export default function NewTripModal() {
  const [form] = Form.useForm<CreateTripInput>()
  const [open, setOpen] = useState(false)
  const { mutate: createTrip, isPending } = useCreateTrip()

  return (
    <>
      <Button
        type="primary"
        onClick={() => setOpen(true)}
        className={styles.modalButton}
      >
        Créer un voyage
      </Button>
      <Modal
        title="Créer un nouveau voyage"
        open={open}
        onCancel={() => {
          setOpen(false)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        confirmLoading={isPending}
      >
        <Form<CreateTripInput>
          form={form}
          layout="vertical"
          onFinish={(values: CreateTripInput) => {
            createTrip(values)
            setOpen(false)
            form.resetFields()
          }}
        >
          <Form.Item<CreateTripInput>
            label="Nom du voyage"
            name="name"
            rules={[
              { required: true, message: 'Veuillez entrer un nom de voyage' },
            ]}
          >
            <Input
              placeholder="Roadtrip en Italie"
              className={styles.inputModal}
            />
          </Form.Item>
          <Form.Item<CreateTripInput> label="Description" name="description">
            <Input.TextArea
              rows={4}
              placeholder="Décrivez votre voyage"
              className={styles.inputModal}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
