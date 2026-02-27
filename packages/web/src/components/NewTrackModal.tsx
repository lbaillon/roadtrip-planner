import { useState } from 'react'
import { Button, Modal, Input } from 'antd'
import { useCreateTrack } from '#web/hooks/useApi'
import { GpxUploader } from './GpxUploader'
import styles from './NewTrackModal.module.css'

export default function NewTrackModal() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [gpxContent, setGpxContent] = useState<string | null>(null)
  const [trackName, setTrackName] = useState<string | null>(null)
  
  const {mutate: postTrack} = useCreateTrack()

  //userId to test tracks endpoints (user = Rémi)
  const userID = '5aeacaad-7116-4ad7-9fa2-0eb6b54c2cda'

  const showModal = () => {
    setIsModalOpen(true)
  }

  const handleOk = () => {
    if (!gpxContent) {
      return
    }
    
    postTrack(
    {
      gpxContent,
      userId: userID,
      ...(trackName && { name: trackName }),
    },
    {
      onSuccess: () => {
        setIsModalOpen(false)
        setGpxContent(null)
        setTrackName(null)
      },
      onError: (error) => alert(`Error: ${error.message}`),
    }
  )
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
        <Input placeholder="track name ?" className={styles.inputModal} onChange={(e) => setTrackName(e.target.value)} />
        {gpxContent ? (
          <p>file ready</p>
        ) : (
          <GpxUploader onFileSelect={handleFileSelect} />
        )}
      </Modal>
    </>
  )
}
