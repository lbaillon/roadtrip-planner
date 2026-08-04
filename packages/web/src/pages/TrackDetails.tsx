import AuthRequiredNotice from '#web/components/AuthRequiredNotice'
import TrackContent from '#web/components/TrackContent'
import { useAuth } from '#web/hooks/useAuth'
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

  const { accessToken } = useAuth()
  const { data: track, isLoading, isError } = useGetTrack(id)
  const parsed = track ? parseGpxFile?.(track.gpxContent) : undefined

  const justSaved = (location.state as { justSaved?: boolean } | null)
    ?.justSaved
  const stateColor = (location.state as { color?: string } | null)?.color

  useEffect(() => {
    if (!justSaved) return
    messageApi.success({ content: 'Trace sauvegardée', key: 'track-saved' })
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
      {!accessToken && isError && <AuthRequiredNotice resource="trace" />}
      {isLoading && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>Chargement de la trace...</p>
        </div>
      )}

      {parsed && (
        <TrackContent
          isPublic={track?.isPublic ?? false}
          isOwner={track?.isOwner ?? false}
          sharedBy={track?.sharedBy}
          routeColor={stateColor}
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
