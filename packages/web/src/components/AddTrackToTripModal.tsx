import { useGetTracks } from '#web/hooks/useTracks'
import { useAddTrackToTrip } from '#web/hooks/mutations/useAddTrackToTrip'
import { useGetTripTracks } from '#web/hooks/useTrips'
import { Button, Form, Modal, Select } from 'antd'
import { useState } from 'react'
import styles from './NewTripModal.module.css'

type AddTrackInput = {
  trackId: string
}
type Props = {
  tripId: string | undefined
}
export default function AddTrackToTripModal({ tripId }: Props) {
  const [form] = Form.useForm<AddTrackInput>()
  const [open, setOpen] = useState(false)
  const { mutate: add, isPending } = useAddTrackToTrip(tripId ?? '')
  const { data: tracks } = useGetTracks()
  const { data: tripTracks } = useGetTripTracks(tripId)

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
        onCancel={() => {
          setOpen(false)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        confirmLoading={isPending}
      >
        <Form<AddTrackInput>
          form={form}
          layout="vertical"
          onFinish={(values: AddTrackInput) => {
            add({ trackId: values.trackId, order: tripTracks?.length ?? 0 })
            setOpen(false)
            form.resetFields()
          }}
        >
          <Form.Item<AddTrackInput>
            label="Track"
            name="trackId"
            rules={[{ required: true, message: 'Please select a track' }]}
          >
            <Select
              style={{ width: 120 }}
              options={tracks
                ?.filter(
                  (track) =>
                    !tripTracks?.find((tripTrack) => tripTrack.id === track.id)
                )
                ?.map((track) => ({ value: track.id, label: track.name }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
