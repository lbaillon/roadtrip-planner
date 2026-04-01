import {
  NewTrackForm,
  type NewTrackFormValues,
} from '#web/components/NewTrackForm'
import { Button, Form, Modal } from 'antd'
import { useState } from 'react'
import styles from './NewTrackModal.module.css'

export default function NewTrackModal() {
  const [form] = Form.useForm<NewTrackFormValues>()
  const [open, setOpen] = useState(false)

  function handleClose() {
    setOpen(false)
    form.resetFields()
  }

  return (
    <>
      <Button
        type="primary"
        onClick={() => setOpen(true)}
        className={styles.modalButton}
      >
        Upload new track
      </Button>
      <Modal
        title="New track"
        open={open}
        onCancel={handleClose}
        onOk={() => form.submit()}
      >
        <NewTrackForm form={form} onSuccess={handleClose} />
      </Modal>
    </>
  )
}
