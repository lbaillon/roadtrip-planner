import { GpxUploader } from '#web/components/GpxUploader'
import { Title } from '#web/components/Title'
import TrackContent from '#web/components/TrackContent'
import { useAuth } from '#web/hooks/useAuth'
import { useHealth } from '#web/hooks/useHealth'
import { PENDING_SAVE_GPX_KEY, useSaveTrack } from '#web/hooks/useSaveTrack'
import { parseGpxFile } from '#web/lib/gpx-utils'
import type { ParsedGpx } from '@roadtrip/shared'
import { Button, message } from 'antd'
import { useEffect, useState } from 'react'
import styles from './Home.module.css'

export default function Home() {
  const [parsedGpx, setParsedGpx] = useState<ParsedGpx | null>(null)
  const [gpxContent, setGpxContent] = useState<string | null>(null)
  const [messageApi, contextHolder] = message.useMessage()
  const { isReady } = useHealth()
  const { accessToken } = useAuth()
  const save = useSaveTrack()

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

  // Après connexion, reprend la sauvegarde du circuit mis en attente avant
  // la redirection vers /login.
  useEffect(() => {
    if (!accessToken) return
    const pending = sessionStorage.getItem(PENDING_SAVE_GPX_KEY)
    if (!pending) return
    sessionStorage.removeItem(PENDING_SAVE_GPX_KEY)
    void save(pending)
  }, [accessToken, save])

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
                Sauvegarder ce circuit
              </Button>
            }
          />
        )}
      </div>
    </>
  )
}
