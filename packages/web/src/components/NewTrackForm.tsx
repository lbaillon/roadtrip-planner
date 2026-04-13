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
import { getGpxName, setGpxName } from '#web/lib/gpx-utils'

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
    const name  = values.name ?? getGpxName(gpxContent) ?? 'Unnamed Route'
    createTrack(
      { gpxContent: setGpxName(gpxContent, name) },
      {
        onSuccess: ({ id: trackId }) => {
          if (tripId) {
            addToTrip({ trackId, order: tripTracks?.length ?? 0 })
          }
          onSuccess()
        },
        onError: (error) => messageApi.error(`Erreur: ${error.message}`),
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
        <Form.Item<NewTrackFormValues> label="Nom" name="name">
          <Input className={styles.inputModal} />
        </Form.Item>
        <Form.Item<NewTrackFormValues>
          label="Fichier GPX"
          name="file"
          valuePropName="fileList"
          getValueFromEvent={(e) => e.fileList}
          rules={[
            { required: true, message: 'Veuillez uploader un fichier GPX' },
          ]}
        >
          <Upload
            beforeUpload={(file) => {
              const isGpx =
                file.type === 'application/gpx+xml' ||
                file.name.endsWith('.gpx')
              if (!isGpx) {
                messageApi.error('Seuls les fichiers GPX sont acceptés')
                return Upload.LIST_IGNORE
              }
              if (file.size > 2_000_000) {
                messageApi.error('Fichier trop volumineux (max 2Mo)')
                return Upload.LIST_IGNORE
              }
              return false // necessary, it prevents automatic upload
            }}
            accept=".gpx"
            maxCount={1}
          >
            <Button>Sélectionner un fichier GPX</Button>
          </Upload>
        </Form.Item>
      </Form>
    </>
  )
}
