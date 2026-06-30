import TrackContent from '#web/components/TrackContent'
import { useGetTrack } from '#web/hooks/useTracks'
import { parseGpxFile, prettifyGpx } from '#web/lib/gpx-utils'
import { Button, message } from 'antd'
import { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import styles from './TrackDetails.module.css'
import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default function TrackDetails() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [messageApi, contextHolder] = message.useMessage()

  const { data: track, isLoading } = useGetTrack(id)
  const parsed = track ? parseGpxFile?.(track.gpxContent) : undefined

  const justSaved = (location.state as { justSaved?: boolean } | null)
    ?.justSaved

  useEffect(() => {
    if (!justSaved) return
    messageApi.success({ content: 'Circuit sauvegardé', key: 'track-saved' })
    // Nettoie le state pour ne pas ré-afficher le toast sur refresh / retour.
    navigate(location.pathname, { replace: true, state: null })
  }, [justSaved, messageApi, navigate, location.pathname])

  function handleDownload() {
    if (!track) return
    const blob = new Blob([prettifyGpx(track.gpxContent)], {
      type: 'application/gpx+xml',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${parsed?.name}.gpx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={styles.contentBox}>
      {contextHolder}
      {isLoading && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>Chargement du circuit...</p>
        </div>
      )}

      {parsed && (
        <TrackContent
          isPublic={track?.isPublic ?? false}
          isOwner={track?.isOwner ?? false}
          parsed={parsed}
          headerAction={
            <Button onClick={handleDownload} className={styles.downloadButton}>
              <FontAwesomeIcon
                className={styles.downloadIcon}
                icon={faDownload}
              />
            </Button>
          }
        />
      )}
    </div>
  )
}
