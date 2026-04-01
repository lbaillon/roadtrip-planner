import { AddTrackToTripForm, type AddTrackToTripFormValues } from '#web/components/AddTrackToTripForm'
import { NewTrackForm, type NewTrackFormValues } from '#web/components/NewTrackForm'
import { Button, Form, Modal, Segmented } from 'antd'
import { useState } from 'react'
import styles from './AddTrackToTripModal.module.css'

type Mode = 'existing' | 'new'

type Props = {
  tripId: string | undefined
}

export default function AddTrackToTripModal({ tripId }: Props) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('existing')
  const [existingForm] = Form.useForm<AddTrackToTripFormValues>()
  const [uploadForm] = Form.useForm<NewTrackFormValues>()

  function handleClose() {
    setOpen(false)
    existingForm.resetFields()
    uploadForm.resetFields()
  }

  return (
    <>
      <Button
        type="primary"
        onClick={() => setOpen(true)}
        disabled={!tripId}
        className={styles.modalButton}
      >
        Add track to trip
      </Button>
      <Modal
        title="Add track to trip"
        open={open}
        onCancel={handleClose}
        onOk={() =>
          mode === 'existing' ? existingForm.submit() : uploadForm.submit()
        }
      >
        <Segmented<Mode>
          options={[
            { label: 'Existing track', value: 'existing' },
            { label: 'New track', value: 'new' },
          ]}
          value={mode}
          onChange={(v: Mode) => {
            setMode(v)
            existingForm.resetFields()
            uploadForm.resetFields()
          }}
          className={styles.switch}
        />
        {mode === 'existing' ? (
          <AddTrackToTripForm
            form={existingForm}
            tripId={tripId!}
            onSuccess={handleClose}
          />
        ) : (
          <NewTrackForm
            form={uploadForm}
            tripId={tripId}
            onSuccess={handleClose}
          />
        )}
      </Modal>
    </>
  )
}
