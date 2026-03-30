import { useGetTracks } from '#web/hooks/useTracks'
import { useAddTrackToTrip } from '#web/hooks/mutations/useAddTrackToTrip'
import { useGetTripTracks } from '#web/hooks/useTrips'
import { Button, Form, Modal, Select } from 'antd'
import { useState } from 'react'
import styles from './NewTripModal.module.css'

type AddTrackInput = {
  trackIds: string[]
}
type Props = {
  tripId: string | undefined
}
export default function AddTrackToTripModal({ tripId }: Props) {
  const [form] = Form.useForm<AddTrackInput>()
  const [open, setOpen] = useState(false)
  const { mutate: add } = useAddTrackToTrip(tripId ?? '')
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
      >
        <Form<AddTrackInput>
          form={form}
          layout="vertical"
          onFinish={(values: AddTrackInput) => {
            const baseOrder = tripTracks?.length ?? 0
            values.trackIds.forEach((trackId, i) => {
              add({ trackId, order: baseOrder + i })
            })
            setOpen(false)
            form.resetFields()
          }}
        >
          <Form.Item<AddTrackInput>
            label="Tracks"
            name="trackIds"
            rules={[{ required: true, message: 'Please select at least one track' }]}
          >
            <Select
              mode="multiple"
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
