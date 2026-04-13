import { useAddTrackToTrip } from '#web/hooks/mutations/useAddTrackToTrip'
import { useCreateTrack } from '#web/hooks/mutations/useCreateTrack'
import { useGetTripTracks } from '#web/hooks/useTrips'
import {
  Button,
  Form,
  Input,
  message,
  Upload,
  type FormInstance,
  type UploadFile,
} from 'antd'
import styles from './NewTrackForm.module.css'
import { setGpxName } from '#web/lib/gpx-utils'

export type NewTrackFormValues = {
  name?: string
  file: UploadFile[]
}

type Props = {
  form: FormInstance<NewTrackFormValues>
  tripId?: string
  onSuccess: () => void
}

export function NewTrackForm({ form, tripId, onSuccess }: Props) {
  const { mutate: createTrack } = useCreateTrack()
  const { mutate: addToTrip } = useAddTrackToTrip(tripId ?? '')
  const { data: tripTracks } = useGetTripTracks(tripId)
  const [messageApi, contextHolder] = message.useMessage()

  const handleSubmit = async (values: NewTrackFormValues) => {
    const file = values.file?.[0]?.originFileObj
    if (!file) return
    const gpxContent = await file.text()
    // edit gpx content if values.name is defined
    // create function in gpx-utils to rewrite name in metadata.name
    const finalGpxContent = values.name ? setGpxName(gpxContent, values.name) : gpxContent
    createTrack(
      // remove values.name
      { gpxContent: finalGpxContent },
      {
        onSuccess: ({ id: trackId }) => {
          if (tripId) {
            addToTrip({ trackId, order: tripTracks?.length ?? 0 })
          }
          onSuccess()
        },
        onError: (error) => messageApi.error(`Error: ${error.message}`),
      }
    )
  }

  return (
    <>
      {contextHolder}
      <Form<NewTrackFormValues>
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item<NewTrackFormValues> label="Name" name="name">
          <Input className={styles.inputModal} />
        </Form.Item>
        <Form.Item<NewTrackFormValues>
          label="GPX File"
          name="file"
          valuePropName="fileList"
          getValueFromEvent={(e) => e.fileList}
          rules={[{ required: true, message: 'Please upload a GPX file' }]}
        >
          <Upload
            beforeUpload={(file) => {
              const isGpx =
                file.type === 'application/gpx+xml' ||
                file.name.endsWith('.gpx')
              if (!isGpx) {
                messageApi.error('Only GPX files allowed')
                return Upload.LIST_IGNORE
              }
              if (file.size > 2_000_000) {
                messageApi.error('File too large (max 2MB)')
                return Upload.LIST_IGNORE
              }
              return false // necessary, it prevents automatic upload
            }}
            accept=".gpx"
            maxCount={1}
          >
            <Button>Select GPX file</Button>
          </Upload>
        </Form.Item>
      </Form>
    </>
  )
}
