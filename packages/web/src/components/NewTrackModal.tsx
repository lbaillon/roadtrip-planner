import { useAddTrackToTrip } from '#web/hooks/mutations/useAddTrackToTrip'
import { useCreateTrack } from '#web/hooks/mutations/useCreateTrack'
import { useGetTripTracks } from '#web/hooks/useTrips'
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Upload,
  type UploadFile,
} from 'antd'
import { useState } from 'react'
import styles from './NewTrackModal.module.css'

type FormValues = {
  name?: string
  file: UploadFile[]
}

type Props = {
  tripId?: string
}

export default function NewTrackModal({ tripId }: Props) {
  const [form] = Form.useForm<FormValues>()
  const [open, setOpen] = useState(false)
  const { mutate: createTrack, isPending } = useCreateTrack()
  const { mutate: addToTrip } = useAddTrackToTrip(tripId ?? '')
  const { data: tripTracks } = useGetTripTracks(tripId)
  const [messageApi, contextHolder] = message.useMessage()

  const handleSubmit = async (values: FormValues) => {
    const file = values.file?.[0]?.originFileObj

    if (!file) return
    const gpxContent = await file.text()
    if (file.size > 500_000) {
      messageApi.error('File too large (max 500KB)')
      return Upload.LIST_IGNORE
    }
    createTrack(
      {
        ...(values.name && { name: values.name }),
        gpxContent,
      },
      {
        onSuccess: ({ id: trackId }) => {
          if (tripId) {
            addToTrip({ trackId, order: tripTracks?.length ?? 0 })
          }
          setOpen(false)
          form.resetFields()
        },
        onError: (error) => messageApi.error(`Error: ${error.message}`),
      }
    )
  }
  return (
    <>
      {contextHolder}
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
        onCancel={() => {
          setOpen(false)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        confirmLoading={isPending}
      >
        <Form<FormValues> form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item<FormValues> label="Name" name="name">
            <Input className={styles.inputModal} />
          </Form.Item>
          <Form.Item<FormValues>
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
      </Modal>
    </>
  )
}
