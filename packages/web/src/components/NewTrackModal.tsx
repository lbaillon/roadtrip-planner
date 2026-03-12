import { useCreateTrack } from '#web/hooks/useTracks'
import { Button, Form, Input, message, Modal, Upload, type UploadFile } from 'antd'
import { useState } from 'react'
import styles from './NewTrackModal.module.css'

type FormValues = {
  name?: string
  file: UploadFile[]
}
export default function NewTrackModal() {
  const [form] = Form.useForm<FormValues>()
  const [open, setOpen] = useState(false)
  const { mutate: createTrack, isPending } = useCreateTrack()
  const [messageApi, contextHolder] = message.useMessage();


  const handleSubmit = async (values: FormValues) => {
    const file = values.file?.[0]?.originFileObj

    if (!file) return
    const gpxContent = await file.text()
    if (file.size > 500_000) {
      messageApi.error("File too large (max 500KB)")
      return Upload.LIST_IGNORE
    }
    createTrack({
      ...(values.name && { name: values.name }),
      gpxContent
    }, {
        onSuccess: () => {
        setOpen(false)
        form.resetFields()
        },
        onError: (error) => messageApi.error(`Error: ${error.message}`),
    })
  }
  return (
    <>
      {contextHolder}
      <Button type="primary" onClick={() => setOpen(true)} className={styles.modalButton}>
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
        <Form<FormValues>
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item<FormValues>
            label="Name"
            name="name"
          >
            <Input className={styles.inputModal} />
          </Form.Item>
          <Form.Item<FormValues>
            label="GPX File"
            name="file"
            valuePropName="fileList"
            getValueFromEvent={(e) => e.fileList}
            rules={[{ required: true, message: "Please upload a GPX file" }]}
          >
            <Upload
              beforeUpload={(file) => {
                const isGpx =
                  file.type === "application/gpx+xml" ||
                  file.name.endsWith(".gpx")
                if (!isGpx) {
                  messageApi.error("Only GPX files allowed")
                }
                return false// necessary, it prevents automatic upload
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
