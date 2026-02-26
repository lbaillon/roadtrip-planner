import { useState } from 'react'
import { Button, Modal, Input } from 'antd'
import { useParseGpx } from '#web/hooks/useApi'
import { GpxUploader } from './GpxUploader'
import styles from './NewTrackModal.module.css'

export default function NewTrackModal() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [gpxContent, setGpxContent] = useState<string | null>(null)

  const { mutate: uploadGpx } = useParseGpx()

  const showModal = () => {
    setIsModalOpen(true)
  }

  const handleOk = () => {
    if (!gpxContent) {
      return
    }
    setIsModalOpen(false)
    uploadGpx(
      { gpxContent },
      { onError: (error) => alert(`Error: ${error.message}`) }
    )
    setGpxContent(null)
  }

  const handleCancel = () => {
    setIsModalOpen(false)
    setGpxContent(null)
  }

  const handleFileSelect = (content: string) => {
    setGpxContent(content)
  }

  return (
    <>
      <Button type="primary" onClick={showModal} className={styles.modalButton}>
        Upload new track
      </Button>
      <Modal
        title="New track"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okButtonProps={{ disabled: gpxContent === null }}
      >
        <Input placeholder="track name ?" className={styles.inputModal} />
        {gpxContent ? (
          <p>file ready</p>
        ) : (
          <GpxUploader onFileSelect={handleFileSelect} />
        )}
      </Modal>
    </>
  )
}
