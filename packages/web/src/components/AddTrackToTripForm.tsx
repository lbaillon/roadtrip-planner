import { useAddTrackToTrip } from '#web/hooks/mutations/useAddTrackToTrip'
import { useGetTracks } from '#web/hooks/useTracks'
import { useGetTripTracks } from '#web/hooks/useTrips'
import { Form, Select, type FormInstance } from 'antd'

export type AddTrackToTripFormValues = {
  trackIds: string[]
}

type Props = {
  form: FormInstance<AddTrackToTripFormValues>
  tripId: string
  onSuccess: () => void
}

export function AddTrackToTripForm({ form, tripId, onSuccess }: Props) {
  const { mutate: add } = useAddTrackToTrip(tripId)
  const { data: tracks } = useGetTracks()
  const { data: tripTracks } = useGetTripTracks(tripId)

  function handleSubmit(values: AddTrackToTripFormValues) {
    const baseOrder = tripTracks?.length ?? 0
    values.trackIds.forEach((trackId, i) => {
      add({ trackId, order: baseOrder + i })
    })
    onSuccess()
  }

  return (
    <Form<AddTrackToTripFormValues>
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
    >
      <Form.Item<AddTrackToTripFormValues>
        label="Tracks"
        name="trackIds"
        rules={[{ required: true, message: 'Please select at least one track' }]}
      >
        <Select
          mode="multiple"
          options={tracks
            ?.filter(
              (track) => !tripTracks?.find((tripTrack) => tripTrack.id === track.id)
            )
            ?.map((track) => ({ value: track.id, label: track.name }))}
        />
      </Form.Item>
    </Form>
  )
}
