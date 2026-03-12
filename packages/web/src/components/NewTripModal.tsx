import { useCreateTrip } from '#web/hooks/useTrips'
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
      <Button type="primary" onClick={() => setOpen(true)}  className={styles.modalButton}>
        Create Trip
      </Button>
      <Modal
        title="Create a new trip"
        open={open}
        onCancel={() => {
          setOpen(false)
          form.resetFields()
        }}
        onOk={() => {
          form.submit()
          setOpen(false)
          form.resetFields()
        }}
        confirmLoading={isPending}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values:CreateTripInput)=>createTrip(values)}
        >
          <Form.Item
            label="Trip name"
            name="name"
            rules={[{ required: true, message: "Please enter a trip name" }]}
          >
            <Input placeholder="Roadtrip in Italy" className={styles.inputModal}/>
          </Form.Item>
          <Form.Item
            label="Description"
            name="description"
          >
            <Input.TextArea
              rows={4}
              placeholder="Describe your trip" className={styles.inputModal}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
