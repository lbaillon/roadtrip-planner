import { GpxUploader } from '#web/components/GpxUploader'
import { Title } from '#web/components/Title'
import TrackContent from '#web/components/TrackContent'
import { useHealth } from '#web/hooks/useHealth'
import { useSaveTrack } from '#web/hooks/useSaveTrack'
import { parseGpxFile } from '#web/lib/gpx-utils'
import type { ParsedGpx } from '@roadtrip/shared'
import { Button, message } from 'antd'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import styles from './Home.module.css'

export default function Home() {
  const [parsedGpx, setParsedGpx] = useState<ParsedGpx | null>(null)
  const [gpxContent, setGpxContent] = useState<string | null>(null)
  const [messageApi, contextHolder] = message.useMessage()
  const { isReady } = useHealth()
  const save = useSaveTrack()
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('confirmed') !== '1') return
    messageApi.success('Email confirmé avec succès, bienvenue !')
    const next = new URLSearchParams(searchParams)
    next.delete('confirmed')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, messageApi])

  const handleFileSelect = (content: string) => {
    try {
      const parsed = parseGpxFile(content)
      setParsedGpx(parsed)
      setGpxContent(content)
    } catch (e) {
      messageApi.error(
        e instanceof Error
          ? e.message
          : 'Erreur lors de la lecture du fichier GPX'
      )
    }
  }

  return (
    <>
      {contextHolder}
      <Title />
      <div className={styles.contentBox}>
        <div className={styles.uploadBox}>
          {isReady ? (
            <GpxUploader onFileSelect={handleFileSelect} />
          ) : (
            <p>L'affichage du GPX est indisponible hors ligne.</p>
          )}
        </div>

        {parsedGpx && gpxContent && (
          <TrackContent
            parsed={parsedGpx}
            headerAction={
              <Button onClick={() => void save(gpxContent)}>
                Sauvegarder cette trace
              </Button>
            }
          />
        )}
      </div>
    </>
  )
}
